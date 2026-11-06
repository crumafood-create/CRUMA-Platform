BEGIN;

SELECT
  set_config('test.material_id', gen_random_uuid()::text, true),
  set_config('test.first_unit_id', gen_random_uuid()::text, true),
  set_config('test.second_unit_id', gen_random_uuid()::text, true);

INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (
    current_setting('test.first_unit_id')::uuid,
    'Unreferenced unit first',
    'uuf-' || left(current_setting('test.first_unit_id'), 8)
  ),
  (
    current_setting('test.second_unit_id')::uuid,
    'Unreferenced unit second',
    'uus-' || left(current_setting('test.second_unit_id'), 8)
  );

INSERT INTO public.raw_materials (
  id, slug, name, description, unit_of_measure_id,
  current_stock, minimum_stock, average_cost, last_cost
)
VALUES (
  current_setting('test.material_id')::uuid,
  'unit-unreferenced-' || left(current_setting('test.material_id'), 8),
  'Materia prima sin referencias',
  'Descripción inicial',
  NULL,
  0,
  0,
  0,
  0
);

UPDATE public.raw_materials
SET description = 'Descripción actualizada',
    unit_of_measure_id = current_setting('test.first_unit_id')::uuid
WHERE id = current_setting('test.material_id')::uuid;

UPDATE public.raw_materials
SET unit_of_measure_id = current_setting('test.second_unit_id')::uuid
WHERE id = current_setting('test.material_id')::uuid;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_materials
    WHERE id = current_setting('test.material_id')::uuid
      AND description = 'Descripción actualizada'
      AND unit_of_measure_id = current_setting('test.second_unit_id')::uuid
      AND current_stock = 0
      AND average_cost = 0
      AND last_cost = 0
  ) THEN
    RAISE EXCEPTION 'A valid unit change without references was not preserved';
  END IF;
END;
$test$;

ROLLBACK;
