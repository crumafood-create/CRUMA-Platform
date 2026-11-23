-- Route prepared ingredient lots through Quality before they enter available stock.
ALTER TABLE public.raw_material_lots
  ADD COLUMN IF NOT EXISTS storage_condition text,
  DROP CONSTRAINT IF EXISTS raw_material_lots_storage_condition_check,
  ADD CONSTRAINT raw_material_lots_storage_condition_check
    CHECK (storage_condition IS NULL OR storage_condition IN ('dry', 'refrigerated'));

ALTER TABLE public.quality_inspections
  ALTER COLUMN purchase_receipt_item_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS quality_inspections_subject_check,
  ADD CONSTRAINT quality_inspections_subject_check
    CHECK (
      (subject_type = 'production_output'
       AND production_order_id IS NOT NULL
       AND production_output_id IS NOT NULL
       AND raw_material_lot_id IS NULL
       AND purchase_receipt_item_id IS NULL)
      OR
      (subject_type = 'raw_material_lot'
       AND production_order_id IS NULL
       AND production_output_id IS NULL
       AND raw_material_lot_id IS NOT NULL)
      OR
      (subject_type = 'product_lot_quality_sample'
       AND production_order_id IS NOT NULL
       AND production_output_id IS NOT NULL
       AND raw_material_lot_id IS NULL
       AND purchase_receipt_item_id IS NULL
       AND product_lot_quality_sample_id IS NOT NULL)
    );

ALTER TABLE public.quality_release_decisions
  ALTER COLUMN purchase_receipt_item_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS quality_release_decisions_subject_check,
  ADD CONSTRAINT quality_release_decisions_subject_check
    CHECK (
      (subject_type = 'production_output'
       AND production_order_id IS NOT NULL
       AND production_output_id IS NOT NULL
       AND raw_material_lot_id IS NULL
       AND purchase_receipt_item_id IS NULL)
      OR
      (subject_type = 'raw_material_lot'
       AND production_order_id IS NULL
       AND production_output_id IS NULL
       AND raw_material_lot_id IS NOT NULL)
    );

