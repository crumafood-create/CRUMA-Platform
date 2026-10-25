-- Restrict inherited open writes without changing reads or authority.
-- Kept outside supabase/migrations until local PostgreSQL proves it.

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.families;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.families;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.families;
DROP POLICY IF EXISTS authenticated_can_manage_categories ON public.categories;
DROP POLICY IF EXISTS inventory_locations_delete ON public.inventory_locations;
DROP POLICY IF EXISTS inventory_locations_insert ON public.inventory_locations;
DROP POLICY IF EXISTS inventory_locations_update ON public.inventory_locations;
DROP POLICY IF EXISTS inventory_movements_delete ON public.inventory_movements;
DROP POLICY IF EXISTS inventory_movements_insert ON public.inventory_movements;
DROP POLICY IF EXISTS inventory_movements_update ON public.inventory_movements;
DROP POLICY IF EXISTS raw_materials_delete ON public.raw_materials;
DROP POLICY IF EXISTS raw_materials_insert ON public.raw_materials;
DROP POLICY IF EXISTS raw_materials_update ON public.raw_materials;

CREATE POLICY families_admin_write
  ON public.families
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY categories_admin_write
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY inventory_locations_admin_write
  ON public.inventory_locations
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY inventory_movements_admin_write
  ON public.inventory_movements
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY raw_materials_admin_write
  ON public.raw_materials
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
