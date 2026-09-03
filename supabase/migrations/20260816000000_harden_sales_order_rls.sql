-- Authenticated users may read sales workflow records; only administrators may write them.
DO $$
DECLARE
  table_name text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'sales_orders', 'sales_order_items', 'sales_order_profit',
    'inventory_reservations', 'picking_orders', 'picking_order_items'
  ]
  LOOP
    FOR policy_name IN
      SELECT pol.polname
      FROM pg_policy AS pol
      JOIN pg_class AS cls ON cls.oid = pol.polrelid
      JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
      WHERE ns.nspname = 'public' AND cls.relname = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY sales_orders_authenticated_read ON public.sales_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY sales_orders_admin_write ON public.sales_orders FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY sales_order_items_authenticated_read ON public.sales_order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY sales_order_items_admin_write ON public.sales_order_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY sales_order_profit_authenticated_read ON public.sales_order_profit
  FOR SELECT TO authenticated USING (true);
CREATE POLICY sales_order_profit_admin_write ON public.sales_order_profit FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY inventory_reservations_authenticated_read ON public.inventory_reservations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY inventory_reservations_admin_write ON public.inventory_reservations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY picking_orders_authenticated_read ON public.picking_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY picking_orders_admin_write ON public.picking_orders FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY picking_order_items_authenticated_read ON public.picking_order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY picking_order_items_admin_write ON public.picking_order_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
