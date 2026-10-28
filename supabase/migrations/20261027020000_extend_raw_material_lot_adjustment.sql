CREATE OR REPLACE FUNCTION public.adjust_raw_material_lot_quantity(
  p_lot_id uuid, p_movement_type text, p_quantity numeric, p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  lot public.raw_material_lots%ROWTYPE;
  material public.raw_materials%ROWTYPE;
  v_previous_stock numeric(18,4); v_new_stock numeric(18,4);
  v_new_average_cost numeric(18,4); v_movement_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Inventory adjustment requires an administrator.';
  END IF;
  IF p_movement_type IS NULL OR p_movement_type NOT IN ('entry', 'exit')
     OR p_lot_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
     OR p_quantity::text IN ('NaN', 'Infinity', '-Infinity')
     OR NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Raw material lot adjustment data is invalid.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO lot FROM public.raw_material_lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Raw material lot was not found.' USING ERRCODE = 'P0002'; END IF;
  IF lot.status <> 'available' THEN
    RAISE EXCEPTION 'Only available raw material lots can be adjusted.' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO material FROM public.raw_materials WHERE id = lot.raw_material_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Raw material was not found.' USING ERRCODE = 'P0002'; END IF;
  v_previous_stock := material.current_stock;
  IF p_movement_type = 'exit' THEN
    IF p_quantity > lot.quantity OR p_quantity > v_previous_stock THEN
      RAISE EXCEPTION 'Adjustment quantity exceeds available stock.' USING ERRCODE = '23514';
    END IF;
    v_new_stock := v_previous_stock - p_quantity;
    v_new_average_cost := material.average_cost;
  ELSE
    v_new_stock := v_previous_stock + p_quantity;
    v_new_average_cost := round(((v_previous_stock * material.average_cost) + (p_quantity * lot.unit_cost)) / v_new_stock, 4);
  END IF;
  UPDATE public.raw_material_lots SET quantity = CASE WHEN p_movement_type = 'entry' THEN quantity + p_quantity ELSE quantity - p_quantity END, status = CASE WHEN p_movement_type = 'exit' AND quantity - p_quantity = 0 THEN 'depleted' ELSE status END, updated_at = now() WHERE id = lot.id;
  UPDATE public.raw_materials SET current_stock = v_new_stock, average_cost = v_new_average_cost, updated_at = now() WHERE id = material.id;
  INSERT INTO public.inventory_movements (item_type, item_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
  VALUES ('raw_material', material.id, p_movement_type, p_quantity, v_previous_stock, v_new_stock, 'manual_adjustment', lot.id, btrim(p_reason), auth.uid())
  RETURNING id INTO v_movement_id;
  RETURN v_movement_id;
END;
$$;
