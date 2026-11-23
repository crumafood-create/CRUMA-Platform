BEGIN;

SELECT set_config('test.ham_admin_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_source_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_grated_material_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_location_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_source_location_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_source_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_invalid_lot_id', gen_random_uuid()::text, true);
SELECT set_config('test.ham_grating_key', gen_random_uuid()::text, true);

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
VALUES (current_setting('test.ham_admin_id')::uuid, 'authenticated', 'authenticated',
  'ham-grating-' || current_setting('test.ham_admin_id') || '@example.test', now(), now());
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (current_setting('test.ham_admin_id')::uuid, 'Ham grating test admin',
  'ham-grating-' || current_setting('test.ham_admin_id') || '@example.test', 'admin');
INSERT INTO public.user_roles (user_id, role)
VALUES (current_setting('test.ham_admin_id')::uuid, 'admin');

INSERT INTO public.units_of_measure (id, name, code)
VALUES (gen_random_uuid(), 'Kilogram test', 'kg')
ON CONFLICT (code) DO UPDATE SET name = excluded.name, is_active = true, deleted_at = null;

INSERT INTO public.raw_materials (id, slug, name, internal_code, unit_of_measure_id, current_stock, average_cost, last_cost)
VALUES
  (current_setting('test.ham_source_material_id')::uuid, 'ham-source-' || left(current_setting('test.ham_admin_id'), 8),
   'Jamón de prueba', 'MP-JAMON', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0.5000, 80, 80),
  (current_setting('test.ham_grated_material_id')::uuid, 'ham-grated-' || left(current_setting('test.ham_admin_id'), 8),
   'Jamón rallado de prueba', 'MP-JAM-RALLADO', (SELECT id FROM public.units_of_measure WHERE code = 'kg'), 0, 0, 0);

INSERT INTO public.inventory_locations (id, slug, name, location_use, storage_condition)
VALUES
  (current_setting('test.ham_location_id')::uuid,
   'ham-grating-' || left(current_setting('test.ham_admin_id'), 8), 'Ham prepared-ingredient refrigerator', 'prepared_ingredient', 'refrigerated'),
  (current_setting('test.ham_source_location_id')::uuid,
   'ham-source-' || left(current_setting('test.ham_admin_id'), 8), 'Ham raw-material refrigerator', 'raw_material', 'refrigerated');
UPDATE public.raw_materials
SET required_storage_condition = 'refrigerated',
    default_storage_use = 'raw_material',
    default_inventory_location_id = current_setting('test.ham_source_location_id')::uuid
WHERE id = current_setting('test.ham_source_material_id')::uuid;
UPDATE public.raw_materials
SET required_storage_condition = 'refrigerated',
    default_storage_use = 'prepared_ingredient',
    default_inventory_location_id = current_setting('test.ham_location_id')::uuid
WHERE id = current_setting('test.ham_grated_material_id')::uuid;

INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.ham_source_lot_id')::uuid, current_setting('test.ham_source_material_id')::uuid,
  'HAM-SOURCE-' || left(current_setting('test.ham_admin_id'), 8), 0.5000, 80, 'available',
  current_setting('test.ham_source_location_id')::uuid);
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, remaining_value, status)
VALUES (current_setting('test.ham_invalid_lot_id')::uuid, current_setting('test.ham_source_material_id')::uuid,
  'HAM-NO-PREPARATION-ORIGIN-' || left(current_setting('test.ham_admin_id'), 8), 0.1000, 80, 8, 'quarantine');
INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock,
  reference_type, reference_id, notes)
VALUES ('raw_material', current_setting('test.ham_source_material_id')::uuid, 'entry', 0.5000, 0, 0.5000,
  'ham_grating_test_seed', current_setting('test.ham_source_lot_id')::uuid, 'Isolated test opening balance');

