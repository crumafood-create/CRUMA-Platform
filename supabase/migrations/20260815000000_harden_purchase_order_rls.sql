-- Authenticated users may read purchase orders; only administrators may write them.
DROP POLICY IF EXISTS purchase_orders_authenticated_read ON public.purchase_orders;
DROP POLICY IF EXISTS purchase_orders_admin_write ON public.purchase_orders;
DROP POLICY IF EXISTS purchase_order_items_authenticated_read ON public.purchase_order_items;
DROP POLICY IF EXISTS purchase_order_items_admin_write ON public.purchase_order_items;

CREATE POLICY purchase_orders_authenticated_read
  ON public.purchase_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY purchase_orders_admin_write
  ON public.purchase_orders FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY purchase_order_items_authenticated_read
  ON public.purchase_order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY purchase_order_items_admin_write
  ON public.purchase_order_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
