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

  BEGIN
    PERFORM public.record_product_lot_quality_sample_inspection(
      'fa000000-0000-4000-8000-000000000031',
      'Intento sin autorización',
      '[{"criterion":"Integridad","passed":true}]'::jsonb,
      '[]'::jsonb
    );
    RAISE EXCEPTION 'non-admin user recorded a product quality sample inspection';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$test$;

RESET ROLE;

SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;

DO $quality_sample_inspection$
DECLARE
  v_sample_id uuid;
  v_inspection_id uuid;
  v_lot_id uuid;
  v_lot_quantity numeric;
  v_frozen_quantity integer;
BEGIN
  SELECT sample.id, sample.product_lot_id
  INTO v_sample_id, v_lot_id
  FROM public.product_lot_quality_samples AS sample
  JOIN public.product_lots AS lot ON lot.id = sample.product_lot_id
  WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
    AND sample.purpose = 'immediate_inspection'
    AND sample.status = 'pending_inspection';

  SELECT lot.quantity, balance.raw_frozen_quantity
  INTO v_lot_quantity, v_frozen_quantity
  FROM public.product_lots AS lot
  JOIN public.product_lot_storage_balances AS balance
    ON balance.product_lot_id = lot.id
  WHERE lot.id = v_lot_id;

  v_inspection_id := public.record_product_lot_quality_sample_inspection(
    v_sample_id,
    'Inspección de prueba de muestra inmediata',
    '[{"criterion":"Integridad","expected_value":"Sin roturas","actual_value":"Íntegras","passed":true}]'::jsonb,
    '[]'::jsonb
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.quality_inspections AS inspection
    WHERE inspection.id = v_inspection_id
      AND inspection.subject_type = 'product_lot_quality_sample'
      AND inspection.product_lot_quality_sample_id = v_sample_id
      AND inspection.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND inspection.production_order_id = (
        SELECT output.production_order_id FROM public.production_outputs AS output
        WHERE output.id = 'fa000000-0000-4000-8000-000000000001'
      )
      AND inspection.sampled_quantity = 2
      AND inspection.accepted_quantity = 2
      AND inspection.rejected_quantity = 0
      AND inspection.status = 'passed'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lot_quality_samples AS sample
    WHERE sample.id = v_sample_id
      AND sample.status = 'pending_disposition'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.quality_inspection_items AS item
    WHERE item.inspection_id = v_inspection_id
      AND item.criterion = 'Integridad'
      AND item.passed = true
  ) THEN
    RAISE EXCEPTION 'immediate sample inspection did not preserve its source, fixed quantity and result';
  END IF;

  IF (SELECT lot.quantity FROM public.product_lots AS lot WHERE lot.id = v_lot_id)
      IS DISTINCT FROM v_lot_quantity
    OR (SELECT balance.raw_frozen_quantity
      FROM public.product_lot_storage_balances AS balance
      WHERE balance.product_lot_id = v_lot_id)
      IS DISTINCT FROM v_frozen_quantity THEN
    RAISE EXCEPTION 'recording sample inspection changed the inventory balance before disposition';
  END IF;

  BEGIN
    PERFORM public.record_product_lot_quality_sample_inspection(
      v_sample_id,
      'Reintento de inspección',
      '[{"criterion":"Integridad","passed":true}]'::jsonb,
      '[]'::jsonb
    );
    RAISE EXCEPTION 'an already inspected sample was inspected a second time';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%already has an inspection%' THEN RAISE; END IF;
  END;

  IF (SELECT count(*) FROM public.quality_inspections AS inspection
      WHERE inspection.product_lot_quality_sample_id = v_sample_id) <> 1
    OR (SELECT count(*) FROM public.quality_inspection_items AS item
      WHERE item.inspection_id = v_inspection_id) <> 1 THEN
    RAISE EXCEPTION 'retrying sample inspection duplicated inspection data';
  END IF;
END;
$quality_sample_inspection$;

RESET ROLE;