SELECT set_config('request.jwt.claim.sub', current_setting('test.ham_admin_id'), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  v_inspection_count bigint;
BEGIN
  SELECT count(*) INTO v_inspection_count FROM public.quality_inspections;
  BEGIN
    PERFORM public.record_prepared_ingredient_quality_inspection(
      current_setting('test.ham_invalid_lot_id')::uuid,
      0.0100,
      'Invalid origin must not inspect',
      '[{"criterion":"Aptitud","passed":true}]'::jsonb,
      '[]'::jsonb
    );
    RAISE EXCEPTION 'Quality accepted a prepared lot without a preparation origin.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.quality_inspections) <> v_inspection_count
     OR (SELECT status FROM public.raw_material_lots WHERE id = current_setting('test.ham_invalid_lot_id')::uuid) <> 'quarantine'
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = current_setting('test.ham_invalid_lot_id')::uuid) <> 8 THEN
    RAISE EXCEPTION 'Invalid prepared origin changed inspection or inventory state.';
  END IF;
END;
$test$;
SELECT set_config('test.ham_grating_id', public.record_ham_grating(
  current_setting('test.ham_source_lot_id')::uuid,
  current_setting('test.ham_grated_material_id')::uuid,
  0.5000, 0.4800, 0.0200,
  current_setting('test.ham_grating_key')::uuid,
  'Prueba aislada de rallado: 0.4800 kg aprovechables y 0.0200 kg de merma'
)::text, true);
SELECT set_config('test.ham_grating_retry_id', public.record_ham_grating(
  current_setting('test.ham_source_lot_id')::uuid,
  current_setting('test.ham_grated_material_id')::uuid,
  0.5000, 0.4800, 0.0200,
  current_setting('test.ham_grating_key')::uuid,
  'Prueba aislada de rallado: 0.4800 kg aprovechables y 0.0200 kg de merma'
)::text, true);
SELECT set_config('test.ham_pending_lot_status', (
  SELECT output_lot.status FROM public.cheese_preparation_operations AS operation
  JOIN public.raw_material_lots AS output_lot ON output_lot.id = operation.output_lot_id
  WHERE operation.id = current_setting('test.ham_grating_id')::uuid
), true);
SELECT set_config('test.ham_pending_stock', (
  SELECT current_stock::text FROM public.raw_materials
  WHERE id = current_setting('test.ham_grated_material_id')::uuid
), true);
SELECT set_config('test.ham_pending_movement_count', (
  SELECT count(*)::text FROM public.inventory_movements
  WHERE reference_type = 'ingredient_preparation'
    AND reference_id = current_setting('test.ham_grating_id')::uuid
), true);
SELECT set_config('test.ham_inspection_id', public.record_prepared_ingredient_quality_inspection(
  (SELECT output_lot_id FROM public.cheese_preparation_operations WHERE id = current_setting('test.ham_grating_id')::uuid),
  0.0500,
  'Prepared ham grating Quality check',
  '[{"criterion":"Appearance","expected_value":"Suitable","actual_value":"Suitable","passed":true}]'::jsonb,
  '[]'::jsonb
)::text, true);
SELECT set_config('test.ham_release_id', public.release_prepared_ingredient_quality_lot(
  current_setting('test.ham_inspection_id')::uuid,
  'refrigerated',
  current_setting('test.ham_location_id')::uuid,
  current_date + 7,
  'Internal date assigned by Quality'
)::text, true);
SELECT set_config('test.ham_release_retry_id', public.release_prepared_ingredient_quality_lot(
  current_setting('test.ham_inspection_id')::uuid,
  'refrigerated',
  current_setting('test.ham_location_id')::uuid,
  current_date + 7,
  'Internal date assigned by Quality'
)::text, true);
RESET ROLE;

DO $test$
DECLARE
  v_operation public.cheese_preparation_operations%ROWTYPE;
  v_initial_movement_count bigint;
