-- Ejecutar en otra pestaña como postgres, mientras A espera. Preparar ambas antes de iniciar.
BEGIN;
SET LOCAL application_name = 'cruma_slug_race_b_f391cce0';
SET LOCAL lock_timeout = '40s';
SELECT set_config('request.jwt.claims', '{}', true),
  set_config('request.jwt.claim.sub', coalesce((SELECT user_id::text FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1), ''), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE violated_constraint text;
BEGIN
  INSERT INTO public.products (id, name, slug, status, min_stock, internal_code)
  VALUES (gen_random_uuid(), 'Intento concurrente', 'concurrency-f391cce0-130d-4271-a724-f623ac225d74', 'draft', 0, NULL);
  RAISE EXCEPTION 'FALLO: B pudo insertar el mismo slug.';
EXCEPTION WHEN unique_violation THEN
  GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
  IF violated_constraint IS DISTINCT FROM 'products_slug_key' THEN RAISE; END IF;
END;
$test$;
ROLLBACK;
-- Recuperación si B se interrumpe: esperar a que A termine y ejecutar solo este bloque de limpieza como postgres.
DO $cleanup$
BEGIN
  IF (SELECT count(*) FROM public.products WHERE slug = 'concurrency-f391cce0-130d-4271-a724-f623ac225d74') <> 1 THEN
    RAISE EXCEPTION 'FALLO: no hay exactamente un producto ganador; revisar antes de limpiar.'; END IF;
  DELETE FROM public.products WHERE id = 'f391cce0-130d-4271-a724-f623ac225d74' AND slug = 'concurrency-f391cce0-130d-4271-a724-f623ac225d74';
  IF NOT FOUND THEN RAISE EXCEPTION 'FALLO: el producto ganador no corresponde a A.'; END IF;
END;
$cleanup$;
SELECT 'rechazado' AS slug_duplicado, count(*) AS filas_restantes FROM public.products WHERE slug = 'concurrency-f391cce0-130d-4271-a724-f623ac225d74';
