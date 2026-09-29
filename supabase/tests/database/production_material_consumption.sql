BEGIN;

-- Actors used to verify authorization and audit ownership.
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
)
VALUES
  (
    'fb100000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'consumption-admin@example.test',
    now(),
    now()
  ),
  (
    'fb100000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'consumption-user@example.test',
    now(),
    now()
  );

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role
)
VALUES
  (
    'fb100000-0000-0000-0000-000000000001',
    'Production Consumption Admin',
    'consumption-admin@example.test',
    'admin'
  ),
  (
    'fb100000-0000-0000-0000-000000000002',
    'Production Consumption User',
    'consumption-user@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  'fb100000-0000-0000-0000-000000000001',
  'admin'
);

INSERT INTO public.products (
  id,
  slug,
  internal_code,
  name,
  status
)
VALUES (
  'fb200000-0000-0000-0000-000000000001',
  'consumption-product',
  'CONS-P1',
  'Consumption Product',
  'active'
);

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  is_active
)
VALUES (
  'fb300000-0000-0000-0000-000000000001',
  'fb200000-0000-0000-0000-000000000001',
  'Consumption Recipe',
  true
);

INSERT INTO public.raw_materials (
  id,
  slug,
  internal_code,
  name,
  current_stock,
  average_cost,
  last_cost,
  is_active
)
VALUES (
  'fb400000-0000-0000-0000-000000000001',
  'consumption-material',
  'CONS-M1',
  'Consumption Material',
  9.0000,
  2.0000,
  3.0000,
  true
);

-- The expired and quarantined lots must never become the FEFO suggestion.
-- Available physical stock is 9: expired 2 + FEFO-1 3 + FEFO-2 4.
INSERT INTO public.raw_material_lots (
  id,
  raw_material_id,
  lot_number,
  expiration_date,
  quantity,
  unit_cost,
  status
)
VALUES
  (
    'fb500000-0000-0000-0000-000000000001',
    'fb400000-0000-0000-0000-000000000001',
    'EXPIRED-LOT',
    '2000-01-01',
    2.0000,
    1.0000,
    'available'
  ),
  (
    'fb500000-0000-0000-0000-000000000002',
    'fb400000-0000-0000-0000-000000000001',
    'FEFO-1',
    '2099-01-31',
    3.0000,
    2.0000,
    'available'
  ),
  (
    'fb500000-0000-0000-0000-000000000003',
    'fb400000-0000-0000-0000-000000000001',
    'FEFO-2',
    '2099-02-28',
    4.0000,
    3.0000,
    'available'
  ),
  (
    'fb500000-0000-0000-0000-000000000004',
    'fb400000-0000-0000-0000-000000000001',
    'QUARANTINE-LOT',
    '2098-01-31',
    10.0000,
    4.0000,
    'quarantine'
  );

INSERT INTO public.production_orders (
  id,
  production_number,
  recipe_id,
  production_status,
  planned_quantity,
  produced_quantity
)
VALUES (
  'fb600000-0000-0000-0000-000000000001',
  'CONS-PRD-1',
  'fb300000-0000-0000-0000-000000000001',
  'released',
  10,
  0
);

INSERT INTO public.production_order_items (
  id,
  production_order_id,
  raw_material_id,
  planned_quantity,
  consumed_quantity,
  status
)
VALUES (
  'fb700000-0000-0000-0000-000000000001',
  'fb600000-0000-0000-0000-000000000001',
  'fb400000-0000-0000-0000-000000000001',
  5.0000,
  0,
  'pending'
);

-- A regular authenticated user cannot consume production material.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fb100000-0000-0000-0000-000000000002',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.consume_production_material_fefo(
      'fb700000-0000-0000-0000-000000000001',
      'FEFO-1',
      'fb800000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'normal user consumed production material';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

-- The administrator must scan the exact next eligible FEFO lot.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fb100000-0000-0000-0000-000000000001',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.consume_production_material_fefo(
      'fb700000-0000-0000-0000-000000000001',
      'FEFO-2',
      'fb800000-0000-4000-8000-000000000099'
    );

    RAISE EXCEPTION
      'non-FEFO lot was accepted';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END;
$test$;

-- FEFO-1 only contains 3 units. The item must remain incomplete.
SELECT public.consume_production_material_fefo(
  'fb700000-0000-0000-0000-000000000001',
  'FEFO-1',
  'fb800000-0000-4000-8000-000000000001'
);

