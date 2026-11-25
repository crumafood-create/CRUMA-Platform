CREATE OR REPLACE FUNCTION public.enforce_purchase_receipt_storage_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  material_id uuid;
  material_condition text;
  material_use text;
  material_location_id uuid;
  location_use text;
  location_condition text;
  location_active boolean;
  lot_location_id uuid;
  lot_condition text;
  lot_status text;
BEGIN
  SELECT item.raw_material_id
  INTO material_id
  FROM public.purchase_order_items AS item
  WHERE item.id = NEW.purchase_order_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Purchase item was not found for receipt storage assignment.'
      USING ERRCODE = '23503';
  END IF;

  SELECT material.required_storage_condition,
         material.default_storage_use,
         material.default_inventory_location_id
  INTO material_condition, material_use, material_location_id
  FROM public.raw_materials AS material
  WHERE material.id = material_id
    AND material.is_active = true
    AND material.deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND
     OR material_condition IS NULL
     OR material_condition NOT IN ('dry', 'refrigerated')
     OR material_use IS DISTINCT FROM 'raw_material'
     OR material_location_id IS NULL THEN
    RAISE EXCEPTION
      'Raw material storage policy is not configured for receipt.'
      USING ERRCODE = '23514';
  END IF;

  SELECT location.location_use,
         location.storage_condition,
         location.is_active
  INTO location_use, location_condition, location_active
  FROM public.inventory_locations AS location
  WHERE location.id = material_location_id
    AND location.deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND
     OR location_active IS DISTINCT FROM true
     OR location_use IS DISTINCT FROM material_use
     OR location_condition IS DISTINCT FROM material_condition THEN
    RAISE EXCEPTION
      'Configured raw material storage location is inactive or incompatible.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.inventory_location_id IS DISTINCT FROM material_location_id THEN
    RAISE EXCEPTION
      'Receipt must use the configured raw material storage location.'
      USING ERRCODE = '23514';
  END IF;

  SELECT lot.inventory_location_id,
         lot.storage_condition,
         lot.status
  INTO lot_location_id, lot_condition, lot_status
  FROM public.raw_material_lots AS lot
  WHERE lot.id = NEW.raw_material_lot_id
  FOR UPDATE;

  IF NOT FOUND
     OR lot_location_id IS DISTINCT FROM material_location_id
     OR lot_status IS DISTINCT FROM 'quarantine'
     OR (lot_condition IS NOT NULL
         AND lot_condition IS DISTINCT FROM material_condition) THEN
    RAISE EXCEPTION
      'Received lot does not match its configured quarantined storage.'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.raw_material_lots
  SET storage_condition = material_condition,
      updated_at = now()
  WHERE id = NEW.raw_material_lot_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
  public.enforce_purchase_receipt_storage_assignment()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purchase_receipt_items_storage_assignment
BEFORE INSERT ON public.purchase_receipt_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_purchase_receipt_storage_assignment();

COMMENT ON FUNCTION public.enforce_purchase_receipt_storage_assignment() IS
  'Validates that a quarantined received lot is stored at its explicitly configured compatible raw material location.';
