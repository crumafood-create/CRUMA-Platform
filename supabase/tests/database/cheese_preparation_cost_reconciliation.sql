BEGIN;

SELECT set_config('test.admin_id', gen_random_uuid()::text, true);
SELECT set_config('test.source_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.party_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.traditional_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.trim_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.grated_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.location_id', gen_random_uuid()::text, true);
SELECT set_config('test.source_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.cut_key', gen_random_uuid()::text, true);
SELECT set_config('test.grate_key', gen_random_uuid()::text, true);

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
VALUES (current_setting('test.admin_id')::uuid, 'authenticated', 'authenticated',
  'cheese-preparation-' || current_setting('test.admin_id') || '@example.test', now(), now());
INSERT INTO public.user_roles (user_id, role)
VALUES (current_setting('test.admin_id')::uuid, 'admin');

INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (gen_random_uuid(), 'Kilogram test', 'kg'),
  (gen_random_uuid(), 'Piece test', 'pza')
ON CONFLICT (code) DO UPDATE SET name = excluded.name, is_active = true, deleted_at = null;

INSERT INTO public.raw_materials (id, slug, name, unit_of_measure_id, current_stock, average_cost, last_cost)
VALUES
  (current_setting('test.source_material_id')::uuid, 'cheese-source-' || left(current_setting('test.admin_id'), 8), 'Queso de prueba', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0.907, 20, 20),
  (current_setting('test.party_material_id')::uuid, 'cheese-party-' || left(current_setting('test.admin_id'), 8), 'Palitos Party de prueba', (SELECT id FROM public.units_of_measure WHERE code = 'pza'), 0, 0, 0),
  (current_setting('test.traditional_material_id')::uuid, 'cheese-trad-' || left(current_setting('test.admin_id'), 8), 'Palitos tradicionales de prueba', (SELECT id FROM public.units_of_measure WHERE code = 'pza'), 0, 0, 0),
  (current_setting('test.trim_material_id')::uuid, 'cheese-trim-' || left(current_setting('test.admin_id'), 8), 'Recorte de queso de prueba', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0, 0, 0),
  (current_setting('test.grated_material_id')::uuid, 'cheese-grated-' || left(current_setting('test.admin_id'), 8), 'Queso rallado de prueba', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0, 0, 0);
INSERT INTO public.inventory_locations (id, slug, name)
VALUES (current_setting('test.location_id')::uuid, 'cheese-prep-' || left(current_setting('test.admin_id'), 8), 'Cheese preparation test location');
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.source_lot_id')::uuid, current_setting('test.source_material_id')::uuid,
  'CHEESE-SOURCE-' || left(current_setting('test.admin_id'), 8), 0.907, 20, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes)
VALUES ('raw_material', current_setting('test.source_material_id')::uuid, 'entry', 0.907, 0, 0.907,
  'cheese_preparation_test_seed', current_setting('test.source_lot_id')::uuid, 'Test-only opening balance');

