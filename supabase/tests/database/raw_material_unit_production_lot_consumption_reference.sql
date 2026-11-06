BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.product_id', gen_random_uuid()::text, true), set_config('test.recipe_id', gen_random_uuid()::text, true), set_config('test.production_order_id', gen_random_uuid()::text, true), set_config('test.inventory_lot_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Lot consumption old', 'lco-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Lot consumption new', 'lcn-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-lot-consumption-' || left(current_setting('test.material_id'), 8), 'Materia prima consumida', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2);
INSERT INTO public.products (id, slug, name)
VALUES (current_setting('test.product_id')::uuid, 'unit-lot-consumption-product-' || left(current_setting('test.product_id'), 8), 'Producto fixture consumo');
INSERT INTO public.recipes (id, product_id, name, yield_quantity)
VALUES (current_setting('test.recipe_id')::uuid, current_setting('test.product_id')::uuid, 'Receta fixture consumo', 1);
INSERT INTO public.production_orders (id, production_number, recipe_id, production_status, planned_quantity)
VALUES (current_setting('test.production_order_id')::uuid, 'UNIT-CONS-' || left(current_setting('test.production_order_id'), 8), current_setting('test.recipe_id')::uuid, 'draft', 1);
INSERT INTO public.inventory_lots (id, item_type, item_id, lot_number, quantity)
VALUES (current_setting('test.inventory_lot_id')::uuid, 'raw_material', current_setting('test.material_id')::uuid, 'UNIT-CONS-' || left(current_setting('test.inventory_lot_id'), 8), 0);
INSERT INTO public.production_lot_consumptions (production_order_id, inventory_lot_id, raw_material_id, quantity)
VALUES (current_setting('test.production_order_id')::uuid, current_setting('test.inventory_lot_id')::uuid, current_setting('test.material_id')::uuid, 0);

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.production_lot_consumptions WHERE production_order_id = current_setting('test.production_order_id')::uuid AND inventory_lot_id = current_setting('test.inventory_lot_id')::uuid AND raw_material_id = current_setting('test.material_id')::uuid AND quantity = 0) THEN
    RAISE EXCEPTION 'Production lot consumption fixture was not created';
  END IF;
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ020';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ020' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'A production_lot_consumptions reference did not block unit mutation' USING ERRCODE = 'PZ019'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima consumida' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 5.5 AND minimum_stock = 2 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected production lot reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
