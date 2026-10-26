-- Ejecutar el bloque completo como postgres en SQL Editor; las solicitudes son secuenciales.
BEGIN;
DO $test$
DECLARE
  admin_id uuid; original_id uuid := gen_random_uuid(); candidate_id uuid;
  base_slug text; base_code text; case_name text; expected_constraint text; violated_constraint text;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1;
  IF admin_id IS NULL THEN RAISE EXCEPTION 'Falta un admin explícito en user_roles para la prueba.'; END IF;
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF current_user <> 'authenticated' OR auth.uid() IS DISTINCT FROM admin_id THEN
    RAISE EXCEPTION 'El rol o la identidad SQL no corresponde al administrador.';
  END IF;
  base_slug := 'unique-test-' || original_id::text;
  base_code := 'UNI-' || upper(original_id::text);
  INSERT INTO public.products (id, name, slug, internal_code, status, min_stock)
  VALUES (original_id, 'Prueba de unicidad', base_slug, base_code, 'draft', 0);
  FOR case_name, expected_constraint IN VALUES
    ('slug', 'products_slug_key'), ('internal_code', 'products_internal_code_key')
  LOOP
    candidate_id := gen_random_uuid();
    BEGIN
      INSERT INTO public.products (id, name, slug, internal_code, status, min_stock)
      VALUES (candidate_id, 'Intento duplicado',
        CASE WHEN case_name = 'slug' THEN base_slug ELSE 'unique-attempt-' || candidate_id::text END,
        CASE WHEN case_name = 'internal_code' THEN base_code ELSE 'UNI-DUP-' || upper(candidate_id::text) END,
        'draft', 0);
      RAISE EXCEPTION 'FALLO: se permitió un % duplicado.', case_name;
    EXCEPTION WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
      IF violated_constraint IS DISTINCT FROM expected_constraint THEN RAISE; END IF;
    END;
    IF EXISTS (SELECT 1 FROM public.products WHERE id = candidate_id)
      OR (SELECT count(*) FROM public.products WHERE slug = base_slug OR internal_code = base_code) <> 1 THEN
      RAISE EXCEPTION 'FALLO: el rechazo de % dejó filas inesperadas.', case_name;
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = original_id AND name = 'Prueba de unicidad'
    AND slug = base_slug AND internal_code = base_code AND status = 'draft' AND min_stock = 0) THEN
    RAISE EXCEPTION 'FALLO: se modificó o perdió el producto original.';
  END IF;
  EXECUTE 'RESET ROLE';
END;
$test$;
ROLLBACK;
SELECT 'rechazado' AS slug_duplicado, 'rechazado' AS codigo_interno_duplicado, 'revertidos' AS datos_prueba;
