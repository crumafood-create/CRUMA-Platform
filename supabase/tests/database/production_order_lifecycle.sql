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
    'Lifecycle Admin',
    'lifecycle-admin@example.test',
    'admin'
  ),
  (
    'e1100000-0000-4000-8000-000000000002',
    'Lifecycle User',
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

INSERT INTO public.units_of_measure (
  id,
  name,
  code
)
VALUES
  (
    'e1210000-0000-4000-8000-000000000001',
    'Kilogram',
    'lifecycle-kg'
  ),
  (
    'e1210000-0000-4000-8000-000000000002',
    'Piece',
    'lifecycle-piece'
  );

INSERT INTO public.products (
  id,
  slug,
  internal_code,
  name,
  status,
  unit_of_measure_id
)
VALUES (
  'e1200000-0000-4000-8000-000000000001',
  'lifecycle-product',
  'LFC-P1',
  'Lifecycle Product',
  'active',
  'e1210000-0000-4000-8000-000000000002'
), (
  'e1200000-0000-4000-8000-000000000002',
  'lifecycle-dough',
  'LFC-D1',
  'Lifecycle Dough',
  'active',
  'e1210000-0000-4000-8000-000000000001'
), (
  'e1200000-0000-4000-8000-000000000003',
  'lifecycle-party',
  'LFC-PARTY',
  'Lifecycle Party',
  'active',
  'e1210000-0000-4000-8000-000000000002'
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

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  yield_quantity,
  unit_of_measure_id,
  is_active
)
VALUES
  (
    'e1300000-0000-4000-8000-000000000002',
    'e1200000-0000-4000-8000-000000000002',
    'Lifecycle Dough Recipe',
    2,
    'e1210000-0000-4000-8000-000000000001',
    true
  ),
  (
    'e1300000-0000-4000-8000-000000000003',
    'e1200000-0000-4000-8000-000000000003',
    'Lifecycle Intermediate Product Recipe',
    100,
    'e1210000-0000-4000-8000-000000000002',
    true
  ),
  (
    'e1300000-0000-4000-8000-000000000004',
    'e1200000-0000-4000-8000-000000000001',
    'Lifecycle Scaled Recipe',
    100,
    'e1210000-0000-4000-8000-000000000002',
    true
  );

INSERT INTO public.raw_materials (
  id,
  slug,
  internal_code,
  name,
  unit_of_measure_id,
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
  'e1210000-0000-4000-8000-000000000001',
  0,
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

INSERT INTO public.recipe_items (
  id,
  recipe_id,
  raw_material_id,
  quantity
)
VALUES (
  'e1450000-0000-4000-8000-000000000004',
  'e1300000-0000-4000-8000-000000000004',
  'e1400000-0000-4000-8000-000000000001',
  2
);

INSERT INTO public.recipe_items (
  id,
  recipe_id,
  raw_material_id,
  quantity
)
VALUES (
  'e1450000-0000-4000-8000-000000000002',
  'e1300000-0000-4000-8000-000000000002',
  'e1400000-0000-4000-8000-000000000001',
  1.25
);

INSERT INTO public.recipe_items (
  id,
  recipe_id,
  product_id,
  quantity
)
VALUES (
  'e1450000-0000-4000-8000-000000000003',
  'e1300000-0000-4000-8000-000000000003',
  'e1200000-0000-4000-8000-000000000002',
  2
);

DO $test$
DECLARE
  constraint_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.recipe_items
    WHERE (raw_material_id IS NULL) = (product_id IS NULL)
  ) THEN
    RAISE EXCEPTION
      'an existing recipe item does not reference exactly one ingredient';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.recipes AS dough_recipe
    JOIN public.products AS dough_product
      ON dough_product.id = dough_recipe.product_id
    JOIN public.recipe_items AS ingredient
      ON ingredient.recipe_id = dough_recipe.id
    JOIN public.raw_materials AS material
      ON material.id = ingredient.raw_material_id
    WHERE dough_recipe.id = 'e1300000-0000-4000-8000-000000000002'
      AND dough_recipe.yield_quantity = 2
      AND dough_recipe.unit_of_measure_id = dough_product.unit_of_measure_id
      AND ingredient.quantity = 1.25
      AND material.current_stock = 0
  ) THEN
    RAISE EXCEPTION
      'intermediate recipe with zero-stock raw material was not persisted in kg';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.recipes AS final_recipe
    JOIN public.products AS final_product
      ON final_product.id = final_recipe.product_id
    JOIN public.recipe_items AS ingredient
      ON ingredient.recipe_id = final_recipe.id
    JOIN public.products AS intermediate_product
      ON intermediate_product.id = ingredient.product_id
    WHERE final_recipe.id = 'e1300000-0000-4000-8000-000000000003'
      AND final_recipe.yield_quantity = 100
      AND final_recipe.unit_of_measure_id = final_product.unit_of_measure_id
      AND ingredient.product_id = 'e1200000-0000-4000-8000-000000000002'
      AND intermediate_product.unit_of_measure_id =
        'e1210000-0000-4000-8000-000000000001'
      AND ingredient.quantity = 2
  ) THEN
    RAISE EXCEPTION
      'final recipe does not reference the expected intermediate product and units';
  END IF;

  BEGIN
    INSERT INTO public.recipe_items (
      recipe_id,
      quantity
    )
    VALUES (
      'e1300000-0000-4000-8000-000000000003',
      1
    );

    RAISE EXCEPTION
      'recipe item without an ingredient was accepted'
      USING ERRCODE = 'PZ004';
  EXCEPTION
    WHEN check_violation THEN
      GET STACKED DIAGNOSTICS constraint_name = CONSTRAINT_NAME;
      IF constraint_name <> 'recipe_items_exactly_one_ingredient' THEN
        RAISE;
      END IF;
    WHEN SQLSTATE 'PZ004' THEN
      RAISE;
  END;

  BEGIN
    INSERT INTO public.recipe_items (
      recipe_id,
      raw_material_id,
      product_id,
      quantity
    )
    VALUES (
      'e1300000-0000-4000-8000-000000000003',
      'e1400000-0000-4000-8000-000000000001',
      'e1200000-0000-4000-8000-000000000002',
      1
    );

    RAISE EXCEPTION
      'recipe item with both ingredient references was accepted'
      USING ERRCODE = 'PZ005';
  EXCEPTION
    WHEN check_violation THEN
      GET STACKED DIAGNOSTICS constraint_name = CONSTRAINT_NAME;
      IF constraint_name <> 'recipe_items_exactly_one_ingredient' THEN
        RAISE;
      END IF;
    WHEN SQLSTATE 'PZ005' THEN
      RAISE;
  END;

  BEGIN
    INSERT INTO public.recipe_items (
      recipe_id,
      product_id,
      quantity
    )
    VALUES (
      'e1300000-0000-4000-8000-000000000003',
      'e1200000-0000-4000-8000-000000000003',
      1
    );

    RAISE EXCEPTION
      'recipe accepted its own output product as ingredient'
      USING ERRCODE = 'PZ001';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'A recipe cannot use its own output product as an ingredient.'
      THEN
        RAISE EXCEPTION 'unexpected self-ingredient rejection: %', SQLERRM;
      END IF;
    WHEN SQLSTATE 'PZ001' THEN
      RAISE;
  END;

  BEGIN
    INSERT INTO public.recipe_items (
      recipe_id,
      product_id,
      quantity
    )
    VALUES (
      'e1300000-0000-4000-8000-000000000003',
      'e1200000-0000-4000-8000-000000000001',
      1
    );

    RAISE EXCEPTION
      'recipe accepted more than one intermediate product'
      USING ERRCODE = 'PZ002';
  EXCEPTION
    WHEN unique_violation THEN NULL;
    WHEN SQLSTATE 'PZ002' THEN RAISE;
  END;