-- Repeating the same operation must return safely without duplicating writes.
SELECT public.consume_production_material_fefo(
  'fb700000-0000-0000-0000-000000000001',
  'FEFO-1',
  'fb800000-0000-4000-8000-000000000001'
);

-- The same key cannot identify different input.
DO $test$
BEGIN
  BEGIN
    PERFORM public.consume_production_material_fefo(
      'fb700000-0000-0000-0000-000000000001',
      'FEFO-2',
      'fb800000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'idempotency key accepted different data';
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;
END;
$test$;

-- The second physical scan consumes only the remaining two units.
SELECT public.consume_production_material_fefo(
  'fb700000-0000-0000-0000-000000000001',
  'fefo-2',
  'fb800000-0000-4000-8000-000000000002'
);

RESET ROLE;

-- Verify stock, FEFO state, idempotency and audit trail.
DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE id =
        'fb500000-0000-0000-0000-000000000002'
      AND quantity = 0
      AND status = 'depleted'
  ) THEN
    RAISE EXCEPTION
      'first FEFO lot was not depleted';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE id =
        'fb500000-0000-0000-0000-000000000003'
      AND quantity = 2.0000
      AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'second FEFO lot has an invalid balance';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE id =
        'fb500000-0000-0000-0000-000000000001'
      AND quantity = 2.0000
      AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'expired lot was consumed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE id =
        'fb500000-0000-0000-0000-000000000004'
      AND quantity = 10.0000
      AND status = 'quarantine'
  ) THEN
    RAISE EXCEPTION
      'quarantined lot was consumed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_materials
    WHERE id =
        'fb400000-0000-0000-0000-000000000001'
      AND current_stock = 4.0000
  ) THEN
    RAISE EXCEPTION
      'raw material stock was not decremented';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE id =
        'fb700000-0000-0000-0000-000000000001'
      AND consumed_quantity = 5.0000
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION
      'production item was not completed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_orders
    WHERE id =
        'fb600000-0000-0000-0000-000000000001'
      AND production_status = 'in_progress'
      AND started_at IS NOT NULL
      AND completed_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'production order has an invalid state';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_order_consumptions
    WHERE production_order_item_id =
      'fb700000-0000-0000-0000-000000000001'
  ) <> 2 THEN
    RAISE EXCEPTION
      'production consumption was duplicated';
  END IF;

  IF (
    SELECT coalesce(sum(quantity), 0)
    FROM public.production_order_consumptions
    WHERE production_order_item_id =
      'fb700000-0000-0000-0000-000000000001'
  ) <> 5.0000 THEN
    RAISE EXCEPTION
      'production consumption quantity is inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_material_consumption_operations
    WHERE production_order_item_id =
      'fb700000-0000-0000-0000-000000000001'
  ) <> 2 THEN
    RAISE EXCEPTION
      'idempotent operation audit is inconsistent';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.production_material_consumption_operations
    WHERE production_order_item_id =
        'fb700000-0000-0000-0000-000000000001'
      AND consumed_by IS DISTINCT FROM
        'fb100000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'consumption actor was not audited';
  END IF;

  IF (
    SELECT count(*)
    FROM public.inventory_movements
    WHERE item_type = 'raw_material'
      AND item_id =
        'fb400000-0000-0000-0000-000000000001'
      AND movement_type = 'exit'
      AND reference_type =
        'production_material_consumption'
  ) <> 2 THEN
    RAISE EXCEPTION
      'inventory movement audit is incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE item_id =
        'fb400000-0000-0000-0000-000000000001'
      AND quantity = 3.0000
      AND previous_stock = 9.0000
      AND new_stock = 6.0000
  ) THEN
    RAISE EXCEPTION
      'first inventory movement is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE item_id =
        'fb400000-0000-0000-0000-000000000001'
      AND quantity = 2.0000
      AND previous_stock = 6.0000
      AND new_stock = 4.0000
  ) THEN
    RAISE EXCEPTION
      'second inventory movement is inconsistent';
  END IF;
END;
$test$;

-- Direct reading of the audit table remains restricted by RLS.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fb100000-0000-0000-0000-000000000002',
  true
);

DO $test$
BEGIN
  IF (
    SELECT count(*)
    FROM public.production_material_consumption_operations
  ) <> 0 THEN
    RAISE EXCEPTION
      'normal user read production consumption operations';
  END IF;
END;
$test$;

RESET ROLE;

ROLLBACK;