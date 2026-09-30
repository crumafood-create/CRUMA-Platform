-- Release a quality-approved finished product to inventory atomically.

CREATE TABLE
  public.finished_product_quality_release_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key uuid NOT NULL UNIQUE,
    quality_inspection_id uuid NOT NULL
      REFERENCES public.quality_inspections(id)
      ON DELETE RESTRICT,
    quality_release_decision_id uuid NOT NULL UNIQUE
      REFERENCES public.quality_release_decisions(id)
      ON DELETE RESTRICT,
    production_output_id uuid NOT NULL UNIQUE
      REFERENCES public.production_outputs(id)
      ON DELETE RESTRICT,
    product_lot_id uuid NOT NULL UNIQUE
      REFERENCES public.product_lots(id)
      ON DELETE RESTRICT,
    inventory_movement_id uuid NOT NULL UNIQUE
      REFERENCES public.inventory_movements(id)
      ON DELETE RESTRICT,
    lot_number text NOT NULL,
    expiration_date date NOT NULL,
    warehouse_id uuid NOT NULL
      REFERENCES public.warehouses(id)
      ON DELETE RESTRICT,
    inventory_location_id uuid NOT NULL
      REFERENCES public.inventory_locations(id)
      ON DELETE RESTRICT,
    release_reason text,
    released_by uuid NOT NULL
      REFERENCES public.profiles(id)
      ON DELETE RESTRICT,
    released_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  );

CREATE INDEX
  finished_product_quality_release_inspection_idx
ON public.finished_product_quality_release_operations (
  quality_inspection_id,
  released_at DESC
);

ALTER TABLE
  public.finished_product_quality_release_operations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  finished_product_quality_release_operations_admin_read
ON public.finished_product_quality_release_operations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE
  public.finished_product_quality_release_operations
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.finished_product_quality_release_operations
TO authenticated;

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
    FROM public.quality_inspections newer
    WHERE
      newer.production_output_id =
        inspection.production_output_id
            AND (newer.inspected_at, newer.id) >
        (inspection.inspected_at, inspection.id)
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
  ) VALUES (
    inspection.id,
    inspection.production_order_id,
    inspection.production_output_id,
    'production_output',
    p_decision,
    auth.uid(),
    btrim(p_reason)
  )
  RETURNING id INTO decision_id;

  UPDATE public.production_outputs
  SET quality_status = CASE p_decision
    WHEN 'hold' THEN 'hold'
    ELSE 'rejected'
  END
  WHERE id = output_row.id;

  RETURN decision_id;
END;
$$;

