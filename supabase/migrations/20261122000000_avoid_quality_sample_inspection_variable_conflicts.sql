CREATE OR REPLACE FUNCTION public.record_product_lot_quality_sample_inspection(
  p_sample_id uuid,
  p_notes text,
  p_criteria jsonb,
  p_defects jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_quality_sample public.product_lot_quality_samples%ROWTYPE;
  v_product_lot public.product_lots%ROWTYPE;
  v_production_output public.production_outputs%ROWTYPE;
  v_inspection_id uuid;
  v_output_count integer;
  v_rejected_quantity integer;
  v_failed_criteria integer;
  v_critical_defects integer;
  v_result_value text;
  v_status_value text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Quality inspection management requires an administrator.';
  END IF;

  IF p_sample_id IS NULL
    OR jsonb_typeof(p_criteria) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_criteria) = 0
    OR jsonb_typeof(p_defects) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Quality sample inspection data is invalid.'
      USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_criteria) AS criterion
    WHERE jsonb_typeof(criterion) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(criterion->>'criterion'), '') IS NULL
      OR jsonb_typeof(criterion->'passed') IS DISTINCT FROM 'boolean'
  ) THEN
    RAISE EXCEPTION 'Quality criterion is invalid.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_defects) AS defect
    WHERE jsonb_typeof(defect) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(defect->>'defect_type'), '') IS NULL
      OR defect->>'severity' NOT IN ('minor', 'major', 'critical')
      OR coalesce(defect->>'quantity', '') !~ '^[1-9][0-9]*$'
  ) THEN
    RAISE EXCEPTION 'Quality defect is invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_quality_sample
  FROM public.product_lot_quality_samples AS sample
  WHERE sample.id = p_sample_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quality sample was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF v_quality_sample.purpose <> 'immediate_inspection'
    OR v_quality_sample.status <> 'pending_inspection' THEN
    RAISE check_violation USING MESSAGE = 'Quality sample already has an inspection or is not awaiting inspection.';
  END IF;

  SELECT * INTO v_product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = v_quality_sample.product_lot_id;
  IF NOT FOUND OR v_product_lot.production_order_id IS NULL THEN
    RAISE check_violation USING MESSAGE = 'Quality sample has no production source.';
  END IF;

  SELECT count(*)::integer INTO v_output_count
  FROM public.production_outputs AS output
  WHERE output.production_order_id = v_product_lot.production_order_id
    AND output.product_id = v_product_lot.product_id
    AND output.quality_status = 'released';
  IF v_output_count <> 1 THEN
    RAISE check_violation USING MESSAGE = 'Quality sample must identify exactly one released production output.';
  END IF;
  SELECT * INTO v_production_output
  FROM public.production_outputs AS output
  WHERE output.production_order_id = v_product_lot.production_order_id
    AND output.product_id = v_product_lot.product_id
    AND output.quality_status = 'released';

  SELECT coalesce(sum((defect->>'quantity')::integer), 0)::integer
  INTO v_rejected_quantity
  FROM jsonb_array_elements(p_defects) AS defect;
  IF v_rejected_quantity > v_quality_sample.quantity THEN
    RAISE check_violation USING MESSAGE = 'Rejected quantity exceeds quality sample quantity.';
  END IF;

  INSERT INTO public.quality_inspections (
    production_order_id,
    production_output_id,
    inspector_id,
    subject_type,
    product_lot_quality_sample_id,
    sampled_quantity,
    notes
  ) VALUES (
    v_product_lot.production_order_id,
    v_production_output.id,
    auth.uid(),
    'product_lot_quality_sample',
    v_quality_sample.id,
    v_quality_sample.quantity,
    NULLIF(btrim(p_notes), '')
  ) RETURNING id INTO v_inspection_id;

  INSERT INTO public.quality_inspection_items (
    inspection_id, criterion, expected_value, actual_value, passed
  )
  SELECT v_inspection_id,
    btrim(criterion->>'criterion'),
    NULLIF(btrim(criterion->>'expected_value'), ''),
    NULLIF(btrim(criterion->>'actual_value'), ''),
    (criterion->>'passed')::boolean
  FROM jsonb_array_elements(p_criteria) AS criterion;

  INSERT INTO public.quality_defects (
    inspection_id, defect_type, severity, quantity, description
  )
  SELECT v_inspection_id,
    btrim(defect->>'defect_type'),
    defect->>'severity',
    (defect->>'quantity')::integer,
    NULLIF(btrim(defect->>'description'), '')
  FROM jsonb_array_elements(p_defects) AS defect;

  SELECT count(*) FILTER (WHERE NOT item.passed)::integer
  INTO v_failed_criteria
  FROM public.quality_inspection_items AS item
  WHERE item.inspection_id = v_inspection_id;
  SELECT count(*) FILTER (WHERE defect.severity = 'critical')::integer,
    coalesce(sum(defect.quantity), 0)::integer
  INTO v_critical_defects, v_rejected_quantity
  FROM public.quality_defects AS defect
  WHERE defect.inspection_id = v_inspection_id;

  v_rejected_quantity := least(v_quality_sample.quantity, v_rejected_quantity);
  IF v_critical_defects > 0 THEN
    v_result_value := 'reject';
    v_status_value := 'failed';
  ELSIF v_failed_criteria > 0 OR v_rejected_quantity > 0 THEN
    v_result_value := 'rework';
    v_status_value := 'hold';
  ELSE
    v_result_value := 'ok';
    v_status_value := 'passed';
  END IF;

  UPDATE public.quality_inspections AS inspection
  SET result = v_result_value,
    status = v_status_value,
    accepted_quantity = v_quality_sample.quantity - v_rejected_quantity,
    rejected_quantity = v_rejected_quantity
  WHERE inspection.id = v_inspection_id;

  UPDATE public.product_lot_quality_samples AS sample
  SET status = 'pending_disposition'
  WHERE sample.id = v_quality_sample.id
    AND sample.status = 'pending_inspection';
  IF NOT FOUND THEN
    RAISE check_violation USING MESSAGE = 'Quality sample changed before inspection was recorded.';
  END IF;

  RETURN v_inspection_id;
END;
$function$;
