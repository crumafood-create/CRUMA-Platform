BEGIN;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
) VALUES
(
  'f1000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'finished-release-admin@example.test',
  now(),
  now()
),
(
  'f1000000-0000-4000-8000-000000000002',
  'authenticated',
  'authenticated',
  'finished-release-user@example.test',
  now(),
  now()
);

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role
) VALUES
(
  'f1000000-0000-4000-8000-000000000001',
  'Finished Release Admin',
  'finished-release-admin@example.test',
  'admin'
),
(
  'f1000000-0000-4000-8000-000000000002',
  'Finished Release User',
  'finished-release-user@example.test',
  'client'
);

INSERT INTO public.user_roles (
  user_id,
  role
) VALUES (
  'f1000000-0000-4000-8000-000000000001',
  'admin'
);

INSERT INTO public.warehouses (
  id,
  code,
  name
) VALUES (
  'f2000000-0000-4000-8000-000000000001',
  'FG-WH',
  'Finished Goods Warehouse'
);

INSERT INTO public.inventory_locations (
  id,
  slug,
  name
) VALUES (
  'f3000000-0000-4000-8000-000000000001',
  'finished-goods-location',
  'Finished Goods Location'
);

INSERT INTO public.products (
  id,
  slug,
  internal_code,
  name,
  status
) VALUES (
  'f4000000-0000-4000-8000-000000000001',
  'finished-release-product',
  'FG-P1',
  'Finished Release Product',
  'active'
);

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  is_active
) VALUES (
  'f5000000-0000-4000-8000-000000000001',
  'f4000000-0000-4000-8000-000000000001',
  'Finished Release Recipe',
  true
);

INSERT INTO public.raw_materials (
  id,
  slug,
  name
) VALUES (
  'f6000000-0000-4000-8000-000000000001',
  'finished-release-material',
  'Finished Release Material'
);

INSERT INTO public.raw_material_lots (
  id,
  raw_material_id,
  lot_number,
  quantity,
  unit_cost,
  inventory_location_id,
  status
) VALUES (
  'f7000000-0000-4000-8000-000000000001',
  'f6000000-0000-4000-8000-000000000001',
  'RM-FG-001',
  100,
  2,
  'f3000000-0000-4000-8000-000000000001',
  'available'
);

INSERT INTO public.production_orders (
  id,
  production_number,
  recipe_id,
  production_status,
  planned_quantity,
  produced_quantity,
  completed_at
) VALUES (
  'f8000000-0000-4000-8000-000000000001',
  'FG-PRD-001',
  'f5000000-0000-4000-8000-000000000001',
  'completed',
  12,
  12,
  now()
);

INSERT INTO public.production_order_items (
  id,
  production_order_id,
  raw_material_id,
  planned_quantity,
  consumed_quantity,
  status
) VALUES (
  'f9000000-0000-4000-8000-000000000001',
  'f8000000-0000-4000-8000-000000000001',
  'f6000000-0000-4000-8000-000000000001',
  12,
  12,
  'completed'
);

INSERT INTO public.production_order_consumptions (
  production_order_item_id,
  raw_material_lot_id,
  quantity,
  unit_cost,
  total_cost
) VALUES (
  'f9000000-0000-4000-8000-000000000001',
  'f7000000-0000-4000-8000-000000000001',
  12,
  2,
  24
);

INSERT INTO public.production_outputs (
  id,
  production_order_id,
  product_id,
  quantity_produced,
  quality_status
) VALUES (
  'fa000000-0000-4000-8000-000000000001',
  'f8000000-0000-4000-8000-000000000001',
  'f4000000-0000-4000-8000-000000000001',
  12,
  'pending'
);

INSERT INTO public.quality_inspections (
  id,
  production_order_id,
  production_output_id,
  inspector_id,
  subject_type,
  status,
  result,
  sampled_quantity,
  accepted_quantity,
  rejected_quantity
) VALUES (
  'fb000000-0000-4000-8000-000000000001',
  'f8000000-0000-4000-8000-000000000001',
  'fa000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000001',
  'production_output',
  'passed',
  'ok',
  12,
  12,
  0
);

