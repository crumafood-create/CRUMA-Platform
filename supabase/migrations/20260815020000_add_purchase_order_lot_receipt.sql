-- Mobile receiving creates the lot and applies its inventory receipt in one transaction.
CREATE OR REPLACE FUNCTION public.receive_purchase_order_lot(
  p_item_id uuid,
  p_lot_number text,
  p_expiration_date date,
  p_inventory_location_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item public.purchase_order_items%ROWTYPE;
  pending numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order receiving requires an administrator.';
  END IF;
  IF NULLIF(btrim(p_lot_number), '') IS NULL THEN RAISE EXCEPTION 'Lot number is required.'; END IF;
  SELECT * INTO item FROM public.purchase_order_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order item not found.'; END IF;
  pending := item.quantity - item.received_quantity;
  IF pending <= 0 THEN RAISE EXCEPTION 'Purchase order item is already received.'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = p_inventory_location_id AND is_active = true AND deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Inventory location is not available.'; END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(item.raw_material_id::text || ':' || lower(btrim(p_lot_number)), 0)
  );
  IF EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE raw_material_id = item.raw_material_id
      AND lower(lot_number) = lower(btrim(p_lot_number))
  ) THEN RAISE EXCEPTION 'Lot number already exists.'; END IF;
  INSERT INTO public.raw_material_lots (
    raw_material_id, lot_number, expiration_date, quantity,
    inventory_location_id, status, unit_cost
  ) VALUES (
    item.raw_material_id, btrim(p_lot_number), p_expiration_date, pending,
    p_inventory_location_id, 'available', item.unit_cost
  );
  PERFORM public.receive_purchase_order_item(item.id, pending);
  RETURN item.purchase_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase_order_lot(uuid, text, date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order_lot(uuid, text, date, uuid) TO authenticated;
