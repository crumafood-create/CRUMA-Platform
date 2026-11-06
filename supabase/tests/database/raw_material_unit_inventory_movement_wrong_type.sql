BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.movement_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Movement wrong type old', 'mwo-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Movement wrong type new', 'mwn-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-movement-wrong-' || left(current_setting('test.material_id'), 8), 'Materia prima tipo incorrecto', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2);
INSERT INTO public.inventory_movements (id, item_type, item_id, movement_type, quantity)
VALUES (current_setting('test.movement_id')::uuid, 'product', current_setting('test.material_id')::uuid, 'entry', 1);

DO $test$
DECLARE
  target_unit uuid; affected integer;
BEGIN
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    UPDATE public.raw_materials
    SET name = 'Nombre permitido', description = 'Descripcion permitida', unit_of_measure_id = target_unit
    WHERE id = current_setting('test.material_id')::uuid;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 OR NOT EXISTS (
      SELECT 1 FROM public.raw_materials
      WHERE id = current_setting('test.material_id')::uuid AND name = 'Nombre permitido'
        AND description = 'Descripcion permitida' AND unit_of_measure_id IS NOT DISTINCT FROM target_unit
        AND current_stock = 5.5 AND minimum_stock = 2 AND average_cost = 2.1 AND last_cost = 3.2
    ) THEN
      RAISE EXCEPTION 'A product-discriminated movement incorrectly blocked or changed the raw material update';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
