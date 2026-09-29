-- Consume one scanned raw-material lot atomically following FEFO.

CREATE TABLE public.production_material_consumption_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  production_order_id uuid NOT NULL
    REFERENCES public.production_orders(id)
    ON DELETE RESTRICT,
  production_order_item_id uuid NOT NULL
    REFERENCES public.production_order_items(id)
    ON DELETE RESTRICT,
  raw_material_lot_id uuid NOT NULL
    REFERENCES public.raw_material_lots(id)
    ON DELETE RESTRICT,
  production_order_consumption_id uuid NOT NULL
    REFERENCES public.production_order_consumptions(id)
    ON DELETE RESTRICT,
  inventory_movement_id uuid NOT NULL
    REFERENCES public.inventory_movements(id)
    ON DELETE RESTRICT,
  scanned_lot_number text NOT NULL,
  consumed_quantity numeric(18,4) NOT NULL
    CHECK (consumed_quantity > 0),
  consumed_by uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX production_material_consumption_item_idx
  ON public.production_material_consumption_operations(
    production_order_item_id,
    created_at
  );

CREATE INDEX production_material_consumption_lot_idx
  ON public.production_material_consumption_operations(
    raw_material_lot_id,
    created_at
  );

ALTER TABLE
  public.production_material_consumption_operations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY production_material_consumption_operations_admin_read
  ON public.production_material_consumption_operations
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE
  public.production_material_consumption_operations
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.production_material_consumption_operations
  TO authenticated;

