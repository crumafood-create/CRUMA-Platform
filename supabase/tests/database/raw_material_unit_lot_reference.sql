BEGIN;

SELECT
  set_config('test.material_id', gen_random_uuid()::text, true),
  set_config('test.old_unit_id', gen_random_uuid()::text, true),
  set_config('test.new_unit_id', gen_random_uuid()::text, true),
  set_config('test.lot_id', gen_random_uuid()::text, true);

INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Legacy unit old', 'luo-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Legacy unit new', 'lun-' || left(current_setting('test.new_unit_id'), 8));

INSERT INTO public.raw_materials (
  id, slug, name, description, unit_of_measure_id,
  current_stock, minimum_stock, average_cost, last_cost
)
VALUES (
  current_setting('test.material_id')::uuid,
  'unit-lot-' || left(current_setting('test.material_id'), 8),
  'Materia prima con lote agotado', 'Descripción original',
  current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2
);

INSERT INTO public.raw_material_lots (
  id, raw_material_id, lot_number, quantity, unit_cost, status
)
VALUES (
  current_setting('test.lot_id')::uuid,
  current_setting('test.material_id')::uuid,
  'UNIT-LOT-' || left(current_setting('test.lot_id'), 8), 0, 3.2, 'depleted'
);

DO $test$
DECLARE
  target_unit uuid;
  rejected boolean;
BEGIN
  FOREACH target_unit IN ARRAY ARRAY[
    current_setting('test.new_unit_id')::uuid,
    NULL::uuid
  ] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials
      SET name = 'Nombre que no debe persistir',
          description = 'Descripción que no debe persistir',
          unit_of_measure_id = target_unit
      WHERE id = current_setting('test.material_id')::uuid;
      -- PZ002 is only a sentinel for an accepted UPDATE; the guard must raise 23514.
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ002';
    EXCEPTION
      WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ002' THEN rejected := false;
    END;

    IF NOT rejected THEN
      RAISE EXCEPTION 'A raw_material_lots reference did not block unit mutation'
        USING ERRCODE = 'PZ001';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.raw_materials
      WHERE id = current_setting('test.material_id')::uuid
        AND name = 'Materia prima con lote agotado'
        AND description = 'Descripción original'
        AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid
        AND current_stock = 5.5 AND minimum_stock = 2
        AND average_cost = 2.1 AND last_cost = 3.2
    ) THEN
      RAISE EXCEPTION 'Rejected unit mutation changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;

ROLLBACK;
