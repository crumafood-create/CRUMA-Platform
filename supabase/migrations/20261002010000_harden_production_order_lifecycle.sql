-- Harden production-order creation and state transitions atomically.

CREATE TABLE
  public.production_order_lifecycle_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key uuid NOT NULL UNIQUE,
    production_order_id uuid NOT NULL
      REFERENCES public.production_orders(id)
      ON DELETE RESTRICT,
    operation text NOT NULL
      CHECK (
        operation IN (
          'create',
          'release',
          'start',
          'cancel'
        )
      ),
    recipe_id uuid
      REFERENCES public.recipes(id)
      ON DELETE RESTRICT,
    planned_quantity integer
      CHECK (
        planned_quantity IS NULL
        OR planned_quantity > 0
      ),
    notes text
      CHECK (
        notes IS NULL
        OR char_length(notes) <= 500
      ),
    reason text
      CHECK (
        reason IS NULL
        OR char_length(reason) <= 500
      ),
    previous_status text
      CHECK (
        previous_status IS NULL
        OR previous_status IN (
          'draft',
          'released',
          'in_progress',
          'completed',
          'cancelled'
        )
      ),
    new_status text NOT NULL
      CHECK (
        new_status IN (
          'draft',
          'released',
          'in_progress',
          'completed',
          'cancelled'
        )
      ),
    performed_by uuid NOT NULL
      REFERENCES public.profiles(id)
      ON DELETE RESTRICT,
    performed_at timestamptz NOT NULL
      DEFAULT now(),
    created_at timestamptz NOT NULL
      DEFAULT now()
  );

CREATE INDEX
  production_order_lifecycle_order_idx
ON public.production_order_lifecycle_operations (
  production_order_id,
  performed_at DESC
);

ALTER TABLE
  public.production_order_lifecycle_operations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  production_order_lifecycle_operations_admin_read
ON public.production_order_lifecycle_operations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE
  public.production_order_lifecycle_operations
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.production_order_lifecycle_operations
TO authenticated;

