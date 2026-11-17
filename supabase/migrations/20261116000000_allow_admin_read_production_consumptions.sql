CREATE POLICY production_order_consumptions_admin_read
  ON public.production_order_consumptions
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
