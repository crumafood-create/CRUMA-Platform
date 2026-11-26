-- Serialize finished-product freezing and habitual raw-material destination
-- validation with updates to the location classification columns.
-- A share lock blocks policy edits while this transaction validates and writes;
-- if the edit commits first, READ COMMITTED rechecks the updated policy.
CREATE OR REPLACE FUNCTION public.start_product_lot_freezing(
  p_product_lot_id uuid,
  p_quantity integer,
  p_reason text,
  p_idempotency_key uuid,
  p_process_location_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  lot public.product_lots%ROWTYPE;
  balance public.product_lot_storage_balances%ROWTYPE;
  existing_operation public.product_lot_freezing_operations%ROWTYPE;
  operation_id uuid;
  process_location public.inventory_locations%ROWTYPE;
  available_product numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Freezing requires an administrator.';
  END IF;
  IF p_product_lot_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
     OR NULLIF(btrim(p_reason), '') IS NULL OR p_idempotency_key IS NULL
     OR p_process_location_id IS NULL THEN
    RAISE EXCEPTION 'Freezing request is invalid.' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('product-lot-freezing-start:' || p_idempotency_key::text, 0));
  SELECT * INTO existing_operation FROM public.product_lot_freezing_operations
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing_operation.product_lot_id <> p_product_lot_id
       OR existing_operation.requested_quantity <> p_quantity
       OR existing_operation.reason <> btrim(p_reason)
       OR existing_operation.process_location_id IS DISTINCT FROM p_process_location_id THEN
      RAISE unique_violation USING MESSAGE = 'Freezing idempotency key was reused with different data.';
    END IF;
    RETURN existing_operation.id;
  END IF;

  SELECT * INTO process_location FROM public.inventory_locations
  WHERE id = p_process_location_id AND is_active AND deleted_at IS NULL
    AND location_use = 'finished_product' AND storage_condition = 'frozen'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE check_violation USING MESSAGE = 'Configure an active finished-product freezer location.';
  END IF;
  PERFORM 1 FROM public.products AS product
  JOIN public.product_lots AS lot_row ON lot_row.product_id = product.id
  WHERE lot_row.id = p_product_lot_id FOR UPDATE OF product;
  SELECT * INTO lot FROM public.product_lots WHERE id = p_product_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE no_data_found USING MESSAGE = 'Finished-product lot was not found.'; END IF;

  INSERT INTO public.product_lot_storage_balances (product_lot_id, fresh_quantity)
  VALUES (p_product_lot_id, CASE WHEN lot.status = 'available'
    THEN lot.quantity::integer ELSE 0 END)
  ON CONFLICT (product_lot_id) DO NOTHING;
  SELECT * INTO balance FROM public.product_lot_storage_balances
  WHERE product_lot_id = p_product_lot_id FOR UPDATE;

  SELECT coalesce(sum(available_quantity), 0) INTO available_product
  FROM public.inventory_available_to_promise
  WHERE item_type = 'product' AND item_id = lot.product_id;
  IF lot.status <> 'available' OR p_quantity > balance.fresh_quantity
     OR p_quantity > available_product THEN
    RAISE check_violation USING MESSAGE = 'Insufficient fresh availability for freezing.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.products AS product
    JOIN public.preparation_types AS preparation ON preparation.id=product.preparation_type_id
    WHERE product.id=lot.product_id AND lower(btrim(preparation.name))='crudo'
  ) THEN
    RAISE check_violation USING MESSAGE='Fresh-to-freezing is limited to the approved raw-product flow.';
  END IF;
  UPDATE public.product_lot_storage_balances
  SET fresh_quantity = fresh_quantity - p_quantity,
      freezing_quantity = freezing_quantity + p_quantity,
      freezing_location_id = p_process_location_id,
      updated_at = now()
  WHERE product_lot_id = p_product_lot_id;
  UPDATE public.product_lots SET quantity = quantity - p_quantity,
    status = CASE WHEN quantity - p_quantity = 0 THEN 'depleted' ELSE status END,
    updated_at = now() WHERE id = p_product_lot_id;
  INSERT INTO public.product_lot_freezing_operations (
    product_lot_id, requested_quantity, reason, idempotency_key, started_by,
    source_location_id, process_location_id, started_from
  ) VALUES (
    p_product_lot_id,p_quantity,btrim(p_reason),p_idempotency_key,auth.uid(),
    lot.inventory_location_id,p_process_location_id,'fresh'
  ) RETURNING id INTO operation_id;
  INSERT INTO public.inventory_movements (
    item_type,item_id,product_id,movement_type,quantity,reference_type,
    reference_id,warehouse_id,created_by,notes
  ) VALUES ('product',lot.product_id,lot.product_id,'exit',p_quantity,
    'product_lot_freezing_start',operation_id,lot.warehouse_id,auth.uid(),btrim(p_reason));
  RETURN operation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decide_product_lot_refrigerated_wait(
  p_product_lot_id uuid,
  p_quantity integer,
  p_destination text,
  p_process_location_id uuid,
  p_reason text,
  p_idempotency_key uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
  lot public.product_lots%ROWTYPE;
  balance public.product_lot_storage_balances%ROWTYPE;
  source_location public.inventory_locations%ROWTYPE;
  process_location public.inventory_locations%ROWTYPE;
  prior public.product_lot_refrigerated_wait_decisions%ROWTYPE;
  decision_id uuid;
  operation_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE='Only an administrator may decide refrigerated waiting stock.'; END IF;
  IF p_product_lot_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
     OR p_destination NOT IN ('freezing','waste') OR NULLIF(btrim(p_reason),'') IS NULL
     OR p_idempotency_key IS NULL OR (p_destination='freezing' AND p_process_location_id IS NULL) THEN
    RAISE EXCEPTION 'Refrigerated-wait decision is invalid.' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('product-lot-wait-decision:'||p_idempotency_key::text,0));
  SELECT * INTO prior FROM public.product_lot_refrigerated_wait_decisions WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF prior.product_lot_id<>p_product_lot_id OR prior.quantity<>p_quantity OR prior.destination<>p_destination
       OR prior.process_location_id IS DISTINCT FROM p_process_location_id OR prior.reason<>btrim(p_reason) THEN
      RAISE unique_violation USING MESSAGE='Refrigerated-wait idempotency key was reused with different data.';
    END IF;
    RETURN prior.id;
  END IF;
  SELECT * INTO lot FROM public.product_lots WHERE id=p_product_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE no_data_found USING MESSAGE='Finished-product lot was not found.'; END IF;
  SELECT * INTO balance FROM public.product_lot_storage_balances WHERE product_lot_id=p_product_lot_id FOR UPDATE;
  IF balance.refrigerated_wait_quantity<p_quantity THEN RAISE check_violation USING MESSAGE='Decision exceeds refrigerated waiting quantity.'; END IF;
  SELECT * INTO source_location FROM public.inventory_locations WHERE id=balance.refrigerated_wait_location_id;
  IF p_destination='freezing' THEN
    SELECT * INTO process_location FROM public.inventory_locations
    WHERE id=p_process_location_id AND is_active AND deleted_at IS NULL
      AND location_use='finished_product' AND storage_condition='frozen' FOR SHARE;
    IF NOT FOUND THEN RAISE check_violation USING MESSAGE='Freezing destination is not a configured finished-product freezer.'; END IF;
  END IF;
  INSERT INTO public.product_lot_refrigerated_wait_decisions (
    product_lot_id,quantity,destination,source_location_id,process_location_id,reason,idempotency_key,decided_by
  ) VALUES (
    p_product_lot_id,p_quantity,p_destination,source_location.id,
    CASE WHEN p_destination='freezing' THEN process_location.id ELSE NULL END,
    btrim(p_reason),p_idempotency_key,auth.uid()
  ) RETURNING id INTO decision_id;
  UPDATE public.product_lot_storage_balances SET
    refrigerated_wait_quantity=refrigerated_wait_quantity-p_quantity,
    freezing_quantity=freezing_quantity+CASE WHEN p_destination='freezing' THEN p_quantity ELSE 0 END,
    quality_waste_quantity=quality_waste_quantity+CASE WHEN p_destination='waste' THEN p_quantity ELSE 0 END,
    freezing_location_id=CASE WHEN p_destination='freezing' THEN process_location.id ELSE freezing_location_id END,
    updated_at=now() WHERE product_lot_id=p_product_lot_id;
  IF p_destination='freezing' THEN
    INSERT INTO public.product_lot_freezing_operations (
      product_lot_id,requested_quantity,reason,idempotency_key,started_by,
      source_location_id,process_location_id,started_from
    ) VALUES (p_product_lot_id,p_quantity,btrim(p_reason),p_idempotency_key,auth.uid(),
      source_location.id,process_location.id,'refrigerated_wait') RETURNING id INTO operation_id;
  END IF;
  INSERT INTO public.inventory_movements (
    item_type,item_id,product_id,movement_type,quantity,reference_type,
    reference_id,warehouse_id,created_by,notes
  ) VALUES (
    'product',lot.product_id,lot.product_id,
    CASE WHEN p_destination='freezing' THEN 'transfer' ELSE 'adjustment' END,
    p_quantity,'product_lot_refrigerated_wait_decision',decision_id,
    lot.warehouse_id,auth.uid(),btrim(p_reason)
  );
  RETURN decision_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_raw_material_storage_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  location_use text;
  location_condition text;
  location_active boolean;
BEGIN
  IF NEW.default_inventory_location_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.required_storage_condition IS NULL OR NEW.default_storage_use IS NULL THEN
    RAISE EXCEPTION 'Configure the material storage condition and destination together.'
      USING ERRCODE = '23514';
  END IF;

  SELECT location.location_use, location.storage_condition,
         location.is_active AND location.deleted_at IS NULL
  INTO location_use, location_condition, location_active
  FROM public.inventory_locations AS location
  WHERE location.id = NEW.default_inventory_location_id
  FOR SHARE;

  IF NOT FOUND OR location_active IS DISTINCT FROM true
     OR location_use IS DISTINCT FROM NEW.default_storage_use
     OR location_condition IS DISTINCT FROM NEW.required_storage_condition THEN
    RAISE EXCEPTION 'The default destination is missing, inactive, or incompatible with the material.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
