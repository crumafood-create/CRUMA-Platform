-- Ejecutar el bloque completo desde SQL Editor con el rol postgres.
-- sin_admin usa una identidad SQL de prueba; no crea un usuario de Auth.
BEGIN;
DO $test$
DECLARE
  admin_id uuid; outsider_id uuid := gen_random_uuid(); actor_id uuid;
  scenario text; db_role text; product_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1;
  IF admin_id IS NULL THEN RAISE EXCEPTION 'Falta un admin explícito en user_roles para la prueba.'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = outsider_id) THEN
    RAISE EXCEPTION 'La identidad de prueba ya tiene roles; repetir con otro UUID.';
  END IF;
  FOREACH scenario IN ARRAY ARRAY['anon', 'sin_admin', 'admin'] LOOP
    db_role := CASE WHEN scenario = 'anon' THEN 'anon' ELSE 'authenticated' END;
    actor_id := CASE WHEN scenario = 'admin' THEN admin_id WHEN scenario = 'sin_admin' THEN outsider_id ELSE NULL END;
    product_id := gen_random_uuid();
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', actor_id, 'role', db_role)::text, true);
    PERFORM set_config('request.jwt.claim.sub', coalesce(actor_id::text, ''), true);
    EXECUTE format('SET LOCAL ROLE %I', db_role);
    IF current_user <> db_role OR auth.uid() IS DISTINCT FROM actor_id THEN
      RAISE EXCEPTION 'El rol o la identidad SQL no corresponde al caso %.', scenario;
    END IF;
    BEGIN
      INSERT INTO public.products (id, name, slug, status, min_stock, internal_code)
      VALUES (product_id, 'Prueba RLS de alta', 'rls-create-' || product_id::text, 'draft', 0, NULL);
      IF scenario <> 'admin' THEN
        RAISE EXCEPTION 'FALLO: el caso % pudo insertar un producto.', scenario;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.products
        WHERE id = product_id AND status = 'draft' AND min_stock = 0 AND internal_code IS NULL) THEN
        RAISE EXCEPTION 'FALLO: el admin no pudo consultar el producto insertado.';
      END IF;
    EXCEPTION WHEN insufficient_privilege THEN
      IF scenario = 'admin' OR SQLERRM NOT LIKE '%row-level security%' THEN RAISE; END IF;
    END;
    EXECUTE 'RESET ROLE';
  END LOOP;
END;
$test$;
ROLLBACK;
SELECT 'rechazado' AS sin_sesion, 'rechazado' AS sin_admin, 'permitido_y_revertido' AS admin;
