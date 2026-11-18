BEGIN;

SELECT set_config('test.initial_cheese_movement_count', (
  SELECT count(*)::text FROM public.inventory_movements WHERE reference_type = 'cheese_preparation'
), true);
SELECT set_config('test.admin_id', gen_random_uuid()::text, true);
SELECT set_config('test.source_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.party_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.traditional_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.trim_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.grated_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.location_id', gen_random_uuid()::text, true);
SELECT set_config('test.source_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.expired_source_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.cut_key', gen_random_uuid()::text, true);
SELECT set_config('test.grate_key', gen_random_uuid()::text, true);
SELECT set_config('test.rounding_source_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.rounding_cut_key', gen_random_uuid()::text, true);
SELECT set_config('test.tiny_source_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.tiny_source_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.tiny_cut_key', gen_random_uuid()::text, true);

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

-- Keep this fixture isolated when run against a catalog that already has the
-- canonical prepared-material codes.
UPDATE public.raw_materials
SET internal_code = 'CHEESE-TEST-EXISTING-' || id::text
WHERE internal_code IN (
  'MP-QSO-CHED-FUER',
  'MP-PAL-QUESO-PARTY', 'MP-PAL-QUESO-TRAD',
  'MP-QSO-RECORTE', 'MP-QSO-RALLADO'
);

INSERT INTO public.raw_materials (id, slug, name, internal_code, unit_of_measure_id, current_stock, average_cost, last_cost)
VALUES
  (current_setting('test.source_material_id')::uuid, 'cheese-source-' || left(current_setting('test.admin_id'), 8), 'Queso de prueba con nombre distinto', 'MP-QSO-CHED-FUER', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0.907, 20, 20),
  (current_setting('test.party_material_id')::uuid, 'cheese-party-' || left(current_setting('test.admin_id'), 8), 'Palitos Party de prueba', 'MP-PAL-QUESO-PARTY', (SELECT id FROM public.units_of_measure WHERE code = 'pza'), 0, 0, 0),
  (current_setting('test.traditional_material_id')::uuid, 'cheese-trad-' || left(current_setting('test.admin_id'), 8), 'Palitos tradicionales de prueba', 'MP-PAL-QUESO-TRAD', (SELECT id FROM public.units_of_measure WHERE code = 'pza'), 0, 0, 0),
  (current_setting('test.trim_material_id')::uuid, 'cheese-trim-' || left(current_setting('test.admin_id'), 8), 'Recorte de queso de prueba', 'MP-QSO-RECORTE', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0, 0, 0),
  (current_setting('test.grated_material_id')::uuid, 'cheese-grated-' || left(current_setting('test.admin_id'), 8), 'Queso rallado de prueba', 'MP-QSO-RALLADO', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0, 0, 0),
  (current_setting('test.tiny_source_material_id')::uuid, 'cheese-tiny-source-' || left(current_setting('test.admin_id'), 8), 'Queso mínimo de prueba', 'CHEESE-TINY-TEST', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0.0003, 20, 20);
INSERT INTO public.inventory_locations (id, slug, name)
VALUES (current_setting('test.location_id')::uuid, 'cheese-prep-' || left(current_setting('test.admin_id'), 8), 'Cheese preparation test location');
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.source_lot_id')::uuid, current_setting('test.source_material_id')::uuid,
  'CHEESE-SOURCE-' || left(current_setting('test.admin_id'), 8), 0.907, 20, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, expiration_date, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.expired_source_lot_id')::uuid, current_setting('test.source_material_id')::uuid,
  'CHEESE-EXPIRED-SOURCE-' || left(current_setting('test.admin_id'), 8), current_date - 1,
  0.1000, 20, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes)
VALUES ('raw_material', current_setting('test.source_material_id')::uuid, 'entry', 0.907, 0, 0.907,
  'cheese_preparation_test_seed', current_setting('test.source_lot_id')::uuid, 'Test-only opening balance');
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.tiny_source_lot_id')::uuid, current_setting('test.tiny_source_material_id')::uuid,
  'CHEESE-TINY-' || left(current_setting('test.admin_id'), 8), 0.0003, 20, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes)
