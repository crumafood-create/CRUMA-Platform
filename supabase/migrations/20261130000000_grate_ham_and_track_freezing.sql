-- Keep grated ham out of production availability until its freezing step is
-- explicitly confirmed. The lot already holds its quantity and assigned value
-- while the aggregate available stock and inventory entry remain unchanged.
ALTER TABLE public.raw_material_lots
  DROP CONSTRAINT IF EXISTS raw_material_lots_status_check;

ALTER TABLE public.raw_material_lots
  ADD CONSTRAINT raw_material_lots_status_check
    CHECK (status IN ('quarantine', 'available', 'hold', 'rejected', 'depleted', 'freezing')) NOT VALID;

ALTER TABLE public.raw_material_lots
  VALIDATE CONSTRAINT raw_material_lots_status_check;

CREATE OR REPLACE FUNCTION public.record_ham_grating(
  p_source_lot_id uuid,
  p_grated_material_id uuid,
  p_freezing_location_id uuid,
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
  IF p_source_lot_id IS NULL OR p_grated_material_id IS NULL OR p_freezing_location_id IS NULL
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
      SELECT 1
      FROM public.cheese_preparation_operations AS operation
      JOIN public.raw_material_lots AS output_lot ON output_lot.id = operation.output_lot_id
      WHERE operation.id = op_id AND operation.operation_type = 'grate'
        AND operation.source_lot_id = p_source_lot_id
        AND operation.output_material_id = p_grated_material_id
        AND operation.source_quantity = p_source_quantity_kg
        AND operation.output_weight_kg = p_grated_weight_kg
        AND operation.waste_quantity = p_waste_weight_kg
        AND operation.reason = btrim(p_reason)
        AND output_lot.inventory_location_id = p_freezing_location_id
        AND operation.source_material_id = (
          SELECT id FROM public.raw_materials WHERE internal_code = 'MP-JAMON'
        )
        AND operation.output_material_id = (
          SELECT id FROM public.raw_materials WHERE internal_code = 'MP-JAM-RALLADO'
        )
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
     OR target_material.internal_code IS DISTINCT FROM 'MP-JAM-RALLADO'
     OR NOT EXISTS (
       SELECT 1 FROM public.inventory_locations AS location
       WHERE location.id = p_freezing_location_id AND location.is_active
         AND location.deleted_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Ham source, grated material, or freezing location is unavailable.' USING ERRCODE = '23514';
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
  input_cost := CASE
    WHEN p_source_quantity_kg = source_lot.quantity THEN source_lot.remaining_value
    ELSE round(source_lot.remaining_value * p_source_quantity_kg / source_lot.quantity, 4)
  END;
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
  UPDATE public.raw_materials
  SET current_stock = source_previous - p_source_quantity_kg, updated_at = now()
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
    remaining_value, status, inventory_location_id
  ) VALUES (
    target_material.id, 'HAM-GRATED-' || replace(op_id::text, '-', ''), source_lot.expiration_date,
    p_grated_weight_kg, output_unit_cost, output_cost, 'freezing', p_freezing_location_id
  ) RETURNING id INTO v_output_lot_id;
  UPDATE public.cheese_preparation_operations
  SET output_lot_id = v_output_lot_id
  WHERE id = op_id;
  RETURN op_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_ham_grating_freezing(p_operation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  operation public.cheese_preparation_operations%ROWTYPE;
  output_lot public.raw_material_lots%ROWTYPE;
  target_material public.raw_materials%ROWTYPE;
  previous_stock numeric(18,4);
  new_stock numeric(18,4);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Confirming ham freezing requires an administrator.';
  END IF;
  IF p_operation_id IS NULL THEN
    RAISE EXCEPTION 'A ham grating operation is required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO operation FROM public.cheese_preparation_operations
  WHERE id = p_operation_id FOR UPDATE;
  IF NOT FOUND OR operation.operation_type <> 'grate'
     OR NOT EXISTS (
       SELECT 1 FROM public.raw_materials
       WHERE id = operation.source_material_id AND internal_code = 'MP-JAMON'
     )
     OR NOT EXISTS (
       SELECT 1 FROM public.raw_materials
       WHERE id = operation.output_material_id AND internal_code = 'MP-JAM-RALLADO'
     ) THEN
    RAISE EXCEPTION 'The operation is not a recorded ham grating.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO output_lot FROM public.raw_material_lots
  WHERE id = operation.output_lot_id FOR UPDATE;
  IF NOT FOUND OR output_lot.raw_material_id <> operation.output_material_id THEN
    RAISE EXCEPTION 'The grated ham lot is missing or does not match its operation.' USING ERRCODE = '23514';
  END IF;
  IF output_lot.status = 'available' THEN
    IF (SELECT count(*) FROM public.inventory_movements
        WHERE reference_type = 'ingredient_preparation' AND reference_id = operation.id
          AND movement_type = 'entry') <> 1 THEN
      RAISE EXCEPTION 'The available ham lot has no unique freezing confirmation movement.' USING ERRCODE = '23514';
    END IF;
    RETURN operation.id;
  END IF;
  IF output_lot.status <> 'freezing' THEN
    RAISE EXCEPTION 'The grated ham lot is not pending freezing.' USING ERRCODE = '23514';
  END IF;
  IF output_lot.expiration_date IS NOT NULL AND output_lot.expiration_date < current_date THEN
    RAISE EXCEPTION 'The grated ham lot expired before freezing was confirmed.' USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM public.raw_materials WHERE id = operation.output_material_id FOR UPDATE;
  SELECT * INTO target_material FROM public.raw_materials WHERE id = operation.output_material_id;
  previous_stock := target_material.current_stock;
  new_stock := previous_stock + output_lot.quantity;
  UPDATE public.raw_materials
  SET current_stock = new_stock,
      average_cost = CASE WHEN new_stock = 0 THEN 0
        ELSE round(((previous_stock * target_material.average_cost) + output_lot.remaining_value) / new_stock, 4) END,
      last_cost = output_lot.unit_cost,
      updated_at = now()
  WHERE id = target_material.id;
  UPDATE public.raw_material_lots SET status = 'available', updated_at = now()
  WHERE id = output_lot.id;
  INSERT INTO public.inventory_movements (
    item_type, item_id, movement_type, quantity, previous_stock, new_stock,
    reference_type, reference_id, notes, created_by
  ) VALUES (
    'raw_material', target_material.id, 'entry', output_lot.quantity,
    previous_stock, new_stock, 'ingredient_preparation', operation.id,
    'Congelación de jamón rallado confirmada; lote ' || output_lot.lot_number,
    auth.uid()
  );
  RETURN operation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_ham_grating(uuid, uuid, uuid, numeric, numeric, numeric, uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_ham_grating(uuid, uuid, uuid, numeric, numeric, numeric, uuid, text)
  TO authenticated;
REVOKE ALL ON FUNCTION public.confirm_ham_grating_freezing(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_ham_grating_freezing(uuid)
  TO authenticated;