-- Sample disposition is separate from inspection. Exercise full return, full
-- quality waste, mixed per-piece destinations, authorization, and retries.
INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status
) VALUES
  ('fa000000-0000-4000-8000-000000000003', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 48, 'released'),
  ('fa000000-0000-4000-8000-000000000004', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 48, 'released'),
  ('fa000000-0000-4000-8000-000000000005', 'f8000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 48, 'released');

INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status, inventory_location_id,
  warehouse_id, location_name, released_at, released_by
) VALUES
  ('fc000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000001', 'SAMPLE-RETURN-48', 'f8000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000003', CURRENT_DATE + 30, 48, 43, 'available', 'f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Finished Goods Location', now(), 'f1000000-0000-4000-8000-000000000001'),
  ('fc000000-0000-4000-8000-000000000004', 'f4000000-0000-4000-8000-000000000001', 'SAMPLE-WASTE-48', 'f8000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000004', CURRENT_DATE + 30, 48, 43, 'available', 'f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Finished Goods Location', now(), 'f1000000-0000-4000-8000-000000000001'),
  ('fc000000-0000-4000-8000-000000000005', 'f4000000-0000-4000-8000-000000000001', 'SAMPLE-MIXED-48', 'f8000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000005', CURRENT_DATE + 30, 48, 43, 'available', 'f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Finished Goods Location', now(), 'f1000000-0000-4000-8000-000000000001');

INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity,
  quality_sampling_pending_quantity, quality_sampling_reserved_quantity
) VALUES
  ('fc000000-0000-4000-8000-000000000003', 0, 43, 0, 0, 5),
  ('fc000000-0000-4000-8000-000000000004', 0, 43, 0, 0, 5),
  ('fc000000-0000-4000-8000-000000000005', 0, 43, 0, 0, 5);

INSERT INTO public.product_lot_quality_samples (
  id, product_lot_id, purpose, quantity, status, created_by
) VALUES
  ('fd000000-0000-4000-8000-000000000201', 'fc000000-0000-4000-8000-000000000003', 'immediate_inspection', 2, 'pending_disposition', 'f1000000-0000-4000-8000-000000000001'),
  ('fd000000-0000-4000-8000-000000000202', 'fc000000-0000-4000-8000-000000000003', 'safety_retention', 3, 'in_custody', 'f1000000-0000-4000-8000-000000000001'),
  ('fd000000-0000-4000-8000-000000000203', 'fc000000-0000-4000-8000-000000000004', 'immediate_inspection', 2, 'pending_disposition', 'f1000000-0000-4000-8000-000000000001'),
  ('fd000000-0000-4000-8000-000000000204', 'fc000000-0000-4000-8000-000000000004', 'safety_retention', 3, 'in_custody', 'f1000000-0000-4000-8000-000000000001'),
  ('fd000000-0000-4000-8000-000000000205', 'fc000000-0000-4000-8000-000000000005', 'immediate_inspection', 2, 'pending_disposition', 'f1000000-0000-4000-8000-000000000001'),
  ('fd000000-0000-4000-8000-000000000206', 'fc000000-0000-4000-8000-000000000005', 'safety_retention', 3, 'in_custody', 'f1000000-0000-4000-8000-000000000001');

INSERT INTO public.quality_inspections (
  id, production_order_id, production_output_id, inspector_id, subject_type,
  product_lot_quality_sample_id, status, result, sampled_quantity,
  accepted_quantity, rejected_quantity
) VALUES
  ('fb000000-0000-4000-8000-000000000101', 'f8000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'product_lot_quality_sample', 'fd000000-0000-4000-8000-000000000201', 'passed', 'ok', 2, 2, 0),
  ('fb000000-0000-4000-8000-000000000102', 'f8000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000001', 'product_lot_quality_sample', 'fd000000-0000-4000-8000-000000000203', 'passed', 'ok', 2, 2, 0),
  ('fb000000-0000-4000-8000-000000000103', 'f8000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000001', 'product_lot_quality_sample', 'fd000000-0000-4000-8000-000000000205', 'passed', 'ok', 2, 2, 0);

INSERT INTO public.inventory_movements (
  item_type, item_id, product_id, movement_type, quantity, reference_type,
  reference_id, warehouse_id, created_by, notes
) VALUES
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 43, 'sample-disposition-fixture', 'fc000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Saldo congelado de prueba'),
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 43, 'sample-disposition-fixture', 'fc000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Saldo congelado de prueba'),
  ('product', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'entry', 43, 'sample-disposition-fixture', 'fc000000-0000-4000-8000-000000000005', 'f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Saldo congelado de prueba');

SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;

DO $quality_sample_disposition$
DECLARE
  v_return_id uuid;
  v_retry_id uuid;
  v_waste_id uuid;
  v_mixed_return_id uuid;
  v_mixed_waste_id uuid;
BEGIN
  BEGIN
    PERFORM public.decide_product_lot_quality_sample_disposition(
      'fd000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-000000000102',
      2, 'direct_waste', false,
      'Intento de usar una inspección de otra muestra',
      'fd000000-0000-4000-8000-000000000307'
    );
    RAISE EXCEPTION 'inspection unrelated to the sample was accepted';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%must be inspected before disposition%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.decide_product_lot_quality_sample_disposition(
      'fd000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-000000000101',
      2, 'returned_to_lot', false,
      'Intento de retorno sin autorización de Calidad',
      'fd000000-0000-4000-8000-000000000301'
    );
    RAISE EXCEPTION 'sample return without Quality authorization was accepted';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%explicit Quality authorization%' THEN RAISE; END IF;
  END;

  IF (SELECT count(*) FROM public.product_lot_quality_sample_dispositions) <> 0
    OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_storage_balances
      WHERE product_lot_id = 'fc000000-0000-4000-8000-000000000003'
        AND raw_frozen_quantity = 43 AND quality_sampling_reserved_quantity = 5
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lots
      WHERE id = 'fc000000-0000-4000-8000-000000000003' AND quantity = 43
    ) THEN
    RAISE EXCEPTION 'unauthorized return changed sample, inventory, or movement state';
  END IF;

  v_return_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-000000000101',
    2, 'returned_to_lot', true,
    'Calidad verificó que las piezas siguen intactas',
    'fd000000-0000-4000-8000-000000000302'
  );
  v_retry_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-000000000101',
    2, 'returned_to_lot', true,
    'Calidad verificó que las piezas siguen intactas',
    'fd000000-0000-4000-8000-000000000302'
  );
  IF v_return_id IS DISTINCT FROM v_retry_id
    OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_storage_balances
      WHERE product_lot_id = 'fc000000-0000-4000-8000-000000000003'
        AND raw_frozen_quantity = 45 AND quality_sampling_reserved_quantity = 3
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lots
      WHERE id = 'fc000000-0000-4000-8000-000000000003' AND quantity = 45
    ) OR NOT EXISTS (
      SELECT 1 FROM public.production_outputs
      WHERE id = 'fa000000-0000-4000-8000-000000000003' AND quantity_produced = 48
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_quality_samples
      WHERE id = 'fd000000-0000-4000-8000-000000000202'
        AND quantity = 3 AND status = 'in_custody'
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_quality_sample_dispositions AS disposition
      WHERE disposition.id = v_return_id
        AND disposition.quantity = 2
        AND disposition.destination = 'returned_to_lot'
        AND disposition.return_authorized
        AND disposition.authorized_by = 'f1000000-0000-4000-8000-000000000001'
        AND disposition.decided_by = 'f1000000-0000-4000-8000-000000000001'
        AND disposition.decided_at IS NOT NULL
    ) OR (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type = 'product_lot_quality_sample_disposition'
        AND reference_id = v_return_id AND movement_type = 'entry' AND quantity = 2) <> 1 THEN
    RAISE EXCEPTION 'returning the intact two-piece sample did not leave 45 available, 3 in custody, and 48 gross';
  END IF;

  v_waste_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000203', 'fb000000-0000-4000-8000-000000000102',
    2, 'direct_waste', false,
    'Muestra consumida en prueba destructiva',
    'fd000000-0000-4000-8000-000000000303'
  );
  v_retry_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000203', 'fb000000-0000-4000-8000-000000000102',
    2, 'direct_waste', false,
    'Muestra consumida en prueba destructiva',
    'fd000000-0000-4000-8000-000000000303'
  );
  IF v_waste_id IS DISTINCT FROM v_retry_id OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_storage_balances
      WHERE product_lot_id = 'fc000000-0000-4000-8000-000000000004'
        AND raw_frozen_quantity = 43 AND quality_sampling_reserved_quantity = 3
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lots
      WHERE id = 'fc000000-0000-4000-8000-000000000004' AND quantity = 43
    ) OR NOT EXISTS (
      SELECT 1 FROM public.production_outputs
      WHERE id = 'fa000000-0000-4000-8000-000000000004' AND quantity_produced = 48
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_quality_samples
      WHERE id = 'fd000000-0000-4000-8000-000000000204'
        AND quantity = 3 AND status = 'in_custody'
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_quality_sample_dispositions AS disposition
      WHERE disposition.id = v_waste_id AND disposition.quantity = 2
        AND disposition.destination = 'direct_waste'
        AND disposition.reason = 'Muestra consumida en prueba destructiva'
        AND disposition.decided_by = 'f1000000-0000-4000-8000-000000000001'
        AND disposition.decided_at IS NOT NULL
    ) OR (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type = 'product_lot_quality_sample_disposition'
        AND reference_id = v_waste_id) <> 0
    OR (SELECT count(*) FROM public.product_lot_quality_sample_dispositions
      WHERE idempotency_key = 'fd000000-0000-4000-8000-000000000303') <> 1 THEN
    RAISE EXCEPTION 'destructive test did not leave 43 available, record two quality-waste pieces, retain 3 in custody, and preserve 48 gross';
  END IF;

  v_mixed_return_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000205', 'fb000000-0000-4000-8000-000000000103',
    1, 'returned_to_lot', true,
    'Calidad autorizó devolver una pieza intacta',
    'fd000000-0000-4000-8000-000000000304'
  );
  v_retry_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000205', 'fb000000-0000-4000-8000-000000000103',
    1, 'returned_to_lot', true,
    'Calidad autorizó devolver una pieza intacta',
    'fd000000-0000-4000-8000-000000000304'
  );
  IF v_mixed_return_id IS DISTINCT FROM v_retry_id THEN
    RAISE EXCEPTION 'retrying a partial sample return did not return the existing decision';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_quality_samples AS sample
    WHERE sample.id = 'fd000000-0000-4000-8000-000000000205'
      AND sample.status = 'partially_disposed'
      AND sample.decided_at IS NULL
  ) OR (SELECT count(*) FROM public.product_lot_quality_sample_dispositions
      WHERE sample_id = 'fd000000-0000-4000-8000-000000000205') <> 1
    OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_storage_balances
      WHERE product_lot_id = 'fc000000-0000-4000-8000-000000000005'
        AND raw_frozen_quantity = 44 AND quality_sampling_reserved_quantity = 4
    ) THEN
    RAISE EXCEPTION 'partial per-piece disposition did not preserve the remaining reserved sample piece';
  END IF;
  v_mixed_waste_id := public.decide_product_lot_quality_sample_disposition(
    'fd000000-0000-4000-8000-000000000205', 'fb000000-0000-4000-8000-000000000103',
    1, 'direct_waste', false,
    'Una pieza se consumió en una prueba destructiva',
    'fd000000-0000-4000-8000-000000000305'
  );
  IF NOT EXISTS (
      SELECT 1 FROM public.product_lot_storage_balances
      WHERE product_lot_id = 'fc000000-0000-4000-8000-000000000005'
        AND raw_frozen_quantity = 44 AND quality_sampling_reserved_quantity = 3
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lots
      WHERE id = 'fc000000-0000-4000-8000-000000000005' AND quantity = 44
    ) OR NOT EXISTS (
      SELECT 1 FROM public.product_lot_quality_samples
      WHERE id = 'fd000000-0000-4000-8000-000000000205'
        AND quantity = 2 AND status = 'mixed_disposition' AND destination = 'mixed'
    ) OR (SELECT count(*) FROM public.product_lot_quality_sample_dispositions
      WHERE sample_id = 'fd000000-0000-4000-8000-000000000205') <> 2
    OR (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type = 'product_lot_quality_sample_disposition'
        AND reference_id IN (v_mixed_return_id, v_mixed_waste_id)) <> 1 THEN
    RAISE EXCEPTION 'distinct per-piece destinations or their retry were not reconciled exactly once';
  END IF;
