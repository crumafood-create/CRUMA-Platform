-- Dispose nonconforming finished product atomically.

CREATE TABLE
  public.finished_product_nonconformance_disposition_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key uuid NOT NULL UNIQUE,
    quality_inspection_id uuid NOT NULL UNIQUE
      REFERENCES public.quality_inspections(id)
      ON DELETE RESTRICT,
    quality_release_decision_id uuid NOT NULL UNIQUE
      REFERENCES public.quality_release_decisions(id)
      ON DELETE RESTRICT,
    production_output_id uuid NOT NULL UNIQUE
      REFERENCES public.production_outputs(id)
      ON DELETE RESTRICT,
    disposition text NOT NULL
      CHECK (disposition IN ('scrap', 'rework')),
    disposed_quantity integer NOT NULL
      CHECK (disposed_quantity > 0),
    reason text NOT NULL
      CHECK (btrim(reason) <> '')
      CHECK (char_length(reason) <= 500),
    rework_production_order_id uuid UNIQUE
      REFERENCES public.production_orders(id)
      ON DELETE RESTRICT,
    disposed_by uuid NOT NULL
      REFERENCES public.profiles(id)
      ON DELETE RESTRICT,
    disposed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
      (
        disposition = 'scrap'
        AND rework_production_order_id IS NULL
      )
      OR (
        disposition = 'rework'
        AND rework_production_order_id IS NOT NULL
      )
    )
  );

CREATE INDEX
  finished_product_nonconformance_disposition_inspection_idx
ON
  public.finished_product_nonconformance_disposition_operations (
    quality_inspection_id,
    disposed_at DESC
  );

ALTER TABLE
  public.finished_product_nonconformance_disposition_operations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  finished_product_nonconformance_disposition_admin_read
ON
  public.finished_product_nonconformance_disposition_operations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE
  public.finished_product_nonconformance_disposition_operations
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.finished_product_nonconformance_disposition_operations
TO authenticated;

CREATE OR REPLACE FUNCTION
public.dispose_finished_product_nonconformance(
  p_inspection_id uuid,
  p_disposition text,
  p_reason text,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  inspection public.quality_inspections%ROWTYPE;
  output_row public.production_outputs%ROWTYPE;
  source_order public.production_orders%ROWTYPE;
  existing_operation
    public.finished_product_nonconformance_disposition_operations%ROWTYPE;
  v_disposition text;
  v_reason text;
  v_decision_id uuid;
  v_rework_order_id uuid;
  v_operation_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Finished product disposition requires an administrator.';
  END IF;

  IF p_inspection_id IS NULL THEN
    RAISE EXCEPTION
      'Quality inspection is required.'
      USING ERRCODE = '22023';
  END IF;

  v_disposition := lower(btrim(p_disposition));
  v_reason := btrim(p_reason);

  IF (
    v_disposition IS NULL
    OR v_disposition NOT IN (
      'scrap',
      'rework'
    )
  ) THEN
    RAISE EXCEPTION
      'Nonconformance disposition is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    v_reason IS NULL
    OR v_reason = ''
  ) THEN
    RAISE EXCEPTION
      'Disposition reason is required.'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(v_reason) > 500 THEN
    RAISE EXCEPTION
      'Disposition reason cannot exceed 500 characters.'
      USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Idempotency key is required.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      p_idempotency_key::text,
      0
    )
  );

  SELECT *
  INTO existing_operation
  FROM
    public.finished_product_nonconformance_disposition_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF (
      existing_operation.quality_inspection_id
        IS DISTINCT FROM p_inspection_id
      OR existing_operation.disposition
        IS DISTINCT FROM v_disposition
      OR existing_operation.reason
        IS DISTINCT FROM v_reason
    ) THEN
      RAISE unique_violation
        USING MESSAGE =
          'Idempotency key was reused with different data.';
    END IF;

    RETURN existing_operation.id;
  END IF;

  SELECT *
  INTO inspection
  FROM public.quality_inspections
  WHERE id = p_inspection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Quality inspection was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF (
    inspection.subject_type
      IS DISTINCT FROM 'production_output'
    OR inspection.production_output_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Quality inspection is not for a production output.'
      USING ERRCODE = '23514';
  END IF;

  IF (
    inspection.status NOT IN ('hold', 'failed')
    OR inspection.result NOT IN ('rework', 'reject')
  ) THEN
    RAISE EXCEPTION
      'Quality inspection is not nonconforming.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quality_inspections
      AS newer
    WHERE
      newer.production_output_id =
        inspection.production_output_id
      AND (
        newer.inspected_at,
        newer.id
      ) > (
        inspection.inspected_at,
        inspection.id
      )
  ) THEN
    RAISE EXCEPTION
      'A newer quality inspection exists.'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO output_row
  FROM public.production_outputs
  WHERE id = inspection.production_output_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production output was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF (
    output_row.production_order_id
      IS DISTINCT FROM
        inspection.production_order_id
  ) THEN
    RAISE EXCEPTION
      'Inspection and production output do not match.'
      USING ERRCODE = '23514';
  END IF;

  IF (
    output_row.quality_status
      NOT IN ('hold', 'rejected')
  ) THEN
    RAISE EXCEPTION
      'Production output is not nonconforming.'
      USING ERRCODE = '23514';
  END IF;

  IF output_row.quantity_produced <= 0 THEN
    RAISE EXCEPTION
      'Production output quantity must be positive.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quality_release_decisions
    WHERE inspection_id = inspection.id
  ) THEN
    RAISE EXCEPTION
      'Quality inspection already has a decision.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM
      public.finished_product_quality_release_operations
    WHERE production_output_id = output_row.id
  ) THEN
    RAISE EXCEPTION
      'Production output was already released.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.product_lots
    WHERE production_output_id = output_row.id
  ) THEN
    RAISE EXCEPTION
      'Production output already has a product lot.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM
      public.finished_product_nonconformance_disposition_operations
    WHERE production_output_id = output_row.id
  ) THEN
    RAISE EXCEPTION
      'Production output already has a disposition.'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO source_order
  FROM public.production_orders
  WHERE id = output_row.production_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production order was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF (
    source_order.production_status
      IS DISTINCT FROM 'completed'
  ) THEN
    RAISE EXCEPTION
      'Production order is not completed.'
      USING ERRCODE = '23514';
  END IF;

  IF p_disposition = 'rework' THEN
    INSERT INTO public.production_orders (
      production_number,
      recipe_id,
      production_status,
      planned_quantity,
      produced_quantity,
      warehouse_id,
      notes,
      created_by
    )
    VALUES (
      'RWK-' ||
        replace(
          p_idempotency_key::text,
          '-',
          ''
        ),
      source_order.recipe_id,
      'draft',
      output_row.quantity_produced,
      0,
      source_order.warehouse_id,
      'Retrabajo de salida no conforme ' ||
        output_row.id::text ||
        ': ' ||
        v_reason,
      auth.uid()
    )
    RETURNING id
    INTO v_rework_order_id;

    INSERT INTO public.production_order_items (
      production_order_id,
      raw_material_id,
      planned_quantity,
      consumed_quantity,
      status
    )
    SELECT
      v_rework_order_id,
      recipe_item.raw_material_id,
      recipe_item.quantity *
        output_row.quantity_produced,
      0,
      'pending'
    FROM public.recipe_items
      AS recipe_item
    WHERE recipe_item.recipe_id =
      source_order.recipe_id;
  END IF;

  INSERT INTO public.quality_release_decisions (
    inspection_id,
    production_order_id,
    production_output_id,
    subject_type,
    decision,
    approved_by,
    reason
  )
  VALUES (
    inspection.id,
    inspection.production_order_id,
    inspection.production_output_id,
    'production_output',
    'reject',
    auth.uid(),
    v_reason
  )
  RETURNING id
  INTO v_decision_id;

  UPDATE public.production_outputs
  SET quality_status = 'rejected'
  WHERE id = output_row.id;

  INSERT INTO
    public.finished_product_nonconformance_disposition_operations (
      idempotency_key,
      quality_inspection_id,
      quality_release_decision_id,
      production_output_id,
      disposition,
      disposed_quantity,
      reason,
      rework_production_order_id,
      disposed_by
    )
  VALUES (
    p_idempotency_key,
    inspection.id,
    v_decision_id,
    output_row.id,
    v_disposition,
    output_row.quantity_produced,
    v_reason,
    v_rework_order_id,
    auth.uid()
  )
  RETURNING id
  INTO v_operation_id;

  RETURN v_operation_id;
