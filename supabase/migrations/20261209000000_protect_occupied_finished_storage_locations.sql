-- Do not allow a product-lot release to put intermediate mass outside
-- refrigerated semielaborado storage. Historical direct inserts are retained.
CREATE OR REPLACE FUNCTION public.guard_mass_output_storage_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  output_mass_quantity numeric;
  has_release_decision boolean;
  location_use text;
  storage_condition text;
  location_active boolean;
BEGIN
  SELECT output.mass_quantity_produced
  INTO output_mass_quantity
  FROM public.production_outputs AS output
  WHERE output.id = NEW.production_output_id;

  IF output_mass_quantity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.quality_release_decisions AS decision
    WHERE decision.production_output_id = NEW.production_output_id
      AND decision.decision = 'release'
  ) INTO has_release_decision;
  IF NOT has_release_decision THEN
    RETURN NEW;
  END IF;

  SELECT location.location_use, location.storage_condition,
         location.is_active AND location.deleted_at IS NULL
  INTO location_use, storage_condition, location_active
  FROM public.inventory_locations AS location
  WHERE location.id = NEW.inventory_location_id;

  IF NOT FOUND OR location_active IS DISTINCT FROM true
     OR location_use IS DISTINCT FROM 'prepared_ingredient'
     OR storage_condition IS DISTINCT FROM 'refrigerated' THEN
    RAISE EXCEPTION 'Intermediate mass requires an active refrigerated semielaborado location.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_mass_output_storage_location()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS product_lots_guard_mass_storage_location
  ON public.product_lots;
CREATE TRIGGER product_lots_guard_mass_storage_location
BEFORE INSERT OR UPDATE OF inventory_location_id
ON public.product_lots
FOR EACH ROW
EXECUTE FUNCTION public.guard_mass_output_storage_location();

CREATE OR REPLACE FUNCTION public.guard_inventory_location_storage_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.raw_materials AS material
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

  IF (NEW.location_use IS DISTINCT FROM OLD.location_use
      OR NEW.storage_condition IS DISTINCT FROM OLD.storage_condition
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at)
     AND EXISTS (
       SELECT 1
       FROM public.product_lots AS lot
       LEFT JOIN public.product_lot_storage_balances AS balance
         ON balance.product_lot_id = lot.id
       WHERE
         (lot.inventory_location_id = NEW.id
          AND lot.status = 'available' AND lot.quantity > 0)
         OR (lot.inventory_location_id = NEW.id
             AND coalesce(balance.fresh_quantity, 0) > 0)
         OR (balance.refrigerated_wait_location_id = NEW.id
             AND balance.refrigerated_wait_quantity > 0)
         OR (balance.freezing_location_id = NEW.id
             AND balance.freezing_quantity > 0)
         OR (balance.frozen_location_id = NEW.id
             AND balance.raw_frozen_quantity > 0)
         OR (
           EXISTS (
             SELECT 1
             FROM public.product_lot_freezing_operations AS operation
             WHERE operation.product_lot_id = lot.id
               AND operation.status = 'in_progress'
               AND operation.process_location_id = NEW.id
           )
         )
         OR (
           (coalesce(balance.quality_sampling_pending_quantity, 0) > 0
            OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0
            OR EXISTS (
              SELECT 1
              FROM public.product_lot_quality_samples AS sample
              WHERE sample.product_lot_id = lot.id
                AND sample.status IN (
                  'pending_inspection', 'in_custody', 'pending_disposition'
                )
            ))
           AND (
             lot.inventory_location_id = NEW.id
             OR balance.refrigerated_wait_location_id = NEW.id
             OR balance.freezing_location_id = NEW.id
             OR balance.frozen_location_id = NEW.id
           )
         )
     ) THEN
    RAISE EXCEPTION 'Resolve available, waiting, freezing, frozen, or quality-custody product quantities before changing this location.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_inventory_location_storage_policy()
  FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.guard_inventory_location_storage_policy() IS
  'Protects configured material destinations, prepared-ingredient lots, and finished-product balances or quality custody from incompatible location changes.';
