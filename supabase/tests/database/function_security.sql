-- Run after a local reset:
-- docker exec -i supabase_db_cruma-platform \
--   psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
--   < supabase/tests/database/function_security.sql

BEGIN;

DO $test$
DECLARE
  signature text;
  function_oid oid;
  search_path_setting text;
  hardened_functions constant text[] := ARRAY[
    'public.create_production_order_items(uuid)',
    'public.decrease_product_lot_quantity(uuid,numeric)',
    'public.handle_new_user()',
    'public.is_admin(uuid)',
    'public.add_purchase_order_item(uuid,uuid,numeric,numeric)',
    'public.receive_purchase_order(uuid)',
    'public.receive_purchase_order_item(uuid,numeric)',
    'public.receive_purchase_order_lot(uuid,text,date,uuid)'
  ];
BEGIN
  FOREACH signature IN ARRAY hardened_functions LOOP
    function_oid := to_regprocedure(signature);

    IF function_oid IS NULL THEN
      RAISE EXCEPTION 'Missing function: %', signature;
    END IF;

    SELECT setting
    INTO search_path_setting
    FROM pg_proc AS procedure
    CROSS JOIN LATERAL unnest(
      coalesce(procedure.proconfig, ARRAY[]::text[])
    ) AS setting
    WHERE procedure.oid = function_oid
      AND setting LIKE 'search_path=%';

    IF search_path_setting IS NULL
      OR split_part(search_path_setting, '=', 2) NOT IN ('', '""')
    THEN
      RAISE EXCEPTION
        'Function % must have an empty search_path; found %',
        signature,
        coalesce(search_path_setting, '<unset>');
    END IF;
  END LOOP;
END;
$test$;

DO $test$
DECLARE
  signature text;
  function_oid oid;
  public_can_execute boolean;
  authenticated_should_execute boolean;
  all_functions constant text[] := ARRAY[
    'public.create_production_order_items(uuid)',
    'public.decrease_product_lot_quantity(uuid,numeric)',
    'public.generate_invoice_number()',
    'public.generate_purchase_requisition_number()',
    'public.handle_new_user()',
    'public.is_admin(uuid)',
    'public.log_order_status_change()',
    'public.add_purchase_order_item(uuid,uuid,numeric,numeric)',
    'public.receive_purchase_order(uuid)',
    'public.receive_purchase_order_item(uuid,numeric)',
    'public.receive_purchase_order_lot(uuid,text,date,uuid)',
    'public.recalculate_cart_totals()',
    'public.set_updated_at()',
    'public.sync_order_payment_status()',
    'public.update_order_timestamp()'
  ];
  authenticated_functions constant text[] := ARRAY[
    'public.create_production_order_items(uuid)',
    'public.decrease_product_lot_quantity(uuid,numeric)',
    'public.is_admin(uuid)',
    'public.add_purchase_order_item(uuid,uuid,numeric,numeric)',
    'public.receive_purchase_order(uuid)',
    'public.receive_purchase_order_item(uuid,numeric)',
    'public.receive_purchase_order_lot(uuid,text,date,uuid)'
  ];
BEGIN
  FOREACH signature IN ARRAY all_functions LOOP
    function_oid := to_regprocedure(signature);

    IF function_oid IS NULL THEN
      RAISE EXCEPTION 'Missing function: %', signature;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM pg_proc AS procedure
      CROSS JOIN LATERAL aclexplode(
        coalesce(
          procedure.proacl,
          acldefault('f', procedure.proowner)
        )
      ) AS privilege
      WHERE procedure.oid = function_oid
        AND privilege.grantee = 0
        AND privilege.privilege_type = 'EXECUTE'
    )
    INTO public_can_execute;

    IF public_can_execute THEN
      RAISE EXCEPTION 'PUBLIC must not execute %', signature;
    END IF;

    IF has_function_privilege('anon', signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon must not execute %', signature;
    END IF;

    IF has_function_privilege('service_role', signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role must not execute %', signature;
    END IF;

    authenticated_should_execute :=
      signature = ANY(authenticated_functions);

    IF has_function_privilege(
      'authenticated',
      signature,
      'EXECUTE'
    ) IS DISTINCT FROM authenticated_should_execute
    THEN
      RAISE EXCEPTION
        'Unexpected authenticated EXECUTE privilege for %',
        signature;
    END IF;
  END LOOP;
END;
$test$;

DO $test$
BEGIN
  IF (
    SELECT procedure.prosecdef
    FROM pg_proc AS procedure
    WHERE procedure.oid =
      to_regprocedure('public.create_production_order_items(uuid)')
  ) THEN
    RAISE EXCEPTION
      'create_production_order_items must remain SECURITY INVOKER';
  END IF;

  IF (
    SELECT procedure.prosecdef
    FROM pg_proc AS procedure
    WHERE procedure.oid =
      to_regprocedure(
        'public.decrease_product_lot_quantity(uuid,numeric)'
      )
  ) THEN
    RAISE EXCEPTION
      'decrease_product_lot_quantity must remain SECURITY INVOKER';
  END IF;

  IF NOT (
    SELECT procedure.prosecdef
    FROM pg_proc AS procedure
    WHERE procedure.oid =
      to_regprocedure('public.handle_new_user()')
  ) THEN
    RAISE EXCEPTION 'handle_new_user must remain SECURITY DEFINER';
  END IF;

  IF NOT (
    SELECT procedure.prosecdef
    FROM pg_proc AS procedure
    WHERE procedure.oid =
      to_regprocedure('public.is_admin(uuid)')
  ) THEN
    RAISE EXCEPTION 'is_admin must remain SECURITY DEFINER';
  END IF;
END;
$test$;

DO $test$
DECLARE
  signature text;
  secured_functions constant text[] := ARRAY[
    'public.add_purchase_order_item(uuid,uuid,numeric,numeric)',
    'public.receive_purchase_order(uuid)',
    'public.receive_purchase_order_item(uuid,numeric)',
    'public.receive_purchase_order_lot(uuid,text,date,uuid)'
  ];
BEGIN
  FOREACH signature IN ARRAY secured_functions LOOP
    IF NOT (
      SELECT procedure.prosecdef
      FROM pg_proc AS procedure
      WHERE procedure.oid = to_regprocedure(signature)
    ) THEN
      RAISE EXCEPTION '% must remain SECURITY DEFINER', signature;
    END IF;
  END LOOP;
END;
$test$;

ROLLBACK;