END;
$test$;

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

-- An intermediate-product order can be planned but cannot start without a lot withdrawal.
DO $test$
DECLARE
  order_count_before bigint;
  intermediate_order_id uuid;
BEGIN
  SELECT count(*)
  INTO order_count_before
  FROM public.production_orders
  WHERE recipe_id = 'e1300000-0000-4000-8000-000000000003';

  PERFORM public.create_production_order_draft(
    'e1300000-0000-4000-8000-000000000003',
    50,
    'Plan de masa sin apartado anticipado',
    'e1500000-0000-4000-8000-000000000010'
  );

  SELECT production_order_id INTO intermediate_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = 'e1500000-0000-4000-8000-000000000010';

  PERFORM public.transition_production_order_lifecycle(
    intermediate_order_id,
    'release',
    NULL,
    'e1500000-0000-4000-8000-000000000020'
  );

  BEGIN
    PERFORM public.transition_production_order_lifecycle(
      intermediate_order_id,
      'start',
      NULL,
      'e1500000-0000-4000-8000-000000000021'
    );

    RAISE EXCEPTION 'mass order started without a lot reservation'
      USING ERRCODE = 'PZ003';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'La orden debe apartar masa de un lote liberado antes de iniciar.'
      THEN
        RAISE EXCEPTION 'unexpected mass start rejection: %', SQLERRM;
      END IF;
    WHEN SQLSTATE 'PZ003' THEN
      RAISE;
  END;

  IF (
    SELECT count(*)
    FROM public.production_orders
    WHERE recipe_id = 'e1300000-0000-4000-8000-000000000003'
  ) <> order_count_before + 1 OR EXISTS (
    SELECT 1
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key = 'e1500000-0000-4000-8000-000000000021'
  ) THEN
    RAISE EXCEPTION
      'mass order planning or rejected start left inconsistent writes';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = intermediate_order_id
      AND production_status = 'released'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.production_order_items
    WHERE production_order_id = intermediate_order_id
      AND product_id = 'e1200000-0000-4000-8000-000000000002'
      AND raw_material_id IS NULL
      AND planned_quantity = 1
  ) THEN
    RAISE EXCEPTION
      'intermediate mass order plan was not preserved while awaiting lot withdrawal';
  END IF;
