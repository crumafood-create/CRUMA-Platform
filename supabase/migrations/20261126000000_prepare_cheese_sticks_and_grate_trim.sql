CREATE TABLE public.cheese_preparation_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  operation_type text NOT NULL CHECK (operation_type IN ('cut', 'grate')),
  source_lot_id uuid NOT NULL REFERENCES public.raw_material_lots(id) ON DELETE RESTRICT,
  source_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  source_quantity numeric(18,4) NOT NULL CHECK (source_quantity > 0),
  source_unit_cost numeric(18,4) NOT NULL CHECK (source_unit_cost >= 0),
  source_cost numeric(18,4) NOT NULL CHECK (source_cost >= 0),
  output_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  output_lot_id uuid REFERENCES public.raw_material_lots(id) ON DELETE RESTRICT,
  output_quantity numeric(18,4) NOT NULL CHECK (output_quantity > 0),
  output_weight_kg numeric(18,4) NOT NULL CHECK (output_weight_kg > 0),
  output_cost numeric(18,4) NOT NULL CHECK (output_cost >= 0),
  stick_presentation text CHECK (stick_presentation IN ('party', 'traditional')),
  secondary_material_id uuid REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  secondary_lot_id uuid REFERENCES public.raw_material_lots(id) ON DELETE RESTRICT,
  secondary_quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (secondary_quantity >= 0),
  secondary_cost numeric(18,4) NOT NULL DEFAULT 0 CHECK (secondary_cost >= 0),
  waste_quantity numeric(18,4) NOT NULL CHECK (waste_quantity >= 0),
  waste_cost numeric(18,4) NOT NULL CHECK (waste_cost >= 0),
  unexplained_quantity numeric(18,4) NOT NULL CHECK (unexplained_quantity >= 0),
  unexplained_cost numeric(18,4) NOT NULL CHECK (unexplained_cost >= 0),
  piece_count integer,
  reason text NOT NULL CHECK (btrim(reason) <> ''),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cheese_preparation_cost_reconciliation CHECK (
    source_cost = output_cost + secondary_cost + waste_cost + unexplained_cost
  ),
  CONSTRAINT cheese_preparation_output_shape CHECK (
    (operation_type = 'cut' AND piece_count IS NOT NULL AND piece_count > 0
      AND stick_presentation IS NOT NULL
      AND secondary_material_id IS NOT NULL)
    OR (operation_type = 'grate' AND piece_count IS NULL
      AND stick_presentation IS NULL AND secondary_material_id IS NULL AND secondary_quantity = 0
      AND secondary_cost = 0)
  ),
  CONSTRAINT cheese_preparation_quantity_reconciliation CHECK (
    source_quantity = output_weight_kg + secondary_quantity + waste_quantity + unexplained_quantity
  )
);

CREATE INDEX cheese_preparation_source_lot_idx
  ON public.cheese_preparation_operations(source_lot_id, created_at);
CREATE INDEX cheese_preparation_output_lot_idx
  ON public.cheese_preparation_operations(output_lot_id)
  WHERE output_lot_id IS NOT NULL;

