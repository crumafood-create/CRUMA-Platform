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
    'fe100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'disposition-admin@example.test',
    now(),
    now()
  ),
  (
    'fe100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'disposition-user@example.test',
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
    'fe100000-0000-4000-8000-000000000001',
    'Disposition Admin',
    'disposition-admin@example.test',
    'admin'
  ),
  (
    'fe100000-0000-4000-8000-000000000002',
    'Disposition User',
    'disposition-user@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  'fe100000-0000-4000-8000-000000000001',
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
  'fe200000-0000-4000-8000-000000000001',
  'disposition-product',
  'DISP-P1',
  'Disposition Product',
  'active'
);

INSERT INTO public.recipes (
  id,
  product_id,
  name,
  is_active
)
VALUES (
  'fe300000-0000-4000-8000-000000000001',
  'fe200000-0000-4000-8000-000000000001',
  'Disposition Recipe',
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
  'fe400000-0000-4000-8000-000000000001',
  'disposition-material',
  'DISP-M1',
  'Disposition Material',
  0,
  2,
  2,
  true
);

INSERT INTO public.recipe_items (
  recipe_id,
  raw_material_id,
  quantity
)
VALUES (
  'fe300000-0000-4000-8000-000000000001',
  'fe400000-0000-4000-8000-000000000001',
  2.5
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
VALUES
  (
    'fe500000-0000-4000-8000-000000000001',
    'DISP-PRD-1',
    'fe300000-0000-4000-8000-000000000001',
    'completed',
    10,
    10,
    now()
  ),
  (
    'fe500000-0000-4000-8000-000000000002',
    'DISP-PRD-2',
    'fe300000-0000-4000-8000-000000000001',
    'completed',
    8,
    8,
    now()
  ),
  (
    'fe500000-0000-4000-8000-000000000003',
    'DISP-PRD-3',
    'fe300000-0000-4000-8000-000000000001',
    'completed',
    6,
    6,
    now()
  );

INSERT INTO public.production_outputs (
  id,
  production_order_id,
  product_id,
  quantity_produced,
  quality_status
)
VALUES
  (
    'fe600000-0000-4000-8000-000000000001',
    'fe500000-0000-4000-8000-000000000001',
    'fe200000-0000-4000-8000-000000000001',
    10,
    'rejected'
  ),
  (
    'fe600000-0000-4000-8000-000000000002',
    'fe500000-0000-4000-8000-000000000002',
    'fe200000-0000-4000-8000-000000000001',
    8,
    'hold'
  ),
  (
    'fe600000-0000-4000-8000-000000000003',
    'fe500000-0000-4000-8000-000000000003',
    'fe200000-0000-4000-8000-000000000001',
    6,
    'pending'
  );

INSERT INTO public.quality_inspections (
  id,
  production_order_id,
  production_output_id,
  subject_type,
  inspector_id,
  status,
  result,
  sampled_quantity,
  accepted_quantity,
  rejected_quantity,
  notes
)
VALUES
  (
    'fe700000-0000-4000-8000-000000000001',
    'fe500000-0000-4000-8000-000000000001',
    'fe600000-0000-4000-8000-000000000001',
    'production_output',
    'fe100000-0000-4000-8000-000000000001',
    'failed',
    'reject',
    10,
    0,
    10,
    'Defecto crítico'
  ),
  (
    'fe700000-0000-4000-8000-000000000002',
    'fe500000-0000-4000-8000-000000000002',
    'fe600000-0000-4000-8000-000000000002',
    'production_output',
    'fe100000-0000-4000-8000-000000000001',
    'hold',
    'rework',
    8,
    6,
    2,
    'Requiere retrabajo'
  ),
  (
    'fe700000-0000-4000-8000-000000000003',
    'fe500000-0000-4000-8000-000000000003',
    'fe600000-0000-4000-8000-000000000003',
    'production_output',
    'fe100000-0000-4000-8000-000000000001',
    'passed',
    'ok',
    6,
    6,
    0,
    'Producto conforme'
  );

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fe100000-0000-4000-8000-000000000002',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM
      public.dispose_finished_product_nonconformance(
        'fe700000-0000-4000-8000-000000000001',
        'scrap',
        'Intento no autorizado',
        'fe800000-0000-4000-8000-000000000001'
      );

    RAISE EXCEPTION
      'normal user disposed finished product';
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
  'fe100000-0000-4000-8000-000000000001',
  true
);

SELECT
  public.dispose_finished_product_nonconformance(
    'fe700000-0000-4000-8000-000000000001',
    'scrap',
    'Descarte por defecto crítico',
    'fe800000-0000-4000-8000-000000000001'
  );

SELECT
  public.dispose_finished_product_nonconformance(
    'fe700000-0000-4000-8000-000000000001',
    'scrap',
    'Descarte por defecto crítico',
    'fe800000-0000-4000-8000-000000000001'
  );

