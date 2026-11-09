BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'presentation-admin@example.test', now(), now()),
  ('f1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'presentation-user@example.test', now(), now());

INSERT INTO public.profiles (id, full_name, email, role)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Presentation Admin', 'presentation-admin@example.test', 'admin'),
  ('f1000000-0000-0000-0000-000000000002', 'Presentation User', 'presentation-user@example.test', 'client');

INSERT INTO public.user_roles (user_id, role)
VALUES ('f1000000-0000-0000-0000-000000000001', 'admin');

INSERT INTO public.suppliers (id, name, is_active)
VALUES ('f2000000-0000-0000-0000-000000000001', 'Presentation Supplier', true);

INSERT INTO public.units_of_measure (id, code, name, is_active)
VALUES ('f2500000-0000-0000-0000-000000000001', 'kg-pres-test', 'Kilogram test', true);

INSERT INTO public.raw_materials (
  id, slug, internal_code, name, unit_of_measure_id,
  current_stock, average_cost, last_cost, is_active
)
VALUES
  ('f3000000-0000-0000-0000-000000000001', 'presentation-base', 'PRES-BASE', 'Presentation base material', 'f2500000-0000-0000-0000-000000000001', 0, 0, 0, true),
  ('f3000000-0000-0000-0000-000000000002', 'presentation-package', 'PRES-PACK', 'Presentation package material', 'f2500000-0000-0000-0000-000000000001', 0, 0, 0, true),
  ('f3000000-0000-0000-0000-000000000003', 'presentation-repeating', 'PRES-REPEAT', 'Presentation precision material', 'f2500000-0000-0000-0000-000000000001', 0, 0, 0, true);

INSERT INTO public.inventory_locations (id, slug, name, is_active)
VALUES ('f4000000-0000-0000-0000-000000000001', 'presentation-test-location', 'Presentation Test Location', true);

INSERT INTO public.purchase_orders (
  id, order_number, supplier_id, status, subtotal, total
)
VALUES
  ('f5000000-0000-0000-0000-000000000001', 'PO-PRES-001', 'f2000000-0000-0000-0000-000000000001', 'draft', 0, 0),
  ('f5000000-0000-0000-0000-000000000002', 'PO-PRES-LEGACY', 'f2000000-0000-0000-0000-000000000001', 'draft', 0, 0);

-- A non-admin cannot add or modify presentation terms.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);

DO $test$
BEGIN
  BEGIN
    PERFORM public.add_purchase_order_item_with_presentation(
      'f5000000-0000-0000-0000-000000000001',
      'f3000000-0000-0000-0000-000000000001',
      'base_unit', 2.5, 1, 24.8
    );
    RAISE EXCEPTION 'non-admin unexpectedly added a purchase line';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000001', true);

SELECT public.update_purchase_order_freight(
  'f5000000-0000-0000-0000-000000000001', 11.25
);

SELECT set_config(
  'test.base_item_id',
  public.add_purchase_order_item_with_presentation(
    'f5000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000001',
    'base_unit', 2.5, 1, 24.8
  )::text,
  true
);

SELECT set_config(
  'test.package_item_id',
  public.add_purchase_order_item_with_presentation(
    'f5000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000002',
    'sealed_package', 2, 25, 620
  )::text,
  true
);

SELECT set_config(
  'test.precision_item_id',
  public.add_purchase_order_item_with_presentation(
    'f5000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000003',
    'sealed_package', 3, 0.3333, 10
  )::text,
  true
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.add_purchase_order_item_with_presentation(
      'f5000000-0000-0000-0000-000000000001',
      'f3000000-0000-0000-0000-000000000001',
      'sealed_package', 1, 10, 200
    );
    RAISE EXCEPTION 'a material was unexpectedly added twice to one order';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  IF (
    SELECT count(*) FROM public.purchase_order_items
    WHERE purchase_order_id = 'f5000000-0000-0000-0000-000000000001'
      AND raw_material_id = 'f3000000-0000-0000-0000-000000000001'
  ) <> 1 THEN
    RAISE EXCEPTION 'the order contains more than one line for a material';
  END IF;
END;
$test$;

DO $test$
DECLARE
  base_item public.purchase_order_items%ROWTYPE;
  package_item public.purchase_order_items%ROWTYPE;
  precision_item public.purchase_order_items%ROWTYPE;
BEGIN
  SELECT * INTO base_item FROM public.purchase_order_items
  WHERE id = current_setting('test.base_item_id')::uuid;
  IF base_item.quantity <> 2.5 OR base_item.unit_cost <> 24.8
    OR base_item.total <> 62 OR base_item.purchase_quantity <> 2.5
    OR base_item.purchase_unit_price <> 24.8 THEN
    RAISE EXCEPTION 'base-unit purchase values were not preserved';
  END IF;

  SELECT * INTO package_item FROM public.purchase_order_items
  WHERE id = current_setting('test.package_item_id')::uuid;
  IF package_item.quantity <> 50 OR package_item.unit_cost <> 24.8
    OR package_item.total <> 1240 OR package_item.purchase_quantity <> 2
    OR package_item.base_quantity_per_presentation <> 25
    OR package_item.purchase_unit_price <> 620 THEN
    RAISE EXCEPTION 'sealed package was not converted and priced from its commercial amount';
  END IF;

  SELECT * INTO precision_item FROM public.purchase_order_items
  WHERE id = current_setting('test.precision_item_id')::uuid;
  IF precision_item.quantity <> 0.9999 OR precision_item.unit_cost <> 30.0030
    OR precision_item.total <> 30 OR precision_item.purchase_unit_price <> 10 THEN
    RAISE EXCEPTION 'non-exact conversion rebuilt the amount from rounded unit cost';
  END IF;
END;
$test$;

-- Every write RPC keeps its own database-level administrator check.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);