CREATE OR REPLACE FUNCTION
public.create_production_order_draft(
  p_recipe_id uuid,
  p_planned_quantity integer,
  p_notes text,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  recipe_row public.recipes%ROWTYPE;
  existing_operation
    public.production_order_lifecycle_operations%ROWTYPE;
  v_notes text;
  v_order_id uuid;
  v_item_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Production order creation requires an administrator.';
  END IF;

  IF p_recipe_id IS NULL THEN
    RAISE EXCEPTION
      'Production recipe is required.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    p_planned_quantity IS NULL
    OR p_planned_quantity <= 0
  ) THEN
    RAISE EXCEPTION
      'Planned quantity must be a positive integer.'
      USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Idempotency key is required.'
      USING ERRCODE = '22023';
  END IF;

  v_notes := NULLIF(
    btrim(p_notes),
    ''
  );

  IF char_length(v_notes) > 500 THEN
    RAISE EXCEPTION
      'Production order notes cannot exceed 500 characters.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_idempotency_key::text,
      0
    )
  );

  SELECT *
  INTO existing_operation
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    p_idempotency_key;

  IF FOUND THEN
    IF (
      existing_operation.operation
        IS DISTINCT FROM 'create'
      OR existing_operation.recipe_id
        IS DISTINCT FROM p_recipe_id
      OR existing_operation.planned_quantity
        IS DISTINCT FROM p_planned_quantity
      OR existing_operation.notes
        IS DISTINCT FROM v_notes
    ) THEN
      RAISE EXCEPTION
        'Idempotency key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;

    RETURN
      existing_operation.production_order_id;
  END IF;

  SELECT *
  INTO recipe_row
  FROM public.recipes
  WHERE id = p_recipe_id
    AND coalesce(is_active, true)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production recipe was not found or is inactive.'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.recipe_items
    WHERE recipe_id = recipe_row.id
  ) THEN
    RAISE EXCEPTION
      'Production recipe has no items.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.production_orders (
    production_number,
    recipe_id,
    production_status,
    planned_quantity,
    produced_quantity,
    notes,
    created_by
  )
  VALUES (
    'OP-' ||
      upper(
        replace(
          p_idempotency_key::text,
          '-',
          ''
        )
      ),
    recipe_row.id,
    'draft',
    p_planned_quantity,
    0,
    v_notes,
    auth.uid()
  )
  RETURNING id
  INTO v_order_id;

  INSERT INTO public.production_order_items (
    production_order_id,
    raw_material_id,
    planned_quantity,
    consumed_quantity,
    status
  )
  SELECT
    v_order_id,
    recipe_item.raw_material_id,
    recipe_item.quantity *
      p_planned_quantity,
    0,
    'pending'
  FROM public.recipe_items
    AS recipe_item
  WHERE recipe_item.recipe_id =
    recipe_row.id;

  GET DIAGNOSTICS
    v_item_count = ROW_COUNT;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION
      'Production recipe has no items.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO
    public.production_order_lifecycle_operations (
      idempotency_key,
      production_order_id,
      operation,
      recipe_id,
      planned_quantity,
      notes,
      previous_status,
      new_status,
      performed_by
    )
  VALUES (
    p_idempotency_key,
    v_order_id,
    'create',
    recipe_row.id,
    p_planned_quantity,
    v_notes,
    NULL,
    'draft',
    auth.uid()
  );

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION
public.transition_production_order_lifecycle(
  p_production_order_id uuid,
  p_transition text,
  p_reason text,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  order_row public.production_orders%ROWTYPE;
  existing_operation
    public.production_order_lifecycle_operations%ROWTYPE;
  v_transition text;
  v_reason text;
  v_new_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Production order transitions require an administrator.';
  END IF;

  IF p_production_order_id IS NULL THEN
    RAISE EXCEPTION
      'Production order is required.'
      USING ERRCODE = '22023';
  END IF;

  v_transition := lower(
    btrim(p_transition)
  );

  IF (
    v_transition IS NULL
    OR v_transition NOT IN (
      'release',
      'start',
      'cancel'
    )
  ) THEN
    RAISE EXCEPTION
      'Production order transition is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Idempotency key is required.'
      USING ERRCODE = '22023';
  END IF;

  v_reason := NULLIF(
    btrim(p_reason),
    ''
  );

  IF (
    v_transition = 'cancel'
    AND v_reason IS NULL
  ) THEN
    RAISE EXCEPTION
      'Production cancellation reason is required.'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(v_reason) > 500 THEN
    RAISE EXCEPTION
      'Production transition reason cannot exceed 500 characters.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_idempotency_key::text,
      0
    )
  );

  SELECT *
  INTO existing_operation
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key =
    p_idempotency_key;

  IF FOUND THEN
    IF (
      existing_operation.production_order_id
        IS DISTINCT FROM
          p_production_order_id
      OR existing_operation.operation
        IS DISTINCT FROM v_transition
      OR existing_operation.reason
        IS DISTINCT FROM v_reason
    ) THEN
      RAISE EXCEPTION
        'Idempotency key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;

    RETURN
      existing_operation.production_order_id;
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
    p_transition = 'release'
    AND order_row.production_status = 'draft'
  ) THEN
    v_new_status := 'released';

    IF NOT EXISTS (
      SELECT 1
      FROM public.production_order_items
      WHERE production_order_id =
        order_row.id
    ) THEN
      RAISE EXCEPTION
        'Production order has no material plan.'
        USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.production_order_items
      WHERE production_order_id =
        order_row.id
        AND (
          planned_quantity <= 0
          OR consumed_quantity <> 0
          OR status <> 'pending'
        )
    ) THEN
      RAISE EXCEPTION
        'Production order material plan is invalid.'
        USING ERRCODE = '23514';
    END IF;
  ELSIF (
    p_transition = 'start'
    AND order_row.production_status =
      'released'
  ) THEN
    v_new_status := 'in_progress';
  ELSIF (
    p_transition = 'cancel'
    AND order_row.production_status IN (
      'draft',
      'released'
    )
  ) THEN
    v_new_status := 'cancelled';
  ELSE
    RAISE EXCEPTION
      'Production order transition is invalid.'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.production_orders
  SET
    production_status = v_new_status,
    started_at = CASE
      WHEN v_transition = 'start'
      THEN now()
      ELSE started_at
    END,
    updated_at = now()
  WHERE id = order_row.id;

  INSERT INTO
    public.production_order_lifecycle_operations (
      idempotency_key,
      production_order_id,
      operation,
      recipe_id,
      planned_quantity,
      notes,
      reason,
      previous_status,
      new_status,
      performed_by
    )
  VALUES (
    p_idempotency_key,
    order_row.id,
    v_transition,
    order_row.recipe_id,
    order_row.planned_quantity,
    order_row.notes,
    v_reason,
    order_row.production_status,
    v_new_status,
    auth.uid()
  );

  RETURN order_row.id;
END;
$$;

DROP POLICY IF EXISTS
  production_orders_insert
ON public.production_orders;

DROP POLICY IF EXISTS
  production_orders_update
ON public.production_orders;

DROP POLICY IF EXISTS
  production_orders_delete
ON public.production_orders;

REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.production_orders,
  public.production_order_items
FROM anon, authenticated;

REVOKE ALL ON FUNCTION
  public.create_production_order_items(
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.create_production_order_draft(
    uuid,
    integer,
    text,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.transition_production_order_lifecycle(
    uuid,
    text,
    text,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.create_production_order_draft(
    uuid,
    integer,
    text,
    uuid
  )
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.transition_production_order_lifecycle(
    uuid,
    text,
    text,
    uuid
  )
TO authenticated;
