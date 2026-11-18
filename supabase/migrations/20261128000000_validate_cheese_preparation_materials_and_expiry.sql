-- Preserve exact remaining lot value, bind cheese outputs to their authorized materials,
-- and reject expired source lots in both preparation operations.
ALTER TABLE public.raw_material_lots
  ADD COLUMN remaining_value numeric(18,4);

UPDATE public.raw_material_lots
SET remaining_value = round(quantity * unit_cost, 4);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE remaining_value IS NULL
       OR remaining_value IS DISTINCT FROM round(quantity * unit_cost, 4)
  ) THEN
    RAISE EXCEPTION 'Existing raw material lot values were not initialized from their recorded quantity and unit cost.';
  END IF;
END;
$$;

ALTER TABLE public.raw_material_lots
  ALTER COLUMN remaining_value SET NOT NULL,
  ADD CONSTRAINT raw_material_lot_remaining_value_check
    CHECK (remaining_value >= 0 AND (quantity > 0 OR remaining_value = 0));

CREATE OR REPLACE FUNCTION public.preserve_raw_material_lot_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_removed_quantity numeric(18,4);
  v_removed_value numeric(18,4);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.remaining_value IS NULL THEN
      NEW.remaining_value := round(NEW.quantity * NEW.unit_cost, 4);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.quantity IS DISTINCT FROM OLD.quantity AND NEW.quantity < OLD.quantity THEN
    v_removed_quantity := OLD.quantity - NEW.quantity;
    v_removed_value := CASE
      WHEN NEW.quantity = 0 THEN OLD.remaining_value
      ELSE round(OLD.remaining_value * v_removed_quantity / OLD.quantity, 4)
    END;
    NEW.remaining_value := OLD.remaining_value - v_removed_value;
  ELSIF NEW.quantity IS DISTINCT FROM OLD.quantity AND NEW.quantity > OLD.quantity THEN
    NEW.remaining_value := OLD.remaining_value
      + round((NEW.quantity - OLD.quantity) * NEW.unit_cost, 4);
  ELSIF NEW.remaining_value IS DISTINCT FROM OLD.remaining_value THEN
    RAISE EXCEPTION 'Raw material lot remaining value is maintained by inventory movements.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.preserve_raw_material_lot_value() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER initialize_raw_material_lot_value
BEFORE INSERT ON public.raw_material_lots
FOR EACH ROW EXECUTE FUNCTION public.preserve_raw_material_lot_value();

CREATE TRIGGER preserve_raw_material_lot_value
BEFORE UPDATE ON public.raw_material_lots
FOR EACH ROW EXECUTE FUNCTION public.preserve_raw_material_lot_value();

ALTER TABLE public.production_order_consumptions
  DROP CONSTRAINT production_consumption_cost_check,
  ADD CONSTRAINT production_consumption_cost_check
    CHECK (quantity > 0 AND unit_cost >= 0 AND total_cost >= 0);

CREATE OR REPLACE FUNCTION public.snapshot_production_consumption_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lot public.raw_material_lots%ROWTYPE;
  v_allocated_cost numeric(18,4);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.raw_material_lot_id IS NOT DISTINCT FROM OLD.raw_material_lot_id
       AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity THEN
      NEW.unit_cost := OLD.unit_cost;
      NEW.total_cost := OLD.total_cost;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'A posted production material consumption cannot change its lot or quantity.'
      USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_lot
  FROM public.raw_material_lots
  WHERE id = NEW.raw_material_lot_id
  FOR UPDATE;

  IF NOT FOUND OR NEW.quantity > v_lot.quantity OR v_lot.quantity <= 0 THEN
    RAISE EXCEPTION 'Production consumption exceeds the remaining lot quantity.'
      USING ERRCODE = '23514';
  END IF;

  v_allocated_cost := CASE
    WHEN NEW.quantity = v_lot.quantity THEN v_lot.remaining_value
    ELSE round(v_lot.remaining_value * NEW.quantity / v_lot.quantity, 4)
  END;
  NEW.total_cost := v_allocated_cost;
  NEW.unit_cost := round(v_allocated_cost / NEW.quantity, 4);
  RETURN NEW;
END;
$$;

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
  VALUES (stick_material.id, 'CHEESE-CUT-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
    p_piece_count, stick_unit_cost, stick_cost, 'available', source_lot.inventory_location_id) RETURNING id INTO v_output_lot_id;
  UPDATE public.raw_materials SET current_stock = stick_previous + p_piece_count,
    average_cost = CASE WHEN stick_previous + p_piece_count = 0 THEN 0 ELSE round(((stick_previous * stick_material.average_cost) + stick_cost) / (stick_previous + p_piece_count), 4) END,
    last_cost = stick_unit_cost, updated_at = now() WHERE id = stick_material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', stick_material.id, 'entry', p_piece_count, stick_previous, stick_previous + p_piece_count, 'cheese_preparation', op_id,
    'Palitos Party/tradicionales; peso real ' || p_stick_weight_kg::text || ' kg; costo ' || stick_cost::text, auth.uid());

  IF p_trim_weight_kg > 0 THEN
    INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, remaining_value, status, inventory_location_id)
    VALUES (trim_material.id, 'CHEESE-TRIM-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
      p_trim_weight_kg, trim_unit_cost, trim_cost, 'available', source_lot.inventory_location_id) RETURNING id INTO v_secondary_lot_id;
    UPDATE public.raw_materials SET current_stock = trim_previous + p_trim_weight_kg,
      average_cost = CASE WHEN trim_previous + p_trim_weight_kg = 0 THEN 0 ELSE round(((trim_previous * trim_material.average_cost) + trim_cost) / (trim_previous + p_trim_weight_kg), 4) END,
      last_cost = trim_unit_cost, updated_at = now() WHERE id = trim_material.id;
    INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
    VALUES ('raw_material', trim_material.id, 'entry', p_trim_weight_kg, trim_previous, trim_previous + p_trim_weight_kg, 'cheese_preparation', op_id,
      'Recorte aprovechable; costo ' || trim_cost::text, auth.uid());
  END IF;
  UPDATE public.cheese_preparation_operations AS operation
  SET output_lot_id = v_output_lot_id, secondary_lot_id = v_secondary_lot_id WHERE operation.id = op_id;
  RETURN op_id;
END;
$$;


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
  VALUES (target_material.id, 'CHEESE-GRATED-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
    p_grated_weight_kg, output_unit_cost, output_cost, 'available', source_lot.inventory_location_id) RETURNING id INTO v_output_lot_id;
  UPDATE public.raw_materials SET current_stock = target_previous + p_grated_weight_kg,
    average_cost = CASE WHEN target_previous + p_grated_weight_kg = 0 THEN 0 ELSE round(((target_previous * target_material.average_cost) + output_cost) / (target_previous + p_grated_weight_kg), 4) END,
    last_cost = output_unit_cost, updated_at = now() WHERE id = target_material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', target_material.id, 'entry', p_grated_weight_kg, target_previous, target_previous + p_grated_weight_kg,
    'cheese_preparation', op_id, 'Queso rallado; costo ' || output_cost::text, auth.uid());
  UPDATE public.cheese_preparation_operations AS operation
  SET output_lot_id = v_output_lot_id WHERE operation.id = op_id;
  RETURN op_id;
END;
$$;
