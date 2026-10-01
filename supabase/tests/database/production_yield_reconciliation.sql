BEGIN;

-- Actores para autorización y auditoría.
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
    'fd100000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'completion-admin@example.test',
    now(),
    now()
  ),
  (
    'fd100000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'completion-user@example.test',
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
    'fd100000-0000-0000-0000-000000000001',
    'Production Completion Admin',
    'completion-admin@example.test',
    'admin'
  ),
  (
    'fd100000-0000-0000-0000-000000000002',
    'Production Completion User',
    'completion-user@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  'fd100000-0000-0000-0000-000000000001',
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
  'fd200000-0000-0000-0000-000000000001',
  'completion-product',
  'COMP-P1',
  'Completion Product',
  'active'
);

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  is_active
)
VALUES (
  'fd300000-0000-0000-0000-000000000001',
  'fd200000-0000-0000-0000-000000000001',
  'Completion Recipe',
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
  'fd400000-0000-0000-0000-000000000001',
  'completion-material',
  'COMP-M1',
  'Completion Material',
  0,
  2,
  2,
  true
);

-- Una orden puede cerrarse; la otra conserva material pendiente.
INSERT INTO public.production_orders (
  id,
  production_number,
  recipe_id,
  production_status,
  planned_quantity,
  produced_quantity
)
VALUES
  (
    'fd500000-0000-0000-0000-000000000001',
    'COMP-PRD-1',
    'fd300000-0000-0000-0000-000000000001',
    'in_progress',
    10,
    0
  ),
  (
    'fd500000-0000-0000-0000-000000000002',
    'COMP-PRD-2',
    'fd300000-0000-0000-0000-000000000001',
    'in_progress',
    5,
    0
  ),
  (
    'fd500000-0000-0000-0000-000000000003',
    'YIELD-PRD-3',
    'fd300000-0000-0000-0000-000000000001',
    'in_progress',
    10,
    0
  ),
  (
    'fd500000-0000-0000-0000-000000000004',
    'YIELD-PRD-4',
    'fd300000-0000-0000-0000-000000000001',
    'in_progress',
    10,
    0
  ),
  (
    'fd500000-0000-0000-0000-000000000005',
    'YIELD-PRD-5',
    'fd300000-0000-0000-0000-000000000001',
    'in_progress',
    10,
    0
  ),
  (
    'fd500000-0000-0000-0000-000000000006',
    'YIELD-PRD-6',
    'fd300000-0000-0000-0000-000000000001',
    'in_progress',
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
VALUES
  (
    'fd600000-0000-0000-0000-000000000001',
    'fd500000-0000-0000-0000-000000000001',
    'fd400000-0000-0000-0000-000000000001',
    4,
    4,
    'completed'
  ),
  (
    'fd600000-0000-0000-0000-000000000002',
    'fd500000-0000-0000-0000-000000000002',
    'fd400000-0000-0000-0000-000000000001',
    2,
    0,
    'pending'
  ),
  (
    'fd600000-0000-0000-0000-000000000003',
    'fd500000-0000-0000-0000-000000000003',
    'fd400000-0000-0000-0000-000000000001',
    4,
    4,
    'completed'
  ),
  (
    'fd600000-0000-0000-0000-000000000004',
    'fd500000-0000-0000-0000-000000000004',
    'fd400000-0000-0000-0000-000000000001',
    4,
    4,
    'completed'
  ),
  (
    'fd600000-0000-0000-0000-000000000005',
    'fd500000-0000-0000-0000-000000000005',
    'fd400000-0000-0000-0000-000000000001',
    4,
    4,
    'completed'
  ),
  (
    'fd600000-0000-0000-0000-000000000006',
    'fd500000-0000-0000-0000-000000000006',
    'fd400000-0000-0000-0000-000000000001',
    4,
    4,
    'completed'
  );

-- Un usuario normal no puede completar producción.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fd100000-0000-0000-0000-000000000002',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.complete_production_yield_to_quarantine(
      'fd500000-0000-0000-0000-000000000001',
      8,
      2,
      'Merma de producción conciliada',
      'fd700000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'normal user completed a production order';
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
  'fd100000-0000-0000-0000-000000000001',
  true
);

-- La operación exacta es idempotente.
SELECT public.complete_production_yield_to_quarantine(
  'fd500000-0000-0000-0000-000000000001',
  8,
  2,
  'Merma de producción conciliada',
  'fd700000-0000-4000-8000-000000000001'
);

SELECT public.complete_production_yield_to_quarantine(
  'fd500000-0000-0000-0000-000000000001',
  8,
  2,
  'Merma de producción conciliada',
  'fd700000-0000-4000-8000-000000000001'
);

