BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.movement_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Movement old unit', 'mou-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Movement new unit', 'mnu-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (
  current_setting('test.material_id')::uuid,
  'unit-movement-' || left(current_setting('test.material_id'), 8),
  'Materia prima con movimiento', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2
);
INSERT INTO public.inventory_movements (id, item_type, item_id, movement_type, quantity)
VALUES (current_setting('test.movement_id')::uuid, 'raw_material', current_setting('test.material_id')::uuid, 'entry', 1);
DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials
      SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit
      WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ004';
    EXCEPTION
      WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ004' THEN rejected := false;
    END;

    IF NOT rejected THEN
      RAISE EXCEPTION 'An inventory_movements raw_material reference did not block unit mutation' USING ERRCODE = 'PZ003';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials
      WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima con movimiento'
        AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid
        AND current_stock = 5.5 AND minimum_stock = 2 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected movement reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
