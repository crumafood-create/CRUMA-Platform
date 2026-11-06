BEGIN;

SELECT set_config('test.admin_id', gen_random_uuid()::text, true);
SELECT set_config('test.material_id', gen_random_uuid()::text, true);
SELECT set_config('test.lot_id', gen_random_uuid()::text, true);

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
VALUES (
  current_setting('test.admin_id')::uuid,
  'authenticated',
  'authenticated',
  'legacy-unit-' || current_setting('test.admin_id') || '@example.test',
  now(),
  now()
);

INSERT INTO public.user_roles (user_id, role)
VALUES (current_setting('test.admin_id')::uuid, 'admin');

INSERT INTO public.raw_materials (
  id,
  slug,
  name,
  description,
  unit_of_measure_id,
  current_stock,
  average_cost,
  last_cost
)
VALUES (
  current_setting('test.material_id')::uuid,
  'legacy-unit-' || left(current_setting('test.material_id'), 8),
  'Materia prima heredada de prueba',
  'Descripción anterior',
  NULL,
  5.5000,
  2.1000,
  3.2000
);

-- A zero-quantity exhausted lot remains an operational reference.
INSERT INTO public.raw_material_lots (
  id,
  raw_material_id,
  lot_number,
  quantity,
  unit_cost,
  status
)
VALUES (
  current_setting('test.lot_id')::uuid,
  current_setting('test.material_id')::uuid,
  'LEGACY-UNIT-' || left(current_setting('test.lot_id'), 8),
  0,
  3.2000,
  'depleted'
);

SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SET LOCAL ROLE authenticated;

UPDATE public.raw_materials
SET description = 'Descripción actualizada'
WHERE id = current_setting('test.material_id')::uuid
  AND unit_of_measure_id IS NULL;

RESET ROLE;

DO $test$
DECLARE
  updated_rows integer;
BEGIN
  SELECT count(*) INTO updated_rows
  FROM public.raw_materials
  WHERE id = current_setting('test.material_id')::uuid
    AND description = 'Descripción actualizada'
    AND unit_of_measure_id IS NULL
    AND current_stock = 5.5000
    AND average_cost = 2.1000
    AND last_cost = 3.2000;

  IF updated_rows <> 1 THEN
    RAISE EXCEPTION 'Catalog edit did not preserve the legacy null unit and inventory values';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE id = current_setting('test.lot_id')::uuid
      AND raw_material_id = current_setting('test.material_id')::uuid
      AND quantity = 0
      AND status = 'depleted'
  ) THEN
    RAISE EXCEPTION 'The zero-quantity exhausted lot reference was not preserved';
  END IF;
END;
$test$;

ROLLBACK;
