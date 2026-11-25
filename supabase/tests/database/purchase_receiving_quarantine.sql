BEGIN;

INSERT INTO auth.users(
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
)
VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'receiving-admin@example.test',
  now(),
  now()
),
(
  'f1000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'receiving-user@example.test',
  now(),
  now()
);

INSERT INTO public.profiles(
  id,
  full_name,
  email,
  role
)
VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'Receiving Admin',
  'receiving-admin@example.test',
  'admin'
),
(
  'f1000000-0000-0000-0000-000000000002',
  'Receiving User',
  'receiving-user@example.test',
  'client'
);

INSERT INTO public.user_roles(
  user_id,
  role
)
VALUES (
  'f1000000-0000-0000-0000-000000000001',
  'admin'
);

INSERT INTO public.suppliers(
  id,
  name,
  is_active
)
VALUES (
  'f2000000-0000-0000-0000-000000000001',
  'Receiving Supplier',
  true
);

INSERT INTO public.raw_materials(
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
  'f3000000-0000-0000-0000-000000000001',
  'receiving-material',
  'REC-M1',
  'Receiving Material',
  0,
  0,
  0,
  true
);

INSERT INTO public.raw_materials(
  id, slug, internal_code, name, current_stock, average_cost, last_cost, is_active
)
VALUES (
  'f3000000-0000-0000-0000-000000000002',
  'receiving-unconfigured-material',
  'REC-M2',
  'Unconfigured Receiving Material',
  0, 0, 0, true
);

INSERT INTO public.inventory_locations(
  id,
  slug,
  name,
  location_use,
  storage_condition,
  is_active
)
VALUES (
  'f4000000-0000-0000-0000-000000000001',
  'receiving-quarantine',
  'Receiving Quarantine',
  'raw_material',
  'refrigerated',
  true
);

INSERT INTO public.inventory_locations(id, slug, name, location_use, storage_condition, is_active)
VALUES (
  'f4000000-0000-0000-0000-000000000002',
  'receiving-incompatible',
  'Receiving Incompatible Location',
  'prepared_ingredient',
  'refrigerated',
  true
);

UPDATE public.raw_materials
SET required_storage_condition = 'refrigerated',
    default_storage_use = 'raw_material',
    default_inventory_location_id = 'f4000000-0000-0000-0000-000000000001'
WHERE id = 'f3000000-0000-0000-0000-000000000001';

INSERT INTO public.purchase_orders(
  id,
  order_number,
  supplier_id,
  status,
  subtotal,
  total
)
VALUES (
  'f5000000-0000-0000-0000-000000000001',
  'PO-RECEIVING-001',
  'f2000000-0000-0000-0000-000000000001',
  'released',
  125,
  125
);

INSERT INTO public.purchase_orders(
  id, order_number, supplier_id, status, subtotal, total
)
VALUES (
  'f5000000-0000-0000-0000-000000000002',
  'PO-RECEIVING-UNCONFIGURED',
  'f2000000-0000-0000-0000-000000000001',
  'released', 5, 5
);

INSERT INTO public.purchase_order_items(
  id,
  purchase_order_id,
  raw_material_id,
  quantity,
  unit_cost,
  total,
  received_quantity
)
VALUES (
  'f6000000-0000-0000-0000-000000000001',
  'f5000000-0000-0000-0000-000000000001',
  'f3000000-0000-0000-0000-000000000001',
  10,
  12.5,
  125,
  0
);

INSERT INTO public.purchase_order_items(
  id, purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity
)
VALUES (
  'f6000000-0000-0000-0000-000000000002',
  'f5000000-0000-0000-0000-000000000002',
  'f3000000-0000-0000-0000-000000000002',
  1, 5, 5, 0
);

-- Un usuario sin privilegios no puede recibir material.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-0000-0000-000000000002',
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.receive_purchase_order_lot(
      'f6000000-0000-0000-0000-000000000001',
      4,
      'SUP-LOT-001',
      '2099-01-31',
      'f4000000-0000-0000-0000-000000000001',
      'f7000000-0000-0000-0000-000000000099'
    );

    RAISE EXCEPTION
      'normal user unexpectedly received material';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

-- El administrador registra una recepción parcial.
RESET ROLE;
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-0000-0000-000000000001',
  true
);