CREATE OR REPLACE FUNCTION public.record_cheese_cut(
  p_source_lot_id uuid,
  p_stick_presentation text,
  p_stick_material_id uuid,
  p_trim_material_id uuid,
  p_source_quantity_kg numeric,
  p_piece_count integer,
  p_stick_weight_kg numeric,
  p_trim_weight_kg numeric,
  p_waste_weight_kg numeric,
  p_idempotency_key uuid,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  source_lot public.raw_material_lots%ROWTYPE;
  source_material public.raw_materials%ROWTYPE;
  stick_material public.raw_materials%ROWTYPE;
  trim_material public.raw_materials%ROWTYPE;
  source_unit_code text;
  stick_unit_code text;
  trim_unit_code text;
  op_id uuid;
  v_output_lot_id uuid;
  v_secondary_lot_id uuid;
  source_previous numeric(18,4);
  stick_previous numeric(18,4);
  trim_previous numeric(18,4);
  input_cost numeric(18,4);
  stick_cost numeric(18,4);
  trim_cost numeric(18,4);
  waste_cost numeric(18,4);
  unexplained_quantity numeric(18,4);
  unexplained_cost numeric(18,4);
  stick_unit_cost numeric(18,4);
  trim_unit_cost numeric(18,4);
  rounding_residual numeric(18,4);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Cheese preparation requires an administrator.';
  END IF;
  IF p_source_lot_id IS NULL OR p_stick_presentation IS NULL
     OR p_stick_presentation NOT IN ('party', 'traditional')
     OR p_stick_material_id IS NULL OR p_trim_material_id IS NULL
     OR p_idempotency_key IS NULL OR p_source_quantity_kg IS NULL OR p_source_quantity_kg <= 0
     OR p_piece_count IS NULL OR p_piece_count <= 0
     OR p_stick_weight_kg IS NULL OR p_stick_weight_kg <= 0
     OR p_trim_weight_kg IS NULL OR p_trim_weight_kg < 0
     OR p_waste_weight_kg IS NULL OR p_waste_weight_kg < 0
     OR p_stick_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_trim_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_waste_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_source_quantity_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_source_quantity_kg <> round(p_source_quantity_kg, 4)
     OR p_stick_weight_kg <> round(p_stick_weight_kg, 4)
     OR p_trim_weight_kg <> round(p_trim_weight_kg, 4)
     OR p_waste_weight_kg <> round(p_waste_weight_kg, 4)
     OR NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Cheese cut data is invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  SELECT id INTO op_id FROM public.cheese_preparation_operations
  WHERE idempotency_key = p_idempotency_key;
  IF op_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.cheese_preparation_operations
      WHERE id = op_id AND operation_type = 'cut' AND source_lot_id = p_source_lot_id
        AND stick_presentation = p_stick_presentation
        AND output_material_id = p_stick_material_id AND secondary_material_id = p_trim_material_id
        AND source_quantity = p_source_quantity_kg
        AND piece_count = p_piece_count AND output_weight_kg = p_stick_weight_kg
        AND secondary_quantity = p_trim_weight_kg AND waste_quantity = p_waste_weight_kg
        AND reason = btrim(p_reason)
    ) THEN RAISE EXCEPTION 'Idempotency key was reused with different cheese cut data.' USING ERRCODE = '23505'; END IF;
    RETURN op_id;
  END IF;

  SELECT * INTO source_lot FROM public.raw_material_lots WHERE id = p_source_lot_id FOR UPDATE;
  IF NOT FOUND OR source_lot.status <> 'available'
     OR (source_lot.expiration_date IS NOT NULL AND source_lot.expiration_date < current_date) THEN
    RAISE EXCEPTION 'Cheese source lot is unavailable or expired.' USING ERRCODE = '23514';
  END IF;
  PERFORM 1 FROM public.raw_materials
  WHERE id = ANY (ARRAY[source_lot.raw_material_id, p_stick_material_id, p_trim_material_id])
  ORDER BY id FOR UPDATE;
  SELECT * INTO source_material FROM public.raw_materials WHERE id = source_lot.raw_material_id;
  SELECT * INTO stick_material FROM public.raw_materials WHERE id = p_stick_material_id;
  SELECT * INTO trim_material FROM public.raw_materials WHERE id = p_trim_material_id;
  IF source_material.id IS NULL OR stick_material.id IS NULL OR trim_material.id IS NULL
     OR NOT source_material.is_active OR source_material.deleted_at IS NOT NULL
     OR NOT stick_material.is_active OR stick_material.deleted_at IS NOT NULL
     OR NOT trim_material.is_active OR trim_material.deleted_at IS NOT NULL
     OR p_stick_material_id = p_trim_material_id OR source_lot.raw_material_id IN (p_stick_material_id, p_trim_material_id)
     OR trim_material.internal_code IS DISTINCT FROM 'MP-QSO-RECORTE'
     OR stick_material.internal_code IS DISTINCT FROM (CASE p_stick_presentation
       WHEN 'party' THEN 'MP-PAL-QUESO-PARTY'
       ELSE 'MP-PAL-QUESO-TRAD'
     END) THEN
    RAISE EXCEPTION 'Cheese preparation materials are unavailable or not distinct.' USING ERRCODE = '23514';
  END IF;
  SELECT code INTO source_unit_code FROM public.units_of_measure WHERE id = source_material.unit_of_measure_id AND is_active AND deleted_at IS NULL;
  SELECT code INTO stick_unit_code FROM public.units_of_measure WHERE id = stick_material.unit_of_measure_id AND is_active AND deleted_at IS NULL;
  SELECT code INTO trim_unit_code FROM public.units_of_measure WHERE id = trim_material.unit_of_measure_id AND is_active AND deleted_at IS NULL;
  IF source_unit_code IS DISTINCT FROM 'kg' OR trim_unit_code IS DISTINCT FROM 'kg'
     OR stick_unit_code IS NULL OR stick_unit_code NOT IN ('pza', 'pieza') THEN
    RAISE EXCEPTION 'Cheese input and trim must use kg; sticks must use pieces.' USING ERRCODE = '23514';
  END IF;

  -- The recorded cut quantity is the actual portion removed, not necessarily the full lot.
  IF p_source_quantity_kg > source_lot.quantity
     OR p_source_quantity_kg > source_material.current_stock
     OR p_stick_weight_kg + p_trim_weight_kg + p_waste_weight_kg > p_source_quantity_kg THEN
    RAISE EXCEPTION 'Cheese cut outputs exceed available lot quantity.' USING ERRCODE = '23514';
  END IF;
  -- This cycle cuts the full weighed portion. Any unassigned difference stays visible as unexplained weight.
  unexplained_quantity := p_source_quantity_kg - p_stick_weight_kg - p_trim_weight_kg - p_waste_weight_kg;
  input_cost := CASE
    WHEN p_source_quantity_kg = source_lot.quantity THEN source_lot.remaining_value
    ELSE round(source_lot.remaining_value * p_source_quantity_kg / source_lot.quantity, 4)
  END;
  stick_cost := round(p_stick_weight_kg * source_lot.unit_cost, 4);
  trim_cost := round(p_trim_weight_kg * source_lot.unit_cost, 4);
  waste_cost := round(p_waste_weight_kg * source_lot.unit_cost, 4);
  unexplained_cost := round(unexplained_quantity * source_lot.unit_cost, 4);
  rounding_residual := input_cost - stick_cost - trim_cost - waste_cost - unexplained_cost;
  -- Assign the four-decimal rounding residual to the largest non-waste weight bucket.
  -- This keeps measured waste cost separate and prevents a negative unexplained cost.
  IF p_stick_weight_kg >= p_trim_weight_kg AND p_stick_weight_kg >= unexplained_quantity THEN
    stick_cost := stick_cost + rounding_residual;
  ELSIF p_trim_weight_kg >= unexplained_quantity THEN
    trim_cost := trim_cost + rounding_residual;
  ELSE
    unexplained_cost := unexplained_cost + rounding_residual;
  END IF;
  IF stick_cost < 0 OR trim_cost < 0 OR unexplained_cost < 0 THEN
    RAISE EXCEPTION 'Cheese cut cost allocation is invalid.' USING ERRCODE = '23514';
  END IF;
  stick_unit_cost := round(stick_cost / p_piece_count, 4);
  trim_unit_cost := CASE WHEN p_trim_weight_kg > 0 THEN round(trim_cost / p_trim_weight_kg, 4) ELSE source_lot.unit_cost END;
  source_previous := source_material.current_stock;
  stick_previous := stick_material.current_stock;
  trim_previous := trim_material.current_stock;

  INSERT INTO public.cheese_preparation_operations (
    idempotency_key, operation_type, source_lot_id, source_material_id,
    source_quantity, source_unit_cost, source_cost, output_material_id,
    output_quantity, output_weight_kg, output_cost, stick_presentation, secondary_material_id,
    secondary_quantity, secondary_cost, waste_quantity, waste_cost,
    unexplained_quantity, unexplained_cost, piece_count, reason, created_by
  ) VALUES (
    p_idempotency_key, 'cut', source_lot.id, source_material.id,
    p_source_quantity_kg, source_lot.unit_cost,
    input_cost, stick_material.id, p_piece_count, p_stick_weight_kg, stick_cost,
    p_stick_presentation, trim_material.id, p_trim_weight_kg, trim_cost, p_waste_weight_kg,
    waste_cost, unexplained_quantity, unexplained_cost, p_piece_count, btrim(p_reason), auth.uid()
  ) RETURNING id INTO op_id;

  UPDATE public.raw_material_lots SET quantity = quantity - p_source_quantity_kg,
    status = CASE WHEN quantity - p_source_quantity_kg = 0 THEN 'depleted' ELSE status END,
    updated_at = now() WHERE id = source_lot.id;
  UPDATE public.raw_materials SET current_stock = source_previous - p_source_quantity_kg, updated_at = now()
    WHERE id = source_material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', source_material.id, 'exit', p_source_quantity_kg,
    source_previous, source_previous - p_source_quantity_kg, 'cheese_preparation', op_id,
    'Corte de queso; origen ' || source_lot.lot_number || '; costo insumo ' || input_cost::text, auth.uid());

  INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, remaining_value, status, inventory_location_id)
  VALUES (stick_material.id, 'CHEESE-CUT-' || replace(op_id::text, '-', ''), NULL,
    p_piece_count, stick_unit_cost, stick_cost, 'quarantine', NULL) RETURNING id INTO v_output_lot_id;
  IF p_trim_weight_kg > 0 THEN
    INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, remaining_value, status, inventory_location_id)
    VALUES (trim_material.id, 'CHEESE-TRIM-' || replace(op_id::text, '-', ''), NULL,
      p_trim_weight_kg, trim_unit_cost, trim_cost, 'quarantine', NULL) RETURNING id INTO v_secondary_lot_id;
  END IF;
  UPDATE public.cheese_preparation_operations AS operation
  SET output_lot_id = v_output_lot_id, secondary_lot_id = v_secondary_lot_id WHERE operation.id = op_id;
  RETURN op_id;