BEGIN
  SELECT * INTO v_operation FROM public.cheese_preparation_operations
  WHERE id = current_setting('test.ham_grating_id')::uuid;
  v_initial_movement_count := current_setting('test.ham_pending_movement_count')::bigint;

  IF current_setting('test.ham_grating_retry_id')::uuid <> v_operation.id
     OR v_operation.operation_type <> 'grate'
     OR v_operation.source_lot_id <> current_setting('test.ham_source_lot_id')::uuid
     OR v_operation.source_material_id <> current_setting('test.ham_source_material_id')::uuid
     OR v_operation.output_material_id <> current_setting('test.ham_grated_material_id')::uuid
     OR v_operation.source_quantity <> 0.5000
     OR v_operation.source_cost <> 40.0000
     OR v_operation.output_weight_kg <> 0.4800
     OR v_operation.output_cost <> 38.4000
     OR v_operation.waste_quantity <> 0.0200
     OR v_operation.waste_cost <> 1.6000
     OR v_operation.unexplained_quantity <> 0
     OR v_operation.unexplained_cost <> 0
     OR current_setting('test.ham_pending_lot_status') <> 'quarantine'
     OR current_setting('test.ham_pending_stock')::numeric <> 0 THEN
    RAISE EXCEPTION 'Ham grating weights and costs did not reconcile or the retry returned a different operation.';
  END IF;

  IF (SELECT quantity FROM public.raw_material_lots WHERE id = current_setting('test.ham_source_lot_id')::uuid) <> 0
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = current_setting('test.ham_source_lot_id')::uuid) <> 0
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.ham_source_material_id')::uuid) <> 0
     OR v_initial_movement_count <> 1
     OR (SELECT count(*) FROM public.cheese_preparation_operations
         WHERE idempotency_key = current_setting('test.ham_grating_key')::uuid) <> 1
     OR (SELECT count(*) FROM public.inventory_movements
         WHERE reference_type = 'ingredient_preparation' AND reference_id = v_operation.id) <> 1 THEN
    RAISE EXCEPTION 'Ham grating retry duplicated a movement or failed to consume the source lot exactly once.';
  END IF;

  IF v_operation.source_cost <> v_operation.output_cost + v_operation.waste_cost + v_operation.unexplained_cost
     OR (SELECT quantity FROM public.raw_material_lots WHERE id = v_operation.output_lot_id) <> 0.4800
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = v_operation.output_lot_id) <> 38.4000
     OR current_setting('test.ham_release_id')::uuid <> current_setting('test.ham_release_retry_id')::uuid
     OR current_setting('test.ham_release_id')::uuid NOT IN (
       SELECT id FROM public.quality_release_decisions WHERE inspection_id = current_setting('test.ham_inspection_id')::uuid
     )
     OR (SELECT status FROM public.raw_material_lots WHERE id = v_operation.output_lot_id) <> 'available'
     OR (SELECT storage_condition FROM public.raw_material_lots WHERE id = v_operation.output_lot_id) <> 'refrigerated'
     OR (SELECT expiration_date FROM public.raw_material_lots WHERE id = v_operation.output_lot_id) <> current_date + 7
     OR (SELECT current_stock FROM public.raw_materials WHERE id = current_setting('test.ham_grated_material_id')::uuid) <> 0.4800
     OR (SELECT average_cost FROM public.raw_materials WHERE id = current_setting('test.ham_grated_material_id')::uuid) <> 80.0000
     OR (SELECT remaining_value FROM public.raw_material_lots WHERE id = v_operation.output_lot_id) <> 38.4000
     OR (SELECT count(*) FROM public.inventory_movements
         WHERE reference_type = 'prepared_ingredient_quality_release' AND reference_id = current_setting('test.ham_release_id')::uuid) <> 1
     OR (SELECT count(*) FROM public.quality_release_decisions WHERE inspection_id = current_setting('test.ham_inspection_id')::uuid) <> 1 THEN
    RAISE EXCEPTION 'Ham grating Quality release or cost allocation is inconsistent.';
  END IF;
END;
$test$;

ROLLBACK;