END;
$test$;

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

-- Editing the recipe changes future plans, not quantities already captured by an order.
UPDATE public.recipe_items
SET quantity = 3
WHERE id = 'e1450000-0000-4000-8000-000000000001';

DO $test$
DECLARE
  existing_order_id uuid;
BEGIN
  SELECT production_order_id INTO existing_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = 'e1500000-0000-4000-8000-000000000001';

  IF NOT EXISTS (
    SELECT 1 FROM public.production_order_items
    WHERE production_order_id = existing_order_id
      AND raw_material_id = 'e1400000-0000-4000-8000-000000000001'
      AND planned_quantity = 20
  ) THEN
    RAISE EXCEPTION
      'recipe edit changed or lost existing order plan: order %, snapshot %',
      existing_order_id,
      (
        SELECT coalesce(
          jsonb_agg(
            jsonb_build_object(
              'raw_material_id', raw_material_id,
              'planned_quantity', planned_quantity
            )
          ),
          '[]'::jsonb
        )
        FROM public.production_order_items
        WHERE production_order_id = existing_order_id
      );
  END IF;

  IF (
    SELECT count(*) FROM public.production_order_items
    WHERE production_order_id = existing_order_id
  ) <> 1 THEN
    RAISE EXCEPTION 'admin cannot read exactly one captured raw-material requirement';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', 'e1100000-0000-4000-8000-000000000002', true);
  IF EXISTS (
    SELECT 1 FROM public.production_order_items
    WHERE production_order_id = existing_order_id
  ) THEN
    RAISE EXCEPTION 'non-admin can read production order item snapshots';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', 'e1100000-0000-4000-8000-000000000001', true);
END;
$test$;

SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000001',
  4,
  'Nueva fórmula',
  'e1500000-0000-4000-8000-000000000011'
);

DO $test$
DECLARE
  new_order_id uuid;
BEGIN
  SELECT production_order_id INTO new_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = 'e1500000-0000-4000-8000-000000000011';

  IF NOT EXISTS (
    SELECT 1 FROM public.production_order_items
    WHERE production_order_id = new_order_id
      AND raw_material_id = 'e1400000-0000-4000-8000-000000000001'
      AND planned_quantity = 12
  ) THEN
    RAISE EXCEPTION 'new production order did not capture the updated recipe quantity';
  END IF;
END;
$test$;

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
      AND planned_quantity = 15
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

-- Planned ingredient quantities scale by the recipe's expected yield.
SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000004',
  50,
  'Escalado de rendimiento',
  'e1500000-0000-4000-8000-000000000013'
);

DO $test$
DECLARE
  scaled_order_id uuid;
BEGIN
  SELECT production_order_id
  INTO scaled_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000013';

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id = scaled_order_id
      AND raw_material_id =
        'e1400000-0000-4000-8000-000000000001'
      AND planned_quantity = 1
  ) THEN
    RAISE EXCEPTION
      '50 of 100 expected pieces must plan half of the 2 kg recipe ingredient';
  END IF;
END;
$test$;

-- Starting an intermediate-product order reserves weighed quantities from
-- one or more quality-released lots of the recipe's exact dough variety.
SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000002',
  2,
  'Masa disponible para apartado',
  'e1500000-0000-4000-8000-000000000014'
);

UPDATE public.production_orders
SET production_status = 'completed',
  produced_quantity = 2,
  completed_at = now()
WHERE id = (
  SELECT production_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000014'
);

INSERT INTO public.production_outputs (
  id,
  production_order_id,
  product_id,
  quantity_produced,
  quality_status
)
SELECT
  'e1600000-0000-4000-8000-000000000001',
  operation.production_order_id,
  'e1200000-0000-4000-8000-000000000002',
  2,
  'released'
FROM public.production_order_lifecycle_operations AS operation
WHERE operation.idempotency_key =
  'e1500000-0000-4000-8000-000000000014';

INSERT INTO public.production_outputs (
  id,
  production_order_id,
  product_id,
  quantity_produced,
  quality_status
)
SELECT
  'e1600000-0000-4000-8000-000000000002',
  operation.production_order_id,
  'e1200000-0000-4000-8000-000000000002',
  2,
  'released'
FROM public.production_order_lifecycle_operations AS operation
WHERE operation.idempotency_key =
  'e1500000-0000-4000-8000-000000000014';

INSERT INTO public.product_lots (
  id,
  product_id,
  lot_number,
  production_output_id,
  initial_quantity,
  quantity,
  status
)
VALUES
  (
    'e1610000-0000-4000-8000-000000000001',
    'e1200000-0000-4000-8000-000000000002',
    'LFC-MASS-A',
    'e1600000-0000-4000-8000-000000000001',
    0.8,
    0.8,
    'available'
  ),
  (
    'e1610000-0000-4000-8000-000000000002',
    'e1200000-0000-4000-8000-000000000002',
    'LFC-MASS-B',
    'e1600000-0000-4000-8000-000000000002',
    0.8,
    0.8,
    'available'
  );

SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000003',
  50,
  'Retiro de masa de dos lotes',
  'e1500000-0000-4000-8000-000000000015'
);

SELECT public.create_production_order_draft(
  'e1300000-0000-4000-8000-000000000003',
  50,
  'Orden concurrente para el mismo lote',
  'e1500000-0000-4000-8000-000000000016'
);

DO $test$
DECLARE
  first_order_id uuid;
  second_order_id uuid;
