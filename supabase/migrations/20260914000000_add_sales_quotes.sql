CREATE SEQUENCE public.sales_quote_number_seq;
CREATE TABLE public.sales_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  sales_order_id uuid REFERENCES public.sales_orders(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired','cancelled','converted')),
  quote_date date NOT NULL DEFAULT current_date, valid_until date NOT NULL,
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes text, terms text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_quotes_sales_order_key UNIQUE (sales_order_id),
  CONSTRAINT sales_quotes_validity_check CHECK (valid_until >= quote_date),
  CONSTRAINT sales_quotes_total_check CHECK (total_amount = round(subtotal - discount + tax_amount, 2)),
  CONSTRAINT sales_quotes_conversion_check CHECK ((status = 'converted') = (sales_order_id IS NOT NULL))
);
CREATE TABLE public.sales_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id uuid NOT NULL REFERENCES public.sales_quotes(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id), product_code text, description text NOT NULL,
  quantity numeric(14,4) NOT NULL CHECK (quantity > 0), unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0), tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate BETWEEN 0 AND 100),
  line_subtotal numeric(14,2) NOT NULL CHECK (line_subtotal >= 0), tax_amount numeric(14,2) NOT NULL CHECK (tax_amount >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, product_id), CHECK (line_subtotal = round(quantity * unit_price, 2)),
  CHECK (line_total = round(line_subtotal - discount + tax_amount, 2))
);
CREATE INDEX sales_quotes_customer_idx ON public.sales_quotes(customer_id, quote_date DESC);
CREATE INDEX sales_quotes_status_idx ON public.sales_quotes(status, valid_until);
CREATE INDEX sales_quote_items_quote_idx ON public.sales_quote_items(quote_id);
ALTER TABLE public.sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_quotes_admin_read ON public.sales_quotes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY sales_quote_items_admin_read ON public.sales_quote_items FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
REVOKE ALL ON TABLE public.sales_quotes, public.sales_quote_items FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.sales_quotes, public.sales_quote_items FROM authenticated;
GRANT SELECT ON public.sales_quotes, public.sales_quote_items TO authenticated;
GRANT ALL ON public.sales_quotes, public.sales_quote_items TO service_role;
REVOKE ALL ON SEQUENCE public.sales_quote_number_seq FROM PUBLIC, anon, authenticated;
GRANT ALL ON SEQUENCE public.sales_quote_number_seq TO service_role;

CREATE OR REPLACE FUNCTION public.create_sales_quote(p_customer_id uuid, p_valid_until date, p_notes text DEFAULT NULL, p_terms text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE quote_id uuid; quote_number text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE = 'Quote management requires an administrator.'; END IF;
  IF p_valid_until IS NULL OR p_valid_until < current_date THEN RAISE EXCEPTION 'Quote validity is invalid.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id=p_customer_id AND is_active AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Customer is unavailable for quotes.'; END IF;
  quote_number := 'COT-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.sales_quote_number_seq')::text,6,'0');
  INSERT INTO public.sales_quotes(quote_number,customer_id,valid_until,notes,terms)
  VALUES(quote_number,p_customer_id,p_valid_until,nullif(trim(p_notes),''),nullif(trim(p_terms),'')) RETURNING id INTO quote_id;
  RETURN quote_id;
END; $$;

