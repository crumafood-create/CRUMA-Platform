BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.product_id', gen_random_uuid()::text, true), set_config('test.recipe_id', gen_random_uuid()::text, true), set_config('test.production_order_id', gen_random_uuid()::text, true), set_config('test.order_item_id', gen_random_uuid()::text, true), set_config('test.raw_lot_id', gen_random_uuid()::text, true), set_config('test.consumption_id', gen_random_uuid()::text, true), set_config('test.entry_movement_id', gen_random_uuid()::text, true), set_config('test.exit_movement_id', gen_random_uuid()::text, true), set_config('test.operation_id', gen_random_uuid()::text, true), set_config('test.profile_id', (SELECT id::text FROM public.profiles ORDER BY created_at LIMIT 1), true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Consumption op old', 'coo-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Consumption op new', 'con-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-consumption-op-' || left(current_setting('test.material_id'), 8), 'Materia prima consumo operación', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 0, 0, 3.2, 3.2);
INSERT INTO public.products (id, slug, name)
VALUES (current_setting('test.product_id')::uuid, 'unit-consumption-op-product-' || left(current_setting('test.product_id'), 8), 'Producto fixture operación');
INSERT INTO public.recipes (id, product_id, name, yield_quantity)
VALUES (current_setting('test.recipe_id')::uuid, current_setting('test.product_id')::uuid, 'Receta fixture operación', 1);
INSERT INTO public.production_orders (id, production_number, recipe_id, production_status, planned_quantity)
VALUES (current_setting('test.production_order_id')::uuid, 'UNIT-OP-' || left(current_setting('test.production_order_id'), 8), current_setting('test.recipe_id')::uuid, 'completed', 1);
INSERT INTO public.production_order_items (id, production_order_id, raw_material_id, planned_quantity, consumed_quantity, status)
VALUES (current_setting('test.order_item_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.material_id')::uuid, 1, 1, 'completed');
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status)
VALUES (current_setting('test.raw_lot_id')::uuid, current_setting('test.material_id')::uuid, 'UNIT-OP-' || left(current_setting('test.raw_lot_id'), 8), 0, 3.2, 'depleted');
INSERT INTO public.production_order_consumptions (id, production_order_item_id, raw_material_lot_id, quantity)
VALUES (current_setting('test.consumption_id')::uuid, current_setting('test.order_item_id')::uuid, current_setting('test.raw_lot_id')::uuid, 1);
INSERT INTO public.inventory_movements (id, item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes)
VALUES (current_setting('test.entry_movement_id')::uuid, 'raw_material', current_setting('test.material_id')::uuid, 'entry', 1, 0, 1, 'opening_balance', current_setting('test.raw_lot_id')::uuid, 'Fixture apertura');
INSERT INTO public.inventory_movements (id, item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes)
VALUES (current_setting('test.exit_movement_id')::uuid, 'raw_material', current_setting('test.material_id')::uuid, 'exit', 1, 1, 0, 'production_material_consumption', current_setting('test.operation_id')::uuid, 'Fixture consumo de produccion');
INSERT INTO public.production_material_consumption_operations (id, idempotency_key, production_order_id, production_order_item_id, raw_material_lot_id, production_order_consumption_id, inventory_movement_id, scanned_lot_number, consumed_quantity, consumed_by)
VALUES (current_setting('test.operation_id')::uuid, current_setting('test.operation_id')::uuid, current_setting('test.production_order_id')::uuid, current_setting('test.order_item_id')::uuid, current_setting('test.raw_lot_id')::uuid, current_setting('test.consumption_id')::uuid, current_setting('test.exit_movement_id')::uuid, 'UNIT-OP-' || left(current_setting('test.raw_lot_id'), 8), 1, current_setting('test.profile_id')::uuid);

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.production_material_consumption_operations WHERE id = current_setting('test.operation_id')::uuid AND production_order_item_id = current_setting('test.order_item_id')::uuid AND raw_material_lot_id = current_setting('test.raw_lot_id')::uuid AND production_order_consumption_id = current_setting('test.consumption_id')::uuid AND inventory_movement_id = current_setting('test.exit_movement_id')::uuid AND consumed_quantity = 1) THEN
    RAISE EXCEPTION 'Production material consumption operation fixture was not created';
  END IF;
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ026';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ026' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'A production_material_consumption_operations reference did not block unit mutation' USING ERRCODE = 'PZ025'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima consumo operación' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 0 AND minimum_stock = 0 AND average_cost = 3.2 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected material consumption operation changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
