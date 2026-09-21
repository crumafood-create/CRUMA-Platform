CREATE OR REPLACE VIEW public.business_sales_by_line
WITH (security_invoker = true)
AS
SELECT
  sales.created_at::date AS day,
  coalesce(category.name, 'Sin categoría') AS line_name,
  product.name AS product_name,
  coalesce(product.internal_code, 'SIN-SKU') AS sku,
  sum(item.quantity)::numeric AS units,
  sum(item.total)::numeric AS revenue
FROM public.sales_order_items AS item
JOIN public.sales_orders AS sales ON sales.id = item.sales_order_id
JOIN public.products AS product ON product.id = item.product_id
LEFT JOIN public.categories AS category ON category.id = product.category_id
WHERE sales.status <> 'cancelled'
GROUP BY sales.created_at::date, category.name, product.id, product.name, product.internal_code;

CREATE OR REPLACE VIEW public.business_inventory_by_sku
WITH (security_invoker = true)
AS
SELECT
  stock.item_type,
  stock.item_id,
  coalesce(product.name, material.name, 'Sin nombre') AS item_name,
  coalesce(product.internal_code, material.internal_code, 'SIN-SKU') AS sku,
  sum(stock.quantity)::numeric AS quantity,
  CASE
    WHEN stock.item_type = 'product' THEN coalesce(product.min_stock, 0)
    ELSE coalesce(material.minimum_stock, 0)
  END::numeric AS minimum
FROM public.inventory_stock_by_item AS stock
LEFT JOIN public.products AS product
  ON stock.item_type = 'product' AND product.id = stock.item_id
LEFT JOIN public.raw_materials AS material
  ON stock.item_type = 'raw_material' AND material.id = stock.item_id
GROUP BY stock.item_type, stock.item_id, product.name, material.name,
  product.internal_code, material.internal_code, product.min_stock, material.minimum_stock;

CREATE OR REPLACE VIEW public.business_production_rates
WITH (security_invoker = true)
AS
SELECT
  created_at::date AS day,
  planned_quantity::numeric AS planned,
  coalesce(produced_quantity, 0)::numeric AS produced,
  production_status AS status
FROM public.production_orders;

DROP POLICY IF EXISTS admin_all_analytics_events ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_admin_read ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_own ON public.analytics_events;

CREATE POLICY analytics_events_admin_read
ON public.analytics_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
  )
);

CREATE POLICY analytics_events_insert_own
ON public.analytics_events
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.analytics_events FROM anon;
GRANT SELECT, INSERT ON TABLE public.analytics_events TO authenticated;
GRANT ALL ON TABLE public.analytics_events TO service_role;

REVOKE ALL ON TABLE public.business_sales_by_line FROM anon;
REVOKE ALL ON TABLE public.business_inventory_by_sku FROM anon;
REVOKE ALL ON TABLE public.business_production_rates FROM anon;
GRANT SELECT ON TABLE public.business_sales_by_line TO authenticated, service_role;
GRANT SELECT ON TABLE public.business_inventory_by_sku TO authenticated, service_role;
GRANT SELECT ON TABLE public.business_production_rates TO authenticated, service_role;
