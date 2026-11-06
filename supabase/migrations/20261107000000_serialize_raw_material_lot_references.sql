CREATE OR REPLACE FUNCTION public.lock_raw_material_unit_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_material_id uuid;
  new_material_id uuid;
  material_id uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    IF TG_NARGS = 1 THEN
      old_material_id := (to_jsonb(OLD) ->> TG_ARGV[0])::uuid;
    ELSIF to_jsonb(OLD) ->> TG_ARGV[1] = TG_ARGV[2] THEN
      old_material_id := (to_jsonb(OLD) ->> TG_ARGV[0])::uuid;
    END IF;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    IF TG_NARGS = 1 THEN
      new_material_id := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
    ELSIF to_jsonb(NEW) ->> TG_ARGV[1] = TG_ARGV[2] THEN
      new_material_id := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
    END IF;
  END IF;

  FOR material_id IN
    SELECT DISTINCT reference_id
    FROM unnest(ARRAY[old_material_id, new_material_id]) AS refs(reference_id)
    WHERE reference_id IS NOT NULL
    ORDER BY reference_id
  LOOP
    PERFORM 1
    FROM public.raw_materials AS material
    WHERE material.id = material_id
    FOR UPDATE;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.raw_material_lots
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');
