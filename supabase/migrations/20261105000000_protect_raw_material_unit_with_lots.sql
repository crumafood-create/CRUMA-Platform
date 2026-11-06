CREATE OR REPLACE FUNCTION public.guard_raw_material_unit_with_lots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.unit_of_measure_id IS NOT DISTINCT FROM OLD.unit_of_measure_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE raw_material_id = OLD.id
  ) THEN
    RAISE EXCEPTION
      'A raw material unit cannot change while lot history exists.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL
  ON FUNCTION public.guard_raw_material_unit_with_lots()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS raw_material_unit_lots_guard
  ON public.raw_materials;

CREATE TRIGGER raw_material_unit_lots_guard
BEFORE UPDATE OF unit_of_measure_id
  ON public.raw_materials
FOR EACH ROW
EXECUTE FUNCTION public.guard_raw_material_unit_with_lots();
