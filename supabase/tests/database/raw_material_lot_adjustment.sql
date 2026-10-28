BEGIN;

SELECT set_config('test.admin_id', gen_random_uuid()::text, true);
SELECT set_config('test.material_id', gen_random_uuid()::text, true);
SELECT set_config('test.location_id', gen_random_uuid()::text, true);
SELECT set_config('test.selected_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.other_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.unit_id', gen_random_uuid()::text, true);

-- The test owns its actor and explicit role assignment, even on a clean database.
INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
VALUES (current_setting('test.admin_id')::uuid, 'authenticated', 'authenticated',
  'lot-adjustment-' || current_setting('test.admin_id') || '@example.test', now(), now());
INSERT INTO public.user_roles (user_id, role)
VALUES (current_setting('test.admin_id')::uuid, 'admin');

INSERT INTO public.units_of_measure (id, name, code)
VALUES (current_setting('test.unit_id')::uuid, 'Kilogram test', 'kg-' || left(current_setting('test.unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, unit_of_measure_id, current_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'lot-adjustment-' || left(current_setting('test.material_id'), 8), 'Lot adjustment test material', current_setting('test.unit_id')::uuid, 10, 2, 1.5);
INSERT INTO public.inventory_locations (id, slug, name)
VALUES (current_setting('test.location_id')::uuid, 'lot-adjustment-' || left(current_setting('test.location_id'), 8), 'Test location');
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.selected_lot_id')::uuid, current_setting('test.material_id')::uuid, 'LOT-ADJUST-SELECTED', 6, 4, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.other_lot_id')::uuid, current_setting('test.material_id')::uuid, 'LOT-ADJUST-OTHER', 4, 1.5, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, notes)
VALUES ('raw_material', current_setting('test.material_id')::uuid, 'entry', 10, 0, 10, 'manual_test_seed', 'Coherent initial balance for lot adjustment test');

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
SELECT public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 2::numeric, 'Corrección de conteo físico de prueba'::text);
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 12 AND average_cost = 2.3333 AND last_cost = 1.5)
    THEN RAISE EXCEPTION 'aggregate stock or weighted average is incorrect'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 8 AND status = 'available' AND unit_cost = 4 AND inventory_location_id = current_setting('test.location_id')::uuid)
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 4 AND unit_cost = 1.5)
    THEN RAISE EXCEPTION 'selected or unselected lot changed incorrectly'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid AND movement_type = 'entry' AND quantity = 2 AND reference_type = 'manual_adjustment' AND reference_id = current_setting('test.selected_lot_id')::uuid AND notes = 'Corrección de conteo físico de prueba')
    THEN RAISE EXCEPTION 'adjustment movement is missing or inconsistent'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
SELECT public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'exit'::text, 2::numeric, 'Corrección de conteo físico de prueba'::text);
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 10 AND average_cost = 2.3333 AND last_cost = 1.5)
    THEN RAISE EXCEPTION 'decrease changed average cost or aggregate stock incorrectly'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 6 AND status = 'available' AND unit_cost = 4 AND inventory_location_id = current_setting('test.location_id')::uuid)
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 4 AND unit_cost = 1.5)
    THEN RAISE EXCEPTION 'decrease changed the wrong lot or its unit cost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid AND movement_type = 'exit' AND quantity = 2 AND previous_stock = 12 AND new_stock = 10 AND reference_type = 'manual_adjustment' AND reference_id = current_setting('test.selected_lot_id')::uuid AND notes = 'Corrección de conteo físico de prueba')
    THEN RAISE EXCEPTION 'decrease movement is missing or inconsistent'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 0.00001::numeric, 'Under-precision quantity test'::text);
    RAISE EXCEPTION 'A quantity below the four-decimal precision was accepted';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
