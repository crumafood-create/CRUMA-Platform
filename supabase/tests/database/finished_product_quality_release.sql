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

INSERT INTO public.units_of_measure (id, name, code)
VALUES ('fd000000-0000-4000-8000-000000000001', 'Kilogram', 'FGR-KG');

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

INSERT INTO public.products (
  id, slug, internal_code, name, status, unit_of_measure_id
) VALUES (
  'f4000000-0000-4000-8000-000000000002',
  'finished-release-dough',
  'FG-D1',
  'Finished Release Dough',
  'active',
  'fd000000-0000-4000-8000-000000000001'
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

INSERT INTO public.recipes (
  id, product_id, name, yield_quantity, unit_of_measure_id, is_active
) VALUES (
  'f5000000-0000-4000-8000-000000000002',
  'f4000000-0000-4000-8000-000000000002',
  'Finished Release Dough Recipe',
  2,
  'fd000000-0000-4000-8000-000000000001',
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

INSERT INTO public.production_orders (
  id, production_number, recipe_id, production_status,
  planned_quantity, produced_quantity, completed_at
) VALUES (
  'f8000000-0000-4000-8000-000000000002',
  'FG-MASS-001',
  'f5000000-0000-4000-8000-000000000002',
  'completed',
  2,
  1,
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

INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced,
  mass_quantity_produced, quality_status
) VALUES (
  'fa000000-0000-4000-8000-000000000002',
  'f8000000-0000-4000-8000-000000000002',
  'f4000000-0000-4000-8000-000000000002',
  1,
  2.15,
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

INSERT INTO public.quality_inspections (
  id, production_order_id, production_output_id, inspector_id,
  subject_type, status, result, sampled_quantity,
  accepted_quantity, rejected_quantity
) VALUES (
  'fb000000-0000-4000-8000-000000000002',
  'f8000000-0000-4000-8000-000000000002',
  'fa000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000001',
  'production_output', 'passed', 'ok', 1, 1, 0
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

SELECT public.release_finished_product_quality_to_inventory(
  'fb000000-0000-4000-8000-000000000002',
  'DOUGH-LOT-215',
  '2099-12-31',
  'f2000000-0000-4000-8000-000000000001',
  'f3000000-0000-4000-8000-000000000001',
  'fc000000-0000-4000-8000-000000000002',
  'Lote pesado después de incorporar sobrante'
);
SELECT public.release_finished_product_quality_to_inventory(
  'fb000000-0000-4000-8000-000000000002',
  'DOUGH-LOT-215',
  '2099-12-31',
  'f2000000-0000-4000-8000-000000000001',
  'f3000000-0000-4000-8000-000000000001',
  'fc000000-0000-4000-8000-000000000002',
  'Lote pesado después de incorporar sobrante'
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

  IF NOT EXISTS (
    SELECT 1 FROM public.production_outputs
    WHERE id = 'fa000000-0000-4000-8000-000000000002'
      AND quality_status = 'released'
      AND mass_quantity_produced = 2.15
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE production_output_id = 'fa000000-0000-4000-8000-000000000002'
      AND lot_number = 'DOUGH-LOT-215'
      AND initial_quantity = 2.15
      AND quantity = 2.15
      AND status = 'available'
  ) OR (
    SELECT count(*) FROM public.inventory_movements
    WHERE reference_type = 'production_lot'
      AND reference_id = (
        SELECT id FROM public.product_lots
        WHERE production_output_id = 'fa000000-0000-4000-8000-000000000002'
      )
      AND quantity = 2.15
  ) <> 1 THEN
    RAISE EXCEPTION
      'Quality did not release exactly the weighed 2.15 kg mass output';
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

-- A 48-piece raw output can be split into fresh, frozen-in-process, and
-- released frozen balances while retaining the same production lot.
UPDATE public.production_outputs
SET quantity_produced = 48
WHERE id = 'fa000000-0000-4000-8000-000000000001';

UPDATE public.product_lots
SET initial_quantity = 48, quantity = 48
WHERE production_output_id = 'fa000000-0000-4000-8000-000000000001';

UPDATE public.inventory_movements
SET quantity = 48
WHERE reference_type = 'production_lot'
  AND reference_id = (
    SELECT id FROM public.product_lots
    WHERE production_output_id = 'fa000000-0000-4000-8000-000000000001'
  );

INSERT INTO public.preparation_types (id, slug, name)
VALUES ('f9000000-0000-4000-8000-000000000001', 'storage-test-raw', 'Crudo');
UPDATE public.products
SET preparation_type_id = 'f9000000-0000-4000-8000-000000000001'
WHERE id = 'f4000000-0000-4000-8000-000000000001';

INSERT INTO public.customers (id, customer_code, name)
VALUES ('fa000000-0000-4000-8000-000000000010', 'STORAGE-TEST', 'Storage Test Customer');
INSERT INTO public.sales_orders (
  id, order_number, customer_id, status, subtotal, total
) VALUES (
  'fa000000-0000-4000-8000-000000000011', 'SO-STORAGE-TEST',
  'fa000000-0000-4000-8000-000000000010', 'confirmed', 11, 11
);
INSERT INTO public.sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price, discount, total
) VALUES (
  'fa000000-0000-4000-8000-000000000012',
  'fa000000-0000-4000-8000-000000000011',
  'f4000000-0000-4000-8000-000000000001', 11, 1, 0, 11
);
INSERT INTO public.picking_orders (id, sales_order_id, status)
VALUES (
  'fa000000-0000-4000-8000-000000000013',
  'fa000000-0000-4000-8000-000000000011', 'in_progress'
);
INSERT INTO public.picking_order_items (
  id, picking_order_id, product_id, quantity
) VALUES (
  'fa000000-0000-4000-8000-000000000014',
  'fa000000-0000-4000-8000-000000000013',
  'f4000000-0000-4000-8000-000000000001', 11
);
INSERT INTO public.inventory_reservations (
  item_type, item_id, reference_type, reference_id, quantity, status, notes
) VALUES (
  'product', 'f4000000-0000-4000-8000-000000000001',
  'sales_order', 'fa000000-0000-4000-8000-000000000011',
  11, 'active', 'Storage-condition picking acceptance test'
);

CREATE TEMP TABLE test_freezing_operation (id uuid PRIMARY KEY);
CREATE TEMP TABLE test_freezing_decisions (
  id uuid PRIMARY KEY,
  idempotency_key uuid NOT NULL
);
GRANT SELECT, INSERT ON test_freezing_operation,
  test_freezing_decisions TO authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-4000-8000-000000000001',
  true
);
SET LOCAL ROLE authenticated;

INSERT INTO test_freezing_operation (id)
SELECT public.start_product_lot_freezing(
  lot.id,
  24,
  'Prueba de aceptación: congelación parcial',
  'fd000000-0000-4000-8000-000000000101'
)
FROM public.product_lots AS lot
WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001';

DO $test$
DECLARE
  v_operation_id uuid;
  v_fresh_quantity integer;
  v_freezing_quantity integer;
  v_lot_quantity numeric;
  v_atp_quantity numeric;
BEGIN
  SELECT id INTO v_operation_id FROM test_freezing_operation;
  IF public.start_product_lot_freezing(
    (SELECT lot.id FROM public.product_lots AS lot
      WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'),
    24,
    'Prueba de aceptación: congelación parcial',
    'fd000000-0000-4000-8000-000000000101'
  ) IS DISTINCT FROM v_operation_id THEN
    RAISE EXCEPTION 'restarting the same freezing request did not return its prior operation';
  END IF;

  SELECT balance.fresh_quantity, balance.freezing_quantity, lot.quantity
  INTO v_fresh_quantity, v_freezing_quantity, v_lot_quantity
  FROM public.product_lot_storage_balances AS balance
  JOIN public.product_lots AS lot ON lot.id = balance.product_lot_id
  WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001';
  SELECT coalesce(sum(stock.available_quantity), 0)
  INTO v_atp_quantity
  FROM public.inventory_available_to_promise AS stock
  WHERE stock.item_type = 'product'
    AND stock.item_id = 'f4000000-0000-4000-8000-000000000001';
  IF v_fresh_quantity IS DISTINCT FROM 24
    OR v_freezing_quantity IS DISTINCT FROM 24
    OR v_lot_quantity IS DISTINCT FROM 24
    OR v_atp_quantity IS DISTINCT FROM 13 THEN
    RAISE EXCEPTION
      'freezing balance mismatch: fresh %, in-process %, lot %, ATP % (expected 24, 24, 24, 13)',
      v_fresh_quantity, v_freezing_quantity, v_lot_quantity, v_atp_quantity;
  END IF;

  INSERT INTO test_freezing_decisions (id, idempotency_key)
  SELECT public.resolve_product_lot_freezing(
    v_operation_id, 15, 'raw_frozen', false,
    'Congelación confirmada de 15 piezas en el primer tramo',
    'fd000000-0000-4000-8000-000000000102'
  ), 'fd000000-0000-4000-8000-000000000102';

  IF public.resolve_product_lot_freezing(
    v_operation_id, 15, 'raw_frozen', false,
    'Congelación confirmada de 15 piezas en el primer tramo',
    'fd000000-0000-4000-8000-000000000102'
  ) IS DISTINCT FROM (
    SELECT id FROM test_freezing_decisions
    WHERE idempotency_key = 'fd000000-0000-4000-8000-000000000102'
  ) THEN
    RAISE EXCEPTION 'retrying the first frozen sample allocation did not return its prior result';
  END IF;

  INSERT INTO test_freezing_decisions (id, idempotency_key)
  SELECT public.resolve_product_lot_freezing(
    v_operation_id, 8, 'fresh', true,
    'Verificación autorizada: no llegaron a congelarse y conservaron condiciones',
    'fd000000-0000-4000-8000-000000000103'
  ), 'fd000000-0000-4000-8000-000000000103';

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = (
      SELECT lot.id FROM public.product_lots AS lot
      WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
    )
      AND balance.fresh_quantity = 32
      AND balance.raw_frozen_quantity = 10
      AND balance.freezing_quantity = 1
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots AS lot
    WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND lot.quantity = 42
  ) THEN
    RAISE EXCEPTION 'partial freeze did not leave 32 fresh, 10 usable frozen, and 1 unresolved';
  END IF;

  IF (
    SELECT output.quantity_produced - lot.quantity - balance.freezing_quantity
    FROM public.production_outputs AS output
    JOIN public.product_lots AS lot ON lot.production_output_id = output.id
    JOIN public.product_lot_storage_balances AS balance
      ON balance.product_lot_id = lot.id
    WHERE output.id = 'fa000000-0000-4000-8000-000000000001'
  ) <> 5 THEN
    RAISE EXCEPTION 'the first partial freeze did not reserve exactly five quality samples';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    JOIN public.product_lots AS lot ON lot.id = balance.product_lot_id
    WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND balance.quality_sampling_pending_quantity = 0
      AND balance.quality_sampling_reserved_quantity = 5
      AND balance.raw_frozen_quantity = 10
  ) OR (SELECT count(*) FROM public.product_lot_quality_samples AS sample
      JOIN public.product_lots AS lot ON lot.id = sample.product_lot_id
      WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
        AND ((sample.purpose = 'immediate_inspection' AND sample.quantity = 2
            AND sample.status = 'pending_inspection')
          OR (sample.purpose = 'safety_retention' AND sample.quantity = 3
            AND sample.status = 'in_custody'))) <> 2 THEN
    RAISE EXCEPTION 'the first threshold crossing did not allocate the 2+3 samples exactly once';
  END IF;

  PERFORM public.confirm_picking_item_with_condition(
    'fa000000-0000-4000-8000-000000000014',
    'PT-FG-001', 'raw_frozen', 4
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = (
      SELECT lot.id FROM public.product_lots AS lot
      WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
    )
      AND balance.fresh_quantity = 32
      AND balance.raw_frozen_quantity = 6
      AND balance.freezing_quantity = 1
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots AS lot
    WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND lot.quantity = 38
  ) THEN
    RAISE EXCEPTION 'picking four frozen pieces changed the wrong storage balance';
  END IF;

  BEGIN
    PERFORM public.confirm_picking_item_with_condition(
      'fa000000-0000-4000-8000-000000000014',
      'PT-FG-001', 'raw_frozen', 7
    );
    RAISE EXCEPTION 'picking accepted more raw-frozen pieces than were available';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Faltan 1 piezas de la condición raw_frozen%' THEN RAISE; END IF;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = (
      SELECT lot.id FROM public.product_lots AS lot
      WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
    )
      AND balance.fresh_quantity = 32
      AND balance.raw_frozen_quantity = 6
      AND balance.freezing_quantity = 1
  ) OR (SELECT quantity FROM public.inventory_reservations
      WHERE reference_type = 'sales_order'
        AND reference_id = 'fa000000-0000-4000-8000-000000000011'
        AND status = 'active') <> 7 THEN
    RAISE EXCEPTION 'rejected frozen shortage changed a balance or the remaining commitment';
  END IF;
  IF (SELECT picked_quantity FROM public.picking_order_items
      WHERE id = 'fa000000-0000-4000-8000-000000000014') <> 4
    OR (SELECT count(*) FROM public.picking_lot_allocations
      WHERE picking_order_item_id = 'fa000000-0000-4000-8000-000000000014') <> 1
    OR (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type = 'picking_lot_allocation'
        AND reference_id = 'fa000000-0000-4000-8000-000000000013') <> 1 THEN
    RAISE EXCEPTION 'rejected condition shortage left a partial picking allocation or movement';
  END IF;