CREATE OR REPLACE FUNCTION
public.release_finished_product_quality_to_inventory(
  p_inspection_id uuid,
  p_lot_number text,
  p_expiration_date date,
  p_warehouse_id uuid,
  p_inventory_location_id uuid,
  p_idempotency_key uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  inspection public.quality_inspections%ROWTYPE;
  output_row public.production_outputs%ROWTYPE;
  existing_operation
    public.finished_product_quality_release_operations%ROWTYPE;
  v_lot_number text;
  v_reason text;
  v_decision_id uuid;
  v_lot_id uuid;
  v_inventory_movement_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Finished product release requires an administrator.';
  END IF;

  v_lot_number := upper(btrim(p_lot_number));
  v_reason := NULLIF(btrim(p_reason), '');

  IF p_inspection_id IS NULL THEN
    RAISE EXCEPTION
      'Quality inspection is required.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    v_lot_number IS NULL
    OR v_lot_number = ''
    OR v_lot_number
      !~ '^[A-Z0-9][A-Z0-9._/-]{1,39}$'
  ) THEN
    RAISE EXCEPTION
      'Production lot number is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_expiration_date IS NULL THEN
    RAISE EXCEPTION
      'Expiration date is required.'
      USING ERRCODE = '22023';
  END IF;

  IF p_warehouse_id IS NULL THEN
    RAISE EXCEPTION
      'Warehouse is required.'
      USING ERRCODE = '22023';
  END IF;

  IF p_inventory_location_id IS NULL THEN
    RAISE EXCEPTION
      'Inventory location is required.'
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
    public.finished_product_quality_release_operations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF (
      existing_operation.quality_inspection_id
        IS DISTINCT FROM p_inspection_id
      OR existing_operation.lot_number
        IS DISTINCT FROM v_lot_number
      OR existing_operation.expiration_date
        IS DISTINCT FROM p_expiration_date
      OR existing_operation.warehouse_id
        IS DISTINCT FROM p_warehouse_id
      OR existing_operation.inventory_location_id
        IS DISTINCT FROM p_inventory_location_id
      OR existing_operation.release_reason
        IS DISTINCT FROM v_reason
    ) THEN
      RAISE unique_violation
        USING MESSAGE =
          'Idempotency key was reused with different data.';
    END IF;

    RETURN existing_operation.product_lot_id;
  END IF;

  IF p_expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION
      'Expiration date cannot be in the past.'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.warehouses
    WHERE
      id = p_warehouse_id
      AND is_active
  ) THEN
    RAISE EXCEPTION
      'Warehouse is unavailable.'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inventory_locations
    WHERE
      id = p_inventory_location_id
      AND coalesce(is_active, true)
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Inventory location is unavailable.'
      USING ERRCODE = '23514';
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
    inspection.status IS DISTINCT FROM 'passed'
    OR inspection.result IS DISTINCT FROM 'ok'
  ) THEN
    RAISE EXCEPTION
      'Inspection cannot be released.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quality_inspections newer
    WHERE
      newer.production_output_id =
        inspection.production_output_id
            AND (newer.inspected_at, newer.id) >
        (inspection.inspected_at, inspection.id)
  ) THEN
    RAISE EXCEPTION
      'A newer quality inspection exists.'
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
      IS DISTINCT FROM inspection.production_order_id
  ) THEN
    RAISE EXCEPTION
      'Inspection and production output do not match.'
      USING ERRCODE = '23514';
  END IF;

  IF (
    output_row.quality_status
      IS DISTINCT FROM 'pending'
  ) THEN
    RAISE EXCEPTION
      'Production output is not pending quality release.'
      USING ERRCODE = '23514';
  END IF;

  IF output_row.quantity_produced <= 0 THEN
    RAISE EXCEPTION
      'Production output quantity must be positive.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.production_orders
      AS production_order
    WHERE
      production_order.id =
        output_row.production_order_id
      AND production_order.production_status
        IS DISTINCT FROM 'completed'
  ) THEN
    RAISE EXCEPTION
      'Production order is not completed.'
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

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      output_row.product_id::text ||
        ':' ||
        v_lot_number,
      0
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.product_lots
    WHERE
      product_id = output_row.product_id
      AND upper(lot_number) = v_lot_number
  ) THEN
    RAISE unique_violation
      USING MESSAGE =
        'Production lot number already exists for this product.';
  END IF;

  INSERT INTO public.quality_release_decisions (
    inspection_id,
    production_order_id,
    production_output_id,
    subject_type,
    decision,
    approved_by,
    reason
  ) VALUES (
    inspection.id,
    inspection.production_order_id,
    inspection.production_output_id,
    'production_output',
    'release',
    auth.uid(),
    v_reason
  )
  RETURNING id INTO v_decision_id;

  UPDATE public.production_outputs
  SET quality_status = 'released'
  WHERE id = output_row.id;

  INSERT INTO public.product_lots (
    product_id,
    lot_number,
    production_order_id,
    production_output_id,
    expiration_date,
    initial_quantity,
    quantity,
    status,
    inventory_location_id,
    warehouse_id,
    released_at,
    released_by,
    location_name
  )
  SELECT
    output_row.product_id,
    v_lot_number,
    output_row.production_order_id,
    output_row.id,
    p_expiration_date,
    output_row.quantity_produced,
    output_row.quantity_produced,
    'available',
    p_inventory_location_id,
    p_warehouse_id,
    now(),
    auth.uid(),
    inventory_location.name
  FROM public.inventory_locations
    AS inventory_location
  WHERE
    inventory_location.id =
      p_inventory_location_id
  RETURNING id INTO v_lot_id;

  INSERT INTO public.production_lot_traceability (
    product_lot_id,
    production_order_consumption_id,
    raw_material_lot_id,
    raw_material_id,
    source_lot_number,
    consumed_quantity
  )
  SELECT
    v_lot_id,
    consumption.id,
    consumption.raw_material_lot_id,
    order_item.raw_material_id,
    raw_lot.lot_number,
    consumption.quantity
  FROM public.production_order_consumptions
    AS consumption
  JOIN public.production_order_items
    AS order_item
    ON order_item.id =
      consumption.production_order_item_id
  JOIN public.raw_material_lots
    AS raw_lot
    ON raw_lot.id =
      consumption.raw_material_lot_id
  WHERE
    order_item.production_order_id =
      output_row.production_order_id;

  INSERT INTO public.inventory_movements (
    item_type,
    item_id,
    product_id,
    movement_type,
    quantity,
    reference_type,
    reference_id,
    warehouse_id,
    created_by,
    notes
  ) VALUES (
    'product',
    output_row.product_id,
    output_row.product_id,
    'entry',
    output_row.quantity_produced,
    'production_lot',
    v_lot_id,
    p_warehouse_id,
    auth.uid(),
    'Liberación de producto terminado'
  )
  RETURNING id INTO v_inventory_movement_id;

  INSERT INTO
    public.finished_product_quality_release_operations (
      idempotency_key,
      quality_inspection_id,
      quality_release_decision_id,
      production_output_id,
      product_lot_id,
      inventory_movement_id,
      lot_number,
      expiration_date,
      warehouse_id,
      inventory_location_id,
      release_reason,
      released_by
    )
  VALUES (
    p_idempotency_key,
    inspection.id,
    v_decision_id,
    output_row.id,
    v_lot_id,
    v_inventory_movement_id,
    v_lot_number,
    p_expiration_date,
    p_warehouse_id,
    p_inventory_location_id,
    v_reason,
    auth.uid()
  );

  RETURN v_lot_id;
END;
$$;

REVOKE ALL ON FUNCTION
  public.release_production_output_to_inventory(
    uuid,
    text,
    date,
    uuid,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.release_finished_product_quality_to_inventory(
    uuid,
    text,
    date,
    uuid,
    uuid,
    uuid,
    text
  )
FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION
  public.release_finished_product_quality_to_inventory(
    uuid,
    text,
    date,
    uuid,
    uuid,
    uuid,
    text
  )
TO authenticated;