ALTER TABLE public.cheese_preparation_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cheese_preparation_operations FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.cheese_preparation_operations TO authenticated;
CREATE POLICY cheese_preparation_operations_admin_read
  ON public.cheese_preparation_operations
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

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
  IF NOT FOUND OR source_lot.status <> 'available' THEN
    RAISE EXCEPTION 'Cheese source lot is unavailable.' USING ERRCODE = '23514';
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
     OR p_stick_material_id = p_trim_material_id OR source_lot.raw_material_id IN (p_stick_material_id, p_trim_material_id) THEN
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
  input_cost := round(p_source_quantity_kg * source_lot.unit_cost, 4);
  stick_cost := round(p_stick_weight_kg * source_lot.unit_cost, 4);
  trim_cost := round(p_trim_weight_kg * source_lot.unit_cost, 4);
  waste_cost := round(p_waste_weight_kg * source_lot.unit_cost, 4);
  unexplained_cost := input_cost - stick_cost - trim_cost - waste_cost;
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

  INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, status, inventory_location_id)
  VALUES (stick_material.id, 'CHEESE-CUT-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
    p_piece_count, stick_unit_cost, 'available', source_lot.inventory_location_id) RETURNING id INTO v_output_lot_id;
  UPDATE public.raw_materials SET current_stock = stick_previous + p_piece_count,
    average_cost = CASE WHEN stick_previous + p_piece_count = 0 THEN 0 ELSE round(((stick_previous * stick_material.average_cost) + (p_piece_count * stick_unit_cost)) / (stick_previous + p_piece_count), 4) END,
    last_cost = stick_unit_cost, updated_at = now() WHERE id = stick_material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', stick_material.id, 'entry', p_piece_count, stick_previous, stick_previous + p_piece_count, 'cheese_preparation', op_id,
    'Palitos Party/tradicionales; peso real ' || p_stick_weight_kg::text || ' kg; costo ' || stick_cost::text, auth.uid());

  IF p_trim_weight_kg > 0 THEN
    INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, status, inventory_location_id)
    VALUES (trim_material.id, 'CHEESE-TRIM-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
      p_trim_weight_kg, trim_unit_cost, 'available', source_lot.inventory_location_id) RETURNING id INTO v_secondary_lot_id;
    UPDATE public.raw_materials SET current_stock = trim_previous + p_trim_weight_kg,
      average_cost = CASE WHEN trim_previous + p_trim_weight_kg = 0 THEN 0 ELSE round(((trim_previous * trim_material.average_cost) + (p_trim_weight_kg * trim_unit_cost)) / (trim_previous + p_trim_weight_kg), 4) END,
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
  IF NOT FOUND OR source_lot.status <> 'available' THEN
    RAISE EXCEPTION 'Cheese trim lot is unavailable.' USING ERRCODE = '23514';
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
     OR NOT target_material.is_active OR target_material.deleted_at IS NOT NULL THEN
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
  input_cost := round(removed_quantity * source_lot.unit_cost, 4);
  output_cost := round(p_grated_weight_kg * source_lot.unit_cost, 4);
  waste_cost := round(p_waste_weight_kg * source_lot.unit_cost, 4);
  unexplained_cost := input_cost - output_cost - waste_cost;
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

  INSERT INTO public.raw_material_lots (raw_material_id, lot_number, expiration_date, quantity, unit_cost, status, inventory_location_id)
  VALUES (target_material.id, 'CHEESE-GRATED-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
    p_grated_weight_kg, output_unit_cost, 'available', source_lot.inventory_location_id) RETURNING id INTO v_output_lot_id;
  UPDATE public.raw_materials SET current_stock = target_previous + p_grated_weight_kg,
    average_cost = CASE WHEN target_previous + p_grated_weight_kg = 0 THEN 0 ELSE round(((target_previous * target_material.average_cost) + (p_grated_weight_kg * output_unit_cost)) / (target_previous + p_grated_weight_kg), 4) END,
    last_cost = output_unit_cost, updated_at = now() WHERE id = target_material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', target_material.id, 'entry', p_grated_weight_kg, target_previous, target_previous + p_grated_weight_kg,
    'cheese_preparation', op_id, 'Queso rallado; costo ' || output_cost::text, auth.uid());
  UPDATE public.cheese_preparation_operations AS operation
  SET output_lot_id = v_output_lot_id WHERE operation.id = op_id;
  RETURN op_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_cheese_cut(uuid, text, uuid, uuid, numeric, integer, numeric, numeric, numeric, uuid, text)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.record_cheese_grating(uuid, uuid, numeric, numeric, numeric, uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_cheese_cut(uuid, text, uuid, uuid, numeric, integer, numeric, numeric, numeric, uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_cheese_grating(uuid, uuid, numeric, numeric, numeric, uuid, text)
  TO authenticated;