END;
$test$;

RESET ROLE;

-- Prepare the earlier-expiring lot as the database owner; authenticated
-- callers intentionally have read-only access to product_lots.
INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status
) SELECT
  'fa000000-0000-4000-8000-000000000020',
  output.production_order_id, output.product_id, 3, 'released'
FROM public.production_outputs AS output
WHERE output.id = 'fa000000-0000-4000-8000-000000000001';

INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status
) SELECT
  'fa000000-0000-4000-8000-000000000021',
  output.product_id, 'PT-FG-FEFO-FIRST', output.production_order_id,
  output.id, '2090-01-01', 3, 3, 'available'
FROM public.production_outputs AS output
WHERE output.id = 'fa000000-0000-4000-8000-000000000020';

INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity
) VALUES (
  'fa000000-0000-4000-8000-000000000021', 0, 3, 0
);

INSERT INTO public.inventory_movements (
  item_type, item_id, product_id, movement_type, quantity,
  reference_type, reference_id, warehouse_id, created_by, notes
) VALUES (
  'product', 'f4000000-0000-4000-8000-000000000001',
  'f4000000-0000-4000-8000-000000000001', 'entry', 3,
  'production_lot', 'fa000000-0000-4000-8000-000000000021',
  'f2000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000001', 'FEFO test lot'
);

