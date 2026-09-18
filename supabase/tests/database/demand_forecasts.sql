BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('8d000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'forecast-admin@example.test', now(), now()),
  ('8d000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'forecast-user@example.test', now(), now());

INSERT INTO public.user_roles (user_id, role)
VALUES ('8d000000-0000-0000-0000-000000000001', 'admin');

INSERT INTO public.products (id, slug, internal_code, name, status)
VALUES (
  '8e000000-0000-0000-0000-000000000001',
  'forecast-product',
  'FC-P1',
  'Forecast Product',
  'active'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '8d000000-0000-0000-0000-000000000002',
  true
);

DO $test$
BEGIN
  IF (SELECT count(*) FROM public.demand_forecasts) <> 0 THEN
    RAISE EXCEPTION 'normal user unexpectedly read demand forecasts';
  END IF;

  BEGIN
    INSERT INTO public.demand_forecasts (product_id, period_days)
    VALUES ('8e000000-0000-0000-0000-000000000001', 30);
    RAISE EXCEPTION 'normal user unexpectedly inserted a demand forecast';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '8d000000-0000-0000-0000-000000000001',
  true
);

INSERT INTO public.demand_forecasts (
  product_id,
  period_days,
  average_daily_demand,
  forecast_quantity,
  stock_quantity,
  suggested_production
) VALUES (
  '8e000000-0000-0000-0000-000000000001',
  30,
  2,
  28,
  8,
  20
);

UPDATE public.demand_forecasts
SET suggested_production = 18
WHERE product_id = '8e000000-0000-0000-0000-000000000001';

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.demand_forecasts
    WHERE product_id = '8e000000-0000-0000-0000-000000000001'
      AND suggested_production = 18
  ) THEN
    RAISE EXCEPTION 'admin demand forecast write was not persisted';
  END IF;
END;
$test$;

DELETE FROM public.demand_forecasts
WHERE product_id = '8e000000-0000-0000-0000-000000000001';

DO $test$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.demand_forecasts
    WHERE product_id = '8e000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'admin demand forecast delete was not persisted';
  END IF;
END;
$test$;

ROLLBACK;
