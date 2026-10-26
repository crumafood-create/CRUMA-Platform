-- Preparar ambas pestañas como postgres; iniciar A y enseguida B durante esta espera de 25 segundos.
BEGIN;
SELECT set_config('request.jwt.claims', '{}', true),
  set_config('request.jwt.claim.sub', coalesce((SELECT user_id::text FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1), ''), true);
SET LOCAL ROLE authenticated;
INSERT INTO public.products (id, name, slug, status, min_stock, internal_code)
VALUES ('f391cce0-130d-4271-a724-f623ac225d74', 'Prueba de concurrencia', 'concurrency-f391cce0-130d-4271-a724-f623ac225d74', 'draft', 0, NULL);
RESET ROLE;
DO $test$
BEGIN
  PERFORM pg_sleep(25);
  IF NOT EXISTS (SELECT 1 FROM pg_stat_activity AS waiting
    WHERE waiting.application_name = 'cruma_slug_race_b_f391cce0'
      AND pg_backend_pid() = ANY(pg_blocking_pids(waiting.pid))) THEN
    RAISE EXCEPTION 'FALLO: no se observó B bloqueada por A; no se acredita concurrencia.';
  END IF;
END;
$test$;
COMMIT;
SELECT 'comprobada' AS concurrencia;
