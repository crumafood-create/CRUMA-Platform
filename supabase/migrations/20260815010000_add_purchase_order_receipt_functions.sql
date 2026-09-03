-- Receive purchase quantities atomically and retain four decimal places in the audit trail.
DROP VIEW public.inventory_available_to_promise;
DROP VIEW public.inventory_stock_by_item;
DROP VIEW public.inventory_stock;

ALTER TABLE public.inventory_movements
  ALTER COLUMN quantity TYPE numeric(18,4) USING quantity::numeric(18,4);

CREATE VIEW public.inventory_stock_by_item AS
SELECT warehouse_id, COALESCE(item_type, 'product') AS item_type,
  COALESCE(item_id, product_id) AS item_id,
  sum(CASE WHEN movement_type = 'entry' THEN quantity
           WHEN movement_type = 'exit' THEN -quantity ELSE 0 END) AS quantity
FROM public.inventory_movements
GROUP BY warehouse_id, COALESCE(item_type, 'product'), COALESCE(item_id, product_id);

CREATE VIEW public.inventory_available_to_promise AS
SELECT s.item_type, s.item_id, s.quantity AS stock_quantity,
  COALESCE(r.reserved_quantity, 0::numeric) AS reserved_quantity,
  s.quantity::numeric - COALESCE(r.reserved_quantity, 0::numeric) AS available_quantity
FROM public.inventory_stock_by_item s
LEFT JOIN (
  SELECT item_type, item_id, sum(quantity) AS reserved_quantity
  FROM public.inventory_reservations WHERE status = 'active'
  GROUP BY item_type, item_id
) r ON r.item_type = s.item_type AND r.item_id = s.item_id;

CREATE VIEW public.inventory_stock AS
SELECT product_id,
  sum(CASE WHEN movement_type = 'entry' THEN quantity
           WHEN movement_type = 'exit' THEN -quantity ELSE 0 END) AS quantity
FROM public.inventory_movements GROUP BY product_id;

ALTER VIEW public.inventory_stock_by_item OWNER TO postgres;
ALTER VIEW public.inventory_available_to_promise OWNER TO postgres;
ALTER VIEW public.inventory_stock OWNER TO postgres;
GRANT ALL ON TABLE public.inventory_stock_by_item TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.inventory_available_to_promise TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.inventory_stock TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.receive_purchase_order_item(
  p_item_id uuid,
  p_quantity numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item public.purchase_order_items%ROWTYPE;
  order_status text;
  pending numeric;
  completed boolean;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order receiving requires an administrator.';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Receipt quantity must be positive.';
  END IF;
  SELECT * INTO item FROM public.purchase_order_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order item not found.'; END IF;
  SELECT status INTO order_status FROM public.purchase_orders
  WHERE id = item.purchase_order_id AND deleted_at IS NULL FOR UPDATE;
  IF order_status NOT IN ('released', 'partially_received') THEN
    RAISE EXCEPTION 'Purchase order cannot be received in its current state.';
  END IF;

  pending := item.quantity - item.received_quantity;
  IF pending <= 0 OR p_quantity > pending THEN
    RAISE EXCEPTION 'Receipt quantity exceeds the pending quantity.';
  END IF;
  UPDATE public.raw_materials
  SET average_cost = round(
        ((current_stock * average_cost) + (p_quantity * item.unit_cost))
        / NULLIF(current_stock + p_quantity, 0), 4
      ),
      last_cost = item.unit_cost,
      current_stock = current_stock + p_quantity,
      updated_at = now()
  WHERE id = item.raw_material_id AND is_active = true AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Raw material is not available.'; END IF;

  UPDATE public.purchase_order_items
  SET received_quantity = received_quantity + p_quantity WHERE id = item.id;
  INSERT INTO public.inventory_movements (
    item_type, item_id, movement_type, quantity, reference_type, reference_id, notes
  ) VALUES (
    'raw_material', item.raw_material_id, 'entry', p_quantity,
    'purchase_order', item.purchase_order_id, 'Recepción de compra'
  );
  SELECT bool_and(received_quantity >= quantity) INTO completed
  FROM public.purchase_order_items WHERE purchase_order_id = item.purchase_order_id;
  UPDATE public.purchase_orders
  SET status = CASE WHEN completed THEN 'received' ELSE 'partially_received' END,
      updated_at = now()
  WHERE id = item.purchase_order_id;
  RETURN item.purchase_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  row_item record;
  processed integer := 0;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order receiving requires an administrator.';
  END IF;
  FOR row_item IN
    SELECT id, quantity - received_quantity AS pending
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_order_id AND received_quantity < quantity ORDER BY id
  LOOP
    PERFORM public.receive_purchase_order_item(row_item.id, row_item.pending);
    processed := processed + 1;
  END LOOP;
  IF processed = 0 THEN RAISE EXCEPTION 'Purchase order has no pending items.'; END IF;
  RETURN p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase_order_item(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.receive_purchase_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order_item(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order(uuid) TO authenticated;
