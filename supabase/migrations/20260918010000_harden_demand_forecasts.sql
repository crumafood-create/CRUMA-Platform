REVOKE ALL ON TABLE public.demand_forecasts FROM anon;
REVOKE ALL ON TABLE public.demand_forecasts FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.demand_forecasts TO authenticated;

DROP POLICY IF EXISTS demand_forecasts_admin_select ON public.demand_forecasts;
DROP POLICY IF EXISTS demand_forecasts_admin_insert ON public.demand_forecasts;
DROP POLICY IF EXISTS demand_forecasts_admin_update ON public.demand_forecasts;
DROP POLICY IF EXISTS demand_forecasts_admin_delete ON public.demand_forecasts;

CREATE POLICY demand_forecasts_admin_select
ON public.demand_forecasts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

CREATE POLICY demand_forecasts_admin_insert
ON public.demand_forecasts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

CREATE POLICY demand_forecasts_admin_update
ON public.demand_forecasts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

CREATE POLICY demand_forecasts_admin_delete
ON public.demand_forecasts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);