VALUES ('raw_material', current_setting('test.tiny_source_material_id')::uuid, 'entry', 0.0003, 0, 0.0003,
  'cheese_preparation_test_seed', current_setting('test.tiny_source_lot_id')::uuid, 'Smallest supported weight balance');

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
DO $test$
DECLARE
  v_source_stock numeric(14,4);
  v_party_stock numeric(14,4);
  v_traditional_stock numeric(14,4);
  v_trim_stock numeric(14,4);
  v_cheese_movement_count bigint;
  v_operation_count bigint;
  v_lot_count bigint;
  v_movement_count bigint;
BEGIN
  SELECT current_stock INTO v_source_stock FROM public.raw_materials WHERE id = current_setting('test.source_material_id')::uuid;
  SELECT current_stock INTO v_party_stock FROM public.raw_materials WHERE id = current_setting('test.party_material_id')::uuid;
  SELECT current_stock INTO v_traditional_stock FROM public.raw_materials WHERE id = current_setting('test.traditional_material_id')::uuid;
  SELECT current_stock INTO v_trim_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid;
  SELECT count(*) INTO v_cheese_movement_count FROM public.inventory_movements WHERE reference_type = 'cheese_preparation';
  SELECT count(*) INTO v_operation_count FROM public.cheese_preparation_operations;
  SELECT count(*) INTO v_lot_count FROM public.raw_material_lots;
  SELECT count(*) INTO v_movement_count FROM public.inventory_movements;
  BEGIN
    PERFORM public.record_cheese_cut(
      current_setting('test.source_lot_id')::uuid, 'party',
      current_setting('test.traditional_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
      0.907, 65, 0.650, 0.245, 0.012, gen_random_uuid(), 'Debe rechazar Party acreditado como tradicional'
    );
    RAISE EXCEPTION 'Party presentation accepted the traditional stick material.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.record_cheese_cut(
      current_setting('test.tiny_source_lot_id')::uuid, 'party',
      current_setting('test.party_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
      0.0003, 1, 0.0002, 0.0001, 0, gen_random_uuid(), 'Debe rechazar materia prima kg que no es queso'
    );
    RAISE EXCEPTION 'Cheese cut accepted a kg raw material that is not the authorized cheese.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.record_cheese_cut(
      current_setting('test.source_lot_id')::uuid, 'traditional',
      current_setting('test.party_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
      0.907, 65, 0.650, 0.245, 0.012, gen_random_uuid(), 'Debe rechazar tradicional acreditado como Party'
    );
    RAISE EXCEPTION 'Traditional presentation accepted the Party stick material.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.record_cheese_cut(
      current_setting('test.source_lot_id')::uuid, 'party',
      current_setting('test.party_material_id')::uuid, current_setting('test.grated_material_id')::uuid,
      0.907, 65, 0.650, 0.245, 0.012, gen_random_uuid(), 'Debe rechazar queso rallado como recorte'
    );
    RAISE EXCEPTION 'Cheese cut accepted a non-trim material as the trim output.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.record_cheese_cut(
      current_setting('test.expired_source_lot_id')::uuid, 'party',
      current_setting('test.party_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
      0.1000, 10, 0.0700, 0.0200, 0.0100, gen_random_uuid(), 'Debe rechazar lote de queso vencido'
    );
    RAISE EXCEPTION 'Cheese cut accepted an expired source lot.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.cheese_preparation_operations WHERE source_lot_id = current_setting('test.source_lot_id')::uuid)
     OR EXISTS (SELECT 1 FROM public.cheese_preparation_operations WHERE source_lot_id = current_setting('test.expired_source_lot_id')::uuid)
     OR EXISTS (SELECT 1 FROM public.cheese_preparation_operations WHERE source_lot_id = current_setting('test.tiny_source_lot_id')::uuid)
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation') IS DISTINCT FROM v_cheese_movement_count
     OR (SELECT count(*) FROM public.cheese_preparation_operations) IS DISTINCT FROM v_operation_count
     OR (SELECT count(*) FROM public.raw_material_lots) IS DISTINCT FROM v_lot_count
     OR (SELECT count(*) FROM public.inventory_movements) IS DISTINCT FROM v_movement_count
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.source_material_id')::uuid) IS DISTINCT FROM v_source_stock
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.tiny_source_material_id')::uuid) IS DISTINCT FROM 0.0003
     OR (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.tiny_source_lot_id')::uuid) IS DISTINCT FROM 0.0003
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.party_material_id')::uuid) IS DISTINCT FROM v_party_stock
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.traditional_material_id')::uuid) IS DISTINCT FROM v_traditional_stock
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) IS DISTINCT FROM v_trim_stock
     OR (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.expired_source_lot_id')::uuid) <> 0.1000
     OR (SELECT status FROM public.raw_material_lots WHERE id = current_setting('test.expired_source_lot_id')::uuid) <> 'available' THEN
    RAISE EXCEPTION 'Rejected presentation crossings wrote partial operations or movements.';
  END IF;
END;
$test$;
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
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = current_setting('test.source_lot_id')::uuid) <> 0
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
DO $test$
DECLARE
  v_operation_count bigint;
  v_movement_count bigint;
  v_trim_stock numeric(14,4);
  v_target_stock numeric(14,4);
