-- Preserve which storage-condition balance a picker actually removes.
ALTER TABLE public.picking_lot_allocations
  ADD COLUMN storage_condition text,
  ADD CONSTRAINT picking_lot_allocations_storage_condition_check
    CHECK (storage_condition IS NULL OR storage_condition IN ('fresh', 'raw_frozen'));

CREATE OR REPLACE FUNCTION public.confirm_picking_item_with_condition(
  p_picking_item_id uuid,
  p_lot_number text,
  p_storage_condition text,
  p_quantity integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  picked public.picking_order_items%ROWTYPE;
  product_lot public.product_lots%ROWTYPE;
  storage_balance public.product_lot_storage_balances%ROWTYPE;
  product_id uuid;
  remaining_quantity numeric;
  allocated_quantity numeric;
  condition_quantity integer;
  total_condition_quantity integer;
  is_condition_managed boolean;
  item_completed boolean;
  all_completed boolean;
  sales_order_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Picking requires an administrator.';
  END IF;

  SELECT item.product_id INTO product_id
  FROM public.picking_order_items AS item
  WHERE item.id = p_picking_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Picking item is unavailable.' USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM public.products AS product
  WHERE product.id = product_id
  FOR UPDATE;

  SELECT * INTO picked
  FROM public.picking_order_items AS item
  WHERE item.id = p_picking_item_id
  FOR UPDATE;
  IF picked.status = 'completed' THEN
    RAISE EXCEPTION 'Picking item is unavailable.' USING ERRCODE = '23514';
  END IF;

  remaining_quantity := picked.quantity - picked.picked_quantity;
  IF remaining_quantity <= 0 THEN
    RAISE EXCEPTION 'Picking item has no remaining quantity.' USING ERRCODE = '23514';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    JOIN public.product_lots AS lot ON lot.id = balance.product_lot_id
    WHERE lot.product_id = picked.product_id
  ) INTO is_condition_managed;

  IF is_condition_managed THEN
    IF p_storage_condition IS NULL
      OR p_storage_condition NOT IN ('fresh', 'raw_frozen')
      OR p_quantity IS NULL OR p_quantity <= 0 THEN
      RAISE EXCEPTION 'Select a storage condition and a positive piece quantity.'
        USING ERRCODE = '22023';
    END IF;
    IF p_quantity > remaining_quantity THEN
      RAISE EXCEPTION 'Requested pieces exceed the remaining picking quantity.'
        USING ERRCODE = '23514';
    END IF;

    -- Existing lots without a condition row become fresh when this product
    -- first enters condition-managed picking, matching the legacy available
    -- balance while making later condition movements explicit.
    INSERT INTO public.product_lot_storage_balances (
      product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity
    )
    SELECT lot.id, lot.quantity::integer, 0, 0
    FROM public.product_lots AS lot
    JOIN public.production_outputs AS output
      ON output.id = lot.production_output_id
    WHERE lot.product_id = picked.product_id
      AND lot.quantity > 0
      AND lot.quantity = trunc(lot.quantity)
      AND lot.status = 'available'
      AND output.quality_status = 'released'
      AND NOT EXISTS (
        SELECT 1 FROM public.product_lot_storage_balances AS existing
        WHERE existing.product_lot_id = lot.id
      )
    ON CONFLICT (product_lot_id) DO NOTHING;

    SELECT coalesce(sum(CASE p_storage_condition
      WHEN 'fresh' THEN balance.fresh_quantity
      ELSE balance.raw_frozen_quantity END), 0)::integer
    INTO total_condition_quantity
    FROM public.product_lot_storage_balances AS balance
    JOIN public.product_lots AS lot ON lot.id = balance.product_lot_id
    JOIN public.production_outputs AS output
      ON output.id = lot.production_output_id
    WHERE lot.product_id = picked.product_id
      AND lot.quantity > 0
      AND lot.status = 'available'
      AND output.quality_status = 'released'
      AND (lot.expiration_date IS NULL OR lot.expiration_date >= CURRENT_DATE);

    IF p_quantity > total_condition_quantity THEN
      RAISE EXCEPTION
        'Faltan % piezas de la condición %; solicitaste % y hay % disponibles.',
        p_quantity - total_condition_quantity, p_storage_condition,
        p_quantity, total_condition_quantity
        USING ERRCODE = '23514';
    END IF;

    SELECT candidate, CASE p_storage_condition
      WHEN 'fresh' THEN balance.fresh_quantity
      ELSE balance.raw_frozen_quantity END
    INTO product_lot, condition_quantity
    FROM public.product_lots AS candidate
    JOIN public.product_lot_storage_balances AS balance
      ON balance.product_lot_id = candidate.id
    JOIN public.production_outputs AS output
      ON output.id = candidate.production_output_id
    WHERE candidate.product_id = picked.product_id
      AND candidate.quantity > 0
      AND candidate.status = 'available'
      AND output.quality_status = 'released'
      AND (candidate.expiration_date IS NULL
        OR candidate.expiration_date >= CURRENT_DATE)
      AND CASE p_storage_condition
        WHEN 'fresh' THEN balance.fresh_quantity > 0
        ELSE balance.raw_frozen_quantity > 0 END
    ORDER BY candidate.expiration_date NULLS LAST, candidate.created_at
    LIMIT 1
    FOR UPDATE OF candidate, balance;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No released FEFO lot is available for condition %.',
        p_storage_condition USING ERRCODE = '23514';
    END IF;
    IF upper(btrim(p_lot_number)) IS DISTINCT FROM upper(product_lot.lot_number) THEN
      RAISE EXCEPTION 'Scanned lot is not the next FEFO lot for condition %.',
        p_storage_condition USING ERRCODE = '23514';
    END IF;

    allocated_quantity := LEAST(condition_quantity, p_quantity);
    UPDATE public.product_lot_storage_balances AS balance
    SET fresh_quantity = CASE WHEN p_storage_condition = 'fresh'
        THEN fresh_quantity - allocated_quantity ELSE fresh_quantity END,
      raw_frozen_quantity = CASE WHEN p_storage_condition = 'raw_frozen'
        THEN raw_frozen_quantity - allocated_quantity ELSE raw_frozen_quantity END,
      updated_at = now()
    WHERE balance.product_lot_id = product_lot.id;
  ELSE
    IF p_storage_condition IS NOT NULL OR p_quantity IS NOT NULL THEN
      RAISE EXCEPTION 'This product still uses the standard picking flow.'
        USING ERRCODE = '22023';
    END IF;

    SELECT candidate INTO product_lot
    FROM public.product_lots AS candidate
    JOIN public.production_outputs AS output
      ON output.id = candidate.production_output_id
    WHERE candidate.product_id = picked.product_id
      AND candidate.quantity > 0
      AND candidate.status = 'available'
      AND (candidate.expiration_date IS NULL
        OR candidate.expiration_date >= CURRENT_DATE)
      AND output.quality_status = 'released'
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
  END IF;

  IF allocated_quantity <= 0 THEN
    RAISE EXCEPTION 'No pieces are available in the selected condition.'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.product_lots AS lot_target
  SET quantity = product_lot.quantity - allocated_quantity,
    status = CASE WHEN product_lot.quantity - allocated_quantity = 0
      THEN 'depleted' ELSE product_lot.status END,
    updated_at = now()
  WHERE lot_target.id = product_lot.id;

  INSERT INTO public.picking_lot_allocations (
    picking_order_item_id, product_lot_id, quantity, created_by, storage_condition
  ) VALUES (
    picked.id, product_lot.id, allocated_quantity, auth.uid(),
    CASE WHEN is_condition_managed THEN p_storage_condition ELSE NULL END
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
    auth.uid(), 'Picking FEFO por lote y condición'
  );

  SELECT order_row.sales_order_id INTO sales_order_id
  FROM public.picking_orders AS order_row
  WHERE order_row.id = picked.picking_order_id
  FOR UPDATE;

  UPDATE public.inventory_reservations AS reservation
  SET quantity = greatest(reservation.quantity - allocated_quantity, 0),
    status = CASE WHEN reservation.quantity - allocated_quantity <= 0
      THEN 'released' ELSE reservation.status END,
    updated_at = now()
  WHERE reservation.reference_type = 'sales_order'
    AND reservation.reference_id = sales_order_id
    AND reservation.item_type = 'product'
    AND reservation.item_id = picked.product_id
    AND reservation.status = 'active';

  SELECT bool_and(item.status = 'completed') INTO all_completed
  FROM public.picking_order_items AS item
  WHERE item.picking_order_id = picked.picking_order_id;

  UPDATE public.picking_orders AS order_row
  SET status = CASE WHEN all_completed THEN 'completed' ELSE 'in_progress' END,
    completed_at = CASE WHEN all_completed THEN now() ELSE NULL END,
    started_at = coalesce(order_row.started_at, now()),
    updated_at = now()
  WHERE order_row.id = picked.picking_order_id;

  IF all_completed THEN
    UPDATE public.sales_orders
    SET status = 'preparing', updated_at = now()
    WHERE id = sales_order_id AND status = 'confirmed';
  END IF;

  RETURN picked.picking_order_id;
END;
$function$;

-- Keep existing callers working for products that have no condition balances.
CREATE OR REPLACE FUNCTION public.confirm_picking_item(
  p_picking_item_id uuid,
  p_lot_number text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN public.confirm_picking_item_with_condition(
    p_picking_item_id, p_lot_number, NULL, NULL
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_picking_item_with_condition(uuid, text, text, integer)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.confirm_picking_item(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_picking_item_with_condition(uuid, text, text, integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_picking_item(uuid, text)
  TO authenticated;
