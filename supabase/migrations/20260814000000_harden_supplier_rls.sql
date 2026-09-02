-- Restrict supplier writes to authenticated administrators.
-- Existing authenticated reads remain available.

DROP POLICY IF EXISTS suppliers_insert ON public.suppliers;
DROP POLICY IF EXISTS suppliers_update ON public.suppliers;
DROP POLICY IF EXISTS suppliers_delete ON public.suppliers;

CREATE POLICY suppliers_admin_write
  ON public.suppliers
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