-- Separate lots exercise sample accumulation, exact threshold and the rule
-- that independent lots do not pool pieces to reach the threshold.
INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status
) VALUES
  ('fa000000-0000-4000-8000-000000000030', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 10, 'released'),
  ('fa000000-0000-4000-8000-000000000040', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 5, 'released'),
  ('fa000000-0000-4000-8000-000000000050', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 4, 'released'),
  ('fa000000-0000-4000-8000-000000000060', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 1, 'released');

WITH sample_lots(output_id, lot_id, lot_number, quantity) AS (
  VALUES
    ('fa000000-0000-4000-8000-000000000030'::uuid, 'fa000000-0000-4000-8000-000000000031'::uuid, 'PT-QA-SAMPLE-3-4', 10),
    ('fa000000-0000-4000-8000-000000000040'::uuid, 'fa000000-0000-4000-8000-000000000041'::uuid, 'PT-QA-SAMPLE-EXACT-5', 5),
    ('fa000000-0000-4000-8000-000000000050'::uuid, 'fa000000-0000-4000-8000-000000000051'::uuid, 'PT-QA-SAMPLE-UNDER-5-A', 4),
    ('fa000000-0000-4000-8000-000000000060'::uuid, 'fa000000-0000-4000-8000-000000000061'::uuid, 'PT-QA-SAMPLE-UNDER-5-B', 1)
)
INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status
)
SELECT sample_lots.lot_id, output.product_id, sample_lots.lot_number,
  output.production_order_id, output.id, '2090-01-01',
  sample_lots.quantity, sample_lots.quantity, 'available'
