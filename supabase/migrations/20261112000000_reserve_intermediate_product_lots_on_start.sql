-- Preserve the intermediate-product ingredient in the production plan and
-- reserve its weighed quantity from released product lots when work starts.

ALTER TABLE public.production_order_items
  ADD COLUMN product_id uuid,
  ALTER COLUMN raw_material_id DROP NOT NULL,
  ADD CONSTRAINT production_order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  ADD CONSTRAINT production_order_items_exactly_one_ingredient
    CHECK (
      (raw_material_id IS NOT NULL AND product_id IS NULL)
      OR (raw_material_id IS NULL AND product_id IS NOT NULL)
    );

CREATE INDEX production_order_items_product_idx
  ON public.production_order_items(product_id)
  WHERE product_id IS NOT NULL;

CREATE TABLE public.production_order_product_lot_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL
    REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  production_order_item_id uuid NOT NULL
    REFERENCES public.production_order_items(id) ON DELETE RESTRICT,
  product_lot_id uuid NOT NULL
    REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  reserved_quantity numeric(18,4) NOT NULL
    CHECK (reserved_quantity > 0),
  created_by uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (production_order_item_id, product_lot_id)
);

CREATE INDEX production_order_product_lot_reservations_order_idx
  ON public.production_order_product_lot_reservations(
    production_order_id,
    production_order_item_id
  );

ALTER TABLE public.production_order_product_lot_reservations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY production_order_product_lot_reservations_admin_read
  ON public.production_order_product_lot_reservations
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.production_order_product_lot_reservations
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.production_order_product_lot_reservations
  TO authenticated;

-- Intermediate-product recipes may be planned and released. Starting them
-- requires at least one reservation for their product ingredient, so a direct
-- status update cannot bypass the inventory transaction below.
CREATE OR REPLACE FUNCTION public.guard_production_order_recipe_ingredients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.production_status = 'in_progress'
    AND EXISTS (
      SELECT 1
      FROM public.production_order_items AS item
      WHERE item.production_order_id = NEW.id
        AND item.product_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.production_order_product_lot_reservations AS reservation
          WHERE reservation.production_order_item_id = item.id
            AND reservation.production_order_id = NEW.id
        )
    ) THEN
    RAISE EXCEPTION
      'La orden debe apartar masa de un lote liberado antes de iniciar.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_production_order_draft(
  p_recipe_id uuid,
  p_planned_quantity integer,
  p_notes text,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
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
    RAISE EXCEPTION 'Production recipe is required.' USING ERRCODE = '22023';
  END IF;
  IF p_planned_quantity IS NULL OR p_planned_quantity <= 0 THEN
    RAISE EXCEPTION
      'Planned quantity must be a positive integer.'
      USING ERRCODE = '22023';
  END IF;
  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Idempotency key is required.' USING ERRCODE = '22023';
  END IF;

  v_notes := NULLIF(btrim(p_notes), '');
  IF char_length(v_notes) > 500 THEN
    RAISE EXCEPTION
      'Production order notes cannot exceed 500 characters.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  SELECT * INTO existing_operation
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF existing_operation.operation IS DISTINCT FROM 'create'
      OR existing_operation.recipe_id IS DISTINCT FROM p_recipe_id
      OR existing_operation.planned_quantity IS DISTINCT FROM p_planned_quantity
      OR existing_operation.notes IS DISTINCT FROM v_notes THEN
      RAISE EXCEPTION
        'Idempotency key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;
    RETURN existing_operation.production_order_id;
  END IF;

  SELECT * INTO recipe_row
  FROM public.recipes
  WHERE id = p_recipe_id AND coalesce(is_active, true)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production recipe was not found or is inactive.'
      USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.recipe_items WHERE recipe_id = recipe_row.id
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
    'OP-' || upper(replace(p_idempotency_key::text, '-', '')),
    recipe_row.id,
    'draft',
    p_planned_quantity,
    0,
    v_notes,
    auth.uid()
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.production_order_items (
    production_order_id,
    raw_material_id,
    product_id,
    planned_quantity,
    consumed_quantity,
    status
  )
  SELECT
    v_order_id,
    recipe_item.raw_material_id,
    recipe_item.product_id,
    round(
      recipe_item.quantity * p_planned_quantity /
        recipe_row.yield_quantity,
      4
    ),
    0,
    'pending'
  FROM public.recipe_items AS recipe_item
  WHERE recipe_item.recipe_id = recipe_row.id;

  GET DIAGNOSTICS v_item_count = ROW_COUNT;
  IF v_item_count = 0 THEN
    RAISE EXCEPTION
      'Production recipe has no items.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.production_order_lifecycle_operations (
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
$function$;

