-- Reconcile production yield and waste atomically before quarantine.

ALTER TABLE
  public.production_output_completion_operations
  ADD COLUMN planned_quantity integer,
  ADD COLUMN waste_quantity integer,
  ADD COLUMN variance_reason text;

UPDATE
  public.production_output_completion_operations
    AS operation
SET
  planned_quantity =
    production_order.planned_quantity,
  waste_quantity = greatest(
    production_order.planned_quantity -
      operation.produced_quantity,
    0
  ),
  variance_reason = CASE
    WHEN operation.produced_quantity
      IS DISTINCT FROM
        production_order.planned_quantity
    THEN
      'Migrated legacy completion without recorded variance reason.'
    ELSE NULL
  END
FROM public.production_orders
  AS production_order
WHERE
  production_order.id =
    operation.production_order_id;

ALTER TABLE
  public.production_output_completion_operations
  ALTER COLUMN planned_quantity SET NOT NULL,
  ALTER COLUMN waste_quantity SET NOT NULL,
  ADD CONSTRAINT
    production_output_completion_planned_positive
    CHECK (planned_quantity > 0),
  ADD CONSTRAINT
    production_output_completion_waste_non_negative
    CHECK (waste_quantity >= 0),
  ADD CONSTRAINT
    production_output_completion_variance_reason_length
    CHECK (
      variance_reason IS NULL
      OR char_length(variance_reason) <= 500
    );

CREATE OR REPLACE FUNCTION
public.complete_production_yield_to_quarantine(
  p_production_order_id uuid,
  p_produced_quantity integer,
  p_waste_quantity integer,
  p_variance_reason text,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  order_row public.production_orders%ROWTYPE;
  existing_operation
    public.production_output_completion_operations%ROWTYPE;
  v_variance_reason text;
  v_product_id uuid;
  v_output_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Production completion requires an administrator.';
  END IF;

  IF p_production_order_id IS NULL THEN
    RAISE EXCEPTION
      'Production order is required.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    p_produced_quantity IS NULL
    OR p_produced_quantity <= 0
  ) THEN
    RAISE EXCEPTION
      'Produced quantity must be a positive integer.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    p_waste_quantity IS NULL
    OR p_waste_quantity < 0
  ) THEN
    RAISE EXCEPTION
      'Waste quantity must be a non-negative integer.'
      USING ERRCODE = '22023';
  END IF;

  v_variance_reason :=
    NULLIF(btrim(p_variance_reason), '');

  IF (
    v_variance_reason IS NOT NULL
    AND char_length(v_variance_reason) > 500
  ) THEN
    RAISE EXCEPTION
      'Production variance reason is too long.'
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
  FROM public.production_output_completion_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF (
      existing_operation.production_order_id
        IS DISTINCT FROM p_production_order_id
      OR existing_operation.produced_quantity
        IS DISTINCT FROM p_produced_quantity
      OR existing_operation.waste_quantity
        IS DISTINCT FROM p_waste_quantity
      OR existing_operation.variance_reason
        IS DISTINCT FROM v_variance_reason
    ) THEN
      RAISE unique_violation
        USING MESSAGE =
          'Idempotency key was reused with different data.';
    END IF;

    RETURN existing_operation.production_output_id;
  END IF;

  SELECT *
  INTO order_row
  FROM public.production_orders
  WHERE id = p_production_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production order was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF (
    order_row.production_status
      IS DISTINCT FROM 'in_progress'
  ) THEN
    RAISE EXCEPTION
      'Production order must be in progress.'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id =
      order_row.id
  ) THEN
    RAISE EXCEPTION
      'Production order has no material items.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id =
      order_row.id
      AND status IS DISTINCT FROM 'completed'
  ) THEN
    RAISE EXCEPTION
      'All production materials must be consumed.'
      USING ERRCODE = '23514';
  END IF;

  IF (
    p_produced_quantity <=
      order_row.planned_quantity
    AND p_produced_quantity + p_waste_quantity
      IS DISTINCT FROM
        order_row.planned_quantity
  ) THEN
    RAISE EXCEPTION
      'Production yield does not reconcile with planned quantity.'
      USING ERRCODE = '23514';
  END IF;

  IF (
    p_produced_quantity >
      order_row.planned_quantity
    AND p_waste_quantity <> 0
  ) THEN
    RAISE EXCEPTION
      'Overproduction cannot include waste.'
      USING ERRCODE = '23514';
  END IF;

  IF (
    (
      p_produced_quantity
        IS DISTINCT FROM
          order_row.planned_quantity
      OR p_waste_quantity > 0
    )
    AND v_variance_reason IS NULL
  ) THEN
    RAISE EXCEPTION
      'Production variance reason is required.'
      USING ERRCODE = '23514';
  END IF;

  SELECT recipe.product_id
  INTO v_product_id
  FROM public.recipes AS recipe
  WHERE recipe.id = order_row.recipe_id;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION
      'Production recipe has no product.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.production_outputs (
    production_order_id,
    product_id,
    quantity_produced,
    quality_status
  )
  VALUES (
    order_row.id,
    v_product_id,
    p_produced_quantity,
    'pending'
  )
  RETURNING id
  INTO v_output_id;

  UPDATE public.production_orders
  SET
    produced_quantity = p_produced_quantity,
    production_status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = order_row.id;

  INSERT INTO
    public.production_output_completion_operations (
      idempotency_key,
      production_order_id,
      production_output_id,
      planned_quantity,
      produced_quantity,
      waste_quantity,
      variance_reason,
      completed_by
    )
  VALUES (
    p_idempotency_key,
    order_row.id,
    v_output_id,
    order_row.planned_quantity,
    p_produced_quantity,
    p_waste_quantity,
    v_variance_reason,
    auth.uid()
  );

  RETURN v_output_id;
END;
$$;

REVOKE ALL ON FUNCTION
  public.complete_production_output_quarantine(
    uuid,
    integer,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.complete_production_yield_to_quarantine(
    uuid,
    integer,
    integer,
    text,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.complete_production_yield_to_quarantine(
    uuid,
    integer,
    integer,
    text,
    uuid
  )
TO authenticated;
