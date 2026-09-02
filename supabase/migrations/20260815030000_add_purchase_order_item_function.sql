-- Add a purchase-order row and refresh totals atomically.
CREATE OR REPLACE FUNCTION public.add_purchase_order_item(
  p_order_id uuid,
  p_raw_material_id uuid,
  p_quantity numeric,
  p_unit_cost numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item_id uuid;
  order_status text;
  order_total numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order management requires an administrator.';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity::text = 'NaN'
    OR p_unit_cost IS NULL OR p_unit_cost < 0 OR p_unit_cost::text = 'NaN' THEN
    RAISE EXCEPTION 'Purchase order item values are invalid.';
  END IF;
  SELECT status INTO order_status FROM public.purchase_orders
  WHERE id = p_order_id AND deleted_at IS NULL FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Purchase order is not an editable draft.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.raw_materials
    WHERE id = p_raw_material_id AND is_active = true AND deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Raw material is not available.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE purchase_order_id = p_order_id AND raw_material_id = p_raw_material_id
  ) THEN RAISE EXCEPTION 'Raw material is already included.'; END IF;

  INSERT INTO public.purchase_order_items (
    purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity
  ) VALUES (
    p_order_id, p_raw_material_id, p_quantity, p_unit_cost,
    round(p_quantity * p_unit_cost, 4), 0
  ) RETURNING id INTO item_id;
  SELECT coalesce(sum(total), 0) INTO order_total
  FROM public.purchase_order_items WHERE purchase_order_id = p_order_id;
  UPDATE public.purchase_orders
  SET subtotal = order_total, total = order_total, updated_at = now()
  WHERE id = p_order_id;
  RETURN item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_purchase_order_item(uuid, uuid, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_purchase_order_item(uuid, uuid, numeric, numeric) TO authenticated;
