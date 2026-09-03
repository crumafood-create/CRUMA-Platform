-- Add a sales-order row and refresh totals atomically.
CREATE OR REPLACE FUNCTION public.add_sales_order_item(
  p_order_id uuid, p_product_id uuid, p_quantity numeric, p_unit_price numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item_id uuid; order_status text; order_total numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Sales order management requires an administrator.';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity::text = 'NaN'
    OR p_unit_price IS NULL OR p_unit_price < 0 OR p_unit_price::text = 'NaN' THEN
    RAISE EXCEPTION 'Sales order item values are invalid.';
  END IF;
  SELECT status INTO order_status FROM public.sales_orders
  WHERE id = p_order_id FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Sales order is not an editable draft.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id
    AND status = 'active' AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Product is not available.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.sales_order_items
    WHERE sales_order_id = p_order_id AND product_id = p_product_id) THEN
    RAISE EXCEPTION 'Product is already included.';
  END IF;
  INSERT INTO public.sales_order_items (
    sales_order_id, product_id, quantity, unit_price, discount, total, delivered_quantity
  ) VALUES (p_order_id, p_product_id, p_quantity, p_unit_price, 0,
    round(p_quantity * p_unit_price, 2), 0) RETURNING id INTO item_id;
  SELECT coalesce(sum(total), 0) INTO order_total FROM public.sales_order_items
  WHERE sales_order_id = p_order_id;
  UPDATE public.sales_orders SET subtotal = order_total, total = order_total,
    updated_at = now() WHERE id = p_order_id;
  RETURN item_id;
END;
$$;

-- Confirm, reserve stock, and create picking atomically.
CREATE OR REPLACE FUNCTION public.confirm_sales_order(p_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE order_status text; picking_id uuid; unavailable record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Sales order confirmation requires an administrator.';
  END IF;
  SELECT status INTO order_status FROM public.sales_orders
  WHERE id = p_order_id FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Sales order is not a confirmable draft.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sales_order_items WHERE sales_order_id = p_order_id) THEN
    RAISE EXCEPTION 'Sales order has no items.';
  END IF;
  SELECT item.product_id, item.quantity,
    coalesce(sum(stock.available_quantity), 0) AS available
  INTO unavailable
  FROM public.sales_order_items AS item
  LEFT JOIN public.inventory_available_to_promise AS stock
    ON stock.item_type = 'product' AND stock.item_id = item.product_id
  WHERE item.sales_order_id = p_order_id
  GROUP BY item.product_id, item.quantity
  HAVING coalesce(sum(stock.available_quantity), 0) < item.quantity LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para producto %. Disponible %. Requerido %.',
      unavailable.product_id, unavailable.available, unavailable.quantity;
  END IF;
  INSERT INTO public.inventory_reservations (
    item_type, item_id, reference_type, reference_id, quantity, status, notes
  ) SELECT 'product', product_id, 'sales_order', p_order_id, quantity,
    'active', 'Reserva por pedido de venta' FROM public.sales_order_items
    WHERE sales_order_id = p_order_id;
  INSERT INTO public.picking_orders (sales_order_id, status)
  VALUES (p_order_id, 'pending') RETURNING id INTO picking_id;
  INSERT INTO public.picking_order_items (picking_order_id, product_id, quantity)
  SELECT picking_id, product_id, quantity FROM public.sales_order_items
  WHERE sales_order_id = p_order_id;
  UPDATE public.sales_orders SET status = 'confirmed', updated_at = now()
  WHERE id = p_order_id;
  RETURN picking_id;
END;
$$;