FROM sample_lots
JOIN public.production_outputs AS output ON output.id = sample_lots.output_id;

INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity
)
VALUES
  ('fa000000-0000-4000-8000-000000000031', 10, 0, 0),
  ('fa000000-0000-4000-8000-000000000041', 5, 0, 0),
  ('fa000000-0000-4000-8000-000000000051', 4, 0, 0),
  ('fa000000-0000-4000-8000-000000000061', 1, 0, 0);

INSERT INTO public.inventory_movements (
  item_type, item_id, product_id, movement_type, quantity,
  reference_type, reference_id, warehouse_id, created_by, notes
)
VALUES
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 10, 'production_lot', 'fa000000-0000-4000-8000-000000000031', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Quality sampling partial-threshold fixture'),
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 5, 'production_lot', 'fa000000-0000-4000-8000-000000000041', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Quality sampling exact-threshold fixture'),
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 4, 'production_lot', 'fa000000-0000-4000-8000-000000000051', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Quality sampling under-threshold fixture A'),
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 1, 'production_lot', 'fa000000-0000-4000-8000-000000000061', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Quality sampling under-threshold fixture B');

CREATE TEMP TABLE test_quality_sampling_operations (
  product_lot_id uuid NOT NULL,
  stage text NOT NULL,
  operation_id uuid NOT NULL,
  decision_id uuid,
  PRIMARY KEY (product_lot_id, stage)
);
GRANT SELECT, INSERT, UPDATE ON test_quality_sampling_operations TO authenticated;

