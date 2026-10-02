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
    'e1100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'lifecycle-admin@example.test',
    now(),
    now()
  ),
  (
    'e1100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'lifecycle-user@example.test',
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
    'e1100000-0000-4000-8000-000000000001',
    'Production Lifecycle Admin',
    'lifecycle-admin@example.test',
    'admin'
  ),
  (
    'e1100000-0000-4000-8000-000000000002',
    'Production Lifecycle User',
    'lifecycle-user@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  'e1100000-0000-4000-8000-000000000001',
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
  'e1200000-0000-4000-8000-000000000001',
  'lifecycle-product',
  'LFC-P1',
  'Lifecycle Product',
  'active'
);

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  is_active
)
VALUES (
  'e1300000-0000-4000-8000-000000000001',
  'e1200000-0000-4000-8000-000000000001',
  'Lifecycle Recipe',
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
  'e1400000-0000-4000-8000-000000000001',
  'lifecycle-material',
  'LFC-M1',
  'Lifecycle Material',
  100,
  2,
  2,
  true
);

INSERT INTO public.recipe_items (
  id,
  recipe_id,
  raw_material_id,
  quantity
)
VALUES (
  'e1450000-0000-4000-8000-000000000001',
  'e1300000-0000-4000-8000-000000000001',
  'e1400000-0000-4000-8000-000000000001',
  2
);

-- Un usuario normal no puede crear órdenes.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'e1100000-0000-4000-8000-000000000002',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.create_production_order_draft(
      'e1300000-0000-4000-8000-000000000001',
      10,
      'Intento no autorizado',
      'e1500000-0000-4000-8000-000000000009'
    );

    RAISE EXCEPTION
      'normal user created a production order';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

-- Tampoco puede escribir directamente.
DO $test$
BEGIN
  BEGIN
    INSERT INTO public.production_orders (
      production_number,
      recipe_id,
      production_status,
      planned_quantity,
      produced_quantity
    )
    VALUES (
      'LFC-DIRECT',
      'e1300000-0000-4000-8000-000000000001',
      'draft',
      10,
      0
    );

    RAISE EXCEPTION
      'normal user inserted a production order directly';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

-- La RPC fragmentada anterior ya no es ejecutable.
DO $test$
BEGIN
  BEGIN
    PERFORM public.create_production_order_items(
      'e1600000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'legacy production item RPC remained executable';
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
  'e1100000-0000-4000-8000-000000000001',
  true
);

-- La creación completa es idempotente.
SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000001',
  10,
  'Lote inicial',
  'e1500000-0000-4000-8000-000000000001'
);

SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000001',
  10,
  'Lote inicial',
  'e1500000-0000-4000-8000-000000000001'
);

-- Una llave no admite datos distintos.
DO $test$
BEGIN
  BEGIN
    PERFORM public.create_production_order_draft(
      'e1300000-0000-4000-8000-000000000001',
      11,
      'Lote inicial',
      'e1500000-0000-4000-8000-000000000001'
    );

    RAISE EXCEPTION
      'idempotency key accepted different creation data';
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

-- draft -> released.
SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000001'
  ),
  'release',
  NULL,
  'e1500000-0000-4000-8000-000000000002'
);

SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000001'
  ),
  'release',
  NULL,
  'e1500000-0000-4000-8000-000000000002'
);

-- released -> in_progress.
SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000001'
  ),
  'start',
  'Inicio confirmado',
  'e1500000-0000-4000-8000-000000000003'
);

-- No puede cancelarse una orden iniciada.
DO $test$
BEGIN
  BEGIN
    PERFORM public.transition_production_order_lifecycle(
      (
        SELECT production_order_id
        FROM public.production_order_lifecycle_operations
        WHERE idempotency_key =
          'e1500000-0000-4000-8000-000000000001'
      ),
      'cancel',
      'Cancelación tardía',
      'e1500000-0000-4000-8000-000000000008'
    );

    RAISE EXCEPTION
      'in-progress order was cancelled';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'Production order transition is invalid.'
      THEN
        RAISE EXCEPTION
          'unexpected transition error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

-- Una segunda orden se cancela desde draft.
SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000001',
  5,
  'Orden cancelable',
  'e1500000-0000-4000-8000-000000000004'
);

SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000004'
  ),
  'cancel',
  'Cambio de programa',
  'e1500000-0000-4000-8000-000000000005'
);

SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000004'
  ),
  'cancel',
  'Cambio de programa',
  'e1500000-0000-4000-8000-000000000005'
);

RESET ROLE;

DO $test$
DECLARE
  active_order_id uuid;
  cancelled_order_id uuid;
BEGIN
  SELECT production_order_id
  INTO active_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000001';

  SELECT production_order_id
  INTO cancelled_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000004';

  IF active_order_id IS NULL
    OR cancelled_order_id IS NULL
  THEN
    RAISE EXCEPTION
      'production orders were not created';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_orders
    WHERE id IN (
      active_order_id,
      cancelled_order_id
    )
  ) <> 2 THEN
    RAISE EXCEPTION
      'production order creation was not idempotent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_orders
    WHERE id = active_order_id
      AND production_status = 'in_progress'
      AND planned_quantity = 10
      AND produced_quantity = 0
      AND started_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'production order did not reach in_progress';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_orders
    WHERE id = cancelled_order_id
      AND production_status = 'cancelled'
      AND planned_quantity = 5
  ) THEN
    RAISE EXCEPTION
      'production order was not cancelled';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id =
      active_order_id
      AND raw_material_id =
        'e1400000-0000-4000-8000-000000000001'
      AND planned_quantity = 20
      AND consumed_quantity = 0
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION
      'active order material plan is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id =
      cancelled_order_id
      AND planned_quantity = 10
      AND consumed_quantity = 0
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION
      'cancelled order material plan is inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_order_lifecycle_operations
    WHERE production_order_id =
      active_order_id
  ) <> 3 THEN
    RAISE EXCEPTION
      'active order lifecycle audit is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_lifecycle_operations
    WHERE production_order_id =
      cancelled_order_id
      AND operation = 'cancel'
      AND previous_status = 'draft'
      AND new_status = 'cancelled'
      AND reason = 'Cambio de programa'
      AND performed_by =
        'e1100000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'cancellation audit is inconsistent';
  END IF;
END;
$test$;

ROLLBACK;
