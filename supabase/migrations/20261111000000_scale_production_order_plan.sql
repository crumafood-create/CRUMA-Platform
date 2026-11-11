-- Scale ingredient snapshots by the recipe's expected output yield.

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
    round(recipe_item.quantity * p_planned_quantity / recipe_row.yield_quantity, 4),
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