BEGIN
  SELECT count(*) INTO v_operation_count FROM public.cheese_preparation_operations;
  SELECT count(*) INTO v_movement_count FROM public.inventory_movements WHERE reference_type = 'cheese_preparation';
  SELECT current_stock INTO v_trim_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid;
  SELECT current_stock INTO v_target_stock FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid;
  BEGIN
    PERFORM public.record_cheese_grating(
      current_setting('test.trim_lot_id')::uuid,
      current_setting('test.source_material_id')::uuid,
      0.245, 0.237, 0.008, gen_random_uuid(),
      'Debe rechazar queso de entrada como salida de rallado'
    );
    RAISE EXCEPTION 'Cheese grating accepted a non-grated material.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.cheese_preparation_operations) <> v_operation_count
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation') <> v_movement_count
     OR (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.trim_lot_id')::uuid) <> 0.245
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> v_trim_stock
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid) <> v_target_stock THEN
    RAISE EXCEPTION 'Rejected grated-material identity wrote partial operations or changed balances.';
  END IF;

  UPDATE public.raw_material_lots SET expiration_date = current_date - 1
  WHERE id = current_setting('test.trim_lot_id')::uuid;
  BEGIN
    PERFORM public.record_cheese_grating(
      current_setting('test.trim_lot_id')::uuid,
      current_setting('test.grated_material_id')::uuid,
      0.245, 0.237, 0.008, gen_random_uuid(),
      'Debe rechazar recorte vencido'
    );
    RAISE EXCEPTION 'Cheese grating accepted an expired trim lot.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.cheese_preparation_operations) <> v_operation_count
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation') <> v_movement_count
     OR (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.trim_lot_id')::uuid) <> 0.245
     OR (SELECT status FROM public.raw_material_lots WHERE id = current_setting('test.trim_lot_id')::uuid) <> 'available'
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> v_trim_stock
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid) <> v_target_stock THEN
    RAISE EXCEPTION 'Rejected expired grating wrote partial operations or changed balances.';
  END IF;
  UPDATE public.raw_material_lots SET expiration_date = current_date + 30
  WHERE id = current_setting('test.trim_lot_id')::uuid;
END;
$test$;
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
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = current_setting('test.trim_lot_id')::uuid) <> 0
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> 0
     OR (SELECT current_stock * average_cost FROM public.raw_materials WHERE id = current_setting('test.trim_material_id')::uuid) <> 0
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation' AND reference_id = v_grate.id) <> 2
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid) <> 0.237
     OR (SELECT average_cost FROM public.raw_materials WHERE id = current_setting('test.grated_material_id')::uuid) <> 20.0000
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = v_grate.output_lot_id) <> v_grate.output_cost THEN
    RAISE EXCEPTION 'Trim was not fully consumed or grating retry duplicated a movement.';
  END IF;
  v_total_final_cost := v_cut.output_cost + v_grate.output_cost + v_cut.waste_cost + v_grate.waste_cost;
  IF v_total_final_cost <> v_cut.source_cost OR v_cut.source_cost <> 18.1400 THEN
    RAISE EXCEPTION 'Final cost of sticks, grated cheese, and separate waste does not equal the original cheese lot cost.';
  END IF;
  IF (SELECT count(*) FROM public.cheese_preparation_operations WHERE idempotency_key IN
      (current_setting('test.cut_key')::uuid, current_setting('test.grate_key')::uuid)) <> 2
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation')
       <> current_setting('test.initial_cheese_movement_count')::bigint + 5 THEN
    RAISE EXCEPTION 'Retry duplicated cheese preparation costs or inventory movements.';
  END IF;
