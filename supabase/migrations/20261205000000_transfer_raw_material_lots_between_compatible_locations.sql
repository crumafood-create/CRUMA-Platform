CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_raw_material_location_transfer_idempotency
  ON public.inventory_movements (reference_type, reference_id)
  WHERE reference_type = 'raw_material_lot_location_transfer'
    AND reference_id IS NOT NULL;

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
AS $$
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

  -- Serialize retries that share a key before looking up or creating the audit movement.
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
  FOR KEY SHARE;

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
$$;

REVOKE ALL ON FUNCTION public.transfer_raw_material_lot_location(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_raw_material_lot_location(uuid, uuid, text, uuid)
  TO authenticated;