CREATE OR REPLACE FUNCTION
  public.consume_production_material_fefo(
    p_production_order_item_id uuid,
    p_scanned_lot_number text,
    p_idempotency_key uuid
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item public.production_order_items%ROWTYPE;
  production_order public.production_orders%ROWTYPE;
  selected_lot public.raw_material_lots%ROWTYPE;
  material public.raw_materials%ROWTYPE;
  existing_operation
    public.production_material_consumption_operations%ROWTYPE;

  v_scanned_lot_number text;
  v_remaining_quantity numeric(18,4);
  v_consumed_quantity numeric(18,4);
  v_new_item_consumed_quantity numeric(18,4);
  v_previous_stock numeric(18,4);
  v_new_stock numeric(18,4);

  v_consumption_id uuid;
  v_inventory_movement_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Production material consumption requires an administrator.';
  END IF;

  IF p_production_order_item_id IS NULL THEN
    RAISE EXCEPTION
      'Production order item is required.'
      USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Idempotency key is required.'
      USING ERRCODE = '22023';
  END IF;

  v_scanned_lot_number :=
    upper(btrim(coalesce(p_scanned_lot_number, '')));

  IF v_scanned_lot_number = ''
     OR v_scanned_lot_number !~
       '^[A-Z0-9][A-Z0-9._/-]{0,79}$' THEN
    RAISE EXCEPTION
      'Scanned lot number is invalid.'
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
  FROM public.production_material_consumption_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF existing_operation.production_order_item_id
         IS DISTINCT FROM p_production_order_item_id
       OR existing_operation.scanned_lot_number
         IS DISTINCT FROM v_scanned_lot_number THEN
      RAISE unique_violation
        USING MESSAGE =
          'Idempotency key was already used with different data.';
    END IF;

    RETURN existing_operation.production_order_id;
  END IF;

  SELECT *
  INTO item
  FROM public.production_order_items
  WHERE id = p_production_order_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production order item was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO production_order
  FROM public.production_orders
  WHERE id = item.production_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production order was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF production_order.production_status
       NOT IN ('released', 'in_progress') THEN
    RAISE EXCEPTION
      'Production order cannot consume material in its current state.'
      USING ERRCODE = '23514';
  END IF;

  v_remaining_quantity :=
    item.planned_quantity -
    coalesce(item.consumed_quantity, 0);

  IF item.status = 'completed'
     OR v_remaining_quantity <= 0 THEN
    RAISE EXCEPTION
      'Production order item is already completed.'
      USING ERRCODE = '23514';
  END IF;

  SELECT lot.*
INTO selected_lot
  FROM public.raw_material_lots AS lot
  WHERE lot.raw_material_id = item.raw_material_id
    AND lot.status = 'available'
    AND lot.quantity > 0
    AND (
      lot.expiration_date IS NULL
      OR lot.expiration_date >= CURRENT_DATE
    )
  ORDER BY
    lot.expiration_date ASC NULLS LAST,
    lot.created_at ASC,
    lot.id ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Insufficient available raw material stock.'
      USING ERRCODE = '23514';
  END IF;

  IF upper(btrim(selected_lot.lot_number))
       IS DISTINCT FROM v_scanned_lot_number THEN
    RAISE EXCEPTION
      'Scanned lot is not the next valid FEFO lot.'
      USING
        ERRCODE = '23514',
        DETAIL =
          'Expected lot: ' || selected_lot.lot_number;
  END IF;

  SELECT *
  INTO material
  FROM public.raw_materials
  WHERE id = item.raw_material_id
    AND is_active = true
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Raw material is not available.'
      USING ERRCODE = '23514';
  END IF;

  v_consumed_quantity := LEAST(
    selected_lot.quantity,
    v_remaining_quantity
  );

  IF v_consumed_quantity <= 0 THEN
    RAISE EXCEPTION
      'Consumed quantity must be positive.'
      USING ERRCODE = '23514';
  END IF;

  v_previous_stock :=
    coalesce(material.current_stock, 0);

  IF v_previous_stock < v_consumed_quantity THEN
    RAISE EXCEPTION
      'Raw material stock is inconsistent with available lots.'
      USING ERRCODE = '23514';
  END IF;

  v_new_stock :=
    v_previous_stock - v_consumed_quantity;

  INSERT INTO public.production_order_consumptions (
    production_order_item_id,
    raw_material_lot_id,
    quantity,
    created_at
  )
  VALUES (
    item.id,
    selected_lot.id,
    v_consumed_quantity,
    now()
  )
  RETURNING id
  INTO v_consumption_id;

  UPDATE public.raw_material_lots
  SET quantity =
        quantity - v_consumed_quantity,
      status = CASE
        WHEN quantity - v_consumed_quantity = 0
          THEN 'depleted'
        ELSE 'available'
      END,
      updated_at = now()
  WHERE id = selected_lot.id;

  UPDATE public.raw_materials
  SET current_stock =
        current_stock - v_consumed_quantity,
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
    'exit',
    v_consumed_quantity,
    v_previous_stock,
    v_new_stock,
    'production_material_consumption',
    v_consumption_id,
    'Consumo FEFO del lote ' || selected_lot.lot_number,
    auth.uid()
  )
  RETURNING id
  INTO v_inventory_movement_id;

  v_new_item_consumed_quantity :=
    coalesce(item.consumed_quantity, 0) +
    v_consumed_quantity;

  UPDATE public.production_order_items
  SET consumed_quantity =
        v_new_item_consumed_quantity,
      status = CASE
        WHEN v_new_item_consumed_quantity
               >= planned_quantity
          THEN 'completed'
        ELSE status
      END,
      updated_at = now()
  WHERE id = item.id;

    UPDATE public.production_orders
  SET production_status = CASE
        WHEN production_status = 'released'
          THEN 'in_progress'
        ELSE production_status
      END,
      started_at =
        coalesce(started_at, now()),
      updated_at = now()
  WHERE id = production_order.id;

  INSERT INTO
    public.production_material_consumption_operations (
      idempotency_key,
      production_order_id,
      production_order_item_id,
      raw_material_lot_id,
      production_order_consumption_id,
      inventory_movement_id,
      scanned_lot_number,
      consumed_quantity,
      consumed_by
    )
  VALUES (
    p_idempotency_key,
    production_order.id,
    item.id,
    selected_lot.id,
    v_consumption_id,
    v_inventory_movement_id,
    v_scanned_lot_number,
    v_consumed_quantity,
    auth.uid()
  );

  RETURN production_order.id;
END;
$$;

REVOKE ALL ON FUNCTION
  public.consume_production_material_fefo(
    uuid,
    text,
    uuid
  )
  FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION
  public.consume_production_material_fefo(
    uuid,
    text,
    uuid
  )
  TO authenticated;