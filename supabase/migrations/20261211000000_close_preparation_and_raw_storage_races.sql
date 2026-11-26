-- Frozen raw-material lots cannot enter ingredient-preparation operations
-- until an approved process defines their safe use or controlled thawing.
CREATE OR REPLACE FUNCTION public.guard_prepared_operation_source_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  source_condition text;
BEGIN
  IF NEW.operation_type NOT IN ('cut', 'grate') THEN
    RETURN NEW;
  END IF;

  SELECT lot.storage_condition INTO source_condition
  FROM public.raw_material_lots AS lot
  WHERE lot.id = NEW.source_lot_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingredient-preparation source lot does not exist.'
      USING ERRCODE = '23503';
  END IF;
  IF source_condition = 'frozen' THEN
    RAISE EXCEPTION 'Frozen source lots cannot be prepared without an approved use or controlled-thawing procedure.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_prepared_operation_source_storage()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS cheese_preparation_guard_source_storage
  ON public.cheese_preparation_operations;
CREATE TRIGGER cheese_preparation_guard_source_storage
BEFORE INSERT ON public.cheese_preparation_operations
FOR EACH ROW
EXECUTE FUNCTION public.guard_prepared_operation_source_storage();

COMMENT ON FUNCTION public.guard_prepared_operation_source_storage() IS
  'Rejects cheese and ham preparation from frozen raw-material lots until an approved use or controlled-thawing procedure exists.';

