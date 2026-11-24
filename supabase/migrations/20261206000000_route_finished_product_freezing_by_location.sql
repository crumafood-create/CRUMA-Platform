-- Track finished product waiting in refrigerated storage separately from
-- product already in the freezer process. Both states stay out of ATP/picking.

ALTER TABLE public.product_lot_storage_balances
  ADD COLUMN refrigerated_wait_quantity integer NOT NULL DEFAULT 0
    CHECK (refrigerated_wait_quantity >= 0),
  ADD COLUMN quality_waste_quantity integer NOT NULL DEFAULT 0
    CHECK (quality_waste_quantity >= 0),
  ADD COLUMN refrigerated_wait_location_id uuid
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  ADD COLUMN freezing_location_id uuid
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  ADD COLUMN frozen_location_id uuid
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT;

ALTER TABLE public.product_lot_freezing_operations
  ADD COLUMN source_location_id uuid
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  ADD COLUMN process_location_id uuid
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  ADD COLUMN started_from text NOT NULL DEFAULT 'fresh'
    CHECK (started_from IN ('fresh', 'refrigerated_wait', 'quality_release'));

ALTER TABLE public.product_lot_freezing_decisions
  DROP CONSTRAINT product_lot_freezing_decisions_destination_check,
  ADD CONSTRAINT product_lot_freezing_decisions_destination_check
    CHECK (destination IN ('fresh', 'raw_frozen', 'waste'));

CREATE TABLE public.product_lot_refrigerated_wait_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_lot_id uuid NOT NULL REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  destination text NOT NULL CHECK (destination IN ('freezing', 'waste')),
  source_location_id uuid NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  process_location_id uuid REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (NULLIF(btrim(reason), '') IS NOT NULL),
  idempotency_key uuid NOT NULL UNIQUE,
  decided_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at timestamptz NOT NULL DEFAULT now(),
  CHECK (destination <> 'freezing' OR process_location_id IS NOT NULL)
);
ALTER TABLE public.product_lot_refrigerated_wait_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_lot_refrigerated_wait_decisions_admin_read
  ON public.product_lot_refrigerated_wait_decisions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
REVOKE ALL ON TABLE public.product_lot_refrigerated_wait_decisions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON TABLE public.product_lot_refrigerated_wait_decisions TO authenticated;