DO $test$
BEGIN
  IF has_function_privilege(
    'authenticated',
    'public.release_production_output_to_inventory' ||
      '(uuid,text,date,uuid,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'authenticated still executes the fragmented release RPC';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.' ||
      'release_finished_product_quality_to_inventory' ||
      '(uuid,text,date,uuid,uuid,uuid,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'authenticated cannot execute the atomic release RPC';
  END IF;
END;
$test$;

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-4000-8000-000000000002',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM
      public.release_finished_product_quality_to_inventory(
        'fb000000-0000-4000-8000-000000000001',
        'PT-FG-001',
        '2099-12-31',
        'f2000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        'fc000000-0000-4000-8000-000000000001',
        'Cumple especificación'
      );

    RAISE EXCEPTION
      'normal user released finished product';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-4000-8000-000000000001',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.decide_quality_release(
      'fb000000-0000-4000-8000-000000000001',
      'release',
      'Fragmented release'
    );

    RAISE EXCEPTION
      'fragmented quality release remained enabled';
  EXCEPTION
    WHEN SQLSTATE '22023' THEN
      IF SQLERRM IS DISTINCT FROM
        'Finished product release requires lot and inventory data.'
      THEN
        RAISE;
      END IF;
  END;
END;
$test$;

SELECT
  public.release_finished_product_quality_to_inventory(
    'fb000000-0000-4000-8000-000000000001',
    'PT-FG-001',
    '2099-12-31',
    'f2000000-0000-4000-8000-000000000001',
    'f3000000-0000-4000-8000-000000000001',
    'fc000000-0000-4000-8000-000000000001',
    'Cumple especificación'
  );

SELECT
  public.release_finished_product_quality_to_inventory(
    'fb000000-0000-4000-8000-000000000001',
    'PT-FG-001',
    '2099-12-31',
    'f2000000-0000-4000-8000-000000000001',
    'f3000000-0000-4000-8000-000000000001',
    'fc000000-0000-4000-8000-000000000001',
    'Cumple especificación'
  );

DO $test$
BEGIN
  BEGIN
    PERFORM
      public.release_finished_product_quality_to_inventory(
        'fb000000-0000-4000-8000-000000000001',
        'PT-FG-002',
        '2099-12-31',
        'f2000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        'fc000000-0000-4000-8000-000000000001',
        'Cumple especificación'
      );

    RAISE EXCEPTION
      'idempotency key accepted different data';
  EXCEPTION
    WHEN unique_violation THEN
      IF SQLERRM IS DISTINCT FROM
        'Idempotency key was reused with different data.'
      THEN
        RAISE;
      END IF;
  END;
END;
$test$;

RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.production_outputs
    WHERE
      id =
        'fa000000-0000-4000-8000-000000000001'
      AND quality_status = 'released'
  ) THEN
    RAISE EXCEPTION
      'production output was not released';
  END IF;

  IF (
    SELECT count(*)
    FROM public.quality_release_decisions
    WHERE
      inspection_id =
        'fb000000-0000-4000-8000-000000000001'
      AND decision = 'release'
  ) <> 1 THEN
    RAISE EXCEPTION
      'quality release decision was not unique';
  END IF;

  IF (
    SELECT count(*)
    FROM public.product_lots
    WHERE
      production_output_id =
        'fa000000-0000-4000-8000-000000000001'
      AND lot_number = 'PT-FG-001'
      AND initial_quantity = 12
      AND quantity = 12
      AND status = 'available'
  ) <> 1 THEN
    RAISE EXCEPTION
      'available product lot was not created once';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_lot_traceability
    WHERE
      raw_material_lot_id =
        'f7000000-0000-4000-8000-000000000001'
      AND consumed_quantity = 12
  ) <> 1 THEN
    RAISE EXCEPTION
      'production traceability was not captured once';
  END IF;

  IF (
    SELECT count(*)
    FROM public.inventory_movements
    WHERE
      movement_type = 'entry'
      AND quantity = 12
      AND reference_type = 'production_lot'
      AND reference_id = (
        SELECT id
        FROM public.product_lots
        WHERE
          production_output_id =
            'fa000000-0000-4000-8000-000000000001'
      )
  ) <> 1 THEN
    RAISE EXCEPTION
      'inventory entry was not created once';
  END IF;

  IF (
    SELECT count(*)
    FROM
      public.finished_product_quality_release_operations
    WHERE
      idempotency_key =
        'fc000000-0000-4000-8000-000000000001'
      AND quality_inspection_id =
        'fb000000-0000-4000-8000-000000000001'
      AND production_output_id =
        'fa000000-0000-4000-8000-000000000001'
      AND lot_number = 'PT-FG-001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'atomic release operation was not recorded once';
  END IF;
END;
$test$;

ROLLBACK;