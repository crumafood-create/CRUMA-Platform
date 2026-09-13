-- Commercial invoices for administrative sales orders. These are not fiscal CFDI documents.
CREATE SEQUENCE public.sales_invoice_number_seq;

CREATE TABLE public.sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id),
  account_receivable_id uuid NOT NULL REFERENCES public.accounts_receivable(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  status text NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued', 'partial', 'paid', 'cancelled')),
  issued_on date NOT NULL DEFAULT current_date,
  due_date date,
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(14,2) NOT NULL CHECK (total_amount > 0),
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  fiscal_status text NOT NULL DEFAULT 'not_requested'
    CHECK (fiscal_status IN ('not_requested', 'pending', 'issued', 'cancelled', 'failed')),
  fiscal_provider text,
  fiscal_external_id text,
  fiscal_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_invoices_number_key UNIQUE (invoice_number),
  CONSTRAINT sales_invoices_sales_order_key UNIQUE (sales_order_id),
  CONSTRAINT sales_invoices_receivable_key UNIQUE (account_receivable_id),
  CONSTRAINT sales_invoices_due_date_check CHECK (due_date IS NULL OR due_date >= issued_on),
  CONSTRAINT sales_invoices_total_check
    CHECK (total_amount = round(subtotal - discount + tax_amount, 2)),
  CONSTRAINT sales_invoices_cancellation_check CHECK (
    (status = 'cancelled' AND cancellation_reason IS NOT NULL AND cancelled_at IS NOT NULL)
    OR (status <> 'cancelled' AND cancellation_reason IS NULL AND cancelled_at IS NULL)
  )
);

CREATE TABLE public.sales_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.sales_invoices(id) ON DELETE RESTRICT,
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  product_code text,
  description text NOT NULL CHECK (length(trim(description)) > 0),
  quantity numeric(14,4) NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_invoice_items_product_key UNIQUE (invoice_id, product_id),
  CONSTRAINT sales_invoice_items_total_check
    CHECK (line_total = round(quantity * unit_price - discount, 2))
);

CREATE UNIQUE INDEX accounts_receivable_sales_order_key
  ON public.accounts_receivable (sales_order_id) WHERE sales_order_id IS NOT NULL;
CREATE INDEX sales_invoices_customer_idx ON public.sales_invoices (customer_id, issued_on DESC);
CREATE INDEX sales_invoices_status_idx ON public.sales_invoices (status, due_date);
CREATE INDEX sales_invoice_items_invoice_idx ON public.sales_invoice_items (invoice_id);

ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_invoices_admin_read ON public.sales_invoices
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY sales_invoice_items_admin_read ON public.sales_invoice_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.sales_invoices, public.sales_invoice_items FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.sales_invoices, public.sales_invoice_items FROM authenticated;
GRANT SELECT ON TABLE public.sales_invoices, public.sales_invoice_items TO authenticated;
GRANT ALL ON TABLE public.sales_invoices, public.sales_invoice_items TO service_role;
REVOKE ALL ON SEQUENCE public.sales_invoice_number_seq FROM PUBLIC, anon, authenticated;
GRANT ALL ON SEQUENCE public.sales_invoice_number_seq TO service_role;