BEGIN
  SELECT production_order_id INTO first_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000015';

  SELECT production_order_id INTO second_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000016';

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id = first_order_id
      AND product_id = 'e1200000-0000-4000-8000-000000000002'
      AND raw_material_id IS NULL
      AND planned_quantity = 1
  ) THEN
    RAISE EXCEPTION
      'scaled production plan did not capture the specific intermediate mass variety';
  END IF;

  IF first_order_id IS NULL OR second_order_id IS NULL THEN
    RAISE EXCEPTION 'orders using an intermediate product were not created';
  END IF;
END;
$test$;

SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000015'
  ),
  'release',
  NULL,
  'e1500000-0000-4000-8000-000000000017'
);

SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000016'
  ),
  'release',
  NULL,
  'e1500000-0000-4000-8000-000000000018'
);

SELECT public.start_production_order_with_mass_lot_reservations(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000015'
  ),
  '[
    {"product_lot_id":"e1610000-0000-4000-8000-000000000001","quantity":0.7},
    {"product_lot_id":"e1610000-0000-4000-8000-000000000002","quantity":0.35}
  ]'::jsonb,
  'e1500000-0000-4000-8000-000000000019'
);

-- Replaying the same start request is idempotent; reusing its key with
-- different weighed quantities is rejected without another lot deduction.
SELECT public.start_production_order_with_mass_lot_reservations(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000015'
  ),
  '[
    {"product_lot_id":"e1610000-0000-4000-8000-000000000001","quantity":0.7},
    {"product_lot_id":"e1610000-0000-4000-8000-000000000002","quantity":0.35}
  ]'::jsonb,
  'e1500000-0000-4000-8000-000000000019'
);

DO $test$
DECLARE
  first_order_id uuid;
BEGIN
  SELECT production_order_id INTO first_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000015';

  BEGIN
    PERFORM public.start_production_order_with_mass_lot_reservations(
      first_order_id,
      '[{"product_lot_id":"e1610000-0000-4000-8000-000000000001","quantity":0.5}]'::jsonb,
      'e1500000-0000-4000-8000-000000000019'
    );

    RAISE EXCEPTION
      'mass start idempotency accepted a different lot weight'
      USING ERRCODE = 'PZ006';
  EXCEPTION
    WHEN unique_violation THEN NULL;
    WHEN SQLSTATE 'PZ006' THEN RAISE;
  END;
END;
$test$;

DO $test$
DECLARE
  first_order_id uuid;
BEGIN
  SELECT production_order_id INTO first_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000015';

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_product_lot_reservations
    WHERE production_order_id = first_order_id
      AND product_lot_id = 'e1610000-0000-4000-8000-000000000001'
      AND reserved_quantity = 0.7
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.production_order_product_lot_reservations
    WHERE production_order_id = first_order_id
      AND product_lot_id = 'e1610000-0000-4000-8000-000000000002'
      AND reserved_quantity = 0.35
  ) THEN
    RAISE EXCEPTION
      'the weighed withdrawal was not recorded separately for both mass lots';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'e1610000-0000-4000-8000-000000000001'
      AND quantity = 0.1 AND status = 'available'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'e1610000-0000-4000-8000-000000000002'
      AND quantity = 0.45 AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'mass availability does not reflect the atomic withdrawal';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = first_order_id
      AND production_status = 'in_progress'
  ) THEN
    RAISE EXCEPTION
      'the order did not start with its mass lots reserved';
  END IF;
END;
$test$;

DO $test$
DECLARE
  first_order_id uuid;
  close_rejected boolean := false;