END;
$$;

-- Remove the old ham-only freezing path. Ingredient preparation outputs use
-- dry or refrigerated storage; freezing belongs to finished-product handling.
DROP FUNCTION public.record_ham_grating(uuid, uuid, uuid, numeric, numeric, numeric, uuid, text);
DROP FUNCTION public.confirm_ham_grating_freezing(uuid);

-- Replace the ham RPC with the same weighed-input contract, without a freezer
-- location. The output remains quarantined until Quality supplies its storage
-- type, physical location, and internal expiration date.
CREATE OR REPLACE FUNCTION public.record_ham_grating(
  p_source_lot_id uuid,
  p_grated_material_id uuid,
  p_source_quantity_kg numeric,
  p_grated_weight_kg numeric,
  p_waste_weight_kg numeric,
  p_idempotency_key uuid,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  source_lot public.raw_material_lots%ROWTYPE;
  source_material public.raw_materials%ROWTYPE;
  target_material public.raw_materials%ROWTYPE;
  op_id uuid;
  v_output_lot_id uuid;
  source_previous numeric(18,4);
  input_cost numeric(18,4);
  output_cost numeric(18,4);
  waste_cost numeric(18,4);
  unexplained_quantity numeric(18,4);
  unexplained_cost numeric(18,4);
  output_unit_cost numeric(18,4);
  rounding_residual numeric(18,4);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Ham grating requires an administrator.';
  END IF;
  IF p_source_lot_id IS NULL OR p_grated_material_id IS NULL
     OR p_idempotency_key IS NULL OR p_source_quantity_kg IS NULL OR p_source_quantity_kg <= 0
     OR p_source_quantity_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_source_quantity_kg <> round(p_source_quantity_kg, 4)
     OR p_grated_weight_kg IS NULL OR p_grated_weight_kg <= 0
     OR p_waste_weight_kg IS NULL OR p_waste_weight_kg < 0
     OR p_grated_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_waste_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_grated_weight_kg <> round(p_grated_weight_kg, 4)
     OR p_waste_weight_kg <> round(p_waste_weight_kg, 4)
     OR NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Ham grating data is invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  SELECT id INTO op_id FROM public.cheese_preparation_operations
  WHERE idempotency_key = p_idempotency_key;
  IF op_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.cheese_preparation_operations AS operation
      JOIN public.raw_material_lots AS output_lot ON output_lot.id = operation.output_lot_id
      WHERE operation.id = op_id AND operation.operation_type = 'grate'
        AND operation.source_lot_id = p_source_lot_id
        AND operation.output_material_id = p_grated_material_id
        AND operation.source_quantity = p_source_quantity_kg
        AND operation.output_weight_kg = p_grated_weight_kg
        AND operation.waste_quantity = p_waste_weight_kg
        AND operation.reason = btrim(p_reason)
        AND output_lot.status = 'quarantine'
        AND operation.source_material_id = (SELECT id FROM public.raw_materials WHERE internal_code = 'MP-JAMON')
        AND operation.output_material_id = (SELECT id FROM public.raw_materials WHERE internal_code = 'MP-JAM-RALLADO')
    ) THEN
      RAISE EXCEPTION 'Idempotency key was reused with different ham grating data.' USING ERRCODE = '23505';
    END IF;
    RETURN op_id;
  END IF;

  SELECT * INTO source_lot FROM public.raw_material_lots WHERE id = p_source_lot_id FOR UPDATE;
  IF NOT FOUND OR source_lot.status <> 'available'
     OR (source_lot.expiration_date IS NOT NULL AND source_lot.expiration_date < current_date) THEN
    RAISE EXCEPTION 'Ham source lot is unavailable or expired.' USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM public.raw_materials
  WHERE id = ANY (ARRAY[source_lot.raw_material_id, p_grated_material_id])
  ORDER BY id FOR UPDATE;
  SELECT * INTO source_material FROM public.raw_materials WHERE id = source_lot.raw_material_id;
  SELECT * INTO target_material FROM public.raw_materials WHERE id = p_grated_material_id;
  IF source_material.id IS NULL OR target_material.id IS NULL
     OR source_material.id = target_material.id
     OR NOT source_material.is_active OR source_material.deleted_at IS NOT NULL
     OR NOT target_material.is_active OR target_material.deleted_at IS NOT NULL
     OR source_material.internal_code IS DISTINCT FROM 'MP-JAMON'
     OR target_material.internal_code IS DISTINCT FROM 'MP-JAM-RALLADO' THEN
    RAISE EXCEPTION 'Ham source or grated material is unavailable.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.units_of_measure
    WHERE id = source_material.unit_of_measure_id AND code = 'kg' AND is_active AND deleted_at IS NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM public.units_of_measure
    WHERE id = target_material.unit_of_measure_id AND code = 'kg' AND is_active AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Ham and grated ham must use kg.' USING ERRCODE = '23514';
  END IF;
  IF p_source_quantity_kg > source_lot.quantity
     OR p_source_quantity_kg > source_material.current_stock
     OR p_grated_weight_kg + p_waste_weight_kg > p_source_quantity_kg THEN
    RAISE EXCEPTION 'Ham grating outputs exceed weighed or available input.' USING ERRCODE = '23514';
  END IF;

  unexplained_quantity := p_source_quantity_kg - p_grated_weight_kg - p_waste_weight_kg;
  input_cost := CASE WHEN p_source_quantity_kg = source_lot.quantity THEN source_lot.remaining_value
    ELSE round(source_lot.remaining_value * p_source_quantity_kg / source_lot.quantity, 4) END;
  output_cost := round(p_grated_weight_kg * source_lot.unit_cost, 4);
  waste_cost := round(p_waste_weight_kg * source_lot.unit_cost, 4);
  unexplained_cost := round(unexplained_quantity * source_lot.unit_cost, 4);
  rounding_residual := input_cost - output_cost - waste_cost - unexplained_cost;
  IF p_grated_weight_kg >= unexplained_quantity THEN
    output_cost := output_cost + rounding_residual;
  ELSE
    unexplained_cost := unexplained_cost + rounding_residual;
  END IF;
  IF output_cost < 0 OR unexplained_cost < 0 THEN
    RAISE EXCEPTION 'Ham grating cost allocation is invalid.' USING ERRCODE = '23514';
  END IF;

  output_unit_cost := round(output_cost / p_grated_weight_kg, 4);
  source_previous := source_material.current_stock;
  INSERT INTO public.cheese_preparation_operations (
    idempotency_key, operation_type, source_lot_id, source_material_id,
    source_quantity, source_unit_cost, source_cost, output_material_id,
    output_quantity, output_weight_kg, output_cost, waste_quantity, waste_cost,
    unexplained_quantity, unexplained_cost, reason, created_by
  ) VALUES (
    p_idempotency_key, 'grate', source_lot.id, source_material.id,
    p_source_quantity_kg, source_lot.unit_cost, input_cost, target_material.id,
    p_grated_weight_kg, p_grated_weight_kg, output_cost, p_waste_weight_kg,
    waste_cost, unexplained_quantity, unexplained_cost, btrim(p_reason), auth.uid()
  ) RETURNING id INTO op_id;

  UPDATE public.raw_material_lots
  SET quantity = quantity - p_source_quantity_kg,
      status = CASE WHEN quantity - p_source_quantity_kg = 0 THEN 'depleted' ELSE status END,
      updated_at = now()
  WHERE id = source_lot.id;
  UPDATE public.raw_materials SET current_stock = source_previous - p_source_quantity_kg, updated_at = now()
  WHERE id = source_material.id;
  INSERT INTO public.inventory_movements (
    item_type, item_id, movement_type, quantity, previous_stock, new_stock,
    reference_type, reference_id, notes, created_by
  ) VALUES (
    'raw_material', source_material.id, 'exit', p_source_quantity_kg,
    source_previous, source_previous - p_source_quantity_kg,
    'ingredient_preparation', op_id,
    'Rallado de jamón; origen ' || source_lot.lot_number || '; costo asignado ' || input_cost::text,
    auth.uid()
  );

  INSERT INTO public.raw_material_lots (
    raw_material_id, lot_number, expiration_date, quantity, unit_cost,
    remaining_value, status, inventory_location_id, storage_condition
  ) VALUES (
    target_material.id, 'HAM-GRATED-' || replace(op_id::text, '-', ''), NULL,
    p_grated_weight_kg, output_unit_cost, output_cost, 'quarantine', NULL, NULL
  ) RETURNING id INTO v_output_lot_id;
  UPDATE public.cheese_preparation_operations SET output_lot_id = v_output_lot_id WHERE id = op_id;
  RETURN op_id;
