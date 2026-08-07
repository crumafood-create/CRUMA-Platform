-- Scope administrative RLS policies to authenticated callers.
-- Anonymous product reads must not evaluate administrative authorization paths.

DROP POLICY IF EXISTS admin_all_products
  ON public.products;

CREATE POLICY admin_all_products
  ON public.products
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_all_user_roles
  ON public.user_roles;

CREATE POLICY admin_all_user_roles
  ON public.user_roles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