-- This logical location is separate from semi-finished goods while sharing
-- the same refrigerator zone. Its physical coordinates remain unset until
-- the administrator identifies the exact marked position on site.
INSERT INTO public.inventory_locations (
  slug, name, description, zone, aisle, rack, level, position,
  is_active, location_use, storage_condition
)
VALUES (
  'REF-PT-ESPERA-CONG',
  'Producto terminado refrigerado — espera de congelación',
  'Ubicación dedicada en el refrigerador compartido para producto terminado que espera congelación.',
  'REFRIGERADOR', NULL, NULL, NULL, NULL,
  true, 'finished_product', 'refrigerated'
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    location_use = EXCLUDED.location_use,
    storage_condition = EXCLUDED.storage_condition,
    updated_at = now()
WHERE public.inventory_locations.location_use IS NULL
   OR (public.inventory_locations.location_use = 'finished_product'
       AND public.inventory_locations.storage_condition = 'refrigerated');

DO $wait_location_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE slug='REF-PT-ESPERA-CONG' AND location_use='finished_product'
      AND storage_condition='refrigerated' AND is_active AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'The dedicated refrigerated finished-product wait location conflicts with an existing classification.';
  END IF;
END;
$wait_location_check$;

CREATE OR REPLACE FUNCTION public.route_new_finished_product_lot_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  location_use text;
  storage_condition text;
  operation_id uuid;
BEGIN
  SELECT location.location_use, location.storage_condition
  INTO location_use, storage_condition
  FROM public.inventory_locations AS location
  WHERE location.id = NEW.inventory_location_id
    AND location.is_active
    AND location.deleted_at IS NULL;

  IF location_use IS NULL THEN
    RETURN NEW;
  END IF;
  IF location_use <> 'finished_product'
     OR storage_condition NOT IN ('refrigerated', 'frozen') THEN
    RAISE EXCEPTION 'Finished product requires a compatible finished-product location.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.product_lot_storage_balances (
    product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity,
    refrigerated_wait_quantity, refrigerated_wait_location_id,
    freezing_location_id, frozen_location_id
  ) VALUES (
    NEW.id, 0, 0,
    CASE WHEN storage_condition = 'frozen' THEN NEW.initial_quantity::integer ELSE 0 END,
    CASE WHEN storage_condition = 'refrigerated' THEN NEW.initial_quantity::integer ELSE 0 END,
    CASE WHEN storage_condition = 'refrigerated' THEN NEW.inventory_location_id ELSE NULL END,
    CASE WHEN storage_condition = 'frozen' THEN NEW.inventory_location_id ELSE NULL END,
    NULL
  );

  UPDATE public.product_lots AS lot
  SET quantity = 0, status = 'depleted', updated_at = now()
  WHERE lot.id = NEW.id;

  IF storage_condition = 'frozen' THEN
    INSERT INTO public.product_lot_freezing_operations (
      product_lot_id, requested_quantity, reason, idempotency_key,
      started_by, source_location_id, process_location_id, started_from
    ) VALUES (
      NEW.id, NEW.initial_quantity::integer,
      'Ingreso directo a congelación al liberar producto terminado',
      gen_random_uuid(), coalesce(auth.uid(), NEW.released_by),
      NEW.inventory_location_id, NEW.inventory_location_id, 'quality_release'
    ) RETURNING id INTO operation_id;
  END IF;

  -- Paired with the release entry inserted by the calling transaction, so the
  -- held quantity has no net available balance before freezing completes.
  INSERT INTO public.inventory_movements (
    item_type, item_id, product_id, movement_type, quantity,
    reference_type, reference_id, warehouse_id, created_by, notes
  ) VALUES (
    'product', NEW.product_id, NEW.product_id, 'exit', NEW.initial_quantity,
    CASE WHEN storage_condition = 'frozen'
      THEN 'finished_product_direct_freezing'
      ELSE 'finished_product_refrigerated_wait' END,
    coalesce(operation_id, NEW.id), NEW.warehouse_id,
    coalesce(auth.uid(), NEW.released_by),
    CASE WHEN storage_condition = 'frozen'
      THEN 'Apartado en proceso de congelación al liberar'
      ELSE 'Apartado en espera refrigerada de congelación' END
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER product_lot_storage_route_after_insert
AFTER INSERT ON public.product_lots
FOR EACH ROW EXECUTE FUNCTION public.route_new_finished_product_lot_storage();

-- Starting from refrigerated wait transfers physical balance to the configured
-- freezer process location without creating a second stock exit.
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
  FOR KEY SHARE;
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

-- Preserve the existing RPC contract for callers which have exactly one
-- explicitly configured finished-product freezer. Ambiguous destinations
-- must use the five-argument form and select a freezer location.
CREATE OR REPLACE FUNCTION public.start_product_lot_freezing(
  p_product_lot_id uuid,
  p_quantity integer,
  p_reason text,
  p_idempotency_key uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
  freezer_count integer;
  freezer_location_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE='Freezing requires an administrator.';
  END IF;
  SELECT count(*)::integer, (array_agg(location.id ORDER BY location.slug))[1]
  INTO freezer_count, freezer_location_id
  FROM public.inventory_locations AS location
  WHERE location.is_active AND location.deleted_at IS NULL
    AND location.location_use='finished_product' AND location.storage_condition='frozen';
  IF freezer_count <> 1 THEN
    RAISE check_violation USING MESSAGE='Select one explicitly configured finished-product freezer location.';
  END IF;
  RETURN public.start_product_lot_freezing(
    p_product_lot_id,p_quantity,p_reason,p_idempotency_key,freezer_location_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_product_lot_freezing(
  p_operation_id uuid,
  p_quantity integer,
  p_destination text,
  p_conservation_verified boolean,
  p_reason text,
  p_idempotency_key uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  operation public.product_lot_freezing_operations%ROWTYPE;
  lot public.product_lots%ROWTYPE;
  balance public.product_lot_storage_balances%ROWTYPE;
  existing_decision public.product_lot_freezing_decisions%ROWTYPE;
  pending_quantity integer;
  sampling_total integer;
  sampling_reserved integer := 0;
  inventory_quantity integer;
  decision_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Freezing decisions require an administrator.';
  END IF;
  IF p_operation_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
     OR p_destination IS NULL OR p_destination NOT IN ('fresh','raw_frozen','waste')
     OR NULLIF(btrim(p_reason),'') IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Freezing decision is invalid.' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('product-lot-freezing-decision:' || p_idempotency_key::text, 0));
  SELECT * INTO existing_decision FROM public.product_lot_freezing_decisions
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing_decision.operation_id <> p_operation_id
       OR existing_decision.quantity <> p_quantity
       OR existing_decision.destination <> p_destination
       OR existing_decision.reason <> btrim(p_reason)
       OR existing_decision.conservation_verified IS DISTINCT FROM coalesce(p_conservation_verified,false) THEN
      RAISE unique_violation USING MESSAGE = 'Freezing decision key was reused with different data.';
    END IF;
    RETURN existing_decision.id;
  END IF;
  SELECT * INTO operation FROM public.product_lot_freezing_operations
  WHERE id = p_operation_id FOR UPDATE;
  IF NOT FOUND OR operation.status <> 'in_progress' THEN
    RAISE no_data_found USING MESSAGE = 'Freezing operation is not pending.';
  END IF;
  IF p_destination = 'fresh' AND coalesce(p_conservation_verified,false) IS NOT TRUE THEN
    RAISE check_violation USING MESSAGE = 'Returning to fresh requires verified conservation.';
  END IF;
  SELECT * INTO lot FROM public.product_lots WHERE id = operation.product_lot_id;
  PERFORM 1 FROM public.products WHERE id = lot.product_id FOR UPDATE;
  SELECT * INTO lot FROM public.product_lots WHERE id = operation.product_lot_id FOR UPDATE;
  SELECT * INTO balance FROM public.product_lot_storage_balances
  WHERE product_lot_id = lot.id FOR UPDATE;
  SELECT operation.requested_quantity - coalesce(sum(decision.quantity),0)::integer
  INTO pending_quantity FROM public.product_lot_freezing_decisions AS decision
  WHERE decision.operation_id = operation.id;
  IF p_quantity > pending_quantity THEN
    RAISE check_violation USING MESSAGE = 'Decision exceeds pending freezing quantity.';
  END IF;
  IF p_destination = 'fresh' AND operation.started_from <> 'fresh' THEN
    RAISE check_violation USING MESSAGE = 'Only pieces started from fresh stock may return to fresh.';
  END IF;
  IF p_destination = 'raw_frozen'
     AND balance.quality_sampling_reserved_quantity = 0 THEN
    sampling_total := balance.quality_sampling_pending_quantity + p_quantity;
    IF sampling_total >= 5 THEN
      sampling_reserved := 5;
      inventory_quantity := sampling_total - 5;
    ELSE
      inventory_quantity := 0;
    END IF;
  ELSIF p_destination = 'raw_frozen' THEN
    inventory_quantity := p_quantity;
  ELSIF p_destination = 'fresh' THEN
    inventory_quantity := p_quantity;
  ELSE
    inventory_quantity := 0;
  END IF;
  INSERT INTO public.product_lot_freezing_decisions (
    operation_id,product_lot_id,quantity,destination,reason,
    conservation_verified,idempotency_key,decided_by
  ) VALUES (operation.id,lot.id,p_quantity,p_destination,btrim(p_reason),
    coalesce(p_conservation_verified,false),p_idempotency_key,auth.uid())
  RETURNING id INTO decision_id;
  UPDATE public.product_lot_storage_balances AS storage_balance
  SET freezing_quantity = storage_balance.freezing_quantity - p_quantity,
      fresh_quantity = storage_balance.fresh_quantity + CASE WHEN p_destination='fresh' THEN p_quantity ELSE 0 END,
      raw_frozen_quantity = storage_balance.raw_frozen_quantity + CASE WHEN p_destination='raw_frozen' THEN inventory_quantity ELSE 0 END,
      quality_sampling_pending_quantity = CASE
        WHEN p_destination <> 'raw_frozen'
          OR storage_balance.quality_sampling_reserved_quantity > 0
          THEN storage_balance.quality_sampling_pending_quantity
        WHEN sampling_reserved = 5 THEN 0
        ELSE storage_balance.quality_sampling_pending_quantity + p_quantity
      END,
      quality_sampling_reserved_quantity = storage_balance.quality_sampling_reserved_quantity + sampling_reserved,
      quality_waste_quantity = storage_balance.quality_waste_quantity + CASE WHEN p_destination='waste' THEN p_quantity ELSE 0 END,
      frozen_location_id = CASE WHEN p_destination='raw_frozen' THEN operation.process_location_id ELSE storage_balance.frozen_location_id END,
      updated_at = now()
  WHERE storage_balance.product_lot_id = lot.id AND storage_balance.freezing_quantity >= p_quantity;
  IF NOT FOUND THEN RAISE check_violation USING MESSAGE = 'Decision exceeds pending freezing quantity.'; END IF;
  IF sampling_reserved = 5 THEN
    INSERT INTO public.product_lot_quality_samples (
      product_lot_id, purpose, quantity, status, created_by
    ) VALUES
      (lot.id, 'immediate_inspection', 2, 'pending_inspection', auth.uid()),
      (lot.id, 'safety_retention', 3, 'in_custody', auth.uid());
  END IF;
  IF p_destination IN ('fresh','raw_frozen') THEN
    UPDATE public.product_lots SET quantity = quantity + inventory_quantity,
      inventory_location_id = CASE WHEN p_destination='raw_frozen' THEN operation.process_location_id ELSE inventory_location_id END,
      location_name = CASE WHEN p_destination='raw_frozen' THEN (SELECT name FROM public.inventory_locations WHERE id=operation.process_location_id) ELSE location_name END,
      status = CASE WHEN quantity + inventory_quantity > 0 THEN 'available' ELSE status END,
      updated_at = now() WHERE id = lot.id;
    IF inventory_quantity > 0 THEN
      INSERT INTO public.inventory_movements (
        item_type,item_id,product_id,movement_type,quantity,reference_type,
        reference_id,warehouse_id,created_by,notes
      ) VALUES ('product',lot.product_id,lot.product_id,'entry',inventory_quantity,
        'product_lot_freezing_decision',decision_id,lot.warehouse_id,auth.uid(),btrim(p_reason));
    END IF;
  ELSE
    INSERT INTO public.inventory_movements (
      item_type,item_id,product_id,movement_type,quantity,reference_type,
      reference_id,warehouse_id,created_by,notes
    ) VALUES ('product',lot.product_id,lot.product_id,'adjustment',p_quantity,
      'product_lot_freezing_decision',decision_id,lot.warehouse_id,auth.uid(),btrim(p_reason));
  END IF;
  IF pending_quantity = p_quantity THEN
    UPDATE public.product_lot_freezing_operations SET status='resolved',resolved_at=now()
    WHERE id=operation.id;
  END IF;
  RETURN decision_id;
END;
$function$;

CREATE FUNCTION public.decide_product_lot_refrigerated_wait(
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
      AND location_use='finished_product' AND storage_condition='frozen' FOR KEY SHARE;
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

DROP FUNCTION public.get_product_lot_storage_balances(uuid);
CREATE FUNCTION public.get_product_lot_storage_balances(p_product_id uuid)
RETURNS TABLE (
  product_lot_id uuid, lot_number text, expiration_date date, location_name text,
  lot_quantity integer, fresh_quantity integer, raw_frozen_quantity integer,
  freezing_quantity integer, refrigerated_wait_quantity integer,
  quality_waste_quantity integer, refrigerated_wait_location_name text,
  freezing_location_name text, frozen_location_name text,
  quality_sampling_pending_quantity integer, quality_sampling_reserved_quantity integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE='Inventory access requires an administrator.'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS tracked
    JOIN public.product_lots AS tracked_lot ON tracked_lot.id=tracked.product_lot_id
    WHERE tracked_lot.product_id=p_product_id
  ) THEN RETURN; END IF;
  RETURN QUERY
  SELECT lot.id,lot.lot_number,lot.expiration_date,location.name,lot.quantity::integer,
    coalesce(balance.fresh_quantity,lot.quantity::integer),coalesce(balance.raw_frozen_quantity,0),
    coalesce(balance.freezing_quantity,0),coalesce(balance.refrigerated_wait_quantity,0),
    coalesce(balance.quality_waste_quantity,0),wait_location.name,process_location.name,frozen_location.name,
    coalesce(balance.quality_sampling_pending_quantity,0),coalesce(balance.quality_sampling_reserved_quantity,0)
  FROM public.product_lots AS lot
  JOIN public.production_outputs AS output ON output.id=lot.production_output_id
  LEFT JOIN public.inventory_locations AS location ON location.id=lot.inventory_location_id
  LEFT JOIN public.product_lot_storage_balances AS balance ON balance.product_lot_id=lot.id
  LEFT JOIN public.inventory_locations AS wait_location ON wait_location.id=balance.refrigerated_wait_location_id
  LEFT JOIN public.inventory_locations AS process_location ON process_location.id=balance.freezing_location_id
  LEFT JOIN public.inventory_locations AS frozen_location ON frozen_location.id=balance.frozen_location_id
  WHERE lot.product_id=p_product_id AND output.quality_status='released'
    AND (lot.status='available' OR coalesce(balance.freezing_quantity,0)>0
      OR coalesce(balance.refrigerated_wait_quantity,0)>0
      OR coalesce(balance.quality_sampling_pending_quantity,0)>0
      OR coalesce(balance.quality_sampling_reserved_quantity,0)>0)
    AND (lot.expiration_date IS NULL OR lot.expiration_date>=CURRENT_DATE
      OR coalesce(balance.quality_sampling_pending_quantity,0)>0
      OR coalesce(balance.quality_sampling_reserved_quantity,0)>0)
  ORDER BY lot.expiration_date NULLS LAST,lot.created_at;
END;
$function$;

DROP FUNCTION public.get_pending_product_lot_freezing_operations();
CREATE FUNCTION public.get_pending_product_lot_freezing_operations()
RETURNS TABLE (
  operation_id uuid, product_lot_id uuid, lot_number text, product_name text,
  requested_quantity integer, pending_quantity integer, reason text,
  started_at timestamptz, started_from text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE='Inventory access requires an administrator.'; END IF;
  RETURN QUERY
  SELECT operation.id,lot.id,lot.lot_number,product.name,operation.requested_quantity,
    operation.requested_quantity-coalesce(sum(decision.quantity),0)::integer,
    operation.reason,operation.started_at,operation.started_from
  FROM public.product_lot_freezing_operations operation
  JOIN public.product_lots lot ON lot.id=operation.product_lot_id
  JOIN public.products product ON product.id=lot.product_id
  LEFT JOIN public.product_lot_freezing_decisions decision ON decision.operation_id=operation.id
  WHERE operation.status='in_progress'
  GROUP BY operation.id,lot.id,product.name
  HAVING operation.requested_quantity-coalesce(sum(decision.quantity),0)>0
  ORDER BY operation.started_at;
END;
$function$;

CREATE OR REPLACE VIEW public.inventory_product_lot_storage_pick_suggestions
WITH (security_invoker = true) AS
SELECT lot.id AS lot_id, lot.product_id, lot.lot_number, condition.storage_condition,
  condition.quantity, lot.expiration_date,
  CASE WHEN condition.storage_condition='raw_frozen' THEN frozen_location.name ELSE location.name END AS location_name,
  lot.created_at
FROM public.product_lots AS lot
JOIN public.production_outputs AS output ON output.id=lot.production_output_id
LEFT JOIN public.inventory_locations AS location ON location.id=lot.inventory_location_id
LEFT JOIN public.product_lot_storage_balances AS balance ON balance.product_lot_id=lot.id
LEFT JOIN public.inventory_locations AS frozen_location ON frozen_location.id=balance.frozen_location_id
CROSS JOIN LATERAL (VALUES
  ('fresh'::text,coalesce(balance.fresh_quantity,lot.quantity::integer)),
  ('raw_frozen'::text,coalesce(balance.raw_frozen_quantity,0))
) AS condition(storage_condition,quantity)
WHERE condition.quantity>0 AND EXISTS (
  SELECT 1 FROM public.product_lot_storage_balances tracked
  JOIN public.product_lots tracked_lot ON tracked_lot.id=tracked.product_lot_id
  WHERE tracked_lot.product_id=lot.product_id
) AND lot.quantity>0 AND lot.status='available' AND output.quality_status='released'
AND (lot.expiration_date IS NULL OR lot.expiration_date>=CURRENT_DATE);

REVOKE ALL ON FUNCTION public.start_product_lot_freezing(uuid,integer,text,uuid,uuid)
  FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.start_product_lot_freezing(uuid,integer,text,uuid,uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.get_product_lot_storage_balances(uuid)
  FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_product_lot_storage_balances(uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.decide_product_lot_refrigerated_wait(uuid,integer,text,uuid,text,uuid)
  FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.decide_product_lot_refrigerated_wait(uuid,integer,text,uuid,text,uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.get_pending_product_lot_freezing_operations()
  FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_product_lot_freezing_operations()
  TO authenticated;

COMMENT ON COLUMN public.product_lot_storage_balances.refrigerated_wait_quantity IS
  'Finished product physically held in the dedicated refrigerated wait location before freezing.';
COMMENT ON COLUMN public.product_lot_storage_balances.quality_waste_quantity IS
  'Quantity discarded by an authorized, traceable quality decision after freezing was started.';