SELECT
  public.dispose_finished_product_nonconformance(
    'fe700000-0000-4000-8000-000000000002',
    'rework',
    'Reprocesar el lote completo',
    'fe800000-0000-4000-8000-000000000002'
  );

DO $test$
BEGIN
  BEGIN
    PERFORM
      public.dispose_finished_product_nonconformance(
        'fe700000-0000-4000-8000-000000000001',
        'scrap',
        'Motivo diferente',
        'fe800000-0000-4000-8000-000000000001'
      );

    RAISE EXCEPTION
      'idempotency key accepted different data';
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

DO $test$
BEGIN
  BEGIN
    PERFORM
      public.dispose_finished_product_nonconformance(
        'fe700000-0000-4000-8000-000000000003',
        'scrap',
        'Producto conforme',
        'fe800000-0000-4000-8000-000000000003'
      );

    RAISE EXCEPTION
      'conforming output was disposed';
  EXCEPTION
    WHEN check_violation THEN
      IF SQLERRM <>
        'Quality inspection is not nonconforming.'
      THEN
        RAISE EXCEPTION
          'unexpected conformance error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

DO $test$
BEGIN
  BEGIN
    PERFORM public.decide_quality_release(
      'fe700000-0000-4000-8000-000000000003',
      'reject',
      'Rechazo fragmentado'
    );

    RAISE EXCEPTION
      'fragmented rejection remained available';
  EXCEPTION
    WHEN invalid_parameter_value THEN
      IF SQLERRM <>
        'Finished product rejection requires an atomic disposition.'
      THEN
        RAISE EXCEPTION
          'unexpected fragmented rejection error: %',
          SQLERRM;
      END IF;
  END;
END;
$test$;

RESET ROLE;

DO $test$
DECLARE
  rework_order_id uuid;
BEGIN
  IF (
    SELECT count(*)
    FROM
      public.finished_product_nonconformance_disposition_operations
  ) <> 2 THEN
    RAISE EXCEPTION
      'unexpected disposition operation count';
  END IF;

  IF (
    SELECT count(*)
    FROM
      public.finished_product_nonconformance_disposition_operations
    WHERE idempotency_key =
      'fe800000-0000-4000-8000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'scrap disposition was not idempotent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM
      public.finished_product_nonconformance_disposition_operations
    WHERE production_output_id =
      'fe600000-0000-4000-8000-000000000001'
      AND disposition = 'scrap'
      AND disposed_quantity = 10
      AND reason =
        'Descarte por defecto crítico'
      AND rework_production_order_id IS NULL
      AND disposed_by =
        'fe100000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'scrap audit is inconsistent';
  END IF;

  SELECT rework_production_order_id
  INTO rework_order_id
  FROM
    public.finished_product_nonconformance_disposition_operations
  WHERE production_output_id =
    'fe600000-0000-4000-8000-000000000002';

  IF rework_order_id IS NULL THEN
    RAISE EXCEPTION
      'rework order was not linked';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_orders
    WHERE id = rework_order_id
      AND recipe_id =
        'fe300000-0000-4000-8000-000000000001'
      AND production_status = 'draft'
      AND planned_quantity = 8
      AND produced_quantity = 0
  ) THEN
    RAISE EXCEPTION
      'rework production order is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id = rework_order_id
      AND raw_material_id =
        'fe400000-0000-4000-8000-000000000001'
      AND planned_quantity = 20
      AND consumed_quantity = 0
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION
      'rework production items are inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.quality_release_decisions
    WHERE production_output_id IN (
      'fe600000-0000-4000-8000-000000000001',
      'fe600000-0000-4000-8000-000000000002'
    )
      AND decision = 'reject'
  ) <> 2 THEN
    RAISE EXCEPTION
      'rejection decisions are inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.production_outputs
    WHERE id IN (
      'fe600000-0000-4000-8000-000000000001',
      'fe600000-0000-4000-8000-000000000002'
    )
      AND quality_status = 'rejected'
  ) <> 2 THEN
    RAISE EXCEPTION
      'disposed outputs are not rejected';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.product_lots
    WHERE production_output_id IN (
      'fe600000-0000-4000-8000-000000000001',
      'fe600000-0000-4000-8000-000000000002'
    )
  ) THEN
    RAISE EXCEPTION
      'disposed output created a product lot';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE item_type = 'product'
      AND item_id =
        'fe200000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'disposed output entered inventory';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM
      public.finished_product_nonconformance_disposition_operations
    WHERE production_output_id =
      'fe600000-0000-4000-8000-000000000003'
  ) THEN
    RAISE EXCEPTION
      'conforming output received a disposition';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_outputs
    WHERE id =
      'fe600000-0000-4000-8000-000000000003'
      AND quality_status = 'pending'
  ) THEN
    RAISE EXCEPTION
      'invalid disposition changed conforming output';
  END IF;
END;
$test$;

ROLLBACK;
