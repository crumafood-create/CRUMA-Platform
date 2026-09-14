ALTER TABLE public.product_lots
  ADD COLUMN production_output_id uuid,
  ADD COLUMN initial_quantity numeric(18,4),
  ADD COLUMN released_at timestamptz,
  ADD COLUMN released_by uuid;

UPDATE public.product_lots
SET initial_quantity = quantity
WHERE initial_quantity IS NULL;

ALTER TABLE public.product_lots
  ALTER COLUMN initial_quantity SET DEFAULT 0,
  ALTER COLUMN initial_quantity SET NOT NULL,
  ADD CONSTRAINT product_lots_production_output_id_fkey
    FOREIGN KEY (production_output_id) REFERENCES public.production_outputs(id) ON DELETE RESTRICT,
  ADD CONSTRAINT product_lots_released_by_fkey
    FOREIGN KEY (released_by) REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD CONSTRAINT product_lots_warehouse_id_fkey
    FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  ADD CONSTRAINT product_lots_production_output_unique UNIQUE (production_output_id),
  ADD CONSTRAINT product_lots_quantity_nonnegative CHECK (quantity >= 0),
  ADD CONSTRAINT product_lots_initial_quantity_nonnegative CHECK (initial_quantity >= 0);

CREATE TABLE public.production_lot_traceability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_lot_id uuid NOT NULL REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  production_order_consumption_id uuid NOT NULL
    REFERENCES public.production_order_consumptions(id) ON DELETE RESTRICT,
  raw_material_lot_id uuid NOT NULL REFERENCES public.raw_material_lots(id) ON DELETE RESTRICT,
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  source_lot_number text NOT NULL,
  consumed_quantity numeric(18,4) NOT NULL CHECK (consumed_quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_lot_id, production_order_consumption_id)
);

CREATE TABLE public.picking_lot_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_order_item_id uuid NOT NULL
    REFERENCES public.picking_order_items(id) ON DELETE RESTRICT,
  product_lot_id uuid NOT NULL REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  quantity numeric(18,4) NOT NULL CHECK (quantity > 0),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX production_lot_traceability_product_lot_idx
  ON public.production_lot_traceability(product_lot_id);
CREATE INDEX production_lot_traceability_raw_lot_idx
  ON public.production_lot_traceability(raw_material_lot_id);
CREATE INDEX picking_lot_allocations_item_idx
  ON public.picking_lot_allocations(picking_order_item_id, created_at);
CREATE INDEX product_lots_fefo_hardened_idx
  ON public.product_lots(product_id, status, expiration_date, created_at)
  WHERE quantity > 0;

ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_lot_traceability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picking_lot_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_lots_admin_read ON public.product_lots;
CREATE POLICY product_lots_admin_read ON public.product_lots
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY production_lot_traceability_admin_read ON public.production_lot_traceability
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY picking_lot_allocations_admin_read ON public.picking_lot_allocations
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.product_lots,
  public.production_lot_traceability,
  public.picking_lot_allocations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_lots,
  public.production_lot_traceability,
  public.picking_lot_allocations TO authenticated;

CREATE OR REPLACE VIEW public.inventory_pick_suggestions
WITH (security_invoker = true) AS
SELECT product_lot.id AS lot_id,
  product_lot.product_id,
  product_lot.lot_number,
  product_lot.quantity,
  product_lot.location_name,
  product_lot.expiration_date
FROM public.product_lots AS product_lot
WHERE product_lot.quantity > 0
  AND product_lot.status = 'available'
  AND (product_lot.expiration_date IS NULL
    OR product_lot.expiration_date >= CURRENT_DATE)
  AND EXISTS (
    SELECT 1 FROM public.production_outputs AS production_output
    WHERE production_output.id = product_lot.production_output_id
      AND production_output.quality_status = 'released'
  )
ORDER BY product_lot.expiration_date NULLS LAST, product_lot.created_at;

CREATE OR REPLACE VIEW public.inventory_product_lots_fefo
WITH (security_invoker = true) AS
SELECT product_lot.id,
  product_lot.product_id,
  product_lot.lot_number,
  product_lot.quantity,
  product_lot.expiration_date,
  inventory_location.name AS location_name
FROM public.product_lots AS product_lot
LEFT JOIN public.inventory_locations AS inventory_location
  ON inventory_location.id = product_lot.inventory_location_id
WHERE product_lot.quantity > 0
  AND product_lot.status = 'available'
  AND (product_lot.expiration_date IS NULL
    OR product_lot.expiration_date >= CURRENT_DATE)
  AND EXISTS (
    SELECT 1 FROM public.production_outputs AS production_output
    WHERE production_output.id = product_lot.production_output_id
      AND production_output.quality_status = 'released'
  )