DO $test$
BEGIN
  BEGIN
    PERFORM public.update_purchase_order_item_presentation(
      current_setting('test.base_item_id')::uuid, 'base_unit', 4, 1, 25
    );
    RAISE EXCEPTION 'non-admin unexpectedly updated a purchase line';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.delete_purchase_order_item(
      current_setting('test.package_item_id')::uuid
    );
    RAISE EXCEPTION 'non-admin unexpectedly deleted a purchase line';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.update_purchase_order_freight(
      'f5000000-0000-0000-0000-000000000001', 99
    );
    RAISE EXCEPTION 'non-admin unexpectedly updated purchase freight';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE id = current_setting('test.base_item_id')::uuid
      AND quantity = 2.5 AND purchase_unit_price = 24.8
  ) OR NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE id = current_setting('test.package_item_id')::uuid
  ) OR NOT EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = 'f5000000-0000-0000-0000-000000000001'
      AND freight_amount = 11.25
  ) THEN
    RAISE EXCEPTION 'unauthorized RPC changed purchase data';
  END IF;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000001', true);

DO $test$
DECLARE
  changed_rows integer;
BEGIN
  UPDATE public.purchase_order_items
  SET purchase_unit_price = 999
  WHERE id = current_setting('test.base_item_id')::uuid;
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 0 THEN
    RAISE EXCEPTION 'authenticated users unexpectedly updated a purchase item directly';
  END IF;
END;
$test$;

-- Flete remains independent; edits and deletion recalculate products + flete.
SELECT public.update_purchase_order_item_presentation(
  current_setting('test.base_item_id')::uuid, 'base_unit', 3.5, 1, 25
);
SELECT public.delete_purchase_order_item(current_setting('test.precision_item_id')::uuid);

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = 'f5000000-0000-0000-0000-000000000001'
      AND subtotal = 1327.5
      AND freight_amount = 11.25
      AND total = 1338.75
  ) THEN
    RAISE EXCEPTION 'order totals did not preserve freight after line changes';
  END IF;
END;
$test$;

-- A legacy base-unit row keeps its historical total instead of being rebuilt.
RESET ROLE;
INSERT INTO public.purchase_order_items (
  purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity
)
VALUES (
  'f5000000-0000-0000-0000-000000000002',
  'f3000000-0000-0000-0000-000000000003',
  3, 2, 5, 0
);

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE purchase_order_id = 'f5000000-0000-0000-0000-000000000002'
      AND presentation_mode = 'base_unit'
      AND purchase_quantity = 3
      AND base_quantity_per_presentation = 1
      AND purchase_unit_price = 2
      AND total = 5
  ) THEN
    RAISE EXCEPTION 'legacy purchase total or base-unit interpretation changed';
  END IF;
END;
$test$;

-- A partial package receipt must accept complete packages only.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000001', true);
UPDATE public.purchase_orders
SET status = 'released'
WHERE id = 'f5000000-0000-0000-0000-000000000001';

DO $test$
BEGIN
  BEGIN
    PERFORM public.receive_purchase_order_lot(
      current_setting('test.package_item_id')::uuid,
      20,
      'PRES-OPEN-PACKAGE',
      '2099-01-31',
      'f4000000-0000-0000-0000-000000000001',
      'f7000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'an incomplete package was unexpectedly accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END;
$test$;

DO $test$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.purchase_receipts
    WHERE idempotency_key = 'f7000000-0000-0000-0000-000000000001'
  ) OR EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE raw_material_id = 'f3000000-0000-0000-0000-000000000002'
      AND lot_number = 'PRES-OPEN-PACKAGE'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE id = current_setting('test.package_item_id')::uuid
      AND received_quantity = 0
  ) THEN
    RAISE EXCEPTION 'rejected package receipt left partial writes or consumed pending quantity';
  END IF;
END;
$test$;

SELECT public.receive_purchase_order_lot(
  current_setting('test.package_item_id')::uuid,
  25,
  'PRES-SEALED-PACKAGE',
  '2099-01-31',
  'f4000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000002'
);

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE id = current_setting('test.package_item_id')::uuid
      AND received_quantity = 25
  ) OR NOT EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE raw_material_id = 'f3000000-0000-0000-0000-000000000002'
      AND lot_number = 'PRES-SEALED-PACKAGE'
      AND quantity = 25
      AND unit_cost = 24.8
      AND status = 'quarantine'
  ) THEN
    RAISE EXCEPTION 'accepted sealed package was not received in base units and quarantine';
  END IF;
END;
$test$;

ROLLBACK;
