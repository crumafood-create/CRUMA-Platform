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

-- Prepare the later-expiring lot as the database owner; authenticated callers
-- intentionally have read-only access to product_lots.
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
    v_operation_id, 10, 'raw_frozen', false,
    'Congelación confirmada de 10 piezas',
    'fd000000-0000-4000-8000-000000000102'
  ), 'fd000000-0000-4000-8000-000000000102';

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
      AND balance.freezing_quantity = 6
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots AS lot
    WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND lot.quantity = 42
  ) THEN
    RAISE EXCEPTION 'partial interruption decisions did not leave 32 fresh, 10 frozen and 6 held';
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
      AND balance.freezing_quantity = 6
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
      AND balance.freezing_quantity = 6
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
    v_operation_id, 6, 'raw_frozen', false,
    'Congelación parcial completada',
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
      AND balance.raw_frozen_quantity = 12
      AND balance.freezing_quantity = 0
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots AS lot
    WHERE lot.production_output_id = 'fa000000-0000-4000-8000-000000000001'
      AND lot.quantity = 44
  ) THEN
    RAISE EXCEPTION 'resolving the last 6 pieces did not reconcile the product lot after picking';
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
    OR (SELECT count(*) FROM public.product_lot_freezing_decisions) <> 0 THEN
    RAISE EXCEPTION 'non-admin user read administrative storage-condition records';
  END IF;
END;
$test$;

RESET ROLE;

ROLLBACK;