CREATE OR REPLACE FUNCTION
public.start_production_order_with_mass_lot_reservations(
  p_production_order_id uuid,
  p_lot_allocations jsonb,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  order_row public.production_orders%ROWTYPE;
  mass_item public.production_order_items%ROWTYPE;
  lot_row public.product_lots%ROWTYPE;
  lot_allocation record;
  existing_operation
    public.production_order_lifecycle_operations%ROWTYPE;
  requested_allocations jsonb;
  stored_allocations jsonb;
  v_quantity numeric(18,4);
  v_previous_quantity numeric(18,4);
  v_allocation_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Production order start requires an administrator.';
  END IF;
  IF p_production_order_id IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Production order and idempotency key are required.'
      USING ERRCODE = '22023';
  END IF;
  IF p_lot_allocations IS NULL
    OR jsonb_typeof(p_lot_allocations) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION
      'Debe registrar el peso retirado de al menos un lote de masa.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_lot_allocations) = 0 THEN
    RAISE EXCEPTION
      'Debe registrar el peso retirado de al menos un lote de masa.'
      USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_lot_allocations) AS entry(value)
    WHERE jsonb_typeof(entry.value) IS DISTINCT FROM 'object'
      OR NOT (entry.value ? 'product_lot_id')
      OR NOT (entry.value ? 'quantity')
  ) THEN
    RAISE EXCEPTION
      'La selección de lotes de masa no es válida.'
      USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'product_lot_id', aggregated_allocation.product_lot_id,
      'quantity', aggregated_allocation.quantity
    ) ORDER BY aggregated_allocation.product_lot_id
  )
  INTO requested_allocations
  FROM (
    SELECT product_lot_id, sum(quantity) AS quantity
    FROM jsonb_to_recordset(p_lot_allocations)
      AS item(product_lot_id uuid, quantity numeric)
    GROUP BY product_lot_id
    ) AS aggregated_allocation
  WHERE aggregated_allocation.product_lot_id IS NOT NULL;

  IF requested_allocations IS NULL OR EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_lot_allocations)
      AS item(product_lot_id uuid, quantity numeric)
    WHERE product_lot_id IS NULL
      OR quantity IS NULL
      OR quantity <= 0
      OR quantity::text IN ('NaN', 'Infinity', '-Infinity')
      OR quantity <> round(quantity, 4)
  ) THEN
    RAISE EXCEPTION
      'Las cantidades retiradas deben ser positivas y estar expresadas en kg con precisión de cuatro decimales.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  SELECT * INTO existing_operation
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF existing_operation.production_order_id
        IS DISTINCT FROM p_production_order_id
      OR existing_operation.operation IS DISTINCT FROM 'start' THEN
      RAISE EXCEPTION
        'Idempotency key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;

    SELECT jsonb_agg(
      jsonb_build_object(
        'product_lot_id', reservation.product_lot_id,
        'quantity', reservation.reserved_quantity
      ) ORDER BY reservation.product_lot_id
    )
    INTO stored_allocations
    FROM public.production_order_product_lot_reservations AS reservation
    WHERE reservation.production_order_id = p_production_order_id;

    IF stored_allocations IS DISTINCT FROM requested_allocations THEN
      RAISE EXCEPTION
        'Idempotency key was reused with different lot weights.'
        USING ERRCODE = '23505';
    END IF;
    RETURN p_production_order_id;
  END IF;

  SELECT * INTO order_row
  FROM public.production_orders
  WHERE id = p_production_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production order was not found.'
      USING ERRCODE = 'P0002';
  END IF;
  IF order_row.production_status IS DISTINCT FROM 'released' THEN
    RAISE EXCEPTION
      'Only released production orders can reserve mass lots.'
      USING ERRCODE = '23514';
  END IF;

  SELECT * INTO mass_item
  FROM public.production_order_items
  WHERE production_order_id = order_row.id
    AND product_id IS NOT NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'This order does not require an intermediate product lot.'
      USING ERRCODE = '23514';
  END IF;
  IF (
    SELECT count(*)
    FROM public.production_order_items
    WHERE production_order_id = order_row.id
      AND product_id IS NOT NULL
  ) <> 1 THEN
    RAISE EXCEPTION
      'A production order must use exactly one mass variety.'
      USING ERRCODE = '23514';
  END IF;

  v_allocation_count := 0;
  FOR lot_allocation IN
    SELECT product_lot_id, sum(quantity) AS quantity
    FROM jsonb_to_recordset(p_lot_allocations)
      AS item(product_lot_id uuid, quantity numeric)
    GROUP BY product_lot_id
    ORDER BY product_lot_id
  LOOP
    SELECT * INTO lot_row
    FROM public.product_lots
    WHERE id = lot_allocation.product_lot_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mass lot was not found.' USING ERRCODE = 'P0002';
    END IF;
    IF lot_row.product_id IS DISTINCT FROM mass_item.product_id
      OR lot_row.status IS DISTINCT FROM 'available'
      OR lot_row.quantity <= 0
      OR (lot_row.expiration_date IS NOT NULL
        AND lot_row.expiration_date < CURRENT_DATE)
      OR NOT EXISTS (
        SELECT 1
        FROM public.production_outputs AS output
        WHERE output.id = lot_row.production_output_id
          AND output.product_id = mass_item.product_id
          AND output.quality_status = 'released'
      ) THEN
      RAISE EXCEPTION
        'El lote seleccionado no está liberado y disponible para esta variedad de masa.'
        USING ERRCODE = '23514';
    END IF;
    IF lot_row.quantity < lot_allocation.quantity THEN
      RAISE EXCEPTION
        'El peso retirado supera la cantidad disponible del lote.'
        USING ERRCODE = '23514';
    END IF;

    v_previous_quantity := lot_row.quantity;
    v_quantity := lot_row.quantity - lot_allocation.quantity;

    UPDATE public.product_lots
    SET quantity = v_quantity,
      status = CASE WHEN v_quantity = 0 THEN 'depleted' ELSE status END,
      updated_at = now()
    WHERE id = lot_row.id;

    INSERT INTO public.production_order_product_lot_reservations (
      production_order_id,
      production_order_item_id,
      product_lot_id,
      reserved_quantity,
      created_by
    )
    VALUES (
      order_row.id,
      mass_item.id,
      lot_row.id,
      lot_allocation.quantity,
      auth.uid()
    );

    v_allocation_count := v_allocation_count + 1;
  END LOOP;

  IF v_allocation_count = 0 THEN
    RAISE EXCEPTION
      'Debe registrar el peso retirado de al menos un lote de masa.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM public.transition_production_order_lifecycle(
    order_row.id,
    'start',
    NULL,
    p_idempotency_key
  );

  RETURN order_row.id;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.start_production_order_with_mass_lot_reservations(uuid, jsonb, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION
  public.start_production_order_with_mass_lot_reservations(uuid, jsonb, uuid)
  TO authenticated;