END;
$$;

-- Move only the unconsumed remainder of previously available preparation
-- outputs into quarantine. Existing lot quantities, values, and prior ledger
-- rows remain intact; one explicit exit records the change in availability.
DO $$
DECLARE
  material_row record;
  lot_row record;
  previous_stock numeric(18,4);
  running_stock numeric(18,4);
  value_removed numeric(18,4);
  available_quantity numeric(18,4);
  available_value numeric(18,4);
BEGIN
  FOR material_row IN
    SELECT DISTINCT lot.raw_material_id
    FROM public.raw_material_lots AS lot
    JOIN public.cheese_preparation_operations AS operation
      ON operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
    WHERE lot.status = 'available' AND lot.quantity > 0
    ORDER BY lot.raw_material_id
  LOOP
    SELECT material.current_stock, material.average_cost
    INTO previous_stock, value_removed
    FROM public.raw_materials AS material
    WHERE material.id = material_row.raw_material_id
    FOR UPDATE;
    running_stock := previous_stock;
    value_removed := 0;

    FOR lot_row IN
      SELECT lot.id, lot.lot_number, lot.quantity, lot.remaining_value
      FROM public.raw_material_lots AS lot
      JOIN public.cheese_preparation_operations AS operation
        ON operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
      WHERE lot.raw_material_id = material_row.raw_material_id
        AND lot.status = 'available' AND lot.quantity > 0
      ORDER BY lot.created_at, lot.id
      FOR UPDATE OF lot
    LOOP
      IF running_stock < lot_row.quantity THEN
        RAISE EXCEPTION 'Prepared ingredient lot balance exceeds material stock during Quality transition.'
          USING ERRCODE = '23514';
      END IF;

      UPDATE public.raw_material_lots
      SET status = 'quarantine', storage_condition = NULL,
          expiration_date = NULL, inventory_location_id = NULL, updated_at = now()
      WHERE id = lot_row.id;

      INSERT INTO public.inventory_movements (
        item_type, item_id, movement_type, quantity, previous_stock, new_stock,
        reference_type, reference_id, notes
      ) VALUES (
        'raw_material', material_row.raw_material_id, 'exit', lot_row.quantity,
        running_stock, running_stock - lot_row.quantity,
        'ingredient_preparation_quality_transition', lot_row.id,
        'Saldo remanente apartado para revisión de condición y caducidad por Calidad; lote ' || lot_row.lot_number
      );

      running_stock := running_stock - lot_row.quantity;
      value_removed := value_removed + lot_row.remaining_value;
    END LOOP;

    SELECT coalesce(sum(lot.quantity), 0), coalesce(sum(lot.remaining_value), 0)
    INTO available_quantity, available_value
    FROM public.raw_material_lots AS lot
    WHERE lot.raw_material_id = material_row.raw_material_id
      AND lot.status = 'available' AND lot.quantity > 0;
    IF available_quantity <> running_stock THEN
      RAISE EXCEPTION 'Available lot quantity does not reconcile during prepared ingredient Quality transition.'
        USING ERRCODE = '23514';
    END IF;

    UPDATE public.raw_materials
    SET current_stock = running_stock,
        average_cost = CASE WHEN running_stock = 0 THEN 0 ELSE round(available_value / running_stock, 4) END,
        updated_at = now()
    WHERE id = material_row.raw_material_id;
  END LOOP;

  UPDATE public.raw_material_lots AS lot
  SET status = 'quarantine', storage_condition = NULL,
      expiration_date = NULL, inventory_location_id = NULL, updated_at = now()
  WHERE lot.status = 'freezing'
    AND EXISTS (
      SELECT 1 FROM public.cheese_preparation_operations AS operation
      WHERE operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_prepared_ingredient_quality_inspection(
  p_lot_id uuid,
  p_sampled_quantity numeric,
  p_notes text,
  p_criteria jsonb,
  p_defects jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  lot public.raw_material_lots%ROWTYPE;
  v_inspection_id uuid;
  rejected_quantity numeric(18,4);
  failed_count integer;
  critical_count integer;
  inspection_result text;
  inspection_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Prepared ingredient Quality inspection requires an administrator.';
  END IF;
  IF p_lot_id IS NULL OR p_sampled_quantity IS NULL OR p_sampled_quantity <= 0
     OR p_sampled_quantity::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_sampled_quantity <> round(p_sampled_quantity, 4) THEN
    RAISE EXCEPTION 'Sampled quantity must be positive and use the lot unit.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_criteria) IS DISTINCT FROM 'array' OR jsonb_array_length(p_criteria) = 0
     OR jsonb_typeof(p_defects) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Prepared ingredient inspection requires criteria and a defects array.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_criteria) AS criterion(item)
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(item->>'criterion'), '') IS NULL
      OR jsonb_typeof(item->'passed') IS DISTINCT FROM 'boolean'
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_defects) AS defect(item)
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(item->>'defect_type'), '') IS NULL
      OR item->>'severity' NOT IN ('minor', 'major', 'critical')
      OR coalesce(item->>'quantity', '') !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,4})?$'
      OR (item->>'quantity')::numeric <= 0
  ) THEN
    RAISE EXCEPTION 'Prepared ingredient inspection data is invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO lot FROM public.raw_material_lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND OR lot.status NOT IN ('quarantine', 'hold') OR p_sampled_quantity > lot.quantity THEN
    RAISE EXCEPTION 'Prepared ingredient lot is unavailable for inspection or sample exceeds its quantity.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.cheese_preparation_operations AS operation
    WHERE operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
  ) THEN
    RAISE EXCEPTION 'Raw material lot has no valid ingredient preparation origin.' USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(sum((item->>'quantity')::numeric), 0)::numeric(18,4)
  INTO rejected_quantity
  FROM jsonb_array_elements(p_defects) AS defect(item);
  IF rejected_quantity > p_sampled_quantity THEN
    RAISE EXCEPTION 'Rejected quantity exceeds sampled quantity.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.quality_inspections (
    inspector_id, status, sampled_quantity, accepted_quantity, rejected_quantity,
    notes, subject_type, raw_material_lot_id, purchase_receipt_item_id
  ) VALUES (
    auth.uid(), 'pending', p_sampled_quantity, 0, 0,
    NULLIF(btrim(p_notes), ''), 'raw_material_lot', lot.id, NULL
  ) RETURNING id INTO v_inspection_id;

  INSERT INTO public.quality_inspection_items (
    inspection_id, criterion, expected_value, actual_value, passed, notes
  )
  SELECT v_inspection_id, btrim(item->>'criterion'),
    NULLIF(btrim(item->>'expected_value'), ''), NULLIF(btrim(item->>'actual_value'), ''),
    (item->>'passed')::boolean, NULLIF(btrim(item->>'notes'), '')
  FROM jsonb_array_elements(p_criteria) AS criterion(item);

  INSERT INTO public.quality_defects (
    inspection_id, defect_type, severity, quantity, description
  )
  SELECT v_inspection_id, btrim(item->>'defect_type'), item->>'severity',
    (item->>'quantity')::numeric(18,4), NULLIF(btrim(item->>'description'), '')
  FROM jsonb_array_elements(p_defects) AS defect(item);

  SELECT count(*) FILTER (WHERE NOT passed)::integer INTO failed_count
  FROM public.quality_inspection_items WHERE quality_inspection_items.inspection_id = v_inspection_id;
  SELECT count(*) FILTER (WHERE severity = 'critical')::integer INTO critical_count
  FROM public.quality_defects WHERE quality_defects.inspection_id = v_inspection_id;

  IF critical_count > 0 THEN
    inspection_result := 'reject'; inspection_status := 'failed';
  ELSIF failed_count > 0 OR rejected_quantity > 0 THEN
    inspection_result := 'rework'; inspection_status := 'hold';
  ELSE
    inspection_result := 'ok'; inspection_status := 'passed';
  END IF;
  UPDATE public.quality_inspections
  SET result = inspection_result, status = inspection_status,
      accepted_quantity = p_sampled_quantity - rejected_quantity,
      rejected_quantity = rejected_quantity
  WHERE id = v_inspection_id;
  UPDATE public.raw_material_lots
  SET status = CASE WHEN inspection_status = 'passed' THEN 'quarantine' ELSE 'hold' END,
      updated_at = now()
  WHERE id = lot.id;
  RETURN v_inspection_id;
