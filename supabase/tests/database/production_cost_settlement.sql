BEGIN;

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
    'ce100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'cost-settlement-admin@example.test',
    now(),
    now()
  ),
  (
    'ce100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'cost-settlement-user@example.test',
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
    'ce100000-0000-4000-8000-000000000001',
    'Cost Settlement Admin',
    'cost-settlement-admin@example.test',
    'admin'
  ),
  (
    'ce100000-0000-4000-8000-000000000002',
    'Cost Settlement User',
    'cost-settlement-user@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  'ce100000-0000-4000-8000-000000000001',
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
  'ce200000-0000-4000-8000-000000000001',
  'cost-settlement-product',
  'COST-SET-P1',
  'Cost Settlement Product',
  'active'
);

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  is_active
)
VALUES (
  'ce300000-0000-4000-8000-000000000001',
  'ce200000-0000-4000-8000-000000000001',
  'Cost Settlement Recipe',
  true
);

INSERT INTO public.raw_materials (
  id,
  slug,
  internal_code,
  name,
  is_active
)
VALUES (
  'ce400000-0000-4000-8000-000000000001',
  'cost-settlement-material',
  'COST-SET-M1',
  'Cost Settlement Material',
  true
);

INSERT INTO public.raw_material_lots (
  id,
  raw_material_id,
  lot_number,
  quantity,
  unit_cost,
  status
)
VALUES (
  'ce500000-0000-4000-8000-000000000001',
  'ce400000-0000-4000-8000-000000000001',
  'COST-SET-LOT-1',
  8,
  12.5,
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
)
VALUES (
  'ce600000-0000-4000-8000-000000000001',
  'COST-SET-PRD-1',
  'ce300000-0000-4000-8000-000000000001',
  'completed',
  10,
  10,
  now()
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
  'ce700000-0000-4000-8000-000000000001',
  'ce600000-0000-4000-8000-000000000001',
  'ce400000-0000-4000-8000-000000000001',
  2,
  2,
  'completed'
);

INSERT INTO public.production_order_consumptions (
  production_order_item_id,
  raw_material_lot_id,
  quantity,
  unit_cost,
  total_cost
)
VALUES (
  'ce700000-0000-4000-8000-000000000001',
  'ce500000-0000-4000-8000-000000000001',
  2,
  12.5,
  25
);

INSERT INTO public.production_outputs (
  id,
  production_order_id,
  product_id,
  quantity_produced,
  quality_status
)
VALUES (
  'ce800000-0000-4000-8000-000000000001',
  'ce600000-0000-4000-8000-000000000001',
  'ce200000-0000-4000-8000-000000000001',
  10,
  'pending'
);

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'ce100000-0000-4000-8000-000000000002',
  true
);

DO $test$
BEGIN
  IF (
    SELECT count(*)
    FROM
      public.production_cost_settlement_operations
  ) <> 0 THEN
    RAISE EXCEPTION
      'normal user read cost settlements';
  END IF;

  BEGIN
    PERFORM public.settle_production_cost(
      'ce600000-0000-4000-8000-000000000001',
      20,
      5,
      'ce900000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'normal user settled production cost';
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
  'ce100000-0000-4000-8000-000000000001',
  true
);

-- La repetición exacta no duplica efectos.
SELECT public.settle_production_cost(
  'ce600000-0000-4000-8000-000000000001',
  20,
  5,
  'ce900000-0000-4000-8000-000000000001'
);

SELECT public.settle_production_cost(
  'ce600000-0000-4000-8000-000000000001',
  20,
  5,
  'ce900000-0000-4000-8000-000000000001'
);

-- La misma clave no admite datos diferentes.
DO $test$
BEGIN
  BEGIN
    PERFORM public.settle_production_cost(
      'ce600000-0000-4000-8000-000000000001',
      21,
      5,
      'ce900000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'idempotency key accepted different cost data';
  EXCEPTION
    WHEN unique_violation THEN
      IF SQLERRM <>
        'Idempotency key was reused with different data.'
      THEN
        RAISE EXCEPTION
          'unexpected idempotency error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

RESET ROLE;

-- El snapshot no cambia aunque cambie el costo del lote.
UPDATE public.raw_material_lots
SET unit_cost = 99
WHERE id =
  'ce500000-0000-4000-8000-000000000001';

UPDATE public.production_order_consumptions
SET
  unit_cost = 99,
  total_cost = 198
WHERE production_order_item_id =
  'ce700000-0000-4000-8000-000000000001';

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'ce100000-0000-4000-8000-000000000001',
  true
);

-- Una nueva intención produce una versión legítima.
SELECT public.settle_production_cost(
  'ce600000-0000-4000-8000-000000000001',
  25,
  5,
  'ce900000-0000-4000-8000-000000000002'
);

RESET ROLE;

-- La disposición de calidad congela el costo.
UPDATE public.production_outputs
SET quality_status = 'released'
WHERE id =
  'ce800000-0000-4000-8000-000000000001';

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'ce100000-0000-4000-8000-000000000001',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.settle_production_cost(
      'ce600000-0000-4000-8000-000000000001',
      30,
      5,
      'ce900000-0000-4000-8000-000000000003'
    );

    RAISE EXCEPTION
      'cost changed after quality disposition';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'Production cost is frozen after quality disposition.'
      THEN
        RAISE EXCEPTION
          'unexpected frozen cost error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.production_costs
      AS cost
    JOIN public.production_orders
      AS production_order
      ON production_order.id =
        cost.production_order_id
    JOIN public.production_outputs
      AS output
      ON output.production_order_id =
        cost.production_order_id
    WHERE cost.production_order_id =
      'ce600000-0000-4000-8000-000000000001'
      AND cost.material_cost = 25
      AND cost.labor_cost = 25
      AND cost.overhead_cost = 5
      AND cost.total_cost = 55
      AND cost.unit_cost = 5.5
      AND cost.calculation_version = 2
      AND cost.source_consumption_count = 1
      AND production_order.actual_cost = 55
      AND output.total_cost = 55
      AND output.unit_cost = 5.5
  ) THEN
    RAISE EXCEPTION
      'production cost settlement is inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_cost_history
    WHERE production_order_id =
      'ce600000-0000-4000-8000-000000000001'
  ) <> 2 THEN
    RAISE EXCEPTION
      'production cost history was duplicated or lost';
  END IF;

  IF (
    SELECT count(*)
    FROM
      public.production_cost_settlement_operations
    WHERE production_order_id =
      'ce600000-0000-4000-8000-000000000001'
  ) <> 2 THEN
    RAISE EXCEPTION
      'settlement audit is inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM
      public.production_cost_settlement_operations
    WHERE idempotency_key =
      'ce900000-0000-4000-8000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'exact retry duplicated settlement';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM
      public.production_cost_settlement_operations
    WHERE idempotency_key =
      'ce900000-0000-4000-8000-000000000002'
      AND calculation_version = 2
      AND material_cost = 25
      AND labor_cost = 25
      AND overhead_cost = 5
      AND total_cost = 55
      AND unit_cost = 5.5
      AND source_consumption_count = 1
      AND settled_by =
        'ce100000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'settlement audit values are inconsistent';
  END IF;
END;
$test$;

ROLLBACK;