-- A caller cannot select an incompatible destination or receive an unconfigured material.
DO $test$
BEGIN
  BEGIN
    PERFORM public.receive_purchase_order_lot(
      'f6000000-0000-0000-0000-000000000001', 1, 'BAD-LOCATION', '2099-01-31',
      'f4000000-0000-0000-0000-000000000002', 'f7000000-0000-0000-0000-000000000020'
    );
    RAISE EXCEPTION 'incompatible destination was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    PERFORM public.receive_purchase_order_lot(
      'f6000000-0000-0000-0000-000000000002', 1, 'NO-POLICY', '2099-01-31',
      'f4000000-0000-0000-0000-000000000001', 'f7000000-0000-0000-0000-000000000021'
    );
    RAISE EXCEPTION 'unconfigured material was received';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$test$;

DO $test$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.purchase_receipts
    WHERE idempotency_key IN (
      'f7000000-0000-0000-0000-000000000020',
      'f7000000-0000-0000-0000-000000000021'
    )
  ) OR EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE lot_number IN ('BAD-LOCATION', 'NO-POLICY')
  ) OR EXISTS (
    SELECT 1 FROM public.purchase_receipt_items AS receipt_item
    JOIN public.raw_material_lots AS lot
      ON lot.id = receipt_item.raw_material_lot_id
    WHERE lot.lot_number IN ('BAD-LOCATION', 'NO-POLICY')
  ) OR EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE id = 'f6000000-0000-0000-0000-000000000002'
      AND received_quantity <> 0
  ) OR EXISTS (
    SELECT 1 FROM public.raw_materials
    WHERE id = 'f3000000-0000-0000-0000-000000000002'
      AND current_stock <> 0
  ) THEN
    RAISE EXCEPTION 'rejected receipt changed receipt, lot, item or stock records';
  END IF;
END;
$test$;

SELECT public.receive_purchase_order_lot(
  'f6000000-0000-0000-0000-000000000001',
  4,
  'SUP-LOT-001',
  '2099-01-31',
  'f4000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000001'
);

-- Repetir exactamente la operación no duplica registros.
SELECT public.receive_purchase_order_lot(
  'f6000000-0000-0000-0000-000000000001',
  4,
  'SUP-LOT-001',
  '2099-01-31',
  'f4000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000001'
);

-- Las funciones heredadas ya no pueden saltarse la cuarentena.
DO $test$
BEGIN
  BEGIN
    PERFORM public.receive_purchase_order_item(
      'f6000000-0000-0000-0000-000000000001',
      1
    );

    RAISE EXCEPTION
      'legacy receiving function remained executable';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

DO $test$
BEGIN
  IF (
    SELECT count(*)
    FROM public.purchase_receipts
    WHERE purchase_order_id =
      'f5000000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'partial receipt was not idempotent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.purchase_receipt_items
    WHERE purchase_order_item_id =
      'f6000000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'partial receipt item was duplicated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.purchase_order_items
    WHERE id =
      'f6000000-0000-0000-0000-000000000001'
      AND received_quantity = 4
  ) THEN
    RAISE EXCEPTION
      'partial received quantity is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.purchase_orders
    WHERE id =
      'f5000000-0000-0000-0000-000000000001'
      AND status = 'partially_received'
  ) THEN
    RAISE EXCEPTION
      'purchase order was not partially received';
  END IF;

  IF (
    SELECT count(*)
    FROM public.purchase_receipts AS receipt
    JOIN public.purchase_receipt_items AS receipt_item
      ON receipt_item.purchase_receipt_id = receipt.id
    JOIN public.raw_material_lots AS lot
      ON lot.id = receipt_item.raw_material_lot_id
    WHERE receipt.idempotency_key =
        'f7000000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION
      'receipt must be associated with exactly one raw material lot';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.purchase_receipts AS receipt
    JOIN public.purchase_receipt_items AS receipt_item
      ON receipt_item.purchase_receipt_id = receipt.id
    JOIN public.raw_material_lots AS lot
      ON lot.id = receipt_item.raw_material_lot_id
    WHERE receipt.idempotency_key =
        'f7000000-0000-0000-0000-000000000001'
      AND receipt_item.purchase_order_item_id =
        'f6000000-0000-0000-0000-000000000001'
      AND receipt_item.quantity = 4
      AND receipt_item.inventory_location_id =
        'f4000000-0000-0000-0000-000000000001'
      AND lot.raw_material_id =
        'f3000000-0000-0000-0000-000000000001'
      AND lot.lot_number = 'SUP-LOT-001'
      AND lot.inventory_location_id =
        'f4000000-0000-0000-0000-000000000001'
      AND lot.quantity = 4
      AND lot.storage_condition = 'refrigerated'
      AND lot.status = 'quarantine'
  ) THEN
    RAISE EXCEPTION
      'receipt lot has incorrect material, number, location, quantity or status';
  END IF;

  IF (
    SELECT current_stock
    FROM public.raw_materials
    WHERE id =
      'f3000000-0000-0000-0000-000000000001'
  ) <> 0 THEN
    RAISE EXCEPTION
      'quarantined material became available';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE reference_type = 'purchase_order'
      AND reference_id =
        'f5000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'quarantine created an available movement';
  END IF;
