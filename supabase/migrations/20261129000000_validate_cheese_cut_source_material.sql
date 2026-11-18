-- A cut may only consume the catalogued cheddar source, regardless of its display name.
CREATE OR REPLACE FUNCTION public.validate_cheese_cut_source_material()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source_code text;
BEGIN
  IF NEW.operation_type <> 'cut' THEN
    RETURN NEW;
  END IF;

  SELECT internal_code
  INTO v_source_code
  FROM public.raw_materials
  WHERE id = NEW.source_material_id;

  IF v_source_code IS DISTINCT FROM 'MP-QSO-CHED-FUER' THEN
    RAISE EXCEPTION 'Cheese cut requires the authorized cheddar raw material.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_cheese_cut_source_material()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER validate_cheese_cut_source_material
BEFORE INSERT ON public.cheese_preparation_operations
FOR EACH ROW
EXECUTE FUNCTION public.validate_cheese_cut_source_material();