CREATE OR REPLACE FUNCTION public.issue_sales_invoice(
  p_sales_order_id uuid,
  p_due_date date DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  order_row public.sales_orders%ROWTYPE;
  account_row public.accounts_receivable%ROWTYPE;
  invoice_id uuid;
  invoice_number text;
  invoice_due_date date;
  item_total numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Invoice management requires an administrator.';
  END IF;
  IF p_due_date IS NOT NULL AND p_due_date < current_date THEN
    RAISE EXCEPTION 'Invoice due date cannot precede its issue date.';
  END IF;

  SELECT * INTO order_row FROM public.sales_orders
  WHERE id = p_sales_order_id FOR UPDATE;
  IF NOT FOUND OR order_row.status IS DISTINCT FROM 'delivered' THEN
    RAISE EXCEPTION 'Only delivered sales orders can be invoiced.';
  END IF;
  IF order_row.total <= 0
    OR order_row.total <> round(order_row.subtotal - order_row.discount + order_row.tax, 2) THEN
    RAISE EXCEPTION 'Sales order totals are invalid.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.sales_invoices WHERE sales_order_id = p_sales_order_id) THEN
    RAISE EXCEPTION 'Sales order was already invoiced.';
  END IF;

  SELECT coalesce(sum(total), 0) INTO item_total FROM public.sales_order_items
  WHERE sales_order_id = p_sales_order_id;
  IF item_total <> order_row.subtotal THEN
    RAISE EXCEPTION 'Sales order item totals do not match its subtotal.';
  END IF;

  SELECT * INTO account_row FROM public.accounts_receivable
  WHERE sales_order_id = p_sales_order_id FOR UPDATE;
  IF NOT FOUND OR account_row.status = 'cancelled' OR account_row.amount <> order_row.total THEN
    RAISE EXCEPTION 'Sales order receivable is unavailable or inconsistent.';
  END IF;

  invoice_number := 'FAC-' || to_char(current_date, 'YYYY') || '-'
    || lpad(nextval('public.sales_invoice_number_seq')::text, 6, '0');
  invoice_due_date := coalesce(p_due_date, account_row.due_date);

  INSERT INTO public.sales_invoices (
    invoice_number, sales_order_id, account_receivable_id, customer_id, status,
    issued_on, due_date, subtotal, discount, tax_amount, total_amount, notes
  ) VALUES (
    invoice_number, order_row.id, account_row.id, order_row.customer_id,
    CASE account_row.status WHEN 'partial' THEN 'partial' WHEN 'paid' THEN 'paid' ELSE 'issued' END,
    current_date, invoice_due_date, order_row.subtotal, order_row.discount,
    order_row.tax, order_row.total, nullif(trim(p_notes), '')
  ) RETURNING id INTO invoice_id;

  INSERT INTO public.sales_invoice_items (
    invoice_id, product_id, product_code, description, quantity,
    unit_price, discount, line_total
  ) SELECT invoice_id, item.product_id, product.internal_code, product.name,
    item.quantity, item.unit_price, item.discount, item.total
  FROM public.sales_order_items AS item
  JOIN public.products AS product ON product.id = item.product_id
  WHERE item.sales_order_id = p_sales_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sales order has no invoiceable items.';
  END IF;

  UPDATE public.accounts_receivable SET
    document_number = invoice_number,
    due_date = invoice_due_date,
    notes = coalesce(nullif(trim(p_notes), ''), notes),
    updated_at = now()
  WHERE id = account_row.id;

  RETURN invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_sales_invoice(
  p_invoice_id uuid,
  p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  invoice_row public.sales_invoices%ROWTYPE;
  account_row public.accounts_receivable%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Invoice management requires an administrator.';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Invoice cancellation reason is required.';
  END IF;

  SELECT * INTO invoice_row FROM public.sales_invoices
  WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND OR invoice_row.status = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice is unavailable for cancellation.';
  END IF;
  IF invoice_row.fiscal_status <> 'not_requested' THEN
    RAISE EXCEPTION 'Fiscal invoice cancellation must be handled by its provider.';
  END IF;
  SELECT * INTO account_row FROM public.accounts_receivable
  WHERE id = invoice_row.account_receivable_id FOR UPDATE;
  IF account_row.paid_amount > 0 OR EXISTS (
    SELECT 1 FROM public.accounts_receivable_payments
    WHERE account_receivable_id = account_row.id
  ) THEN
    RAISE EXCEPTION 'Invoice has registered payments.';
  END IF;

  UPDATE public.sales_invoices SET status = 'cancelled',
    cancellation_reason = trim(p_reason), cancelled_at = now(), updated_at = now()
  WHERE id = invoice_row.id;
  UPDATE public.accounts_receivable SET status = 'cancelled', updated_at = now()
  WHERE id = account_row.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_sales_invoice_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.sales_invoices SET status = CASE NEW.status
    WHEN 'partial' THEN 'partial'
    WHEN 'paid' THEN 'paid'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'issued'
  END, updated_at = now()
  WHERE account_receivable_id = NEW.id AND status <> 'cancelled';
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_sales_invoice_status_after_receivable
AFTER UPDATE OF status ON public.accounts_receivable
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_sales_invoice_status();

REVOKE ALL ON FUNCTION public.issue_sales_invoice(uuid, date, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.issue_sales_invoice(uuid, date, text) TO authenticated;
REVOKE ALL ON FUNCTION public.cancel_sales_invoice(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_sales_invoice(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.sync_sales_invoice_status() FROM PUBLIC, anon, authenticated;
