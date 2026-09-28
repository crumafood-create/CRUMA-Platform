-- Extend the canonical quality model to inspect and release raw material lots.
-- A released lot becomes available as one atomic inventory transaction.

ALTER TABLE public.quality_inspections
  ALTER COLUMN production_order_id DROP NOT NULL,
  ALTER COLUMN production_output_id DROP NOT NULL,
  ALTER COLUMN sampled_quantity
    TYPE numeric(18,4)
    USING sampled_quantity::numeric(18,4),
  ALTER COLUMN accepted_quantity
    TYPE numeric(18,4)
    USING accepted_quantity::numeric(18,4),
  ALTER COLUMN rejected_quantity
    TYPE numeric(18,4)
    USING rejected_quantity::numeric(18,4),
  ADD COLUMN subject_type text
    NOT NULL DEFAULT 'production_output',
  ADD COLUMN raw_material_lot_id uuid
    REFERENCES public.raw_material_lots(id)
    ON DELETE RESTRICT,
  ADD COLUMN purchase_receipt_item_id uuid
    REFERENCES public.purchase_receipt_items(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT quality_inspections_subject_type_check
    CHECK (
      subject_type IN (
        'production_output',
        'raw_material_lot'
      )
    ),
  ADD CONSTRAINT quality_inspections_subject_check
    CHECK (
      (
        subject_type = 'production_output'
        AND production_order_id IS NOT NULL
        AND production_output_id IS NOT NULL
        AND raw_material_lot_id IS NULL
        AND purchase_receipt_item_id IS NULL
      )
      OR
      (
        subject_type = 'raw_material_lot'
        AND production_order_id IS NULL
        AND production_output_id IS NULL
        AND raw_material_lot_id IS NOT NULL
        AND purchase_receipt_item_id IS NOT NULL
      )
    );

ALTER TABLE public.quality_defects
  ALTER COLUMN quantity
    TYPE numeric(18,4)
    USING quantity::numeric(18,4);

ALTER TABLE public.inventory_movements
  ALTER COLUMN previous_stock
    TYPE numeric(18,4)
    USING previous_stock::numeric(18,4),
  ALTER COLUMN new_stock
    TYPE numeric(18,4)
    USING new_stock::numeric(18,4);

ALTER TABLE public.quality_release_decisions
  ALTER COLUMN production_order_id DROP NOT NULL,
  ALTER COLUMN production_output_id DROP NOT NULL,
  ADD COLUMN subject_type text
    NOT NULL DEFAULT 'production_output',
  ADD COLUMN raw_material_lot_id uuid
    REFERENCES public.raw_material_lots(id)
    ON DELETE RESTRICT,
  ADD COLUMN purchase_receipt_item_id uuid
    REFERENCES public.purchase_receipt_items(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT quality_release_decisions_subject_type_check
    CHECK (
      subject_type IN (
        'production_output',
        'raw_material_lot'
      )
    ),
  ADD CONSTRAINT quality_release_decisions_subject_check
    CHECK (
      (
        subject_type = 'production_output'
        AND production_order_id IS NOT NULL
        AND production_output_id IS NOT NULL
        AND raw_material_lot_id IS NULL
        AND purchase_receipt_item_id IS NULL
      )
      OR
      (
        subject_type = 'raw_material_lot'
        AND production_order_id IS NULL
        AND production_output_id IS NULL
        AND raw_material_lot_id IS NOT NULL
        AND purchase_receipt_item_id IS NOT NULL
      )
    );

CREATE INDEX quality_inspections_raw_material_lot_idx
  ON public.quality_inspections(
    raw_material_lot_id,
    inspected_at DESC
  )
  WHERE raw_material_lot_id IS NOT NULL;

CREATE INDEX quality_release_decisions_raw_material_lot_idx
  ON public.quality_release_decisions(
    raw_material_lot_id,
    approved_at DESC
  )
  WHERE raw_material_lot_id IS NOT NULL;

  DROP POLICY IF EXISTS
  raw_material_lots_admin_read
  ON public.raw_material_lots;

CREATE POLICY raw_material_lots_admin_read
  ON public.raw_material_lots
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION
  public.record_raw_material_quality_inspection(
    p_lot_id uuid,
    p_sampled_quantity numeric,
    p_notes text,
    p_criteria jsonb,
    p_defects jsonb
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  lot public.raw_material_lots%ROWTYPE;
  v_receipt_item_id uuid;
  v_inspection_id uuid;
  v_failed_criteria integer;
  v_critical_defects integer;
  v_rejected_quantity numeric(18,4);
  v_inspection_result text;
  v_inspection_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Raw material quality inspection requires an administrator.';
  END IF;

  IF p_lot_id IS NULL
     OR p_sampled_quantity IS NULL
     OR p_sampled_quantity <= 0 THEN
    RAISE EXCEPTION
      'Sampled quantity must be positive.'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_criteria) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_criteria) = 0 THEN
    RAISE EXCEPTION
      'Raw material inspection requires at least one criterion.'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_defects) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION
      'Raw material defects must be an array.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_criteria) AS item
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(item->>'criterion'), '') IS NULL
      OR jsonb_typeof(item->'passed')
        IS DISTINCT FROM 'boolean'
  ) THEN
    RAISE EXCEPTION
      'Raw material quality criterion is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_defects) AS defect
    WHERE jsonb_typeof(defect) IS DISTINCT FROM 'object'
      OR NULLIF(
        btrim(defect->>'defect_type'),
        ''
      ) IS NULL
      OR defect->>'severity'
        NOT IN ('minor', 'major', 'critical')
      OR coalesce(
        defect->>'quantity',
        ''
      ) !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,4})?$'
  ) THEN
    RAISE EXCEPTION
      'Raw material quality defect is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_defects) AS defect
    WHERE (defect->>'quantity')::numeric <= 0
  ) THEN
    RAISE EXCEPTION
      'Raw material defect quantity must be positive.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO lot
  FROM public.raw_material_lots
  WHERE id = p_lot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Raw material lot was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF lot.status NOT IN ('quarantine', 'hold') THEN
    RAISE EXCEPTION
      'Raw material lot cannot be inspected in its current state.'
      USING ERRCODE = '23514';
  END IF;

  IF p_sampled_quantity > lot.quantity THEN
    RAISE EXCEPTION
      'Sampled quantity exceeds lot quantity.'
      USING ERRCODE = '23514';
  END IF;

  SELECT receipt_item.id
  INTO v_receipt_item_id
  FROM public.purchase_receipt_items AS receipt_item
  WHERE receipt_item.raw_material_lot_id = lot.id
  ORDER BY receipt_item.created_at, receipt_item.id
  LIMIT 1;

  IF v_receipt_item_id IS NULL THEN
    RAISE EXCEPTION
      'Raw material lot is not linked to a purchase receipt.'
      USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(
    sum((defect->>'quantity')::numeric),
    0
  )::numeric(18,4)
  INTO v_rejected_quantity
  FROM jsonb_array_elements(p_defects) AS defect;

  IF v_rejected_quantity > p_sampled_quantity THEN
    RAISE EXCEPTION
      'Rejected quantity exceeds sampled quantity.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.quality_inspections (
    production_order_id,
    production_output_id,
    inspector_id,
    status,
    sampled_quantity,
    accepted_quantity,
    rejected_quantity,
    notes,
    subject_type,
    raw_material_lot_id,
    purchase_receipt_item_id
  )
  VALUES (
    NULL,
    NULL,
    auth.uid(),
    'pending',
    p_sampled_quantity,
    0,
    0,
    NULLIF(btrim(p_notes), ''),
    'raw_material_lot',
    lot.id,
    v_receipt_item_id
  )
  RETURNING id
  INTO v_inspection_id;

  INSERT INTO public.quality_inspection_items (
    inspection_id,
    criterion,
    expected_value,
    actual_value,
    passed,
    notes
  )
  SELECT
    v_inspection_id,
    btrim(item->>'criterion'),
    NULLIF(btrim(item->>'expected_value'), ''),
    NULLIF(btrim(item->>'actual_value'), ''),
    (item->>'passed')::boolean,
    NULLIF(btrim(item->>'notes'), '')
  FROM jsonb_array_elements(p_criteria) AS item;

  INSERT INTO public.quality_defects (
    inspection_id,
    defect_type,
    severity,
    quantity,
    description
  )
  SELECT
    v_inspection_id,
    btrim(defect->>'defect_type'),
    defect->>'severity',
    (defect->>'quantity')::numeric(18,4),
    NULLIF(btrim(defect->>'description'), '')
  FROM jsonb_array_elements(p_defects) AS defect;

  SELECT count(*) FILTER (
    WHERE NOT item.passed
  )::integer
  INTO v_failed_criteria
  FROM public.quality_inspection_items AS item
  WHERE item.inspection_id = v_inspection_id;

  SELECT count(*) FILTER (
    WHERE defect.severity = 'critical'
  )::integer
  INTO v_critical_defects
  FROM public.quality_defects AS defect
  WHERE defect.inspection_id = v_inspection_id;

  v_rejected_quantity :=
    LEAST(
      p_sampled_quantity,
      v_rejected_quantity
    );

  IF v_critical_defects > 0 THEN
    v_inspection_result := 'reject';
    v_inspection_status := 'failed';
  ELSIF v_failed_criteria > 0
        OR v_rejected_quantity > 0 THEN
    v_inspection_result := 'rework';
    v_inspection_status := 'hold';
  ELSE
    v_inspection_result := 'ok';
    v_inspection_status := 'passed';
  END IF;

  UPDATE public.quality_inspections
  SET result = v_inspection_result,
      status = v_inspection_status,
      accepted_quantity =
        p_sampled_quantity - v_rejected_quantity,
      rejected_quantity = v_rejected_quantity
  WHERE id = v_inspection_id;

  UPDATE public.raw_material_lots
  SET status = CASE
        WHEN v_inspection_status = 'passed'
          THEN 'quarantine'
        ELSE 'hold'
      END,
      updated_at = now()
  WHERE id = lot.id;

  RETURN v_inspection_id;
