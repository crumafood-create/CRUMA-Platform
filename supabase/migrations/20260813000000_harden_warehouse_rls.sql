-- Restrict warehouse writes to authenticated administrators.
-- Existing authenticated reads remain available.

DROP POLICY IF EXISTS admin_all_warehouses ON public.warehouses;
DROP POLICY IF EXISTS warehouses_insert ON public.warehouses;
DROP POLICY IF EXISTS warehouses_update ON public.warehouses;
DROP POLICY IF EXISTS warehouses_delete ON public.warehouses;

CREATE POLICY warehouses_admin_write
  ON public.warehouses
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