END;
$test$;
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 10 AND average_cost = 2.3333 AND last_cost = 1.5)
    OR (SELECT count(*) FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid) <> 3
    THEN RAISE EXCEPTION 'under-precision quantity changed the balance, average cost, or movement history'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 6 AND status = 'available' AND unit_cost = 4)
    THEN RAISE EXCEPTION 'under-precision quantity changed the selected lot'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'exit'::text, 7::numeric, 'Excess decrease test'::text);
    RAISE EXCEPTION 'A decrease larger than the selected lot was accepted';
  EXCEPTION WHEN SQLSTATE '23514' THEN
    NULL;
  END;
END;
$test$;
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 10 AND average_cost = 2.3333 AND last_cost = 1.5)
    OR (SELECT count(*) FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid) <> 3
    THEN RAISE EXCEPTION 'excessive decrease changed stock, valuation, or movement history'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 6 AND status = 'available' AND unit_cost = 4)
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 4 AND status = 'available' AND unit_cost = 1.5)
    THEN RAISE EXCEPTION 'excessive decrease changed lot balances'; END IF;
END;
$test$;

CREATE FUNCTION public.test_fail_raw_material_lot_adjustment_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.reference_type = 'manual_adjustment' THEN
    RAISE EXCEPTION 'simulated movement write failure' USING ERRCODE = 'PZ001';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER raw_material_lot_adjustment_test_failure
BEFORE INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.test_fail_raw_material_lot_adjustment_movement();

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 1::numeric, 'Rollback test'::text);
    RAISE EXCEPTION 'The simulated movement failure did not occur';
  EXCEPTION WHEN SQLSTATE 'PZ001' THEN
    NULL;
  END;
END;
$test$;
RESET ROLE;
DROP TRIGGER raw_material_lot_adjustment_test_failure ON public.inventory_movements;
DROP FUNCTION public.test_fail_raw_material_lot_adjustment_movement();

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 10 AND average_cost = 2.3333 AND last_cost = 1.5)
    OR (SELECT count(*) FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid) <> 3
    THEN RAISE EXCEPTION 'a failed movement insert left partial material or movement writes'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 6 AND status = 'available' AND unit_cost = 4)
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 4 AND status = 'available' AND unit_cost = 1.5)
    THEN RAISE EXCEPTION 'a failed movement insert left partial lot writes'; END IF;
END;
$test$;

UPDATE public.raw_material_lots SET status = 'quarantine' WHERE id = current_setting('test.selected_lot_id')::uuid;
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 1::numeric, 'Unavailable lot test'::text);
    RAISE EXCEPTION 'A quarantined lot was adjusted';
  EXCEPTION WHEN SQLSTATE '23514' THEN NULL;
  END;
END;
$test$;
RESET ROLE;
UPDATE public.raw_material_lots SET status = 'available' WHERE id = current_setting('test.selected_lot_id')::uuid;

UPDATE public.raw_material_lots SET status = 'hold' WHERE id = current_setting('test.selected_lot_id')::uuid;
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 1::numeric, 'Unavailable lot test'::text);
    RAISE EXCEPTION 'A held lot was adjusted';
  EXCEPTION WHEN SQLSTATE '23514' THEN NULL;
  END;
END;
$test$;
RESET ROLE;
UPDATE public.raw_material_lots SET status = 'available' WHERE id = current_setting('test.selected_lot_id')::uuid;

UPDATE public.raw_material_lots SET status = 'rejected' WHERE id = current_setting('test.selected_lot_id')::uuid;
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 1::numeric, 'Unavailable lot test'::text);
    RAISE EXCEPTION 'A rejected lot was adjusted';
  EXCEPTION WHEN SQLSTATE '23514' THEN NULL;
  END;
END;
$test$;
RESET ROLE;
UPDATE public.raw_material_lots SET status = 'available' WHERE id = current_setting('test.selected_lot_id')::uuid;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 10 AND average_cost = 2.3333 AND last_cost = 1.5)
    OR (SELECT count(*) FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid) <> 3
    THEN RAISE EXCEPTION 'unavailable lot adjustment changed stock, valuation, or movement history'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 6 AND status = 'available' AND unit_cost = 4)
    THEN RAISE EXCEPTION 'unavailable lot adjustment changed the selected lot'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