-- La llave no puede reutilizarse con otros datos.
DO $test$
BEGIN
  BEGIN
    PERFORM public.complete_production_yield_to_quarantine(
      'fd500000-0000-0000-0000-000000000001',
      7,
      3,
      'Datos diferentes',
      'fd700000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'idempotency key accepted different completion data';
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

-- La producción exacta no exige motivo.
SELECT public.complete_production_yield_to_quarantine(
  'fd500000-0000-0000-0000-000000000003',
  10,
  0,
  NULL,
  'fd700000-0000-4000-8000-000000000003'
);

-- La sobreproducción requiere motivo y no admite merma.
SELECT public.complete_production_yield_to_quarantine(
  'fd500000-0000-0000-0000-000000000006',
  12,
  0,
  'Demanda extraordinaria',
  'fd700000-0000-4000-8000-000000000006'
);

-- Una merma incompleta no concilia el rendimiento.
DO $test$
BEGIN
  BEGIN
    PERFORM public.complete_production_yield_to_quarantine(
      'fd500000-0000-0000-0000-000000000004',
      8,
      1,
      'Merma incompleta',
      'fd700000-0000-4000-8000-000000000004'
    );

    RAISE EXCEPTION
      'unreconciled yield was accepted';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'Production yield does not reconcile with planned quantity.'
      THEN
        RAISE EXCEPTION
          'unexpected reconciliation error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

-- La sobreproducción y la merma son incompatibles.
DO $test$
BEGIN
  BEGIN
    PERFORM public.complete_production_yield_to_quarantine(
      'fd500000-0000-0000-0000-000000000005',
      12,
      1,
      'Datos incompatibles',
      'fd700000-0000-4000-8000-000000000005'
    );

    RAISE EXCEPTION
      'overproduction with waste was accepted';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'Overproduction cannot include waste.'
      THEN
        RAISE EXCEPTION
          'unexpected overproduction error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

-- No puede cerrarse una orden con materiales pendientes.
DO $test$
BEGIN
  BEGIN
    PERFORM public.complete_production_yield_to_quarantine(
      'fd500000-0000-0000-0000-000000000002',
      5,
      0,
      NULL,
      'fd700000-0000-4000-8000-000000000002'
    );

    RAISE EXCEPTION
      'order with pending materials was completed';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

DO $test$
BEGIN
  IF (
    SELECT count(*)
    FROM public.production_output_completion_operations
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'completion operation was not idempotent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_outputs
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'production output was duplicated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_outputs
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000001'
      AND product_id =
        'fd200000-0000-0000-0000-000000000001'
      AND quantity_produced = 8
      AND quality_status = 'pending'
  ) THEN
    RAISE EXCEPTION
      'pending production output is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_orders
    WHERE id =
      'fd500000-0000-0000-0000-000000000001'
      AND production_status = 'completed'
      AND produced_quantity = 8
      AND completed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'production order was not completed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_output_completion_operations
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000001'
      AND planned_quantity = 10
      AND produced_quantity = 8
      AND waste_quantity = 2
      AND variance_reason =
        'Merma de producción conciliada'
      AND completed_by =
        'fd100000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'completion audit data is inconsistent';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.product_lots
    WHERE product_id =
      'fd200000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'quarantined output created a product lot';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE item_type = 'product'
      AND item_id =
        'fd200000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'quarantined output became available inventory';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_orders
    WHERE id =
      'fd500000-0000-0000-0000-000000000002'
      AND production_status = 'in_progress'
  ) THEN
    RAISE EXCEPTION
      'invalid production order changed status';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.production_outputs
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000002'
  ) THEN
    RAISE EXCEPTION
      'invalid production order created an output';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.production_output_completion_operations
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000003'
      AND planned_quantity = 10
      AND produced_quantity = 10
      AND waste_quantity = 0
      AND variance_reason IS NULL
  ) THEN
    RAISE EXCEPTION
      'exact production yield is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_output_completion_operations
    WHERE production_order_id =
      'fd500000-0000-0000-0000-000000000006'
      AND planned_quantity = 10
      AND produced_quantity = 12
      AND waste_quantity = 0
      AND variance_reason =
        'Demanda extraordinaria'
  ) THEN
    RAISE EXCEPTION
      'overproduction audit is inconsistent';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.production_outputs
    WHERE production_order_id IN (
      'fd500000-0000-0000-0000-000000000004',
      'fd500000-0000-0000-0000-000000000005'
    )
  ) THEN
    RAISE EXCEPTION
      'invalid yield reconciliation created output';
  END IF;

END;
$test$;

ROLLBACK;
