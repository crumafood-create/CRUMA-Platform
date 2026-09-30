CREATE TABLE public.production_output_completion_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  production_order_id uuid NOT NULL
    REFERENCES public.production_orders(id)
    ON DELETE RESTRICT,
  production_output_id uuid NOT NULL UNIQUE
    REFERENCES public.production_outputs(id)
    ON DELETE RESTRICT,
  produced_quantity integer NOT NULL
    CHECK (produced_quantity > 0),
  completed_by uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX production_output_completion_order_idx
  ON public.production_output_completion_operations(
    production_order_id,
    completed_at DESC
  );

ALTER TABLE
  public.production_output_completion_operations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  production_output_completion_operations_admin_read
ON public.production_output_completion_operations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE
  public.production_output_completion_operations
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.production_output_completion_operations
TO authenticated;

CREATE OR REPLACE FUNCTION
public.complete_production_output_quarantine(
  p_production_order_id uuid,
  p_produced_quantity integer,
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
      produced_quantity,
      completed_by
    )
  VALUES (
    p_idempotency_key,
    order_row.id,
    v_output_id,
    p_produced_quantity,
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
FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION
  public.complete_production_output_quarantine(
    uuid,
    integer,
    uuid
  )
TO authenticated;