END;
$test$;

-- PostgreSQL accepts the same smallest weight increment as the form: 0.0001 kg.
SET LOCAL ROLE authenticated;
SELECT set_config('test.tiny_cut_id', public.record_cheese_cut(
  current_setting('test.tiny_source_lot_id')::uuid, 'party',
  current_setting('test.party_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
  0.0003, 1, 0.0001, 0.0001, 0.0001,
  current_setting('test.tiny_cut_key')::uuid,
  'Peso mínimo de 0.0001 kg por partida'
)::text, true);
RESET ROLE;
DO $test$
DECLARE
  v_cut public.cheese_preparation_operations%ROWTYPE;
BEGIN
  SELECT * INTO v_cut FROM public.cheese_preparation_operations WHERE id = current_setting('test.tiny_cut_id')::uuid;
  IF v_cut.source_quantity <> 0.0003 OR v_cut.output_weight_kg <> 0.0001
     OR v_cut.secondary_quantity <> 0.0001 OR v_cut.waste_quantity <> 0.0001
     OR v_cut.unexplained_quantity <> 0 THEN
    RAISE EXCEPTION 'The SQL RPC rejected or changed a valid 0.0001 kg increment.';
  END IF;
END;
$test$;

-- At $129.03/kg, individually rounded cut partitions exceed the rounded input by $0.0001.
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.rounding_source_lot_id')::uuid, current_setting('test.source_material_id')::uuid,
  'CHEESE-ROUNDING-' || left(current_setting('test.admin_id'), 8), 0.907, 129.03, 'available', current_setting('test.location_id')::uuid);
UPDATE public.raw_materials SET current_stock = 0.907, average_cost = 129.03, last_cost = 129.03
WHERE id = current_setting('test.source_material_id')::uuid;
INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes)
VALUES ('raw_material', current_setting('test.source_material_id')::uuid, 'entry', 0.907, 0, 0.907,
  'cheese_preparation_test_seed', current_setting('test.rounding_source_lot_id')::uuid, 'Rounding allocation test balance');
SET LOCAL ROLE authenticated;
SELECT set_config('test.rounding_cut_id', public.record_cheese_cut(
  current_setting('test.rounding_source_lot_id')::uuid, 'party',
  current_setting('test.party_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
  0.907, 65, 0.650, 0.245, 0.012,
  current_setting('test.rounding_cut_key')::uuid,
  'Rounding residual allocation at 129.03 MXN/kg'
)::text, true);
SELECT set_config('test.rounding_retry_id', public.record_cheese_cut(
  current_setting('test.rounding_source_lot_id')::uuid, 'party',
  current_setting('test.party_material_id')::uuid, current_setting('test.trim_material_id')::uuid,
  0.907, 65, 0.650, 0.245, 0.012,
  current_setting('test.rounding_cut_key')::uuid,
  'Rounding residual allocation at 129.03 MXN/kg'
)::text, true);
RESET ROLE;

DO $test$
DECLARE
  v_cut public.cheese_preparation_operations%ROWTYPE;
BEGIN
  SELECT * INTO v_cut FROM public.cheese_preparation_operations WHERE id = current_setting('test.rounding_cut_id')::uuid;
  IF current_setting('test.rounding_retry_id')::uuid <> v_cut.id
     OR v_cut.source_cost <> 117.0302 OR v_cut.output_cost <> 83.8694
     OR v_cut.secondary_cost <> 31.6124 OR v_cut.waste_cost <> 1.5484
     OR v_cut.unexplained_cost <> 0
     OR v_cut.source_cost <> v_cut.output_cost + v_cut.secondary_cost + v_cut.waste_cost + v_cut.unexplained_cost
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type = 'cheese_preparation' AND reference_id = v_cut.id) <> 3
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = v_cut.output_lot_id) <> v_cut.output_cost THEN
    RAISE EXCEPTION 'Rounded cut operation cost, inventory value, or retry movements did not reconcile.';
  END IF;
END;
$test$;

ROLLBACK;
