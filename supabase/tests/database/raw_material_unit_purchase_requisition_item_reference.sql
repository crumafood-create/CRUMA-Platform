BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.requisition_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Requisition old unit', 'prou-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Requisition new unit', 'prnu-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-requisition-' || left(current_setting('test.material_id'), 8), 'Materia prima en requisicion', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2);
INSERT INTO public.purchase_requisitions (id, requisition_number, status, notes)
VALUES (current_setting('test.requisition_id')::uuid, 'UNIT-REQ-' || left(current_setting('test.requisition_id'), 8), 'draft', 'Fixture de unidad base');
INSERT INTO public.purchase_requisition_items (purchase_requisition_id, raw_material_id, required_quantity, available_quantity, purchase_quantity)
VALUES (current_setting('test.requisition_id')::uuid, current_setting('test.material_id')::uuid, 1, 0, 1);

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ010';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ010' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'A purchase_requisition_items reference did not block unit mutation' USING ERRCODE = 'PZ009'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima en requisicion' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 5.5 AND minimum_stock = 2 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected purchase requisition reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
