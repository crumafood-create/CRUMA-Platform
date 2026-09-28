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
    'fa100000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'raw-quality-admin@example.test',
    now(),
    now()
  ),
  (
    'fa100000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'raw-quality-user@example.test',
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
    'fa100000-0000-0000-0000-000000000001',
    'Raw Quality Admin',
    'raw-quality-admin@example.test',
    'admin'
  ),
  (
    'fa100000-0000-0000-0000-000000000002',
    'Raw Quality User',
    'raw-quality-user@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  'fa100000-0000-0000-0000-000000000001',
  'admin'
);

INSERT INTO public.suppliers (
  id,
  name,
  is_active
)
VALUES (
  'fa200000-0000-0000-0000-000000000001',
  'Raw Quality Supplier',
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
  'fa300000-0000-0000-0000-000000000001',
  'raw-quality-material',
  'RQM-001',
  'Raw Quality Material',
  10.2500,
  2.0000,
  2.0000,
  true
);

INSERT INTO public.inventory_locations (
  id,
  slug,
  name
)
VALUES (
  'fa400000-0000-0000-0000-000000000001',
  'raw-quality-location',
  'Raw Quality Location'
);

INSERT INTO public.purchase_orders (
  id,
  order_number,
  supplier_id,
  status,
  subtotal,
  total
)
VALUES (
  'fa500000-0000-0000-0000-000000000001',
  'RQM-PO-001',
  'fa200000-0000-0000-0000-000000000001',
  'released',
  32.0000,
  32.0000
);

INSERT INTO public.purchase_order_items (
  id,
  purchase_order_id,
  raw_material_id,
  quantity,
  unit_cost,
  total,
  received_quantity
)
VALUES (
  'fa600000-0000-0000-0000-000000000001',
  'fa500000-0000-0000-0000-000000000001',
  'fa300000-0000-0000-0000-000000000001',
  8.0000,
  4.0000,
  32.0000,
  0
);

-- Receive three physical lots. They must remain quarantined and must not
-- increase available stock before a quality release decision.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fa100000-0000-0000-0000-000000000001',
  true
);

SELECT public.receive_purchase_order_lot(
  'fa600000-0000-0000-0000-000000000001',
  4.5000,
  'RQM-RELEASE',
  '2099-01-31',
  'fa400000-0000-0000-0000-000000000001',
  'fa700000-0000-0000-0000-000000000001'
);

SELECT public.receive_purchase_order_lot(
  'fa600000-0000-0000-0000-000000000001',
  2.2500,
  'RQM-HOLD',
  '2099-02-28',
  'fa400000-0000-0000-0000-000000000001',
  'fa700000-0000-0000-0000-000000000002'
);

SELECT public.receive_purchase_order_lot(
  'fa600000-0000-0000-0000-000000000001',
  1.2500,
  'RQM-REJECT',
  '2099-03-31',
  'fa400000-0000-0000-0000-000000000001',
  'fa700000-0000-0000-0000-000000000003'
);

RESET ROLE;

DO $test$
BEGIN
  IF (
    SELECT current_stock
    FROM public.raw_materials
    WHERE id =
      'fa300000-0000-0000-0000-000000000001'
  ) <> 10.2500 THEN
    RAISE EXCEPTION
      'quarantined receipts changed available stock';
  END IF;

  IF (
    SELECT count(*)
    FROM public.raw_material_lots
    WHERE raw_material_id =
        'fa300000-0000-0000-0000-000000000001'
      AND status = 'quarantine'
  ) <> 3 THEN
    RAISE EXCEPTION
      'received raw material lots were not quarantined';
  END IF;
END;
$test$;

-- A non-admin cannot inspect or dispose raw material lots.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fa100000-0000-0000-0000-000000000002',
  true
);

DO $test$
DECLARE
  v_lot_id uuid;
BEGIN
  SELECT id
  INTO v_lot_id
  FROM public.raw_material_lots
  WHERE lot_number = 'RQM-RELEASE';

  BEGIN
    PERFORM public.record_raw_material_quality_inspection(
      v_lot_id,
      1.5000,
      'Unauthorized inspection',
      '[{"criterion":"Appearance","passed":true}]'::jsonb,
      '[]'::jsonb
    );

    RAISE EXCEPTION
      'normal user recorded a raw material inspection';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

-- Record one passing, one held and one rejected inspection as an admin.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'fa100000-0000-0000-0000-000000000001',
  true
);

SELECT public.record_raw_material_quality_inspection(
  (
    SELECT id
    FROM public.raw_material_lots
    WHERE lot_number = 'RQM-RELEASE'
  ),
  1.5000,
  'Passing raw material inspection',
  '[{"criterion":"Appearance","expected_value":"Conforming","actual_value":"Conforming","passed":true}]'::jsonb,
  '[]'::jsonb
);

SELECT public.decide_raw_material_quality_release(
  (
    SELECT inspection.id
    FROM public.quality_inspections AS inspection
    JOIN public.raw_material_lots AS lot
      ON lot.id = inspection.raw_material_lot_id
    WHERE lot.lot_number = 'RQM-RELEASE'
    ORDER BY inspection.inspected_at DESC,
      inspection.id DESC
    LIMIT 1
  ),
  'release',
  NULL
);