SET LOCAL ROLE authenticated;

DO $sampling_threshold$
DECLARE
  v_operation_id uuid;
  v_decision_id uuid;
  v_retry_id uuid;
  v_lot_id uuid;
  v_quantity integer;
  v_key uuid;
BEGIN
  -- Three confirmed pieces remain apart; the next confirmation of four
  -- crosses the threshold for this lot only and leaves two available.
  v_lot_id := 'fa000000-0000-4000-8000-000000000031';
  v_operation_id := public.start_product_lot_freezing(
    v_lot_id, 3, 'Prueba de umbral: primer tramo de tres',
    'fd000000-0000-4000-8000-000000000201'
  );
  INSERT INTO test_quality_sampling_operations
  VALUES (v_lot_id, 'first', v_operation_id, NULL);
  v_decision_id := public.resolve_product_lot_freezing(
    v_operation_id, 3, 'raw_frozen', false,
    'Confirmación parcial de tres piezas',
    'fd000000-0000-4000-8000-000000000202'
  );
  UPDATE test_quality_sampling_operations SET decision_id = v_decision_id
  WHERE product_lot_id = v_lot_id AND stage = 'first';

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = v_lot_id
      AND balance.quality_sampling_pending_quantity = 3
      AND balance.quality_sampling_reserved_quantity = 0
      AND balance.raw_frozen_quantity = 0
  ) OR EXISTS (
    SELECT 1 FROM public.inventory_product_lot_storage_pick_suggestions AS suggestion
    WHERE suggestion.lot_id = v_lot_id AND suggestion.storage_condition = 'raw_frozen'
  ) THEN
    RAISE EXCEPTION 'three confirmed frozen pieces were not held outside available stock';
  END IF;

  v_operation_id := public.start_product_lot_freezing(
    v_lot_id, 4, 'Prueba de umbral: segundo tramo de cuatro',
    'fd000000-0000-4000-8000-000000000203'
  );
  INSERT INTO test_quality_sampling_operations
  VALUES (v_lot_id, 'second', v_operation_id, NULL);
  v_key := 'fd000000-0000-4000-8000-000000000204';
  v_decision_id := public.resolve_product_lot_freezing(
    v_operation_id, 4, 'raw_frozen', false,
    'Confirmación parcial de cuatro piezas', v_key
  );
  UPDATE test_quality_sampling_operations SET decision_id = v_decision_id
  WHERE product_lot_id = v_lot_id AND stage = 'second';
  v_retry_id := public.resolve_product_lot_freezing(
    v_operation_id, 4, 'raw_frozen', false,
    'Confirmación parcial de cuatro piezas', v_key
  );
  IF v_retry_id IS DISTINCT FROM v_decision_id THEN
    RAISE EXCEPTION 'retrying the second partial confirmation did not return its prior result';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = v_lot_id
      AND balance.quality_sampling_pending_quantity = 0
      AND balance.quality_sampling_reserved_quantity = 5
      AND balance.raw_frozen_quantity = 2
  ) OR (SELECT count(*) FROM public.product_lot_quality_samples AS sample
      WHERE sample.product_lot_id = v_lot_id) <> 2
    OR (SELECT coalesce(sum(sample.quantity), 0)
      FROM public.product_lot_quality_samples AS sample
      WHERE sample.product_lot_id = v_lot_id) <> 5
    OR (SELECT quantity_produced FROM public.production_outputs
      WHERE id = 'fa000000-0000-4000-8000-000000000030') <> 10
    OR NOT EXISTS (
      SELECT 1 FROM public.inventory_product_lot_storage_pick_suggestions AS suggestion
      WHERE suggestion.lot_id = v_lot_id
        AND suggestion.storage_condition = 'raw_frozen'
        AND suggestion.quantity = 2
    ) THEN
    RAISE EXCEPTION 'crossing three plus four did not reserve five once and expose only two';
  END IF;

  IF (SELECT count(*) FROM public.inventory_movements AS movement
      WHERE (movement.reference_type = 'product_lot_freezing_start'
          AND movement.reference_id IN (
            SELECT operation_id FROM test_quality_sampling_operations
            WHERE product_lot_id = v_lot_id
          ))
        OR (movement.reference_type = 'product_lot_freezing_decision'
          AND movement.reference_id IN (
            SELECT decision_id FROM test_quality_sampling_operations
            WHERE product_lot_id = v_lot_id
          ))) <> 3 THEN
    RAISE EXCEPTION 'the retry duplicated a start, confirmation or inventory movement';
  END IF;

  -- Exactly five are all reserved and none is available.
  v_lot_id := 'fa000000-0000-4000-8000-000000000041';
  v_operation_id := public.start_product_lot_freezing(
    v_lot_id, 5, 'Prueba de umbral exacto',
    'fd000000-0000-4000-8000-000000000205'
  );
  PERFORM public.resolve_product_lot_freezing(
    v_operation_id, 5, 'raw_frozen', false,
    'Confirmación exacta de cinco piezas',
    'fd000000-0000-4000-8000-000000000206'
  );
  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = v_lot_id
      AND balance.quality_sampling_pending_quantity = 0
      AND balance.quality_sampling_reserved_quantity = 5
      AND balance.raw_frozen_quantity = 0
  ) OR EXISTS (
    SELECT 1 FROM public.inventory_product_lot_storage_pick_suggestions AS suggestion
    WHERE suggestion.lot_id = v_lot_id AND suggestion.storage_condition = 'raw_frozen'
  ) THEN
    RAISE EXCEPTION 'an exact five-piece lot exposed pieces before sample disposition';
  END IF;

  -- A lot that ends below five remains isolated for Quality disposition;
  -- the four-piece lot and the one-piece lot must never pool their quantities.
  FOREACH v_lot_id IN ARRAY ARRAY[
    'fa000000-0000-4000-8000-000000000051'::uuid,
    'fa000000-0000-4000-8000-000000000061'::uuid
  ] LOOP
    SELECT balance.fresh_quantity INTO v_quantity
    FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = v_lot_id;
    v_operation_id := public.start_product_lot_freezing(
      v_lot_id, v_quantity, 'Prueba de lotes separados debajo del umbral',
      gen_random_uuid()
    );
    PERFORM public.resolve_product_lot_freezing(
      v_operation_id, v_quantity, 'raw_frozen', false,
      'Lote final debajo del umbral, pendiente de Calidad', gen_random_uuid()
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = 'fa000000-0000-4000-8000-000000000051'
      AND balance.quality_sampling_pending_quantity = 4
      AND balance.quality_sampling_reserved_quantity = 0
      AND balance.raw_frozen_quantity = 0
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = 'fa000000-0000-4000-8000-000000000061'
      AND balance.quality_sampling_pending_quantity = 1
      AND balance.quality_sampling_reserved_quantity = 0
      AND balance.raw_frozen_quantity = 0
  ) OR EXISTS (
    SELECT 1 FROM public.product_lot_quality_samples AS sample
    WHERE sample.product_lot_id IN (
      'fa000000-0000-4000-8000-000000000051',
      'fa000000-0000-4000-8000-000000000061'
    )
  ) OR NOT EXISTS (
    SELECT 1 FROM public.get_product_lot_storage_balances(
      'f4000000-0000-4000-8000-000000000001'
    ) AS balances
    WHERE balances.product_lot_id = 'fa000000-0000-4000-8000-000000000051'
      AND balances.quality_sampling_pending_quantity = 4
  ) OR NOT EXISTS (
    SELECT 1 FROM public.get_product_lot_storage_balances(
      'f4000000-0000-4000-8000-000000000001'
    ) AS balances
    WHERE balances.product_lot_id = 'fa000000-0000-4000-8000-000000000061'
      AND balances.quality_sampling_pending_quantity = 1
  ) THEN
    RAISE EXCEPTION 'independent under-threshold lots were pooled or made available';
  END IF;