END;
$quality_sample_disposition$;

RESET ROLE;

-- Daily snapshots must count a safety sample once at month end, even when it
-- was present in multiple daily closes during the month.
INSERT INTO public.preparation_types (id, slug, name)
VALUES ('fe000000-0000-4000-8000-000000000001', 'raw-frozen-retention-test', 'Crudo congelado');
INSERT INTO public.products (id, slug, internal_code, name, status, preparation_type_id)
VALUES (
  'fe000000-0000-4000-8000-000000000010', 'quality-retention-monthly-test',
  'QA-RET-MONTH-01', 'Quality Retention Monthly Test', 'active',
  'fe000000-0000-4000-8000-000000000001'
);
INSERT INTO public.recipes (id, product_id, name, is_active)
VALUES (
  'fe000000-0000-4000-8000-000000000011',
  'fe000000-0000-4000-8000-000000000010', 'Quality Retention Monthly Recipe', true
);
INSERT INTO public.production_orders (
  id, production_number, recipe_id, production_status, planned_quantity,
  produced_quantity, completed_at
) VALUES (
  'fe000000-0000-4000-8000-000000000012', 'QA-RET-MONTH-ORDER',
  'fe000000-0000-4000-8000-000000000011', 'completed', 48, 48,
  '2026-10-10 12:00:00-06'
);
INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status, created_at
) VALUES (
  'fe000000-0000-4000-8000-000000000013',
  'fe000000-0000-4000-8000-000000000012',
  'fe000000-0000-4000-8000-000000000010', 48, 'released', '2026-10-10 12:00:00-06'
);
INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status, inventory_location_id,
  warehouse_id, location_name
) VALUES (
  'fe000000-0000-4000-8000-000000000014',
  'fe000000-0000-4000-8000-000000000010', 'QA-RET-MONTH-LOT',
  'fe000000-0000-4000-8000-000000000012',
  'fe000000-0000-4000-8000-000000000013', '2026-12-31', 48, 43, 'available',
  'f3000000-0000-4000-8000-000000000001',
  'f2000000-0000-4000-8000-000000000001', 'Finished Goods Location'
);
INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity,
  quality_sampling_pending_quantity, quality_sampling_reserved_quantity
) VALUES (
  'fe000000-0000-4000-8000-000000000014', 0, 43, 0, 0, 5
);
INSERT INTO public.product_lot_quality_samples (
  id, product_lot_id, purpose, quantity, status, created_by, created_at
) VALUES (
  'fe000000-0000-4000-8000-000000000018',
  'fe000000-0000-4000-8000-000000000014', 'safety_retention', 3,
  'in_custody', 'f1000000-0000-4000-8000-000000000001', '2026-10-11 12:00:00-06'
);
INSERT INTO public.production_orders (
  id, production_number, recipe_id, production_status, planned_quantity,
  produced_quantity, completed_at
) VALUES (
  'fe000000-0000-4000-8000-000000000026', 'QA-RET-OTHER-MONTH-ORDER',
  'fe000000-0000-4000-8000-000000000011', 'completed', 12, 12,
  '2026-09-30 12:00:00-06'
);
INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status, created_at
) VALUES (
  'fe000000-0000-4000-8000-000000000027',
  'fe000000-0000-4000-8000-000000000026',
  'fe000000-0000-4000-8000-000000000010', 12, 'released', '2026-09-30 12:00:00-06'
);
INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status, inventory_location_id,
  warehouse_id, location_name
) VALUES (
  'fe000000-0000-4000-8000-000000000028',
  'fe000000-0000-4000-8000-000000000010', 'QA-RET-OTHER-MONTH-LOT',
  'fe000000-0000-4000-8000-000000000026',
  'fe000000-0000-4000-8000-000000000027', '2026-12-31', 12, 12, 'available',
  'f3000000-0000-4000-8000-000000000001',
  'f2000000-0000-4000-8000-000000000001', 'Finished Goods Location'
);
INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity,
  quality_sampling_pending_quantity, quality_sampling_reserved_quantity
) VALUES (
  'fe000000-0000-4000-8000-000000000028', 0, 10, 0, 0, 2
);
INSERT INTO public.product_lot_quality_samples (
  id, product_lot_id, purpose, quantity, status, created_by, created_at
) VALUES (
  'fe000000-0000-4000-8000-000000000029',
  'fe000000-0000-4000-8000-000000000028', 'safety_retention', 2,
  'in_custody', 'f1000000-0000-4000-8000-000000000001', '2026-10-01 12:00:00-06'
);
INSERT INTO public.product_lot_quality_samples (
  id, product_lot_id, purpose, quantity, status, created_by, decided_by,
  decided_at, destination, reason, created_at
) VALUES (
  'fe000000-0000-4000-8000-000000000019',
  'fe000000-0000-4000-8000-000000000014', 'immediate_inspection', 2,
  'direct_waste', 'f1000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000001', '2026-10-20 15:00:00-06',
  'direct_waste', 'Destructive monthly retention test', '2026-10-11 12:00:00-06'
);
INSERT INTO public.product_lot_quality_sample_dispositions (
  id, sample_id, quantity, destination, return_authorized, reason,
  idempotency_key, decided_by, decided_at
) VALUES (
  'fe000000-0000-4000-8000-000000000020',
  'fe000000-0000-4000-8000-000000000019', 2, 'direct_waste', false,
  'Destructive monthly retention test', 'fe000000-0000-4000-8000-000000000021',
  'f1000000-0000-4000-8000-000000000001', '2026-10-20 15:00:00-06'
);

SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;

DO $quality_retention_pending$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.get_quality_retention_monthly_indicator('2026-10-01') AS indicator
    WHERE indicator.product_id = 'fe000000-0000-4000-8000-000000000010'
      AND indicator.preparation_type_id = 'fe000000-0000-4000-8000-000000000001'
      AND indicator.retained_quantity = 0
      AND indicator.gross_production_quantity = 48
      AND indicator.retention_percentage IS NULL
      AND indicator.direct_quality_waste_quantity = 2
      AND NOT indicator.month_closed
  ) THEN
    RAISE EXCEPTION 'monthly indicator did not show pending close, gross production, and separate Quality waste';
  END IF;
END;
$quality_retention_pending$;

RESET ROLE;

INSERT INTO public.product_lot_freezing_operations (
  id, product_lot_id, requested_quantity, reason, idempotency_key, started_by, started_at
) VALUES (
  'fe000000-0000-4000-8000-000000000022',
  'fe000000-0000-4000-8000-000000000014', 48, 'Monthly retention fixture',
  'fe000000-0000-4000-8000-000000000023',
  'f1000000-0000-4000-8000-000000000001', '2026-10-10 13:00:00-06'
);
INSERT INTO public.product_lot_freezing_decisions (
  id, operation_id, product_lot_id, quantity, destination, reason,
  idempotency_key, decided_by, decided_at
) VALUES (
  'fe000000-0000-4000-8000-000000000024',
  'fe000000-0000-4000-8000-000000000022',
  'fe000000-0000-4000-8000-000000000014', 40, 'raw_frozen',
  'All accepted pieces confirmed frozen',
  'fe000000-0000-4000-8000-000000000025',
  'f1000000-0000-4000-8000-000000000001', '2026-10-10 14:00:00-06'
);

