BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.product_id', gen_random_uuid()::text, true), set_config('test.recipe_id', gen_random_uuid()::text, true), set_config('test.production_order_id', gen_random_uuid()::text, true), set_config('test.order_item_id', gen_random_uuid()::text, true), set_config('test.output_id', gen_random_uuid()::text, true), set_config('test.inspection_id', gen_random_uuid()::text, true), set_config('test.decision_id', gen_random_uuid()::text, true), set_config('test.profile_id', (SELECT id::text FROM public.profiles ORDER BY created_at LIMIT 1), true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Quality old unit', 'qao-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Quality new unit', 'qan-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-quality-history-' || left(current_setting('test.material_id'), 8), 'Materia prima en orden de calidad', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 0, 0, 2.1, 3.2);
INSERT INTO public.products (id, slug, name)
VALUES (current_setting('test.product_id')::uuid, 'unit-quality-product-' || left(current_setting('test.product_id'), 8), 'Producto fixture calidad');
INSERT INTO public.recipes (id, product_id, name, yield_quantity)
VALUES (current_setting('test.recipe_id')::uuid, current_setting('test.product_id')::uuid, 'Receta fixture calidad', 1);
INSERT INTO public.production_orders (id, production_number, recipe_id, production_status, planned_quantity)
VALUES (current_setting('test.production_order_id')::uuid, 'UNIT-QUALITY-' || left(current_setting('test.production_order_id'), 8), current_setting('test.recipe_id')::uuid, 'completed', 1);
INSERT INTO public.production_order_items (id, production_order_id, raw_material_id, planned_quantity, consumed_quantity, status)
VALUES (current_setting('test.order_item_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.material_id')::uuid, 1, 1, 'completed');
INSERT INTO public.production_outputs (id, production_order_id, product_id, quantity_produced, unit_cost, total_cost, quality_status)
VALUES (current_setting('test.output_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.product_id')::uuid, 1, 2.1, 2.1, 'released');
INSERT INTO public.quality_inspections (id, production_order_id, production_output_id, inspector_id, status, result, sampled_quantity, accepted_quantity, rejected_quantity)
VALUES (current_setting('test.inspection_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.output_id')::uuid, current_setting('test.profile_id')::uuid, 'passed', 'ok', 1, 1, 0);
INSERT INTO public.quality_release_decisions (id, inspection_id, production_order_id, production_output_id, decision, approved_by, reason)
VALUES (current_setting('test.decision_id')::uuid, current_setting('test.inspection_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.output_id')::uuid, 'release', current_setting('test.profile_id')::uuid, 'Liberacion fixture');

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.quality_inspections WHERE id = current_setting('test.inspection_id')::uuid AND production_order_id = current_setting('test.production_order_id')::uuid)
     OR NOT EXISTS (SELECT 1 FROM public.quality_release_decisions WHERE id = current_setting('test.decision_id')::uuid AND production_order_id = current_setting('test.production_order_id')::uuid AND decision = 'release') THEN
    RAISE EXCEPTION 'Quality history fixture was not created';
  END IF;
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ028';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ028' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'Quality history through its production order did not block unit mutation' USING ERRCODE = 'PZ027'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima en orden de calidad' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 0 AND minimum_stock = 0 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected quality history update changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
