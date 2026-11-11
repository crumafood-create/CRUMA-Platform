DROP POLICY IF EXISTS production_order_items_admin_read
ON public.production_order_items;

CREATE POLICY production_order_items_admin_read
ON public.production_order_items
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