END;
$sampling_threshold$;

DO $test$
DECLARE
  v_operation_id uuid;
BEGIN
  SELECT id INTO v_operation_id FROM test_freezing_operation;

  PERFORM public.confirm_picking_item_with_condition(
    'fa000000-0000-4000-8000-000000000014',
    'PT-FG-FEFO-FIRST', 'raw_frozen', 1
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.picking_lot_allocations AS allocation
    WHERE allocation.picking_order_item_id = 'fa000000-0000-4000-8000-000000000014'
      AND allocation.product_lot_id = 'fa000000-0000-4000-8000-000000000021'
      AND allocation.quantity = 1
      AND allocation.storage_condition = 'raw_frozen'
  ) THEN
    RAISE EXCEPTION 'picking did not allocate the first eligible FEFO lot in the selected condition';
  END IF;

  IF public.resolve_product_lot_freezing(
    v_operation_id, 8, 'fresh', true,
    'Verificación autorizada: no llegaron a congelarse y conservaron condiciones',
    'fd000000-0000-4000-8000-000000000103'
  ) IS DISTINCT FROM (SELECT id FROM test_freezing_decisions
                      WHERE idempotency_key = 'fd000000-0000-4000-8000-000000000103') THEN
    RAISE EXCEPTION 'retrying a prior freezing decision did not return its prior result';
  END IF;

  BEGIN
    PERFORM public.resolve_product_lot_freezing(
      v_operation_id, 7, 'raw_frozen', false,
      'Intento de resolver más que las 6 piezas pendientes',
      'fd000000-0000-4000-8000-000000000104'
    );
    RAISE EXCEPTION 'freezing decision exceeded its pending quantity';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%pending freezing quantity%' THEN RAISE; END IF;
  END;

  PERFORM public.resolve_product_lot_freezing(
    v_operation_id, 1, 'raw_frozen', false,
    'Congelación parcial completada en un segundo tramo',
    'fd000000-0000-4000-8000-000000000105'
  );

  BEGIN
    PERFORM public.resolve_product_lot_freezing(
      v_operation_id, 1, 'fresh', true,
      'Intento de devolver una pieza ya confirmada como congelada',
      'fd000000-0000-4000-8000-000000000106'
    );
    RAISE EXCEPTION 'confirmed raw-frozen pieces were changed back to fresh';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Decision exceeds pending freezing quantity%' THEN RAISE; END IF;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    WHERE balance.product_lot_id = (
      SELECT lot.id FROM public.product_lots AS lot
      WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
    )
      AND balance.fresh_quantity = 32
      AND balance.raw_frozen_quantity = 7
      AND balance.freezing_quantity = 0
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots AS lot
    WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND lot.quantity = 39
  ) THEN
    RAISE EXCEPTION 'resolving the final frozen piece duplicated samples or misreconciled the lot after picking';
  END IF;

  IF (
    SELECT output.quantity_produced - lot.quantity - balance.freezing_quantity
      - coalesce((
        SELECT sum(allocation.quantity)
        FROM public.picking_lot_allocations AS allocation
        WHERE allocation.product_lot_id = lot.id
      ), 0)
    FROM public.production_outputs AS output
    JOIN public.product_lots AS lot ON lot.production_output_id = output.id
    JOIN public.product_lot_storage_balances AS balance
      ON balance.product_lot_id = lot.id
    WHERE output.id = 'fa000000-0000-4000-8000-000000000001'
  ) <> 5 THEN
    RAISE EXCEPTION 'partial confirmations or retries duplicated or lost the five sample pieces';
  END IF;

  IF (SELECT count(*) FROM public.product_lot_freezing_decisions AS decision
      WHERE decision.operation_id = v_operation_id) <> 3
    OR (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type IN ('product_lot_freezing_start', 'product_lot_freezing_decision')
        AND (reference_id = v_operation_id OR reference_id IN (
          SELECT decision.id FROM public.product_lot_freezing_decisions AS decision
          WHERE decision.operation_id = v_operation_id
        ))) <> 4 THEN
    RAISE EXCEPTION 'freezing retries duplicated a decision or inventory movement';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.product_lot_freezing_decisions AS decision
    WHERE decision.operation_id = v_operation_id
      AND (decision.product_lot_id IS DISTINCT FROM (
        SELECT lot.id FROM public.product_lots AS lot
        WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      ) OR decision.reason IS NULL OR decision.decided_by IS NULL OR decision.decided_at IS NULL)
  ) THEN
    RAISE EXCEPTION 'freezing decision audit data is incomplete';
  END IF;
END;
$test$;

RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-4000-8000-000000000002',
  true
);
SET LOCAL ROLE authenticated;

DO $test$
BEGIN
  IF (SELECT count(*) FROM public.product_lot_storage_balances) <> 0
    OR (SELECT count(*) FROM public.product_lot_freezing_operations) <> 0
    OR (SELECT count(*) FROM public.product_lot_freezing_decisions) <> 0
    OR (SELECT count(*) FROM public.product_lot_quality_samples) <> 0 THEN
    RAISE EXCEPTION 'non-admin user read administrative storage-condition records';
  END IF;
END;
$test$;

RESET ROLE;

ROLLBACK;