-- A lot transfer and a storage-policy update must serialize on both location
-- rows. FOR SHARE conflicts with updates to the location classification.
CREATE OR REPLACE FUNCTION public.transfer_raw_material_lot_location(
  p_lot_id uuid,
  p_destination_location_id uuid,
  p_reason text,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  lot public.raw_material_lots%ROWTYPE;
  material public.raw_materials%ROWTYPE;
  source_location public.inventory_locations%ROWTYPE;
  destination_location public.inventory_locations%ROWTYPE;
  existing_movement public.inventory_movements%ROWTYPE;
  transfer_notes text;
BEGIN
  IF NOT coalesce(public.is_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Only an administrator may transfer inventory lots.' USING ERRCODE = '42501';
  END IF;
  IF p_lot_id IS NULL OR p_destination_location_id IS NULL
     OR p_idempotency_key IS NULL OR nullif(btrim(p_reason), '') IS NULL
     OR length(btrim(p_reason)) > 500 THEN
    RAISE EXCEPTION 'Lot, destination, reason and idempotency key are required.' USING ERRCODE = '23514';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key::text, 0));
  SELECT * INTO existing_movement
  FROM public.inventory_movements
  WHERE reference_type = 'raw_material_lot_location_transfer'
    AND reference_id = p_idempotency_key;
  IF FOUND THEN
    IF existing_movement.notes LIKE '%lote=' || p_lot_id::text || '; destino=' || p_destination_location_id::text || ';%' THEN
      RETURN existing_movement.id;
    END IF;
    RAISE EXCEPTION 'The idempotency key was already used for a different lot or destination.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO lot
  FROM public.raw_material_lots
  WHERE id = p_lot_id
  FOR UPDATE;
  IF NOT FOUND OR lot.quantity <= 0 OR lot.status NOT IN ('available', 'hold', 'quarantine') THEN
    RAISE EXCEPTION 'Only a non-empty available, held or quarantined lot can be transferred.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO material
  FROM public.raw_materials
  WHERE id = lot.raw_material_id AND is_active AND deleted_at IS NULL
  FOR SHARE;
  IF NOT FOUND OR material.required_storage_condition IS NULL
     OR material.default_storage_use IS NULL OR material.current_stock < 0
     OR lot.storage_condition IS DISTINCT FROM material.required_storage_condition THEN
    RAISE EXCEPTION 'The material storage policy or lot condition is missing or incompatible.' USING ERRCODE = '23514';
  END IF;

  PERFORM 1
  FROM public.inventory_locations AS location
  WHERE location.id IN (lot.inventory_location_id, p_destination_location_id)
  ORDER BY location.id
  FOR SHARE;

  SELECT * INTO source_location
  FROM public.inventory_locations
  WHERE id = lot.inventory_location_id AND is_active AND deleted_at IS NULL;
  SELECT * INTO destination_location
  FROM public.inventory_locations
  WHERE id = p_destination_location_id AND is_active AND deleted_at IS NULL;
  IF NOT FOUND OR source_location.id IS NULL
     OR source_location.location_use IS DISTINCT FROM material.default_storage_use
     OR source_location.storage_condition IS DISTINCT FROM material.required_storage_condition
     OR destination_location.location_use IS DISTINCT FROM material.default_storage_use
     OR destination_location.storage_condition IS DISTINCT FROM material.required_storage_condition
     OR destination_location.id = source_location.id THEN
    RAISE EXCEPTION 'Source and destination must be distinct active locations compatible with the material.' USING ERRCODE = '23514';
  END IF;

  transfer_notes := format(
    'Traslado de lote; lote=%s; destino=%s; origen=%s; estado=%s; condicion=%s; cantidad=%s; valor=%s; motivo: %s',
    lot.id, destination_location.id, source_location.id, lot.status,
    lot.storage_condition, lot.quantity, lot.remaining_value, btrim(p_reason)
  );

  UPDATE public.raw_material_lots
  SET inventory_location_id = destination_location.id,
      updated_at = now()
  WHERE id = lot.id;

  INSERT INTO public.inventory_movements (
    item_type, item_id, movement_type, quantity, previous_stock, new_stock,
    reference_type, reference_id, notes, created_by
  ) VALUES (
    'raw_material', material.id, 'transfer', lot.quantity,
    material.current_stock, material.current_stock,
    'raw_material_lot_location_transfer', p_idempotency_key,
    transfer_notes, auth.uid()
  ) RETURNING * INTO existing_movement;

  RETURN existing_movement.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.transfer_raw_material_lot_location(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_raw_material_lot_location(uuid, uuid, text, uuid)
  TO authenticated;

-- Protect every physical raw-material lot, including purchased, quarantined,
-- held and preparation lots, when an occupied location is changed or disabled.
CREATE OR REPLACE FUNCTION public.guard_inventory_location_storage_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
    JOIN public.raw_materials AS material ON material.id = lot.raw_material_id
    WHERE lot.inventory_location_id = NEW.id
      AND lot.quantity > 0
      AND (lot.storage_condition IS DISTINCT FROM NEW.storage_condition
           OR material.default_storage_use IS DISTINCT FROM NEW.location_use
           OR material.required_storage_condition IS DISTINCT FROM NEW.storage_condition
           OR NOT NEW.is_active OR NEW.deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Location classification conflicts with physical raw-material lots stored there.'
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
       WHERE (lot.inventory_location_id = NEW.id AND lot.status = 'available' AND lot.quantity > 0)
         OR (lot.inventory_location_id = NEW.id AND coalesce(balance.fresh_quantity, 0) > 0)
         OR (balance.refrigerated_wait_location_id = NEW.id AND balance.refrigerated_wait_quantity > 0)
         OR (balance.freezing_location_id = NEW.id AND balance.freezing_quantity > 0)
         OR (balance.frozen_location_id = NEW.id AND balance.raw_frozen_quantity > 0)
         OR EXISTS (
           SELECT 1 FROM public.product_lot_freezing_operations AS operation
           WHERE operation.product_lot_id = lot.id AND operation.status = 'in_progress'
             AND operation.process_location_id = NEW.id
         )
         OR ((coalesce(balance.quality_sampling_pending_quantity, 0) > 0
              OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0
              OR EXISTS (
                SELECT 1 FROM public.product_lot_quality_samples AS sample
                WHERE sample.product_lot_id = lot.id
                  AND sample.status IN ('pending_inspection', 'in_custody', 'pending_disposition')
              ))
             AND (lot.inventory_location_id = NEW.id
                  OR balance.refrigerated_wait_location_id = NEW.id
                  OR balance.freezing_location_id = NEW.id
                  OR balance.frozen_location_id = NEW.id))
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
  'Protects configured material destinations, all occupied raw-material lots, and finished-product balances or quality custody from incompatible location changes.';