END;
$$;


REVOKE ALL ON FUNCTION public.record_ham_grating(uuid, uuid, numeric, numeric, numeric, uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_ham_grating(uuid, uuid, numeric, numeric, numeric, uuid, text)
  TO authenticated;



CREATE OR REPLACE FUNCTION public.record_cheese_grating(
  p_trim_lot_id uuid,
  p_grated_material_id uuid,
  p_source_quantity_kg numeric,
  p_grated_weight_kg numeric,
  p_waste_weight_kg numeric,
  p_idempotency_key uuid,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  source_lot public.raw_material_lots%ROWTYPE;
  source_material public.raw_materials%ROWTYPE;
  target_material public.raw_materials%ROWTYPE;
  source_unit_code text;
  target_unit_code text;
  op_id uuid;
  v_output_lot_id uuid;
  source_previous numeric(18,4);
  target_previous numeric(18,4);
  input_cost numeric(18,4);
  output_cost numeric(18,4);
  waste_cost numeric(18,4);
  unexplained_quantity numeric(18,4);
  unexplained_cost numeric(18,4);
  output_unit_cost numeric(18,4);
  removed_quantity numeric(18,4);
  rounding_residual numeric(18,4);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Cheese grating requires an administrator.';
  END IF;
  IF p_trim_lot_id IS NULL OR p_grated_material_id IS NULL OR p_idempotency_key IS NULL
     OR p_source_quantity_kg IS NULL OR p_source_quantity_kg <= 0
     OR p_source_quantity_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_source_quantity_kg <> round(p_source_quantity_kg, 4)
     OR p_grated_weight_kg IS NULL OR p_grated_weight_kg <= 0
     OR p_waste_weight_kg IS NULL OR p_waste_weight_kg < 0
     OR p_grated_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_waste_weight_kg::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_grated_weight_kg <> round(p_grated_weight_kg, 4)
     OR p_waste_weight_kg <> round(p_waste_weight_kg, 4)
     OR NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Cheese grating data is invalid.' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  SELECT id INTO op_id FROM public.cheese_preparation_operations WHERE idempotency_key = p_idempotency_key;
  IF op_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.cheese_preparation_operations WHERE id = op_id
      AND operation_type = 'grate' AND source_lot_id = p_trim_lot_id
      AND output_material_id = p_grated_material_id AND output_weight_kg = p_grated_weight_kg
      AND source_quantity = p_source_quantity_kg
      AND waste_quantity = p_waste_weight_kg AND reason = btrim(p_reason)) THEN
      RAISE EXCEPTION 'Idempotency key was reused with different cheese grating data.' USING ERRCODE = '23505';
    END IF;
    RETURN op_id;
  END IF;
  SELECT * INTO source_lot FROM public.raw_material_lots WHERE id = p_trim_lot_id FOR UPDATE;
  IF NOT FOUND OR source_lot.status <> 'available'
     OR (source_lot.expiration_date IS NOT NULL AND source_lot.expiration_date < current_date) THEN
    RAISE EXCEPTION 'Cheese trim lot is unavailable or expired.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.cheese_preparation_operations AS cut_operation
    WHERE cut_operation.operation_type = 'cut'
      AND cut_operation.secondary_lot_id = source_lot.id
  ) THEN
    RAISE EXCEPTION 'Only trim lots produced by a recorded cheese cut can be grated.' USING ERRCODE = '23514';
  END IF;
  PERFORM 1 FROM public.raw_materials
  WHERE id = ANY (ARRAY[source_lot.raw_material_id, p_grated_material_id])
  ORDER BY id FOR UPDATE;
  SELECT * INTO source_material FROM public.raw_materials WHERE id = source_lot.raw_material_id;
  SELECT * INTO target_material FROM public.raw_materials WHERE id = p_grated_material_id;
  IF source_material.id IS NULL OR target_material.id IS NULL OR source_material.id = target_material.id
     OR NOT source_material.is_active OR source_material.deleted_at IS NOT NULL
     OR NOT target_material.is_active OR target_material.deleted_at IS NOT NULL
     OR source_material.internal_code IS DISTINCT FROM 'MP-QSO-RECORTE'
     OR target_material.internal_code IS DISTINCT FROM 'MP-QSO-RALLADO' THEN
    RAISE EXCEPTION 'Cheese trim or grated material is unavailable.' USING ERRCODE = '23514';
  END IF;
  SELECT code INTO source_unit_code FROM public.units_of_measure WHERE id = source_material.unit_of_measure_id AND is_active AND deleted_at IS NULL;
  SELECT code INTO target_unit_code FROM public.units_of_measure WHERE id = target_material.unit_of_measure_id AND is_active AND deleted_at IS NULL;
  IF source_unit_code IS DISTINCT FROM 'kg' OR target_unit_code IS DISTINCT FROM 'kg' THEN
    RAISE EXCEPTION 'Cheese trim and grated cheese must use kg.' USING ERRCODE = '23514';
  END IF;
  removed_quantity := p_source_quantity_kg;
  IF p_grated_weight_kg + p_waste_weight_kg > removed_quantity THEN
    RAISE EXCEPTION 'Grated output and waste exceed the weighed trim input.' USING ERRCODE = '23514';
  END IF;
  IF removed_quantity > source_lot.quantity OR removed_quantity > source_material.current_stock THEN
    RAISE EXCEPTION 'Grating outputs exceed available trim quantity.' USING ERRCODE = '23514';
  END IF;
  unexplained_quantity := removed_quantity - p_grated_weight_kg - p_waste_weight_kg;
  input_cost := CASE
    WHEN removed_quantity = source_lot.quantity THEN source_lot.remaining_value
    ELSE round(source_lot.remaining_value * removed_quantity / source_lot.quantity, 4)
  END;
  output_cost := round(p_grated_weight_kg * source_lot.unit_cost, 4);
  waste_cost := round(p_waste_weight_kg * source_lot.unit_cost, 4);
  unexplained_cost := round(unexplained_quantity * source_lot.unit_cost, 4);
  rounding_residual := input_cost - output_cost - waste_cost - unexplained_cost;
  -- Assign rounding to the largest non-waste weight bucket; measured waste remains separate.
  IF p_grated_weight_kg >= unexplained_quantity THEN
    output_cost := output_cost + rounding_residual;
  ELSE
    unexplained_cost := unexplained_cost + rounding_residual;
  END IF;
  IF output_cost < 0 OR unexplained_cost < 0 THEN
    RAISE EXCEPTION 'Cheese grating cost allocation is invalid.' USING ERRCODE = '23514';
  END IF;
  output_unit_cost := round(output_cost / p_grated_weight_kg, 4);
  source_previous := source_material.current_stock;
  target_previous := target_material.current_stock;
  INSERT INTO public.cheese_preparation_operations (
    idempotency_key, operation_type, source_lot_id, source_material_id,
    source_quantity, source_unit_cost, source_cost, output_material_id,
    output_quantity, output_weight_kg, output_cost, waste_quantity, waste_cost,
    unexplained_quantity, unexplained_cost, reason, created_by
  ) VALUES (
    p_idempotency_key, 'grate', source_lot.id, source_material.id, removed_quantity,
    source_lot.unit_cost, input_cost, target_material.id, p_grated_weight_kg,
    p_grated_weight_kg, output_cost, p_waste_weight_kg, waste_cost,
    unexplained_quantity, unexplained_cost, btrim(p_reason), auth.uid()
  ) RETURNING id INTO op_id;

  UPDATE public.raw_material_lots SET quantity = quantity - removed_quantity,
    status = CASE WHEN quantity - removed_quantity = 0 THEN 'depleted' ELSE status END, updated_at = now()
    WHERE id = source_lot.id;
  UPDATE public.raw_materials SET current_stock = source_previous - removed_quantity, updated_at = now()
    WHERE id = source_material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', source_material.id, 'exit', removed_quantity, source_previous, source_previous - removed_quantity,
    'cheese_preparation', op_id, 'Rallado de recorte; origen ' || source_lot.lot_number || '; costo insumo ' || input_cost::text, auth.uid());

  INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, remaining_value, status, inventory_location_id)
  VALUES (target_material.id, 'CHEESE-GRATED-' || replace(op_id::text, '-', ''), NULL,
    p_grated_weight_kg, output_unit_cost, output_cost, 'quarantine', NULL) RETURNING id INTO v_output_lot_id;
  UPDATE public.cheese_preparation_operations AS operation
  SET output_lot_id = v_output_lot_id WHERE operation.id = op_id;
  RETURN op_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_prepared_ingredient_quality_lot(
  p_inspection_id uuid,
  p_storage_condition text,
  p_inventory_location_id uuid,
  p_expiration_date date,
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
  source_expiration_date date;
  existing_decision public.quality_release_decisions%ROWTYPE;
  decision_id uuid;
  new_stock numeric(18,4);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Prepared ingredient release requires an administrator.';
  END IF;
  IF p_inspection_id IS NULL OR p_storage_condition IS NULL
     OR p_storage_condition NOT IN ('dry', 'refrigerated')
     OR p_inventory_location_id IS NULL OR p_expiration_date IS NULL
     OR p_expiration_date < current_date THEN
    RAISE EXCEPTION 'Quality must provide a valid storage condition, location, and internal expiration date.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO inspection FROM public.quality_inspections
  WHERE id = p_inspection_id AND subject_type = 'raw_material_lot'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prepared ingredient inspection was not found.' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO lot FROM public.raw_material_lots
  WHERE id = inspection.raw_material_lot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prepared ingredient lot was not found.' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO existing_decision FROM public.quality_release_decisions
  WHERE inspection_id = inspection.id AND subject_type = 'raw_material_lot'
    AND raw_material_lot_id = lot.id AND decision = 'release'
  ORDER BY approved_at DESC, id DESC LIMIT 1;
  IF lot.status = 'available' THEN
    IF existing_decision.id IS NOT NULL
       AND lot.storage_condition = p_storage_condition
       AND lot.inventory_location_id = p_inventory_location_id
       AND lot.expiration_date = p_expiration_date
       AND existing_decision.reason IS NOT DISTINCT FROM NULLIF(btrim(p_reason), '') THEN
      RETURN existing_decision.id;
    END IF;
    RAISE EXCEPTION 'Prepared ingredient lot already has a different final disposition.' USING ERRCODE = '23514';
  END IF;
  IF lot.status NOT IN ('quarantine', 'hold') OR inspection.status IS DISTINCT FROM 'passed' THEN
    RAISE EXCEPTION 'Prepared ingredient inspection cannot be released.' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.quality_inspections AS newer
    WHERE newer.raw_material_lot_id = inspection.raw_material_lot_id
      AND (newer.inspected_at, newer.id) > (inspection.inspected_at, inspection.id)
  ) THEN
    RAISE EXCEPTION 'A newer prepared ingredient inspection exists.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.cheese_preparation_operations AS operation
    WHERE operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
  ) THEN
    RAISE EXCEPTION 'Prepared ingredient lot has no valid preparation origin.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations AS location
    WHERE location.id = p_inventory_location_id AND location.is_active AND location.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Quality storage location is unavailable.' USING ERRCODE = '23514';
  END IF;

  SELECT source_lot.expiration_date INTO source_expiration_date
  FROM public.cheese_preparation_operations AS operation
  JOIN public.raw_material_lots AS source_lot ON source_lot.id = operation.source_lot_id
  WHERE operation.output_lot_id = lot.id OR operation.secondary_lot_id = lot.id
  ORDER BY operation.created_at, operation.id LIMIT 1;
  IF source_expiration_date IS NOT NULL AND p_expiration_date >= source_expiration_date THEN
    RAISE EXCEPTION 'Internal expiration must be earlier than the source lot expiration.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO material FROM public.raw_materials
  WHERE id = lot.raw_material_id AND is_active AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prepared ingredient material is unavailable.' USING ERRCODE = '23514';
  END IF;
  new_stock := material.current_stock + lot.quantity;

  INSERT INTO public.quality_release_decisions (
    inspection_id, production_order_id, production_output_id, decision,
    approved_by, reason, subject_type, raw_material_lot_id, purchase_receipt_item_id
  ) VALUES (
    inspection.id, NULL, NULL, 'release', auth.uid(), NULLIF(btrim(p_reason), ''),
    'raw_material_lot', lot.id, NULL
  ) RETURNING id INTO decision_id;

  UPDATE public.raw_materials
  SET current_stock = new_stock,
      average_cost = CASE WHEN new_stock = 0 THEN 0
        ELSE round(((material.current_stock * material.average_cost) + lot.remaining_value) / new_stock, 4) END,
      last_cost = lot.unit_cost,
      updated_at = now()
  WHERE id = material.id;
  UPDATE public.raw_material_lots
  SET status = 'available', storage_condition = p_storage_condition,
      inventory_location_id = p_inventory_location_id,
      expiration_date = p_expiration_date, updated_at = now()
  WHERE id = lot.id;
  INSERT INTO public.inventory_movements (
    item_type, item_id, movement_type, quantity, previous_stock, new_stock,
    reference_type, reference_id, notes, created_by
  ) VALUES (
    'raw_material', material.id, 'entry', lot.quantity,
    material.current_stock, new_stock, 'prepared_ingredient_quality_release', decision_id,
    'Liberación de preparación; condición ' || p_storage_condition || '; caducidad interna ' || p_expiration_date::text || '; lote ' || lot.lot_number,
    auth.uid()
  );
  RETURN decision_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_prepared_ingredient_quality_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'available' AND OLD.status IN ('quarantine', 'hold')
     AND EXISTS (
       SELECT 1 FROM public.cheese_preparation_operations AS operation
       WHERE operation.output_lot_id = NEW.id OR operation.secondary_lot_id = NEW.id
     )
     AND (NEW.storage_condition IS NULL OR NEW.storage_condition NOT IN ('dry', 'refrigerated')
       OR NEW.expiration_date IS NULL OR NEW.inventory_location_id IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.quality_release_decisions AS release
         JOIN public.quality_inspections AS inspection ON inspection.id = release.inspection_id
         WHERE release.subject_type = 'raw_material_lot'
           AND release.raw_material_lot_id = NEW.id
           AND release.decision = 'release'
           AND inspection.status = 'passed'
       )) THEN
    RAISE EXCEPTION 'Prepared ingredient lot requires a passed Quality release, storage condition, location, and expiration.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS raw_material_lots_prepared_quality_storage ON public.raw_material_lots;
CREATE TRIGGER raw_material_lots_prepared_quality_storage
  BEFORE UPDATE OF status, storage_condition, expiration_date, inventory_location_id
  ON public.raw_material_lots
  FOR EACH ROW EXECUTE FUNCTION public.require_prepared_ingredient_quality_storage();

REVOKE ALL ON FUNCTION public.record_prepared_ingredient_quality_inspection(uuid, numeric, text, jsonb, jsonb)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_prepared_ingredient_quality_inspection(uuid, numeric, text, jsonb, jsonb)
  TO authenticated;
REVOKE ALL ON FUNCTION public.release_prepared_ingredient_quality_lot(uuid, text, uuid, date, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.release_prepared_ingredient_quality_lot(uuid, text, uuid, date, text)
  TO authenticated;
REVOKE ALL ON FUNCTION public.require_prepared_ingredient_quality_storage()
  FROM PUBLIC, anon, service_role;
