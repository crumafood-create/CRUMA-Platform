-- Avoid collision between the PL/pgSQL variable and quality_inspections.rejected_quantity.

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
  v_rejected_quantity numeric(18,4);
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
  INTO v_rejected_quantity
  FROM jsonb_array_elements(p_defects) AS defect(item);
  IF v_rejected_quantity > p_sampled_quantity THEN
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
  ELSIF failed_count > 0 OR v_rejected_quantity > 0 THEN
    inspection_result := 'rework'; inspection_status := 'hold';
  ELSE
    inspection_result := 'ok'; inspection_status := 'passed';
  END IF;
  UPDATE public.quality_inspections
  SET result = inspection_result, status = inspection_status,
      accepted_quantity = p_sampled_quantity - v_rejected_quantity,
      rejected_quantity = v_rejected_quantity
  WHERE id = v_inspection_id;
  UPDATE public.raw_material_lots
  SET status = CASE WHEN inspection_status = 'passed' THEN 'quarantine' ELSE 'hold' END,
      updated_at = now()
  WHERE id = lot.id;
  RETURN v_inspection_id;
END;
$$;
