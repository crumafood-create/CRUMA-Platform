-- Keep existing locations unclassified. Administrators assign their actual
-- use and physical condition explicitly; names are not used for inference.
ALTER TABLE public.inventory_locations
  ADD COLUMN IF NOT EXISTS location_use text,
  ADD COLUMN IF NOT EXISTS storage_condition text;

ALTER TABLE public.inventory_locations
  DROP CONSTRAINT IF EXISTS inventory_locations_location_use_check,
  ADD CONSTRAINT inventory_locations_location_use_check
    CHECK (location_use IS NULL OR location_use IN (
      'raw_material', 'prepared_ingredient', 'finished_product', 'packaging', 'chemical'
    )),
  DROP CONSTRAINT IF EXISTS inventory_locations_storage_condition_check,
  ADD CONSTRAINT inventory_locations_storage_condition_check
    CHECK (storage_condition IS NULL OR storage_condition IN ('dry', 'refrigerated', 'frozen')),
  DROP CONSTRAINT IF EXISTS inventory_locations_storage_classification_check,
  ADD CONSTRAINT inventory_locations_storage_classification_check
    CHECK (
      (location_use IS NULL AND storage_condition IS NULL)
      OR (location_use IN ('raw_material', 'prepared_ingredient')
          AND storage_condition IN ('dry', 'refrigerated'))
      OR (location_use = 'finished_product'
          AND storage_condition IN ('refrigerated', 'frozen'))
      OR (location_use IN ('packaging', 'chemical')
          AND storage_condition = 'dry')
    );

COMMENT ON COLUMN public.inventory_locations.location_use IS
  'Explicit destination use; null means the existing location has not been classified.';
COMMENT ON COLUMN public.inventory_locations.storage_condition IS
  'Physical condition supported by this location; null means the location has not been classified.';

ALTER TABLE public.raw_materials
  ADD COLUMN IF NOT EXISTS required_storage_condition text,
  ADD COLUMN IF NOT EXISTS default_storage_use text,
  ADD COLUMN IF NOT EXISTS default_inventory_location_id uuid;

ALTER TABLE public.raw_materials
  DROP CONSTRAINT IF EXISTS raw_materials_required_storage_condition_check,
  ADD CONSTRAINT raw_materials_required_storage_condition_check
    CHECK (required_storage_condition IS NULL OR required_storage_condition IN ('dry', 'refrigerated')),
  DROP CONSTRAINT IF EXISTS raw_materials_default_storage_use_check,
  ADD CONSTRAINT raw_materials_default_storage_use_check
    CHECK (default_storage_use IS NULL OR default_storage_use IN ('raw_material', 'prepared_ingredient')),
  DROP CONSTRAINT IF EXISTS raw_materials_default_inventory_location_fkey,
  ADD CONSTRAINT raw_materials_default_inventory_location_fkey
    FOREIGN KEY (default_inventory_location_id)
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.raw_materials.required_storage_condition IS
  'Approved storage condition for this material; null means Quality has not configured it.';
COMMENT ON COLUMN public.raw_materials.default_storage_use IS
  'Expected physical location use for the material, configured by an administrator.';
COMMENT ON COLUMN public.raw_materials.default_inventory_location_id IS
  'Administrator-configured habitual destination; null means a destination must be configured.';

-- These two product-specific decisions were explicitly approved: grated cheese
-- and grated ham are refrigerated ingredients. Their destinations remain unset
-- until an administrator classifies a compatible location and assigns it.
UPDATE public.raw_materials
SET required_storage_condition = 'refrigerated',
    default_storage_use = 'prepared_ingredient',
    updated_at = now()
WHERE internal_code IN ('MP-QSO-RALLADO', 'MP-JAM-RALLADO')
  AND (required_storage_condition IS NULL OR default_storage_use IS NULL);

CREATE OR REPLACE FUNCTION public.guard_raw_material_storage_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  location_use text;
  location_condition text;
  location_active boolean;