INSERT INTO public.quality_retention_daily_closes (id, close_date, closed_by, closed_at)
VALUES
  ('fe000000-0000-4000-8000-000000000031', '2026-10-30', 'f1000000-0000-4000-8000-000000000001', '2026-10-30 23:00:00-06'),
  ('fe000000-0000-4000-8000-000000000032', '2026-10-31', 'f1000000-0000-4000-8000-000000000001', '2026-10-31 23:00:00-06');
INSERT INTO public.quality_retention_daily_close_items (daily_close_id, sample_id, quantity)
VALUES
  ('fe000000-0000-4000-8000-000000000031', 'fe000000-0000-4000-8000-000000000018', 3),
  ('fe000000-0000-4000-8000-000000000032', 'fe000000-0000-4000-8000-000000000018', 3),
  ('fe000000-0000-4000-8000-000000000031', 'fe000000-0000-4000-8000-000000000029', 2),
  ('fe000000-0000-4000-8000-000000000032', 'fe000000-0000-4000-8000-000000000029', 2);

SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;

DO $quality_retention_closing$
DECLARE
  v_today uuid;
  v_today_retry uuid;
BEGIN
  v_today := public.close_quality_retention_day(
    (now() AT TIME ZONE 'America/Mexico_City')::date
  );
  v_today_retry := public.close_quality_retention_day(
    (now() AT TIME ZONE 'America/Mexico_City')::date
  );
  IF v_today IS DISTINCT FROM v_today_retry
    OR (SELECT count(*) FROM public.quality_retention_daily_close_items
      WHERE daily_close_id = v_today
        AND sample_id IN (
          'fe000000-0000-4000-8000-000000000018',
          'fe000000-0000-4000-8000-000000000029'
        )) <> 2
    OR (SELECT count(*) FROM public.quality_retention_daily_closes
      WHERE close_date = (now() AT TIME ZONE 'America/Mexico_City')::date) <> 1 THEN
    RAISE EXCEPTION 'daily close retry duplicated its snapshot or missed custodied samples';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.get_quality_retention_monthly_indicator('2026-10-01') AS indicator
    WHERE indicator.product_id = 'fe000000-0000-4000-8000-000000000010'
      AND indicator.preparation_type_id = 'fe000000-0000-4000-8000-000000000001'
      AND indicator.retained_quantity = 3
      AND indicator.gross_production_quantity = 48
      AND indicator.retention_percentage = 6.25
      AND indicator.direct_quality_waste_quantity = 2
      AND indicator.month_closed
  ) THEN
    RAISE EXCEPTION 'monthly retention duplicated daily sample snapshots or misgrouped production/waste';
  END IF;
END;
$quality_retention_closing$;

RESET ROLE;

SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
SET LOCAL ROLE authenticated;

DO $quality_sample_disposition_authorization$
BEGIN
  IF (SELECT count(*) FROM public.product_lot_quality_sample_dispositions) <> 0 THEN
    RAISE EXCEPTION 'non-admin user read product sample disposition records';
  END IF;

  BEGIN
    PERFORM public.decide_product_lot_quality_sample_disposition(
      'fd000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-000000000101',
      1, 'direct_waste', false,
      'Intento de disposición sin autorización administrativa',
      'fd000000-0000-4000-8000-000000000306'
    );
    RAISE EXCEPTION 'non-admin user decided a quality sample disposition';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM public.close_quality_retention_day('2026-10-31');
    RAISE EXCEPTION 'non-admin user closed the Quality retention day';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM * FROM public.get_quality_retention_monthly_indicator('2026-10-01');
    RAISE EXCEPTION 'non-admin user read the Quality retention indicator';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$quality_sample_disposition_authorization$;

RESET ROLE;

ROLLBACK;
