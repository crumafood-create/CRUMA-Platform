-- Retain an already released prepared ingredient whose stored location or
-- condition no longer matches its configured Quality policy. The lot value is
-- preserved; only the available stock aggregate is reduced until a new
-- inspection and a separate Quality release.

CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_prepared_storage_correction_once
  ON public.inventory_movements (reference_type, reference_id)
  WHERE reference_type = 'prepared_ingredient_storage_correction';

CREATE OR REPLACE FUNCTION public.retain_prepared_ingredient_for_storage_correction(
  p_inspection_id uuid,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inspection public.quality_inspections%ROWTYPE;
  lot public.raw_material_lots%ROWTYPE;
  material public.raw_materials%ROWTYPE;
  target_location public.inventory_locations%ROWTYPE;
  existing_movement public.inventory_movements%ROWTYPE;
  new_stock numeric(18,4);
  new_average_cost numeric(18,4);
  other_lot_quantity numeric(18,4);
  other_lot_value numeric(18,4);
  correction_reason text;
  correction_notes text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Prepared ingredient storage correction requires an administrator.';
  END IF;
  correction_reason := NULLIF(btrim(p_reason), '');
  IF p_inspection_id IS NULL OR correction_reason IS NULL THEN
    RAISE EXCEPTION 'A Quality inspection and correction reason are required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO inspection
  FROM public.quality_inspections
  WHERE id = p_inspection_id AND subject_type = 'raw_material_lot'
  FOR UPDATE;
  IF NOT FOUND OR inspection.status IS DISTINCT FROM 'passed'
     OR inspection.raw_material_lot_id IS NULL THEN
    RAISE EXCEPTION 'A passed inspection for a prepared ingredient lot is required.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO lot
  FROM public.raw_material_lots
  WHERE id = inspection.raw_material_lot_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prepared ingredient lot was not found.' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO existing_movement
  FROM public.inventory_movements
  WHERE reference_type = 'prepared_ingredient_storage_correction'
    AND reference_id = lot.id;
  IF FOUND THEN
    IF lot.status = 'hold'
       AND EXISTS (
         SELECT 1 FROM public.raw_materials AS configured_material
         JOIN public.inventory_locations AS configured_location
           ON configured_location.id = configured_material.default_inventory_location_id
         WHERE configured_material.id = lot.raw_material_id
           AND lot.storage_condition = configured_material.required_storage_condition
           AND lot.inventory_location_id = configured_location.id
           AND configured_location.location_use = configured_material.default_storage_use
           AND configured_location.storage_condition = configured_material.required_storage_condition
       ) THEN
      RETURN existing_movement.id;
    END IF;
    RAISE EXCEPTION 'The prepared ingredient correction record conflicts with the current lot state.' USING ERRCODE = '23514';
  END IF;

  IF lot.status <> 'available'
     OR NOT EXISTS (
       SELECT 1 FROM public.quality_release_decisions AS prior_release
       WHERE prior_release.inspection_id = inspection.id
         AND prior_release.subject_type = 'raw_material_lot'
         AND prior_release.raw_material_lot_id = lot.id
         AND prior_release.decision = 'release'
     )
     OR NOT EXISTS (
       SELECT 1 FROM public.cheese_preparation_operations AS preparation
       WHERE preparation.output_lot_id = lot.id OR preparation.secondary_lot_id = lot.id
     ) THEN
    RAISE EXCEPTION 'Only an available, previously released prepared ingredient lot can be retained for correction.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO material
  FROM public.raw_materials
  WHERE id = lot.raw_material_id AND is_active AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND OR material.required_storage_condition IS NULL
     OR material.default_storage_use IS NULL
     OR material.default_inventory_location_id IS NULL THEN
    RAISE EXCEPTION 'The administrator must configure the prepared ingredient storage policy before correction.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO target_location
  FROM public.inventory_locations
  WHERE id = material.default_inventory_location_id
    AND is_active AND deleted_at IS NULL
  FOR KEY SHARE;
  IF NOT FOUND
     OR target_location.location_use IS DISTINCT FROM material.default_storage_use
     OR target_location.storage_condition IS DISTINCT FROM material.required_storage_condition THEN
    RAISE EXCEPTION 'The configured correction destination is not compatible with this prepared ingredient.' USING ERRCODE = '23514';
  END IF;

  new_stock := material.current_stock - lot.quantity;
  IF lot.quantity <= 0 OR new_stock < 0 THEN
    RAISE EXCEPTION 'The prepared ingredient lot quantity is inconsistent with available stock.' USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(sum(available_lot.quantity), 0),
         coalesce(sum(available_lot.remaining_value), 0)
  INTO other_lot_quantity, other_lot_value
  FROM public.raw_material_lots AS available_lot
  WHERE available_lot.raw_material_id = material.id
    AND available_lot.status = 'available'
    AND available_lot.id <> lot.id;
  IF other_lot_quantity <> new_stock THEN
    RAISE EXCEPTION 'The material stock aggregate does not reconcile with its available lots.' USING ERRCODE = '23514';
  END IF;
  new_average_cost := CASE WHEN new_stock = 0 THEN 0
    ELSE round(other_lot_value / new_stock, 4) END;

  correction_notes := format(
    'Retención y corrección de almacenamiento; inspección %s; estado previo %s; condición previa %s; ubicación previa %s; destino %s; cantidad %s; valor conservado %s; motivo: %s',
    inspection.id, lot.status, coalesce(lot.storage_condition, 'sin clasificar'),
    coalesce(lot.inventory_location_id::text, 'sin ubicación'), target_location.id,
    lot.quantity, lot.remaining_value, correction_reason
  );

  UPDATE public.raw_material_lots
  SET status = 'hold',
      storage_condition = material.required_storage_condition,
      inventory_location_id = target_location.id,
      updated_at = now()
  WHERE id = lot.id;
  UPDATE public.raw_materials
  SET current_stock = new_stock,
      average_cost = new_average_cost,
      updated_at = now()
  WHERE id = material.id;

  INSERT INTO public.inventory_movements (
    item_type, item_id, movement_type, quantity, previous_stock, new_stock,
    reference_type, reference_id, notes, created_by
  ) VALUES (
    'raw_material', material.id, 'exit', lot.quantity,
    material.current_stock, new_stock,
    'prepared_ingredient_storage_correction', lot.id,
    correction_notes, auth.uid()
  ) RETURNING * INTO existing_movement;

  RETURN existing_movement.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_new_quality_release_after_storage_correction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  correction_inspection_id uuid;
  release_inspection_id uuid;
BEGIN
  IF OLD.status = 'hold' AND NEW.status = 'available'
     AND EXISTS (
       SELECT 1 FROM public.inventory_movements AS correction
       WHERE correction.reference_type = 'prepared_ingredient_storage_correction'
         AND correction.reference_id = NEW.id
     ) THEN
    SELECT (regexp_match(correction.notes, 'inspección ([0-9a-f-]{36});'))[1]::uuid
    INTO correction_inspection_id
    FROM public.inventory_movements AS correction
    WHERE correction.reference_type = 'prepared_ingredient_storage_correction'
      AND correction.reference_id = NEW.id;
    SELECT release.inspection_id INTO release_inspection_id
    FROM public.quality_release_decisions AS release
    JOIN public.quality_inspections AS new_inspection
      ON new_inspection.id = release.inspection_id
    WHERE release.subject_type = 'raw_material_lot'
      AND release.raw_material_lot_id = NEW.id
      AND release.decision = 'release'
      AND release.inspection_id <> correction_inspection_id
      AND new_inspection.status = 'passed'
      AND (new_inspection.inspected_at, new_inspection.id) > (
        SELECT original.inspected_at, original.id
        FROM public.quality_inspections AS original
        WHERE original.id = correction_inspection_id
      )
    ORDER BY new_inspection.inspected_at DESC, new_inspection.id DESC
    LIMIT 1;
    IF correction_inspection_id IS NULL
       OR release_inspection_id IS NULL
       THEN
      RAISE EXCEPTION 'A new passed Quality inspection is required after storage correction.' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.require_new_quality_release_after_storage_correction()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS raw_material_lots_new_quality_after_storage_correction ON public.raw_material_lots;
CREATE TRIGGER raw_material_lots_new_quality_after_storage_correction
  BEFORE UPDATE OF status ON public.raw_material_lots
  FOR EACH ROW EXECUTE FUNCTION public.require_new_quality_release_after_storage_correction();

REVOKE ALL ON FUNCTION public.retain_prepared_ingredient_for_storage_correction(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.retain_prepared_ingredient_for_storage_correction(uuid, text)
  TO authenticated;