ORDER BY product_lot.expiration_date NULLS LAST, product_lot.created_at;

REVOKE ALL ON TABLE public.inventory_pick_suggestions,
  public.inventory_product_lots_fefo FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.inventory_pick_suggestions,
  public.inventory_product_lots_fefo TO authenticated;

CREATE OR REPLACE FUNCTION public.release_production_output_to_inventory(
  p_output_id uuid,
  p_lot_number text,
  p_expiration_date date,
  p_warehouse_id uuid,
  p_inventory_location_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  output_row public.production_outputs%ROWTYPE;
  v_lot_id uuid;
  v_lot_number text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE =
      'Production lot release requires an administrator.';
  END IF;

  v_lot_number := upper(btrim(p_lot_number));
  IF p_output_id IS NULL OR v_lot_number IS NULL OR v_lot_number = ''
     OR v_lot_number !~ '^[A-Z0-9][A-Z0-9._/-]{1,39}$' THEN
    RAISE EXCEPTION 'Production lot number is invalid.' USING ERRCODE = '22023';
  END IF;
  IF p_expiration_date IS NULL OR p_expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Expiration date cannot be in the past.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses
    WHERE id = p_warehouse_id AND is_active
  ) THEN
    RAISE EXCEPTION 'Warehouse is unavailable.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = p_inventory_location_id
      AND coalesce(is_active, true)
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Inventory location is unavailable.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO output_row
  FROM public.production_outputs
  WHERE id = p_output_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production output was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF output_row.quality_status IS DISTINCT FROM 'released' THEN
    RAISE EXCEPTION 'Production output is not quality released.' USING ERRCODE = '23514';
  END IF;
  IF output_row.quantity_produced <= 0 THEN
    RAISE EXCEPTION 'Production output quantity must be positive.' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = output_row.production_order_id
      AND production_status IS DISTINCT FROM 'completed'
  ) THEN
    RAISE EXCEPTION 'Production order is not completed.' USING ERRCODE = '23514';
  END IF;

  SELECT id INTO v_lot_id
  FROM public.product_lots
  WHERE production_output_id = output_row.id;
  IF v_lot_id IS NOT NULL THEN
    RETURN v_lot_id;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    output_row.product_id::text || ':' || v_lot_number, 0
  ));
  IF EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE product_id = output_row.product_id
      AND upper(lot_number) = v_lot_number
  ) THEN
    RAISE EXCEPTION 'Production lot number already exists for this product.'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.product_lots (
    product_id, lot_number, production_order_id, production_output_id,
    expiration_date, initial_quantity, quantity, status,
    inventory_location_id, warehouse_id, released_at, released_by,
    location_name
  )
  SELECT output_row.product_id, v_lot_number, output_row.production_order_id,
    output_row.id, p_expiration_date, output_row.quantity_produced,
    output_row.quantity_produced, 'available', p_inventory_location_id,
    p_warehouse_id, now(), auth.uid(), inventory_location.name
  FROM public.inventory_locations AS inventory_location
  WHERE inventory_location.id = p_inventory_location_id
  RETURNING id INTO v_lot_id;

  INSERT INTO public.production_lot_traceability (
    product_lot_id, production_order_consumption_id, raw_material_lot_id,
    raw_material_id, source_lot_number, consumed_quantity
  )
  SELECT v_lot_id, consumption.id, consumption.raw_material_lot_id,
    order_item.raw_material_id, raw_lot.lot_number, consumption.quantity
  FROM public.production_order_consumptions AS consumption
  JOIN public.production_order_items AS order_item
    ON order_item.id = consumption.production_order_item_id
  JOIN public.raw_material_lots AS raw_lot
    ON raw_lot.id = consumption.raw_material_lot_id
  WHERE order_item.production_order_id = output_row.production_order_id;

  INSERT INTO public.inventory_movements (
    item_type, item_id, product_id, movement_type, quantity,
    reference_type, reference_id, warehouse_id, created_by, notes
  ) VALUES (
    'product', output_row.product_id, output_row.product_id, 'entry',
    output_row.quantity_produced, 'production_lot', v_lot_id,
    p_warehouse_id, auth.uid(), 'Liberación de lote producido'
  );

  RETURN v_lot_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_picking_item(
  p_picking_item_id uuid,
  p_lot_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  picked public.picking_order_items%ROWTYPE;
  product_lot public.product_lots%ROWTYPE;
  remaining_quantity numeric;
  allocated_quantity numeric;
  item_completed boolean;
  all_completed boolean;
  v_sales_order_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Picking requires an administrator.';
  END IF;

  SELECT * INTO picked
  FROM public.picking_order_items
  WHERE id = p_picking_item_id
  FOR UPDATE;

  IF NOT FOUND OR picked.status = 'completed' THEN
    RAISE EXCEPTION 'Picking item is unavailable.' USING ERRCODE = '23514';
  END IF;

  remaining_quantity := picked.quantity - picked.picked_quantity;
  IF remaining_quantity <= 0 THEN
    RAISE EXCEPTION 'Picking item has no remaining quantity.' USING ERRCODE = '23514';
  END IF;

  SELECT candidate.* INTO product_lot
  FROM public.product_lots AS candidate
  WHERE candidate.product_id = picked.product_id
    AND candidate.quantity > 0
    AND candidate.status = 'available'
    AND (candidate.expiration_date IS NULL
      OR candidate.expiration_date >= CURRENT_DATE)
    AND EXISTS (
      SELECT 1 FROM public.production_outputs AS production_output
      WHERE production_output.id = candidate.production_output_id
        AND production_output.quality_status = 'released'
    )
  ORDER BY candidate.expiration_date NULLS LAST, candidate.created_at
  LIMIT 1
  FOR UPDATE OF candidate;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No released FEFO lot is available.' USING ERRCODE = '23514';
  END IF;
  IF upper(btrim(p_lot_number)) IS DISTINCT FROM upper(product_lot.lot_number) THEN
    RAISE EXCEPTION 'Scanned lot does not match the FEFO suggestion.'
      USING ERRCODE = '23514';
  END IF;

  allocated_quantity := LEAST(product_lot.quantity, remaining_quantity);

  UPDATE public.product_lots AS lot_target
  SET quantity = product_lot.quantity - allocated_quantity,
    status = CASE
      WHEN product_lot.quantity - allocated_quantity = 0 THEN 'depleted'
      ELSE product_lot.status
    END,
    updated_at = now()
  WHERE lot_target.id = product_lot.id;

  INSERT INTO public.picking_lot_allocations (
    picking_order_item_id, product_lot_id, quantity, created_by
  ) VALUES (
    picked.id, product_lot.id, allocated_quantity, auth.uid()
  );

  item_completed := picked.picked_quantity + allocated_quantity >= picked.quantity;
  UPDATE public.picking_order_items
  SET picked_quantity = picked.picked_quantity + allocated_quantity,
    product_lot_id = product_lot.id,
    status = CASE WHEN item_completed THEN 'completed' ELSE 'in_progress' END,
    updated_at = now()
  WHERE id = picked.id;

  INSERT INTO public.inventory_movements (
    item_type, item_id, product_id, movement_type, quantity,
    reference_type, reference_id, warehouse_id, created_by, notes
  ) VALUES (
    'product', picked.product_id, picked.product_id, 'exit', allocated_quantity,
    'picking_lot_allocation', picked.picking_order_id, product_lot.warehouse_id,
    auth.uid(), 'Picking FEFO por lote'
  );

  SELECT bool_and(status = 'completed') INTO all_completed
  FROM public.picking_order_items
  WHERE picking_order_id = picked.picking_order_id;

  SELECT sales_order_id INTO v_sales_order_id
  FROM public.picking_orders
  WHERE id = picked.picking_order_id
  FOR UPDATE;

  UPDATE public.picking_orders
  SET status = CASE WHEN all_completed THEN 'completed' ELSE 'in_progress' END,
    completed_at = CASE WHEN all_completed THEN now() ELSE NULL END,
    started_at = coalesce(started_at, now()),
    updated_at = now()
  WHERE id = picked.picking_order_id;

  IF item_completed THEN
    UPDATE public.inventory_reservations
    SET status = 'released', updated_at = now()
    WHERE reference_type = 'sales_order'
      AND reference_id = v_sales_order_id
      AND item_id = picked.product_id
      AND status = 'active';
  END IF;

  IF all_completed THEN
    UPDATE public.sales_orders
    SET status = 'preparing', updated_at = now()
    WHERE id = v_sales_order_id AND status = 'confirmed';
  END IF;

  RETURN picked.picking_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.release_production_output_to_inventory(
  uuid, text, date, uuid, uuid
) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.confirm_picking_item(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.release_production_output_to_inventory(
  uuid, text, date, uuid, uuid
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_picking_item(uuid, text)
  TO authenticated;