BEGIN
  SELECT production_order_id INTO first_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000015';

  BEGIN
    PERFORM public.complete_production_order_with_mass_lot_yield(
      first_order_id,
      48,
      2,
      'Ajuste de rendimiento de prueba',
      '[
        {"product_lot_id":"e1610000-0000-4000-8000-000000000001","surplus_quantity":0.7001},
        {"product_lot_id":"e1610000-0000-4000-8000-000000000002","surplus_quantity":0.05}
      ]'::jsonb,
      'e1500000-0000-4000-8000-000000000020'
    );

    RAISE EXCEPTION
      'mass completion accepted a surplus greater than the withdrawn weight'
      USING ERRCODE = 'PZ020';
  EXCEPTION
    WHEN check_violation THEN close_rejected := true;
    WHEN SQLSTATE 'PZ020' THEN close_rejected := false;
  END;

  IF NOT close_rejected THEN
    RAISE EXCEPTION
      'mass completion did not reject an excessive per-lot surplus';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = first_order_id
      AND production_status = 'in_progress'
      AND produced_quantity IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.production_outputs
    WHERE production_order_id = first_order_id
  ) OR EXISTS (
    SELECT 1
    FROM public.production_order_product_lot_reservations
    WHERE production_order_id = first_order_id
      AND (consumed_quantity IS NOT NULL OR surplus_quantity IS NOT NULL)
  ) THEN
    RAISE EXCEPTION
      'rejected mass completion left partial order, output, or reservation writes';
  END IF;
END;
$test$;

SELECT public.complete_production_order_with_mass_lot_yield(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000015'
  ),
  48,
  2,
  'Ajuste de rendimiento de prueba',
  '[
    {"product_lot_id":"e1610000-0000-4000-8000-000000000001","surplus_quantity":0.1},
    {"product_lot_id":"e1610000-0000-4000-8000-000000000002","surplus_quantity":0.05}
  ]'::jsonb,
  'e1500000-0000-4000-8000-000000000020'
);

-- Repeating an identical completion must return the same output.
SELECT public.complete_production_order_with_mass_lot_yield(
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key =
      'e1500000-0000-4000-8000-000000000015'
  ),
  48,
  2,
  'Ajuste de rendimiento de prueba',
  '[
    {"product_lot_id":"e1610000-0000-4000-8000-000000000001","surplus_quantity":0.1},
    {"product_lot_id":"e1610000-0000-4000-8000-000000000002","surplus_quantity":0.05}
  ]'::jsonb,
  'e1500000-0000-4000-8000-000000000020'
);

DO $test$
DECLARE
  first_order_id uuid;
BEGIN
  SELECT production_order_id INTO first_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    'e1500000-0000-4000-8000-000000000015';

  IF NOT EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = first_order_id
      AND production_status = 'completed'
      AND produced_quantity = 48
  ) THEN
    RAISE EXCEPTION 'mass order did not close with 48 produced pieces';
  END IF;

  IF (
    SELECT count(*) FROM public.production_outputs
    WHERE production_order_id = first_order_id
      AND quantity_produced = 48
      AND quality_status = 'pending'
  ) <> 1 OR (
    SELECT count(*) FROM public.production_output_completion_operations
    WHERE production_order_id = first_order_id
      AND produced_quantity = 48
      AND waste_quantity = 2
  ) <> 1 THEN
    RAISE EXCEPTION
      'completion must create exactly one 48-piece output awaiting quality';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_product_lot_reservations
    WHERE production_order_id = first_order_id
      AND product_lot_id = 'e1610000-0000-4000-8000-000000000001'
      AND reserved_quantity = 0.7
      AND consumed_quantity = 0.6
      AND surplus_quantity = 0.1
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.production_order_product_lot_reservations
    WHERE production_order_id = first_order_id
      AND product_lot_id = 'e1610000-0000-4000-8000-000000000002'
      AND reserved_quantity = 0.35
      AND consumed_quantity = 0.3
      AND surplus_quantity = 0.05
  ) THEN
    RAISE EXCEPTION
      'mass consumed and surplus weights were not reconciled per lot';
  END IF;

  IF (
    SELECT sum(surplus_quantity)
    FROM public.production_order_product_lot_reservations
    WHERE production_order_id = first_order_id
  ) <> 0.15 OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'e1610000-0000-4000-8000-000000000001'
      AND quantity = 0.1 AND status = 'available'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'e1610000-0000-4000-8000-000000000002'
      AND quantity = 0.45 AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'pending surplus must remain outside available mass inventory';
  END IF;
END;
$test$;

ROLLBACK;
