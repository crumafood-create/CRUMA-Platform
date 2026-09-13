BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('8d000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'invoice-admin@example.test', now(), now()),
  ('8d000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'invoice-user@example.test', now(), now());
INSERT INTO public.user_roles (user_id, role)
VALUES ('8d000000-0000-0000-0000-000000000001', 'admin');

INSERT INTO public.customers (id, customer_code, customer_type, name) VALUES
  ('8e000000-0000-0000-0000-000000000001', 'INV-C1', 'business', 'Invoice Customer');
INSERT INTO public.products (id, slug, internal_code, name, status) VALUES
  ('8f000000-0000-0000-0000-000000000001', 'invoice-product', 'INV-P1', 'Snapshot Product', 'active');
INSERT INTO public.sales_orders (
  id, order_number, customer_id, status, subtotal, discount, tax, total
) VALUES
  ('91000000-0000-0000-0000-000000000001', 'SO-INV-1', '8e000000-0000-0000-0000-000000000001', 'delivered', 100, 0, 16, 116),
  ('91000000-0000-0000-0000-000000000002', 'SO-INV-2', '8e000000-0000-0000-0000-000000000001', 'delivered', 50, 0, 8, 58);
INSERT INTO public.sales_order_items (
  sales_order_id, product_id, quantity, unit_price, discount, total
) VALUES
  ('91000000-0000-0000-0000-000000000001', '8f000000-0000-0000-0000-000000000001', 2, 50, 0, 100),
  ('91000000-0000-0000-0000-000000000002', '8f000000-0000-0000-0000-000000000001', 1, 50, 0, 50);
INSERT INTO public.accounts_receivable (
  id, customer_id, sales_order_id, amount, paid_amount, balance, status
) VALUES
  ('92000000-0000-0000-0000-000000000001', '8e000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 116, 0, 116, 'pending'),
  ('92000000-0000-0000-0000-000000000002', '8e000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000002', 58, 0, 58, 'pending');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '8d000000-0000-0000-0000-000000000002', true);

DO $test$
BEGIN
  IF (SELECT count(*) FROM public.sales_invoices) <> 0 THEN
    RAISE EXCEPTION 'normal user unexpectedly read commercial invoices';
  END IF;
  BEGIN
    PERFORM public.issue_sales_invoice('91000000-0000-0000-0000-000000000001', current_date, NULL);
    RAISE EXCEPTION 'normal user unexpectedly issued an invoice';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '8d000000-0000-0000-0000-000000000001', true);

SELECT public.issue_sales_invoice(
  '91000000-0000-0000-0000-000000000001', current_date + 15, 'Commercial invoice'
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.issue_sales_invoice('91000000-0000-0000-0000-000000000001', NULL, NULL);
    RAISE EXCEPTION 'duplicate commercial invoice was accepted';
  EXCEPTION WHEN unique_violation OR raise_exception THEN
    IF SQLERRM <> 'Sales order was already invoiced.' THEN RAISE; END IF;
  END;
END;
$test$;

SELECT public.register_receivable_payment(
  '92000000-0000-0000-0000-000000000001', current_date, 16, 'transfer', 'INV-SPEI-1', NULL
);

DO $test$
DECLARE invoice_id uuid;
BEGIN
  SELECT id INTO invoice_id FROM public.sales_invoices
  WHERE sales_order_id = '91000000-0000-0000-0000-000000000001';
  BEGIN
    PERFORM public.cancel_sales_invoice(invoice_id, 'Must fail after payment');
    RAISE EXCEPTION 'invoice with payments was cancelled';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Invoice has registered payments.' THEN RAISE; END IF;
  END;
END;
$test$;

SELECT public.issue_sales_invoice('91000000-0000-0000-0000-000000000002', NULL, NULL);
SELECT public.cancel_sales_invoice(
  (SELECT id FROM public.sales_invoices WHERE sales_order_id = '91000000-0000-0000-0000-000000000002'),
  'Customer return'
);

RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sales_invoices AS invoice
    JOIN public.sales_invoice_items AS item ON item.invoice_id = invoice.id
    JOIN public.accounts_receivable AS account ON account.id = invoice.account_receivable_id
    WHERE invoice.sales_order_id = '91000000-0000-0000-0000-000000000001'
      AND invoice.invoice_number LIKE 'FAC-%'
      AND invoice.status = 'partial'
      AND invoice.fiscal_status = 'not_requested'
      AND item.product_code = 'INV-P1'
      AND item.description = 'Snapshot Product'
      AND item.line_total = 100
      AND account.document_number = invoice.invoice_number
      AND account.balance = 100
  ) THEN
    RAISE EXCEPTION 'issued invoice snapshot or receivable synchronization is inconsistent';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.sales_invoices AS invoice
    JOIN public.accounts_receivable AS account ON account.id = invoice.account_receivable_id
    WHERE invoice.sales_order_id = '91000000-0000-0000-0000-000000000002'
      AND invoice.status = 'cancelled'
      AND invoice.cancellation_reason = 'Customer return'
      AND account.status = 'cancelled'
  ) THEN
    RAISE EXCEPTION 'invoice cancellation is inconsistent';
  END IF;
END;
$test$;

ROLLBACK;
