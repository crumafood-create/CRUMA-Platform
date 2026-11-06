BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.reservation_id', gen_random_uuid()::text, true), set_config('test.reference_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Reservation old unit', 'rou-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Reservation new unit', 'rnu-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-reservation-' || left(current_setting('test.material_id'), 8), 'Materia prima reservada', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2);
INSERT INTO public.inventory_reservations (id, item_type, item_id, reference_type, reference_id, quantity, status, notes)
VALUES (current_setting('test.reservation_id')::uuid, 'raw_material', current_setting('test.material_id')::uuid, 'sales_order', current_setting('test.reference_id')::uuid, 0, 'released', 'Referencia historica sin cantidad activa');

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ008';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ008' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'An inventory_reservations raw_material reference did not block unit mutation' USING ERRCODE = 'PZ007'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima reservada' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 5.5 AND minimum_stock = 2 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected inventory_reservations reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