SELECT public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'exit'::text, 6::numeric, 'Agotar lote de prueba'::text);
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 4 AND average_cost = 2.3333 AND last_cost = 1.5)
    THEN RAISE EXCEPTION 'exhausting a lot changed aggregate balance or valuation incorrectly'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 0 AND status = 'depleted' AND unit_cost = 4 AND inventory_location_id = current_setting('test.location_id')::uuid)
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 4 AND status = 'available' AND unit_cost = 1.5)
    THEN RAISE EXCEPTION 'exhausting a lot changed the wrong lot or its attributes'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid AND movement_type = 'exit' AND quantity = 6 AND previous_stock = 10 AND new_stock = 4 AND reference_type = 'manual_adjustment' AND reference_id = current_setting('test.selected_lot_id')::uuid AND notes = 'Agotar lote de prueba')
    THEN RAISE EXCEPTION 'lot exhaustion movement is missing or inconsistent'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
SELECT public.adjust_raw_material_lot_quantity(current_setting('test.other_lot_id')::uuid, 'exit'::text, 4::numeric, 'Agotar saldo de prueba'::text);
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 0 AND average_cost = 2.3333 AND last_cost = 1.5)
    THEN RAISE EXCEPTION 'zero aggregate balance did not preserve the last average cost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 0 AND status = 'depleted' AND unit_cost = 1.5 AND inventory_location_id = current_setting('test.location_id')::uuid)
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 0 AND status = 'depleted' AND unit_cost = 4)
    THEN RAISE EXCEPTION 'zero aggregate balance left a lot in an incorrect state'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid AND movement_type = 'exit' AND quantity = 4 AND previous_stock = 4 AND new_stock = 0 AND reference_type = 'manual_adjustment' AND reference_id = current_setting('test.other_lot_id')::uuid AND notes = 'Agotar saldo de prueba')
    THEN RAISE EXCEPTION 'final exhaustion movement is missing or inconsistent'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
SET LOCAL ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.other_lot_id')::uuid, 'entry'::text, 1::numeric, 'Unauthorized test'::text);
    RAISE EXCEPTION 'an unauthorised user was allowed to adjust a lot';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$test$;
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 0 AND average_cost = 2.3333 AND last_cost = 1.5)
    OR (SELECT count(*) FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid) <> 5
    THEN RAISE EXCEPTION 'unauthorized adjustment changed stock, valuation, or movement history'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 0 AND status = 'depleted')
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 0 AND status = 'depleted')
    THEN RAISE EXCEPTION 'unauthorized adjustment changed lot balances'; END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  v_quantity numeric;
BEGIN
  FOREACH v_quantity IN ARRAY ARRAY[0::numeric, -1::numeric, 'NaN'::numeric, 'Infinity'::numeric] LOOP
    BEGIN
      PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, v_quantity, 'Invalid quantity test'::text);
      RAISE EXCEPTION 'Invalid quantity was accepted: %', v_quantity;
    EXCEPTION WHEN SQLSTATE '22023' THEN
      NULL;
    END;
  END LOOP;
  BEGIN
    PERFORM public.adjust_raw_material_lot_quantity(current_setting('test.selected_lot_id')::uuid, 'entry'::text, 1::numeric, '   '::text);
    RAISE EXCEPTION 'A blank adjustment reason was accepted';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
END;
$test$;
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND current_stock = 0 AND average_cost = 2.3333 AND last_cost = 1.5)
    OR (SELECT count(*) FROM public.inventory_movements WHERE item_id = current_setting('test.material_id')::uuid) <> 5
    THEN RAISE EXCEPTION 'invalid adjustment data changed stock, valuation, or movement history'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.selected_lot_id')::uuid AND quantity = 0 AND status = 'depleted')
    OR NOT EXISTS (SELECT 1 FROM public.raw_material_lots WHERE id = current_setting('test.other_lot_id')::uuid AND quantity = 0 AND status = 'depleted')
    THEN RAISE EXCEPTION 'invalid adjustment data changed lot balances'; END IF;
END;
$test$;

ROLLBACK;
