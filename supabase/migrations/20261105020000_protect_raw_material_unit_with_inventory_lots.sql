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
  ) OR EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE item_type = 'raw_material'
      AND item_id = OLD.id
  ) OR EXISTS (
    SELECT 1
    FROM public.inventory_lots
    WHERE item_type = 'raw_material'
      AND item_id = OLD.id
  ) THEN
    RAISE EXCEPTION
      'A raw material unit cannot change while inventory history exists.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