SELECT public.record_raw_material_quality_inspection(
  (
    SELECT id
    FROM public.raw_material_lots
    WHERE lot_number = 'RQM-HOLD'
  ),
  0.7500,
  'Held raw material inspection',
  '[{"criterion":"Moisture","expected_value":"Within range","actual_value":"Outside range","passed":false}]'::jsonb,
  '[{"defect_type":"Moisture","severity":"minor","quantity":"0.2500","description":"Requires review"}]'::jsonb
);

SELECT public.decide_raw_material_quality_release(
  (
    SELECT inspection.id
    FROM public.quality_inspections AS inspection
    JOIN public.raw_material_lots AS lot
      ON lot.id = inspection.raw_material_lot_id
    WHERE lot.lot_number = 'RQM-HOLD'
    ORDER BY inspection.inspected_at DESC,
      inspection.id DESC
    LIMIT 1
  ),
  'hold',
  'Pending supplier review'
);

SELECT public.record_raw_material_quality_inspection(
  (
    SELECT id
    FROM public.raw_material_lots
    WHERE lot_number = 'RQM-REJECT'
  ),
  0.5000,
  'Rejected raw material inspection',
  '[{"criterion":"Contamination","expected_value":"None","actual_value":"Detected","passed":false}]'::jsonb,
  '[{"defect_type":"Contamination","severity":"critical","quantity":"0.2500","description":"Unsafe material"}]'::jsonb
);

SELECT public.decide_raw_material_quality_release(
  (
    SELECT inspection.id
    FROM public.quality_inspections AS inspection
    JOIN public.raw_material_lots AS lot
      ON lot.id = inspection.raw_material_lot_id
    WHERE lot.lot_number = 'RQM-REJECT'
    ORDER BY inspection.inspected_at DESC,
      inspection.id DESC
    LIMIT 1
  ),
  'reject',
  'Critical contamination'
);

-- A final disposition cannot be applied twice and therefore cannot duplicate
-- stock or inventory movements.
DO $test$
DECLARE
  v_inspection_id uuid;
BEGIN
  SELECT inspection.id
  INTO v_inspection_id
  FROM public.quality_inspections AS inspection
  JOIN public.raw_material_lots AS lot
    ON lot.id = inspection.raw_material_lot_id
  WHERE lot.lot_number = 'RQM-RELEASE'
  ORDER BY inspection.inspected_at DESC,
    inspection.id DESC
  LIMIT 1;

  BEGIN
    PERFORM public.decide_raw_material_quality_release(
      v_inspection_id,
      'release',
      NULL
    );

    RAISE EXCEPTION
      'raw material lot was released twice';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_materials
    WHERE id =
        'fa300000-0000-0000-0000-000000000001'
      AND current_stock = 14.7500
      AND average_cost = 2.6102
      AND last_cost = 4.0000
  ) THEN
    RAISE EXCEPTION
      'released lot did not update stock and weighted cost';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE lot_number = 'RQM-RELEASE'
      AND quantity = 4.5000
      AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'passing raw material lot was not released';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE lot_number = 'RQM-HOLD'
      AND quantity = 2.2500
      AND status = 'hold'
  ) THEN
    RAISE EXCEPTION
      'held raw material lot has an invalid disposition';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE lot_number = 'RQM-REJECT'
      AND quantity = 1.2500
      AND status = 'rejected'
  ) THEN
    RAISE EXCEPTION
      'rejected raw material lot has an invalid disposition';
  END IF;

  IF (
    SELECT count(*)
    FROM public.quality_inspections
    WHERE subject_type = 'raw_material_lot'
      AND raw_material_lot_id IN (
        SELECT id
        FROM public.raw_material_lots
        WHERE raw_material_id =
          'fa300000-0000-0000-0000-000000000001'
      )
      AND production_order_id IS NULL
      AND production_output_id IS NULL
      AND purchase_receipt_item_id IS NOT NULL
  ) <> 3 THEN
    RAISE EXCEPTION
      'raw material inspection audit trail is incomplete';
  END IF;

  IF (
    SELECT count(*)
    FROM public.quality_release_decisions
    WHERE subject_type = 'raw_material_lot'
      AND raw_material_lot_id IN (
        SELECT id
        FROM public.raw_material_lots
        WHERE raw_material_id =
          'fa300000-0000-0000-0000-000000000001'
      )
      AND production_order_id IS NULL
      AND production_output_id IS NULL
      AND purchase_receipt_item_id IS NOT NULL
  ) <> 3 THEN
    RAISE EXCEPTION
      'raw material disposition audit trail is incomplete';
  END IF;

  IF (
    SELECT count(*)
    FROM public.inventory_movements
    WHERE item_type = 'raw_material'
      AND item_id =
        'fa300000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'quality disposition created an invalid movement count';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE item_type = 'raw_material'
      AND item_id =
        'fa300000-0000-0000-0000-000000000001'
      AND movement_type = 'entry'
      AND quantity = 4.5000
      AND previous_stock = 10.2500
      AND new_stock = 14.7500
      AND reference_type =
        'raw_material_quality_release'
  ) THEN
    RAISE EXCEPTION
      'quality release inventory movement is inconsistent';
  END IF;
END;
$test$;

ROLLBACK;