DO $test$
BEGIN
  IF has_table_privilege('anon', 'public.cheese_preparation_operations', 'SELECT')
     OR has_table_privilege('anon', 'public.cheese_preparation_operations', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.cheese_preparation_operations', 'SELECT')
     OR has_table_privilege('authenticated', 'public.cheese_preparation_operations', 'INSERT') THEN
    RAISE EXCEPTION 'Cheese preparation operation table privileges are invalid (anon SELECT %, anon INSERT %, authenticated SELECT %, authenticated INSERT %).',
      has_table_privilege('anon', 'public.cheese_preparation_operations', 'SELECT'),
      has_table_privilege('anon', 'public.cheese_preparation_operations', 'INSERT'),
      has_table_privilege('authenticated', 'public.cheese_preparation_operations', 'SELECT'),
      has_table_privilege('authenticated', 'public.cheese_preparation_operations', 'INSERT');
  END IF;
END;
$test$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;
SELECT set_config('test.cut_id', public.record_cheese_cut(
  current_setting('test.source_lot_id')::uuid,
  'party',
  current_setting('test.party_material_id')::uuid,
  current_setting('test.trim_material_id')::uuid,
  0.907, 65, 0.650, 0.245, 0.012,
  current_setting('test.cut_key')::uuid,
  '907 g: 65 palitos Party, recorte y merma medidos'
)::text, true);
SELECT set_config('test.cut_retry_id', public.record_cheese_cut(
  current_setting('test.source_lot_id')::uuid,
  'party',
  current_setting('test.party_material_id')::uuid,
  current_setting('test.trim_material_id')::uuid,
  0.907, 65, 0.650, 0.245, 0.012,
  current_setting('test.cut_key')::uuid,
  '907 g: 65 palitos Party, recorte y merma medidos'
)::text, true);
RESET ROLE;

DO $test$
DECLARE
  v_cut public.cheese_preparation_operations%ROWTYPE;
BEGIN
  SELECT * INTO v_cut FROM public.cheese_preparation_operations WHERE id = current_setting('test.cut_id')::uuid;
  IF current_setting('test.cut_retry_id')::uuid <> v_cut.id
     OR v_cut.operation_type <> 'cut' OR v_cut.source_quantity <> 0.907
     OR v_cut.stick_presentation <> 'party'
     OR v_cut.output_weight_kg <> 0.650 OR v_cut.piece_count <> 65
     OR v_cut.output_cost <> 13.0000 OR v_cut.secondary_quantity <> 0.245
     OR v_cut.secondary_cost <> 4.9000 OR v_cut.waste_quantity <> 0.012
     OR v_cut.waste_cost <> 0.2400 OR v_cut.unexplained_quantity <> 0
     OR v_cut.unexplained_cost <> 0 THEN
    RAISE EXCEPTION 'Cheese cut quantities or costs did not reconcile.';
  END IF;
  IF (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation' AND reference_id = v_cut.id) <> 3
     OR (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.source_lot_id')::uuid) <> 0
     OR (SELECT status FROM public.raw_material_lots WHERE id = current_setting('test.source_lot_id')::uuid) <> 'depleted'
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.source_material_id')::uuid) <> 0
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.party_material_id')::uuid) <> 65
     OR (SELECT average_cost FROM public.raw_materials WHERE id = current_setting('test.party_material_id')::uuid) <> 0.2000
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> 0.245
     OR (SELECT average_cost FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> 20.0000 THEN
    RAISE EXCEPTION 'Cheese cut balances, output unit cost, or retry movements are incorrect.';
  END IF;
  IF v_cut.source_cost <> v_cut.output_cost + v_cut.secondary_cost + v_cut.waste_cost + v_cut.unexplained_cost THEN
    RAISE EXCEPTION 'Cut cost does not reconcile to its source cost.';
  END IF;
END;
$test$;

SELECT set_config('test.trim_lot_id', (
  SELECT secondary_lot_id::text FROM public.cheese_preparation_operations WHERE id = current_setting('test.cut_id')::uuid
), true);
SELECT set_config('test.grate_id', public.record_cheese_grating(
  current_setting('test.trim_lot_id')::uuid,
  current_setting('test.grated_material_id')::uuid,
  0.245,
  0.237, 0.008, current_setting('test.grate_key')::uuid,
  '245 g de recorte: 237 g rallados y 8 g de merma'
)::text, true);
SELECT set_config('test.grate_retry_id', public.record_cheese_grating(
  current_setting('test.trim_lot_id')::uuid,
  current_setting('test.grated_material_id')::uuid,
  0.245,
  0.237, 0.008, current_setting('test.grate_key')::uuid,
  '245 g de recorte: 237 g rallados y 8 g de merma'
)::text, true);
RESET ROLE;

DO $test$
DECLARE
  v_cut public.cheese_preparation_operations%ROWTYPE;
  v_grate public.cheese_preparation_operations%ROWTYPE;
  v_total_final_cost numeric(18,4);
BEGIN
  SELECT * INTO v_cut FROM public.cheese_preparation_operations WHERE id = current_setting('test.cut_id')::uuid;
  SELECT * INTO v_grate FROM public.cheese_preparation_operations WHERE id = current_setting('test.grate_id')::uuid;
  IF current_setting('test.grate_retry_id')::uuid <> v_grate.id
     OR v_grate.operation_type <> 'grate' OR v_grate.source_quantity <> 0.245
     OR v_grate.output_weight_kg <> 0.237 OR v_grate.output_cost <> 4.7400
     OR v_grate.waste_quantity <> 0.008 OR v_grate.waste_cost <> 0.1600
     OR v_grate.unexplained_quantity <> 0 OR v_grate.unexplained_cost <> 0 THEN
    RAISE EXCEPTION 'Grating quantities or costs did not reconcile.';
  END IF;
  IF (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.trim_lot_id')::uuid) <> 0
     OR (SELECT status FROM public.raw_material_lots WHERE id = current_setting('test.trim_lot_id')::uuid) <> 'depleted'
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> 0
     OR (SELECT current_stock * average_cost FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> 0
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation' AND reference_id = v_grate.id) <> 2
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid) <> 0.237
     OR (SELECT average_cost FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid) <> 20.0000 THEN
    RAISE EXCEPTION 'Trim was not fully consumed or grating retry duplicated a movement.';
  END IF;
  v_total_final_cost := v_cut.output_cost + v_grate.output_cost + v_cut.waste_cost + v_grate.waste_cost;
  IF v_total_final_cost <> v_cut.source_cost OR v_cut.source_cost <> 18.1400 THEN
    RAISE EXCEPTION 'Final cost of sticks, grated cheese, and separate waste does not equal the original cheese lot cost.';
  END IF;
  IF (SELECT count(*) FROM public.cheese_preparation_operations WHERE idempotency_key IN
      (current_setting('test.cut_key')::uuid, current_setting('test.grate_key')::uuid)) <> 2
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation') <> 5 THEN
    RAISE EXCEPTION 'Retry duplicated cheese preparation costs or inventory movements.';
  END IF;
END;
$test$;

ROLLBACK;
