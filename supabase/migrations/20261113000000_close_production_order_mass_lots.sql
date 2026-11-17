-- Reconcile weighed mass reservations and actual production output atomically.

ALTER TABLE public.production_order_product_lot_reservations
  ADD COLUMN consumed_quantity numeric(18,4),
  ADD COLUMN surplus_quantity numeric(18,4),
  ADD CONSTRAINT production_order_mass_reservation_close_pair
    CHECK (
      (consumed_quantity IS NULL AND surplus_quantity IS NULL)
      OR (
        consumed_quantity IS NOT NULL
        AND surplus_quantity IS NOT NULL
        AND consumed_quantity >= 0
        AND surplus_quantity >= 0
        AND consumed_quantity + surplus_quantity = reserved_quantity
      )
    );

CREATE OR REPLACE FUNCTION
public.complete_production_order_with_mass_lot_yield(
  p_production_order_id uuid,
  p_produced_quantity integer,
  p_waste_quantity integer,
  p_variance_reason text,
  p_lot_surpluses jsonb,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  order_row public.production_orders%ROWTYPE;
  existing_operation
    public.production_output_completion_operations%ROWTYPE;
  reservation_row
    public.production_order_product_lot_reservations%ROWTYPE;
  requested_surpluses jsonb;
  stored_surpluses jsonb;
  v_surplus_quantity numeric;
  v_variance_reason text;
  v_product_id uuid;
  v_output_id uuid;
  v_reservation_count integer;
  v_input_count integer;
  v_distinct_input_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Production completion requires an administrator.';
  END IF;

  IF p_production_order_id IS NULL
    OR p_idempotency_key IS NULL
    OR p_produced_quantity IS NULL
    OR p_produced_quantity <= 0
    OR p_waste_quantity IS NULL
    OR p_waste_quantity < 0 THEN
    RAISE EXCEPTION 'Production completion data is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_lot_surpluses IS NULL
    OR jsonb_typeof(p_lot_surpluses) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_lot_surpluses) = 0 THEN
    RAISE EXCEPTION 'Debe registrar el sobrante de cada lote de masa.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_lot_surpluses) AS entry(value)
    WHERE jsonb_typeof(entry.value) IS DISTINCT FROM 'object'
      OR NOT (entry.value ? 'product_lot_id')
      OR NOT (entry.value ? 'surplus_quantity')
  ) THEN
    RAISE EXCEPTION 'La lista de sobrantes por lote no es válida.'
      USING ERRCODE = '22023';
  END IF;

  SELECT
    jsonb_agg(
      jsonb_build_object(
        'product_lot_id', input.product_lot_id,
        'surplus_quantity', input.surplus_quantity
      ) ORDER BY input.product_lot_id
    ),
    count(*)::integer,
    count(DISTINCT input.product_lot_id)::integer
  INTO requested_surpluses, v_input_count, v_distinct_input_count
  FROM jsonb_to_recordset(p_lot_surpluses)
    AS input(product_lot_id uuid, surplus_quantity numeric);

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_lot_surpluses)
      AS input(product_lot_id uuid, surplus_quantity numeric)
    WHERE input.product_lot_id IS NULL
      OR input.surplus_quantity IS NULL
      OR input.surplus_quantity < 0
      OR input.surplus_quantity::text IN ('NaN', 'Infinity', '-Infinity')
      OR input.surplus_quantity <> round(input.surplus_quantity, 4)
  ) THEN
    RAISE EXCEPTION
      'Los sobrantes deben ser cantidades no negativas en kg con precisión de cuatro decimales.'
      USING ERRCODE = '22023';
  END IF;

  v_variance_reason := NULLIF(btrim(p_variance_reason), '');
  IF v_variance_reason IS NOT NULL
    AND char_length(v_variance_reason) > 500 THEN
    RAISE EXCEPTION 'Production variance reason is too long.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  SELECT * INTO existing_operation
  FROM public.production_output_completion_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF existing_operation.production_order_id
        IS DISTINCT FROM p_production_order_id
      OR existing_operation.produced_quantity
        IS DISTINCT FROM p_produced_quantity
      OR existing_operation.waste_quantity
        IS DISTINCT FROM p_waste_quantity
      OR existing_operation.variance_reason
        IS DISTINCT FROM v_variance_reason THEN
      RAISE unique_violation
        USING MESSAGE = 'Idempotency key was reused with different data.';
    END IF;

    SELECT jsonb_agg(
      jsonb_build_object(
        'product_lot_id', reservation.product_lot_id,
        'surplus_quantity', reservation.surplus_quantity
      ) ORDER BY reservation.product_lot_id
    )
    INTO stored_surpluses
    FROM public.production_order_product_lot_reservations AS reservation
    WHERE reservation.production_order_id = p_production_order_id;

    IF stored_surpluses IS DISTINCT FROM requested_surpluses THEN
      RAISE unique_violation
        USING MESSAGE = 'Idempotency key was reused with different lot surpluses.';
    END IF;

    RETURN existing_operation.production_output_id;
  END IF;

  SELECT * INTO order_row
  FROM public.production_orders
  WHERE id = p_production_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production order was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF order_row.production_status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'Production order must be in progress.'
      USING ERRCODE = '23514';
  END IF;

  IF p_produced_quantity <= order_row.planned_quantity
    AND p_produced_quantity + p_waste_quantity
      IS DISTINCT FROM order_row.planned_quantity THEN
    RAISE EXCEPTION 'Production yield does not reconcile with planned quantity.'
      USING ERRCODE = '23514';
  END IF;

  IF p_produced_quantity > order_row.planned_quantity
    AND p_waste_quantity <> 0 THEN
    RAISE EXCEPTION 'Overproduction cannot include waste.'
      USING ERRCODE = '23514';
  END IF;

  IF (p_produced_quantity IS DISTINCT FROM order_row.planned_quantity
      OR p_waste_quantity > 0)
    AND v_variance_reason IS NULL THEN
    RAISE EXCEPTION 'Production variance reason is required.'
      USING ERRCODE = '23514';
  END IF;

  SELECT recipe.product_id
  INTO v_product_id
  FROM public.recipes AS recipe
  WHERE recipe.id = order_row.recipe_id;

  IF v_product_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.production_order_items AS item
    JOIN public.recipe_items AS recipe_item
      ON recipe_item.recipe_id = order_row.recipe_id
      AND recipe_item.product_id = item.product_id
      AND recipe_item.raw_material_id IS NULL
    WHERE item.production_order_id = order_row.id
      AND item.raw_material_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Production order does not use an intermediate product.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.production_order_items AS item
    WHERE item.production_order_id = order_row.id
      AND item.raw_material_id IS NOT NULL
      AND item.status IS DISTINCT FROM 'completed'
  ) THEN
    RAISE EXCEPTION 'All raw materials must be consumed before completion.'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*)::integer
  INTO v_reservation_count
  FROM public.production_order_product_lot_reservations AS reservation
  WHERE reservation.production_order_id = order_row.id;

  IF v_reservation_count = 0
    OR v_input_count <> v_reservation_count
    OR v_distinct_input_count <> v_input_count
    OR EXISTS (
      SELECT 1
      FROM jsonb_to_recordset(p_lot_surpluses)
        AS input(product_lot_id uuid, surplus_quantity numeric)
      LEFT JOIN public.production_order_product_lot_reservations AS reservation
        ON reservation.production_order_id = order_row.id
        AND reservation.product_lot_id = input.product_lot_id
      WHERE reservation.id IS NULL
    ) THEN
    RAISE EXCEPTION 'Registra el sobrante de cada lote apartado, una sola vez.'
      USING ERRCODE = '23514';
  END IF;

  FOR reservation_row IN
    SELECT *
    FROM public.production_order_product_lot_reservations AS reservation
    WHERE reservation.production_order_id = order_row.id
    ORDER BY reservation.product_lot_id
    FOR UPDATE
  LOOP
    SELECT input.surplus_quantity
    INTO v_surplus_quantity
    FROM jsonb_to_recordset(p_lot_surpluses)
      AS input(product_lot_id uuid, surplus_quantity numeric)
    WHERE input.product_lot_id = reservation_row.product_lot_id;

    IF reservation_row.consumed_quantity IS NOT NULL
      OR reservation_row.surplus_quantity IS NOT NULL THEN
      RAISE EXCEPTION 'Mass lot reservation is already closed.'
        USING ERRCODE = '23514';
    END IF;

    IF v_surplus_quantity > reservation_row.reserved_quantity THEN
      RAISE EXCEPTION
        'The weighed surplus cannot exceed the mass withdrawn from its lot.'
        USING ERRCODE = '23514';
    END IF;

    UPDATE public.production_order_product_lot_reservations
    SET consumed_quantity = reservation_row.reserved_quantity - v_surplus_quantity,
      surplus_quantity = v_surplus_quantity
    WHERE id = reservation_row.id;
  END LOOP;

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
  RETURNING id INTO v_output_id;

  UPDATE public.production_orders
  SET produced_quantity = p_produced_quantity,
    production_status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = order_row.id;

  INSERT INTO public.production_output_completion_operations (
    idempotency_key,
    production_order_id,
    production_output_id,
    planned_quantity,
    produced_quantity,
    waste_quantity,
    variance_reason,
    completed_by
  ) VALUES (
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
$function$;

REVOKE ALL ON FUNCTION
  public.complete_production_order_with_mass_lot_yield(
    uuid, integer, integer, text, jsonb, uuid
  )
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION
  public.complete_production_order_with_mass_lot_yield(
    uuid, integer, integer, text, jsonb, uuid
  )
  TO authenticated;