END;
$$;

CREATE OR REPLACE FUNCTION
  public.decide_raw_material_quality_release(
    p_inspection_id uuid,
    p_decision text,
    p_reason text
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inspection public.quality_inspections%ROWTYPE;
  lot public.raw_material_lots%ROWTYPE;
  material public.raw_materials%ROWTYPE;
  v_decision_id uuid;
  v_new_stock numeric(18,4);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Raw material quality decisions require an administrator.';
  END IF;

  IF p_decision IS NULL
     OR p_decision NOT IN (
       'release',
       'hold',
       'reject'
     ) THEN
    RAISE EXCEPTION
      'Raw material quality decision is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision IN ('hold', 'reject')
     AND NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION
      'Raw material quality decision reason is required.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO inspection
  FROM public.quality_inspections
  WHERE id = p_inspection_id
    AND subject_type = 'raw_material_lot'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Raw material quality inspection was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quality_inspections AS newer
    WHERE newer.raw_material_lot_id =
        inspection.raw_material_lot_id
      AND (
        newer.inspected_at,
        newer.id
      ) > (
        inspection.inspected_at,
        inspection.id
      )
  ) THEN
    RAISE EXCEPTION
      'A newer raw material quality inspection exists.'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO lot
  FROM public.raw_material_lots
  WHERE id = inspection.raw_material_lot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Raw material lot was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF lot.status NOT IN (
    'quarantine',
    'hold'
  ) THEN
    RAISE EXCEPTION
      'Raw material lot already has a final disposition.'
      USING ERRCODE = '23514';
  END IF;

  IF p_decision = 'release'
     AND inspection.status IS DISTINCT FROM 'passed' THEN
    RAISE EXCEPTION
      'Raw material inspection cannot be released.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.quality_release_decisions (
    inspection_id,
    production_order_id,
    production_output_id,
    decision,
    approved_by,
    reason,
    subject_type,
    raw_material_lot_id,
    purchase_receipt_item_id
  )
  VALUES (
    inspection.id,
    NULL,
    NULL,
    p_decision,
    auth.uid(),
    NULLIF(btrim(p_reason), ''),
    'raw_material_lot',
    lot.id,
    inspection.purchase_receipt_item_id
  )
  RETURNING id
  INTO v_decision_id;

  IF p_decision = 'release' THEN
    SELECT *
    INTO material
    FROM public.raw_materials
    WHERE id = lot.raw_material_id
      AND is_active = true
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Raw material is not available.'
        USING ERRCODE = '23514';
    END IF;

    v_new_stock :=
      material.current_stock + lot.quantity;

    UPDATE public.raw_materials
    SET average_cost = round(
          (
            (
              material.current_stock *
              material.average_cost
            ) +
            (
              lot.quantity *
              lot.unit_cost
            )
          ) /
          NULLIF(v_new_stock, 0),
          4
        ),
        last_cost = lot.unit_cost,
        current_stock =
          current_stock + lot.quantity,
        updated_at = now()
    WHERE id = material.id;

    INSERT INTO public.inventory_movements (
      item_type,
      item_id,
      movement_type,
      quantity,
      previous_stock,
      new_stock,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    VALUES (
      'raw_material',
      material.id,
      'entry',
      lot.quantity,
      material.current_stock,
      v_new_stock,
      'raw_material_quality_release',
      v_decision_id,
      'Liberación de calidad del lote ' ||
        lot.lot_number,
      auth.uid()
    );

    UPDATE public.raw_material_lots
    SET status = 'available',
        updated_at = now()
    WHERE id = lot.id;
  ELSIF p_decision = 'hold' THEN
    UPDATE public.raw_material_lots
    SET status = 'hold',
        updated_at = now()
    WHERE id = lot.id;
  ELSE
    UPDATE public.raw_material_lots
    SET status = 'rejected',
        updated_at = now()
    WHERE id = lot.id;
  END IF;

  RETURN v_decision_id;
END;
$$;

REVOKE ALL ON FUNCTION
  public.record_raw_material_quality_inspection(
    uuid,
    numeric,
    text,
    jsonb,
    jsonb
  )
  FROM PUBLIC, anon, service_role;

REVOKE ALL ON FUNCTION
  public.decide_raw_material_quality_release(
    uuid,
    text,
    text
  )
  FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION
  public.record_raw_material_quality_inspection(
    uuid,
    numeric,
    text,
    jsonb,
    jsonb
  )
  TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.decide_raw_material_quality_release(
    uuid,
    text,
    text
  )
  TO authenticated;
