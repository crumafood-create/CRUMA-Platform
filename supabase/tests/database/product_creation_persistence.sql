-- Ejecutar el bloque completo como postgres en SQL Editor; los INSERT y SELECT usan un admin existente.
BEGIN;
DO $test$
DECLARE
  admin_id uuid; product_id uuid; product_status text;
  expected_slug text; expected_code text; stored_product record;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1;
  IF admin_id IS NULL THEN RAISE EXCEPTION 'Falta un admin explícito en user_roles para la prueba.'; END IF;
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF current_user <> 'authenticated' OR auth.uid() IS DISTINCT FROM admin_id THEN
    RAISE EXCEPTION 'El rol o la identidad SQL no corresponde al administrador.';
  END IF;
  FOREACH product_status IN ARRAY ARRAY['active', 'archived'] LOOP
    expected_slug := 'persistence-' || product_status || '-' || gen_random_uuid()::text;
    expected_code := CASE WHEN product_status = 'archived' THEN 'PERSIST-' || upper(gen_random_uuid()::text) ELSE NULL END;
    INSERT INTO public.products (name, slug, internal_code, status, min_stock)
    VALUES ('Prueba de persistencia', expected_slug, expected_code, product_status, 12)
    RETURNING id INTO product_id;
    SELECT name, slug, internal_code, status, min_stock INTO STRICT stored_product
    FROM public.products WHERE id = product_id;
    IF stored_product.name IS DISTINCT FROM 'Prueba de persistencia'
      OR stored_product.slug IS DISTINCT FROM expected_slug
      OR stored_product.internal_code IS DISTINCT FROM expected_code
      OR stored_product.status IS DISTINCT FROM product_status
      OR stored_product.min_stock IS DISTINCT FROM 12 THEN
      RAISE EXCEPTION 'FALLO: los valores consultados del producto % difieren de los insertados.', product_status;
    END IF;
  END LOOP;
  EXECUTE 'RESET ROLE';
END;
$test$;
ROLLBACK;
SELECT 'guardado_y_consultado' AS activo, 'guardado_y_consultado' AS archivado,
  12 AS stock_minimo, 'revertidos' AS datos_prueba;