END;
$test$;

-- Un lote en cuarentena no puede consumirse por UUID.
DO $test$
DECLARE
  quarantined_lot_id uuid;
  original_quantity numeric;
BEGIN
  SELECT id, quantity
  INTO
    quarantined_lot_id,
    original_quantity
  FROM public.raw_material_lots
  WHERE raw_material_id =
      'f3000000-0000-0000-0000-000000000001'
    AND lot_number = 'SUP-LOT-001'
    AND status = 'quarantine';

  IF quarantined_lot_id IS NULL THEN
    RAISE EXCEPTION
      'quarantined lot was not found';
  END IF;

  BEGIN
    UPDATE public.raw_material_lots
    SET quantity = original_quantity - 1
    WHERE id = quarantined_lot_id;

    RAISE EXCEPTION
      'quarantined lot quantity was mutable';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  IF (
    SELECT quantity
    FROM public.raw_material_lots
    WHERE id = quarantined_lot_id
  ) IS DISTINCT FROM original_quantity THEN
    RAISE EXCEPTION
      'quarantined lot quantity changed';
  END IF;
END;
$test$;

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  'f1000000-0000-0000-0000-000000000001',
  true
);

-- Una llave no puede reutilizarse con datos diferentes.
DO $test$
BEGIN
  BEGIN
    PERFORM public.receive_purchase_order_lot(
      'f6000000-0000-0000-0000-000000000001',
      3,
      'SUP-LOT-001',
      '2099-01-31',
      'f4000000-0000-0000-0000-000000000001',
      'f7000000-0000-0000-0000-000000000001'
    );

    RAISE EXCEPTION
      'idempotency key accepted different data';
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;
END;
$test$;

-- No se puede recibir más que el saldo pendiente.
DO $test$
BEGIN
  BEGIN
    PERFORM public.receive_purchase_order_lot(
      'f6000000-0000-0000-0000-000000000001',
      7,
      'SUP-LOT-002',
      '2099-02-28',
      'f4000000-0000-0000-0000-000000000001',
      'f7000000-0000-0000-0000-000000000002'
    );

    RAISE EXCEPTION
      'receipt exceeded pending quantity';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END;
$test$;

-- Segunda recepción completa el saldo.
SELECT public.receive_purchase_order_lot(
  'f6000000-0000-0000-0000-000000000001',
  6,
  'SUP-LOT-002',
  '2099-02-28',
  'f4000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000003'
);

RESET ROLE;

DO $test$
BEGIN
  IF (
    SELECT count(*)
    FROM public.purchase_receipts
    WHERE purchase_order_id =
      'f5000000-0000-0000-0000-000000000001'
  ) <> 2 THEN
    RAISE EXCEPTION
      'final receipt count is inconsistent';
  END IF;

  IF (
    SELECT count(*)
    FROM public.purchase_receipt_items
    WHERE purchase_order_item_id =
      'f6000000-0000-0000-0000-000000000001'
  ) <> 2 THEN
    RAISE EXCEPTION
      'final receipt item count is inconsistent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.purchase_order_items
    WHERE id =
      'f6000000-0000-0000-0000-000000000001'
      AND received_quantity = 10
  ) THEN
    RAISE EXCEPTION
      'purchase item was not completely received';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.purchase_orders
    WHERE id =
      'f5000000-0000-0000-0000-000000000001'
      AND status = 'received'
  ) THEN
    RAISE EXCEPTION
      'purchase order was not completed';
  END IF;

  IF (
    SELECT coalesce(sum(quantity), 0)
    FROM public.raw_material_lots
    WHERE raw_material_id =
      'f3000000-0000-0000-0000-000000000001'
      AND status = 'quarantine'
  ) <> 10 THEN
    RAISE EXCEPTION
      'quarantine physical quantity is inconsistent';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE raw_material_id =
      'f3000000-0000-0000-0000-000000000001'
      AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'a received lot bypassed quarantine';
  END IF;

  IF (
    SELECT current_stock
    FROM public.raw_materials
    WHERE id =
      'f3000000-0000-0000-0000-000000000001'
  ) <> 0 THEN
    RAISE EXCEPTION
      'completed receipt changed available stock';
  END IF;
END;
$test$;

ROLLBACK;
