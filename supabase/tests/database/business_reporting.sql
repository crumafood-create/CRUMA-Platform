BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('91000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'report-admin@example.test', now(), now()),
  ('91000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'report-user@example.test', now(), now());

INSERT INTO public.user_roles (user_id, role)
VALUES ('91000000-0000-0000-0000-000000000001', 'admin');

DO $test$
DECLARE
  secured_views integer;
BEGIN
  SELECT count(*) INTO secured_views
  FROM pg_class
  WHERE relname IN (
    'business_sales_by_line',
    'business_inventory_by_sku',
    'business_production_rates'
  )
    AND reloptions @> ARRAY['security_invoker=true'];

  IF secured_views <> 3 THEN
    RAISE EXCEPTION 'expected three security-invoker reporting views, found %', secured_views;
  END IF;
  IF has_table_privilege('anon', 'public.analytics_events', 'SELECT')
    OR has_table_privilege('anon', 'public.analytics_events', 'INSERT') THEN
    RAISE EXCEPTION 'anon unexpectedly has analytics_events privileges';
  END IF;
END;
$test$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000002', true);

INSERT INTO public.analytics_events (user_id, session_id, event_type, entity_type, page)
VALUES (
  '91000000-0000-0000-0000-000000000002',
  'session-report-user',
  'page_view',
  'admin',
  '/reports'
);

DO $test$
BEGIN
  IF (SELECT count(*) FROM public.analytics_events) <> 0 THEN
    RAISE EXCEPTION 'non-admin unexpectedly read analytics events';
  END IF;

  BEGIN
    INSERT INTO public.analytics_events (user_id, session_id, event_type, page)
    VALUES (
      '91000000-0000-0000-0000-000000000001',
      'spoofed-session',
      'page_view',
      '/reports'
    );
    RAISE EXCEPTION 'user unexpectedly inserted an event for another identity';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.analytics_events
    WHERE user_id = '91000000-0000-0000-0000-000000000002'
      AND page = '/reports'
  ) THEN
    RAISE EXCEPTION 'admin could not read the expected analytics event';
  END IF;
END;
$test$;

ROLLBACK;