END;
$$;

CREATE OR REPLACE FUNCTION
public.decide_quality_release(
  p_inspection_id uuid,
  p_decision text,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  inspection public.quality_inspections%ROWTYPE;
  output_row public.production_outputs%ROWTYPE;
  decision_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Quality release decisions require an administrator.';
  END IF;

  IF (
    p_decision IS NULL
    OR p_decision NOT IN (
      'release',
      'hold',
      'reject'
    )
  ) THEN
    RAISE EXCEPTION
      'Quality decision is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'release' THEN
    RAISE EXCEPTION
      'Finished product release requires lot and inventory data.'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'reject' THEN
    RAISE EXCEPTION
      'Finished product rejection requires an atomic disposition.'
      USING ERRCODE = '22023';
  END IF;

  IF NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION
      'Quality decision reason is required.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO inspection
  FROM public.quality_inspections
  WHERE id = p_inspection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Quality inspection was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF (
    inspection.subject_type
      IS DISTINCT FROM 'production_output'
    OR inspection.production_output_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Quality inspection is not for a production output.'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO output_row
  FROM public.production_outputs
  WHERE id = inspection.production_output_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production output was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quality_inspections
      AS newer
    WHERE
      newer.production_output_id =
        inspection.production_output_id
      AND (
        newer.inspected_at,
        newer.id
      ) > (
        inspection.inspected_at,
        inspection.id
      )
  ) THEN
    RAISE EXCEPTION
      'A newer quality inspection exists.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.quality_release_decisions (
    inspection_id,
    production_order_id,
    production_output_id,
    subject_type,
    decision,
    approved_by,
    reason
  )
  VALUES (
    inspection.id,
    inspection.production_order_id,
    inspection.production_output_id,
    'production_output',
    'hold',
    auth.uid(),
    btrim(p_reason)
  )
  RETURNING id
  INTO decision_id;

  UPDATE public.production_outputs
  SET quality_status = 'hold'
  WHERE id = output_row.id;

  RETURN decision_id;
END;
$$;

REVOKE ALL ON FUNCTION
  public.dispose_finished_product_nonconformance(
    uuid,
    text,
    text,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.dispose_finished_product_nonconformance(
    uuid,
    text,
    text,
    uuid
  )
TO authenticated;
