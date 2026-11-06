BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.product_id', gen_random_uuid()::text, true), set_config('test.recipe_id', gen_random_uuid()::text, true), set_config('test.production_order_id', gen_random_uuid()::text, true), set_config('test.order_item_id', gen_random_uuid()::text, true), set_config('test.raw_lot_id', gen_random_uuid()::text, true), set_config('test.consumption_id', gen_random_uuid()::text, true), set_config('test.output_id', gen_random_uuid()::text, true), set_config('test.product_lot_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Traceability old unit', 'trco-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Traceability new unit', 'trcn-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-traceability-' || left(current_setting('test.material_id'), 8), 'Materia prima trazable', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 1, 0, 2.1, 3.2);
INSERT INTO public.products (id, slug, name)
VALUES (current_setting('test.product_id')::uuid, 'unit-trace-product-' || left(current_setting('test.product_id'), 8), 'Producto fixture trazabilidad');
INSERT INTO public.recipes (id, product_id, name, yield_quantity)
VALUES (current_setting('test.recipe_id')::uuid, current_setting('test.product_id')::uuid, 'Receta fixture trazabilidad', 1);
INSERT INTO public.production_orders (id, production_number, recipe_id, production_status, planned_quantity)
VALUES (current_setting('test.production_order_id')::uuid, 'UNIT-TRACE-' || left(current_setting('test.production_order_id'), 8), current_setting('test.recipe_id')::uuid, 'completed', 1);
INSERT INTO public.production_order_items (id, production_order_id, raw_material_id, planned_quantity, consumed_quantity, status)
VALUES (current_setting('test.order_item_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.material_id')::uuid, 1, 1, 'completed');
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status)
VALUES (current_setting('test.raw_lot_id')::uuid, current_setting('test.material_id')::uuid, 'UNIT-TRACE-' || left(current_setting('test.raw_lot_id'), 8), 1, 3.2, 'available');
INSERT INTO public.production_order_consumptions (id, production_order_item_id, raw_material_lot_id, quantity)
VALUES (current_setting('test.consumption_id')::uuid, current_setting('test.order_item_id')::uuid, current_setting('test.raw_lot_id')::uuid, 1);
INSERT INTO public.production_outputs (id, production_order_id, product_id, quantity_produced, unit_cost, total_cost)
VALUES (current_setting('test.output_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.product_id')::uuid, 1, 2.1, 2.1);
INSERT INTO public.product_lots (id, product_id, lot_number, production_order_id, production_output_id, quantity, initial_quantity, status)
VALUES (current_setting('test.product_lot_id')::uuid, current_setting('test.product_id')::uuid, 'UNIT-TRACE-OUT-' || left(current_setting('test.product_lot_id'), 8), current_setting('test.production_order_id')::uuid, current_setting('test.output_id')::uuid, 1, 1, 'quarantine');
INSERT INTO public.production_lot_traceability (product_lot_id, production_order_consumption_id, raw_material_lot_id, raw_material_id, source_lot_number, consumed_quantity)
VALUES (current_setting('test.product_lot_id')::uuid, current_setting('test.consumption_id')::uuid, current_setting('test.raw_lot_id')::uuid, current_setting('test.material_id')::uuid, 'UNIT-TRACE-' || left(current_setting('test.raw_lot_id'), 8), 1);

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.production_lot_traceability WHERE product_lot_id = current_setting('test.product_lot_id')::uuid AND production_order_consumption_id = current_setting('test.consumption_id')::uuid AND raw_material_lot_id = current_setting('test.raw_lot_id')::uuid AND raw_material_id = current_setting('test.material_id')::uuid AND consumed_quantity = 1) THEN
    RAISE EXCEPTION 'Production lot traceability fixture was not created';
  END IF;
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ022';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ022' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'A production_lot_traceability reference did not block unit mutation' USING ERRCODE = 'PZ021'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima trazable' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 1 AND minimum_stock = 0 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected production traceability reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
