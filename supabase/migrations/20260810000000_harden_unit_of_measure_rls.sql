-- Restrict unit-of-measure writes to authenticated administrators.
-- Public and authenticated read policies remain unchanged.

DROP POLICY IF EXISTS units_of_measure_insert
  ON public.units_of_measure;

DROP POLICY IF EXISTS units_of_measure_update
  ON public.units_of_measure;

DROP POLICY IF EXISTS units_of_measure_delete
  ON public.units_of_measure;

CREATE POLICY units_of_measure_admin_write
  ON public.units_of_measure
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