BEGIN
  IF NEW.default_inventory_location_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.required_storage_condition IS NULL OR NEW.default_storage_use IS NULL THEN
    RAISE EXCEPTION 'Configure the material storage condition and destination together.'
      USING ERRCODE = '23514';
  END IF;

  SELECT location.location_use, location.storage_condition,
         location.is_active AND location.deleted_at IS NULL
  INTO location_use, location_condition, location_active
  FROM public.inventory_locations AS location
  WHERE location.id = NEW.default_inventory_location_id
  FOR KEY SHARE;

  IF NOT FOUND OR location_active IS DISTINCT FROM true
     OR location_use IS DISTINCT FROM NEW.default_storage_use
     OR location_condition IS DISTINCT FROM NEW.required_storage_condition THEN
    RAISE EXCEPTION 'The default destination is missing, inactive, or incompatible with the material.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_raw_material_storage_policy() FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_inventory_location_storage_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.raw_materials AS material
    WHERE material.default_inventory_location_id = NEW.id
      AND (material.default_storage_use IS DISTINCT FROM NEW.location_use
           OR material.required_storage_condition IS DISTINCT FROM NEW.storage_condition
           OR NOT NEW.is_active OR NEW.deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Location classification conflicts with an assigned material destination.'
      USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.raw_material_lots AS lot
    JOIN public.cheese_preparation_operations AS operation
      ON operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
    JOIN public.raw_materials AS material ON material.id = lot.raw_material_id
    WHERE lot.inventory_location_id = NEW.id
      AND lot.status IN ('available', 'quarantine', 'hold')
      AND (lot.storage_condition IS DISTINCT FROM NEW.storage_condition
           OR material.default_storage_use IS DISTINCT FROM NEW.location_use
           OR material.required_storage_condition IS DISTINCT FROM NEW.storage_condition)
  ) THEN
    RAISE EXCEPTION 'Location classification conflicts with prepared ingredient lots stored there.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_inventory_location_storage_policy() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS raw_materials_guard_storage_policy ON public.raw_materials;
CREATE TRIGGER raw_materials_guard_storage_policy
BEFORE INSERT OR UPDATE OF required_storage_condition, default_storage_use, default_inventory_location_id
ON public.raw_materials
FOR EACH ROW EXECUTE FUNCTION public.guard_raw_material_storage_policy();

DROP TRIGGER IF EXISTS inventory_locations_guard_storage_policy ON public.inventory_locations;
CREATE TRIGGER inventory_locations_guard_storage_policy
BEFORE UPDATE OF location_use, storage_condition, is_active, deleted_at
ON public.inventory_locations
FOR EACH ROW EXECUTE FUNCTION public.guard_inventory_location_storage_policy();

CREATE OR REPLACE FUNCTION public.guard_prepared_ingredient_lot_storage_compatibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_prepared_ingredient boolean;
  material public.raw_materials%ROWTYPE;
  location public.inventory_locations%ROWTYPE;
  is_release boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.cheese_preparation_operations AS operation
    WHERE operation.output_lot_id = NEW.id OR operation.secondary_lot_id = NEW.id
  ) INTO is_prepared_ingredient;
  IF NOT is_prepared_ingredient THEN
    RETURN NEW;
  END IF;

  IF NEW.inventory_location_id IS NULL THEN
    IF NEW.status = 'available' THEN
      RAISE EXCEPTION 'Configure a compatible storage destination before releasing this ingredient.'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  SELECT * INTO material FROM public.raw_materials
  WHERE id = NEW.raw_material_id FOR KEY SHARE;
  IF NOT FOUND OR material.required_storage_condition IS NULL
     OR material.default_storage_use IS NULL OR material.default_inventory_location_id IS NULL THEN
    RAISE EXCEPTION 'The administrator must configure this ingredient condition and destination before storage.'
      USING ERRCODE = '23514';
  END IF;

  SELECT * INTO location FROM public.inventory_locations
  WHERE id = NEW.inventory_location_id FOR KEY SHARE;
  IF NOT FOUND OR NOT location.is_active OR location.deleted_at IS NOT NULL
     OR location.location_use IS DISTINCT FROM material.default_storage_use
     OR location.storage_condition IS DISTINCT FROM material.required_storage_condition
     OR NEW.storage_condition IS DISTINCT FROM material.required_storage_condition THEN
    RAISE EXCEPTION 'Prepared ingredient requires its configured location use and storage condition.'
      USING ERRCODE = '23514';
  END IF;

  is_release := OLD.status IN ('quarantine', 'hold') AND NEW.status = 'available';
  IF is_release AND NEW.inventory_location_id IS DISTINCT FROM material.default_inventory_location_id THEN
    RAISE EXCEPTION 'Quality release must use the administrator-configured habitual destination.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_prepared_ingredient_lot_storage_compatibility() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS raw_material_lots_guard_prepared_storage_compatibility ON public.raw_material_lots;
CREATE TRIGGER raw_material_lots_guard_prepared_storage_compatibility
BEFORE UPDATE OF status, storage_condition, inventory_location_id
ON public.raw_material_lots
FOR EACH ROW EXECUTE FUNCTION public.guard_prepared_ingredient_lot_storage_compatibility();