CREATE OR REPLACE FUNCTION public.add_sales_quote_item(p_quote_id uuid,p_product_id uuid,p_quantity numeric,p_unit_price numeric,p_discount numeric DEFAULT 0,p_tax_rate numeric DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE quote_status text; item_id uuid; line_subtotal numeric; line_tax numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE = 'Quote management requires an administrator.'; END IF;
  IF p_quantity IS NULL OR p_quantity<=0 OR p_quantity::text='NaN' OR p_unit_price IS NULL OR p_unit_price<0 OR p_unit_price::text='NaN' THEN RAISE EXCEPTION 'Quote item values are invalid.'; END IF;
  line_subtotal:=round(p_quantity*p_unit_price,2);
  IF p_discount IS NULL OR p_discount<0 OR p_discount>line_subtotal OR p_tax_rate IS NULL OR p_tax_rate<0 OR p_tax_rate>100 THEN RAISE EXCEPTION 'Quote discount or tax is invalid.'; END IF;
  SELECT status INTO quote_status FROM public.sales_quotes WHERE id=p_quote_id FOR UPDATE;
  IF quote_status IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'Quote is not an editable draft.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id=p_product_id AND status='active' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Product is unavailable.'; END IF;
  IF EXISTS (SELECT 1 FROM public.sales_quote_items WHERE quote_id=p_quote_id AND product_id=p_product_id) THEN RAISE EXCEPTION 'Product is already quoted.'; END IF;
  line_tax:=round((line_subtotal-p_discount)*p_tax_rate/100,2);
  INSERT INTO public.sales_quote_items(quote_id,product_id,product_code,description,quantity,unit_price,discount,tax_rate,line_subtotal,tax_amount,line_total)
  SELECT p_quote_id,p.id,p.internal_code,p.name,p_quantity,p_unit_price,p_discount,p_tax_rate,line_subtotal,line_tax,round(line_subtotal-p_discount+line_tax,2)
  FROM public.products p WHERE p.id=p_product_id RETURNING id INTO item_id;
  UPDATE public.sales_quotes SET subtotal = t.subtotal, discount = t.discount,
    tax_amount = t.tax, total_amount = round(t.subtotal-t.discount+t.tax,2), updated_at = now()
  FROM (SELECT sum(item.line_subtotal) subtotal, sum(item.discount) discount,
    sum(item.tax_amount) tax FROM public.sales_quote_items AS item
    WHERE item.quote_id=p_quote_id) t WHERE id=p_quote_id;
  RETURN item_id;
END; $$;

CREATE OR REPLACE FUNCTION public.transition_sales_quote(p_quote_id uuid,p_expected_status text,p_next_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE q public.sales_quotes%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE = 'Quote management requires an administrator.'; END IF;
  SELECT * INTO q FROM public.sales_quotes WHERE id=p_quote_id FOR UPDATE;
  IF NOT FOUND OR q.status IS DISTINCT FROM p_expected_status THEN RAISE EXCEPTION 'Quote status changed concurrently.'; END IF;
  IF p_next_status='expired' THEN IF q.valid_until>=current_date OR q.status NOT IN ('draft','sent') THEN RAISE EXCEPTION 'Quote cannot be expired.'; END IF;
  ELSIF NOT ((q.status='draft' AND p_next_status IN ('sent','cancelled')) OR (q.status='sent' AND p_next_status IN ('accepted','rejected','cancelled')) OR (q.status='accepted' AND p_next_status='cancelled')) THEN RAISE EXCEPTION 'Quote transition is invalid.'; END IF;
  IF p_next_status='sent' AND (q.total_amount<=0 OR NOT EXISTS(SELECT 1 FROM public.sales_quote_items WHERE quote_id=q.id)) THEN RAISE EXCEPTION 'Quote has no invoiceable items.'; END IF;
  IF p_next_status='accepted' AND q.valid_until<current_date THEN RAISE EXCEPTION 'Expired quote cannot be accepted.'; END IF;
  UPDATE public.sales_quotes SET status=p_next_status,updated_at=now() WHERE id=q.id;
END; $$;

CREATE OR REPLACE FUNCTION public.convert_sales_quote_to_order(p_quote_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE q public.sales_quotes%ROWTYPE; order_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE = 'Quote management requires an administrator.'; END IF;
  SELECT * INTO q FROM public.sales_quotes WHERE id=p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote was not found.'; END IF;
  IF q.sales_order_id IS NOT NULL OR q.status = 'converted' THEN RAISE EXCEPTION 'Quote was already converted.'; END IF;
  IF q.status IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'Only accepted quotes can be converted.'; END IF;
  IF q.valid_until<current_date THEN RAISE EXCEPTION 'Expired quote cannot be converted.'; END IF;
  INSERT INTO public.sales_orders(order_number,customer_id,status,subtotal,discount,tax,total,notes)
  VALUES('SO-'||q.quote_number,q.customer_id,'draft',q.subtotal,q.discount,q.tax_amount,q.total_amount,q.notes) RETURNING id INTO order_id;
  INSERT INTO public.sales_order_items(sales_order_id,product_id,quantity,unit_price,discount,total,delivered_quantity)
  SELECT order_id,product_id,quantity,unit_price,discount,line_subtotal,0 FROM public.sales_quote_items WHERE quote_id=q.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote has no items.'; END IF;
  UPDATE public.sales_quotes SET status='converted',sales_order_id=order_id,updated_at=now() WHERE id=q.id;
  RETURN order_id;
END; $$;

REVOKE ALL ON FUNCTION public.create_sales_quote(uuid,date,text,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.add_sales_quote_item(uuid,uuid,numeric,numeric,numeric,numeric) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.transition_sales_quote(uuid,text,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.convert_sales_quote_to_order(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.create_sales_quote(uuid,date,text,text), public.add_sales_quote_item(uuid,uuid,numeric,numeric,numeric,numeric), public.transition_sales_quote(uuid,text,text), public.convert_sales_quote_to_order(uuid) TO authenticated;
