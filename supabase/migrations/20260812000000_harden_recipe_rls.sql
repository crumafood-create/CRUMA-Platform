-- Restrict recipe and recipe-item writes to authenticated administrators.
-- Existing authenticated read policies remain unchanged.

DROP POLICY IF EXISTS recipes_insert ON public.recipes;
DROP POLICY IF EXISTS recipes_update ON public.recipes;
DROP POLICY IF EXISTS recipes_delete ON public.recipes;

CREATE POLICY recipes_admin_write
  ON public.recipes
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS recipe_items_insert ON public.recipe_items;
DROP POLICY IF EXISTS recipe_items_update ON public.recipe_items;
DROP POLICY IF EXISTS recipe_items_delete ON public.recipe_items;

CREATE POLICY recipe_items_admin_write
  ON public.recipe_items
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
