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
  quality_sample public.product_lot_quality_samples%ROWTYPE;
  product_lot public.product_lots%ROWTYPE;
  production_output public.production_outputs%ROWTYPE;
  v_inspection_id uuid;
  output_count integer;
  rejected_quantity integer;
  failed_criteria integer;
  critical_defects integer;
  result_value text;
  status_value text;
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

  SELECT * INTO quality_sample
  FROM public.product_lot_quality_samples AS sample
  WHERE sample.id = p_sample_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quality sample was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF quality_sample.purpose <> 'immediate_inspection'
    OR quality_sample.status <> 'pending_inspection' THEN
    RAISE check_violation USING MESSAGE = 'Quality sample already has an inspection or is not awaiting inspection.';
  END IF;

  SELECT * INTO product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = quality_sample.product_lot_id;
  IF NOT FOUND OR product_lot.production_order_id IS NULL THEN
    RAISE check_violation USING MESSAGE = 'Quality sample has no production source.';
  END IF;

  SELECT count(*)::integer INTO output_count
  FROM public.production_outputs AS output
  WHERE output.production_order_id = product_lot.production_order_id
    AND output.product_id = product_lot.product_id
    AND output.quality_status = 'released';
  IF output_count <> 1 THEN
    RAISE check_violation USING MESSAGE = 'Quality sample must identify exactly one released production output.';
  END IF;
  SELECT * INTO production_output
  FROM public.production_outputs AS output
  WHERE output.production_order_id = product_lot.production_order_id
    AND output.product_id = product_lot.product_id
    AND output.quality_status = 'released';

  SELECT coalesce(sum((defect->>'quantity')::integer), 0)::integer
  INTO rejected_quantity
  FROM jsonb_array_elements(p_defects) AS defect;
  IF rejected_quantity > quality_sample.quantity THEN
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
    product_lot.production_order_id,
    production_output.id,
    auth.uid(),
    'product_lot_quality_sample',
    quality_sample.id,
    quality_sample.quantity,
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
  INTO failed_criteria
  FROM public.quality_inspection_items AS item
  WHERE item.inspection_id = v_inspection_id;
  SELECT count(*) FILTER (WHERE defect.severity = 'critical')::integer,
    coalesce(sum(defect.quantity), 0)::integer
  INTO critical_defects, rejected_quantity
  FROM public.quality_defects AS defect
  WHERE defect.inspection_id = v_inspection_id;

  rejected_quantity := least(quality_sample.quantity, rejected_quantity);
  IF critical_defects > 0 THEN
    result_value := 'reject';
    status_value := 'failed';
  ELSIF failed_criteria > 0 OR rejected_quantity > 0 THEN
    result_value := 'rework';
    status_value := 'hold';
  ELSE
    result_value := 'ok';
    status_value := 'passed';
  END IF;

  UPDATE public.quality_inspections AS inspection
  SET result = result_value,
    status = status_value,
    accepted_quantity = quality_sample.quantity - rejected_quantity,
    rejected_quantity = rejected_quantity
  WHERE inspection.id = v_inspection_id;

  UPDATE public.product_lot_quality_samples AS sample
  SET status = 'pending_disposition'
  WHERE sample.id = quality_sample.id
    AND sample.status = 'pending_inspection';
  IF NOT FOUND THEN
    RAISE check_violation USING MESSAGE = 'Quality sample changed before inspection was recorded.';
  END IF;

  RETURN v_inspection_id;
END;
$function$;