-- Enforce the sales-order state machine under row lock.
CREATE OR REPLACE FUNCTION public.transition_sales_order(
  p_order_id uuid, p_expected_status text, p_next_status text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Sales order transition requires an administrator.';
  END IF;
  SELECT status INTO current_status FROM public.sales_orders
  WHERE id = p_order_id FOR UPDATE;
  IF current_status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION 'Sales order status changed concurrently.';
  END IF;
  IF NOT ((current_status = 'confirmed' AND p_next_status IN ('preparing', 'cancelled'))
    OR (current_status = 'preparing' AND p_next_status = 'ready')) THEN
    RAISE EXCEPTION 'Sales order transition is invalid.';
  END IF;
  UPDATE public.sales_orders SET status = p_next_status, updated_at = now()
  WHERE id = p_order_id;
  RETURN p_order_id;
END;
$$;

-- Consume the selected lot and complete a picking row atomically.
CREATE OR REPLACE FUNCTION public.confirm_picking_item(
  p_picking_item_id uuid, p_lot_number text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE picked public.picking_order_items%ROWTYPE; lot_id uuid; suggested_lot_number text;
  required_quantity numeric; picking_status text; sales_order_id uuid; completed boolean;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Picking requires an administrator.';
  END IF;
  SELECT * INTO picked FROM public.picking_order_items
  WHERE id = p_picking_item_id FOR UPDATE;
  IF NOT FOUND OR picked.status = 'completed' THEN RAISE EXCEPTION 'Picking item is unavailable.'; END IF;
  required_quantity := picked.quantity;
  SELECT product_lot.lot_number INTO suggested_lot_number
  FROM public.product_lots AS product_lot
  WHERE product_lot.product_id = picked.product_id
    AND product_lot.quantity >= required_quantity AND product_lot.status = 'available'
  ORDER BY product_lot.expiration_date NULLS LAST, product_lot.created_at LIMIT 1;
  IF suggested_lot_number IS DISTINCT FROM trim(p_lot_number) THEN
    RAISE EXCEPTION 'Scanned lot does not match the FEFO suggestion.';
  END IF;
  SELECT product_lot.id INTO lot_id FROM public.product_lots AS product_lot
  WHERE product_lot.product_id = picked.product_id
    AND product_lot.lot_number = trim(p_lot_number)
    AND product_lot.quantity >= required_quantity
    AND product_lot.status = 'available'
  ORDER BY product_lot.expiration_date NULLS LAST, product_lot.created_at LIMIT 1 FOR UPDATE;
  IF lot_id IS NULL THEN RAISE EXCEPTION 'Product lot is unavailable or insufficient.'; END IF;
  UPDATE public.product_lots AS product_lot
  SET quantity = product_lot.quantity - required_quantity, updated_at = now()
  WHERE product_lot.id = lot_id AND product_lot.quantity >= required_quantity;
  INSERT INTO public.inventory_movements (
    item_type, item_id, product_id, movement_type, quantity,
    reference_type, reference_id, notes
  ) VALUES ('product', picked.product_id, picked.product_id, 'exit', required_quantity,
    'picking', picked.picking_order_id, 'Picking de pedido de venta');
  UPDATE public.picking_order_items SET picked_quantity = required_quantity,
    product_lot_id = lot_id, status = 'completed', updated_at = now()
  WHERE id = picked.id;
  SELECT bool_and(status = 'completed') INTO completed FROM public.picking_order_items
  WHERE picking_order_id = picked.picking_order_id;
  SELECT picking.status, picking.sales_order_id INTO picking_status, sales_order_id
  FROM public.picking_orders AS picking WHERE picking.id = picked.picking_order_id FOR UPDATE;
  UPDATE public.picking_orders SET status = CASE WHEN completed THEN 'completed' ELSE 'in_progress' END,
    completed_at = CASE WHEN completed THEN now() ELSE NULL END, updated_at = now()
  WHERE id = picked.picking_order_id;
  UPDATE public.inventory_reservations SET status = 'released', updated_at = now()
  WHERE reference_type = 'sales_order' AND reference_id = sales_order_id
    AND item_id = picked.product_id AND status = 'active';
  IF completed THEN UPDATE public.sales_orders SET status = 'preparing', updated_at = now()
    WHERE id = sales_order_id AND status = 'confirmed'; END IF;
  RETURN picked.picking_order_id;
END;
$$;

-- Delivery closes an already picked order; it does not consume inventory a second time.
CREATE OR REPLACE FUNCTION public.deliver_sales_order(p_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE order_row public.sales_orders%ROWTYPE; picking_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Sales order delivery requires an administrator.';
  END IF;
  SELECT * INTO order_row FROM public.sales_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR order_row.status IS DISTINCT FROM 'ready' THEN
    RAISE EXCEPTION 'Sales order is not ready for delivery.';
  END IF;
  SELECT status INTO picking_status FROM public.picking_orders
  WHERE sales_order_id = p_order_id FOR UPDATE;
  IF picking_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Picking must be completed before delivery.';
  END IF;
  UPDATE public.inventory_reservations SET status = 'released', updated_at = now()
  WHERE reference_type = 'sales_order' AND reference_id = p_order_id AND status = 'active';
  UPDATE public.sales_orders SET status = 'delivered', updated_at = now()
  WHERE id = p_order_id;
  IF order_row.total > 0 THEN
    INSERT INTO public.accounts_receivable (
      customer_id, sales_order_id, amount, balance, status
    ) VALUES (order_row.customer_id, p_order_id, order_row.total, order_row.total, 'pending');
  END IF;
  RETURN p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_sales_order_item(uuid, uuid, numeric, numeric) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.confirm_sales_order(uuid) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.transition_sales_order(uuid, text, text) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.confirm_picking_item(uuid, text) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.deliver_sales_order(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.add_sales_order_item(uuid, uuid, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_sales_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_sales_order(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_picking_item(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deliver_sales_order(uuid) TO authenticated;
