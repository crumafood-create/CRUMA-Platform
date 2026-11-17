-- Track physical finished-product portions through fresh, freezing, and
-- raw-frozen states without replacing the production lot as their source.

CREATE TABLE public.product_lot_storage_balances (
  product_lot_id uuid PRIMARY KEY
    REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  fresh_quantity integer NOT NULL DEFAULT 0 CHECK (fresh_quantity >= 0),
  raw_frozen_quantity integer NOT NULL DEFAULT 0 CHECK (raw_frozen_quantity >= 0),
  freezing_quantity integer NOT NULL DEFAULT 0 CHECK (freezing_quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_lot_freezing_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_lot_id uuid NOT NULL
    REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  requested_quantity integer NOT NULL CHECK (requested_quantity > 0),
  destination text NOT NULL DEFAULT 'freezing'
    CHECK (destination = 'freezing'),
  reason text NOT NULL CHECK (NULLIF(btrim(reason), '') IS NOT NULL),
  idempotency_key uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'resolved')),
  started_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK ((status = 'in_progress' AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolved_at IS NOT NULL))
);

CREATE INDEX product_lot_freezing_operations_pending_idx
  ON public.product_lot_freezing_operations (product_lot_id, started_at)
  WHERE status = 'in_progress';

CREATE TABLE public.product_lot_freezing_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL
    REFERENCES public.product_lot_freezing_operations(id) ON DELETE RESTRICT,
  product_lot_id uuid NOT NULL
    REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  destination text NOT NULL CHECK (destination IN ('fresh', 'raw_frozen')),
  reason text NOT NULL CHECK (NULLIF(btrim(reason), '') IS NOT NULL),
  conservation_verified boolean NOT NULL DEFAULT false,
  idempotency_key uuid NOT NULL UNIQUE,
  decided_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at timestamptz NOT NULL DEFAULT now(),
  CHECK (destination <> 'fresh' OR conservation_verified = true),
  UNIQUE (operation_id, id)
);

CREATE INDEX product_lot_freezing_decisions_operation_idx
  ON public.product_lot_freezing_decisions (operation_id, decided_at);

ALTER TABLE public.product_lot_storage_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lot_freezing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lot_freezing_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_lot_storage_balances_admin_read
  ON public.product_lot_storage_balances FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY product_lot_freezing_operations_admin_read
  ON public.product_lot_freezing_operations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY product_lot_freezing_decisions_admin_read
  ON public.product_lot_freezing_decisions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Once a product enters condition tracking, older lots with no explicit
-- condition row remain usable as fresh inventory; their stored lot balance
-- remains the source of truth until a freezing operation creates the row.
CREATE OR REPLACE VIEW public.inventory_product_lot_storage_pick_suggestions
WITH (security_invoker = true) AS
SELECT
  lot.id AS lot_id,
  lot.product_id,
  lot.lot_number,
  condition.storage_condition,
  condition.quantity,
  lot.expiration_date,
  location.name AS location_name,
  lot.created_at
FROM public.product_lots AS lot
JOIN public.production_outputs AS output
  ON output.id = lot.production_output_id
LEFT JOIN public.inventory_locations AS location
  ON location.id = lot.inventory_location_id
LEFT JOIN public.product_lot_storage_balances AS balance
  ON balance.product_lot_id = lot.id
CROSS JOIN LATERAL (VALUES
  ('fresh'::text, coalesce(balance.fresh_quantity, lot.quantity::integer)),
  ('raw_frozen'::text, coalesce(balance.raw_frozen_quantity, 0))
) AS condition(storage_condition, quantity)
WHERE condition.quantity > 0
  AND (EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS tracked
    JOIN public.product_lots AS tracked_lot ON tracked_lot.id = tracked.product_lot_id
    WHERE tracked_lot.product_id = lot.product_id
  ))
  AND lot.quantity > 0
  AND lot.status = 'available'
  AND output.quality_status = 'released'
  AND (lot.expiration_date IS NULL OR lot.expiration_date >= CURRENT_DATE);

GRANT SELECT ON public.inventory_product_lot_storage_pick_suggestions TO authenticated;

CREATE OR REPLACE FUNCTION public.get_product_lot_storage_pick_suggestion(
  p_product_id uuid,
  p_storage_condition text
) RETURNS TABLE (
  lot_id uuid,
  lot_number text,
  quantity integer,
  location_name text,
  expiration_date date,
  storage_condition text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Picking requires an administrator.';
  END IF;
  IF p_storage_condition IS NULL
    OR p_storage_condition NOT IN ('fresh', 'raw_frozen') THEN
    RAISE EXCEPTION 'Storage condition is invalid.' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT suggestion.lot_id, suggestion.lot_number,
    suggestion.quantity, suggestion.location_name,
    suggestion.expiration_date, suggestion.storage_condition
  FROM public.inventory_product_lot_storage_pick_suggestions AS suggestion
  WHERE suggestion.product_id = p_product_id
    AND suggestion.storage_condition = p_storage_condition
  ORDER BY suggestion.expiration_date NULLS LAST, suggestion.created_at
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_lot_storage_balances(
  p_product_id uuid
) RETURNS TABLE (
  product_lot_id uuid,
  lot_number text,
  expiration_date date,
  location_name text,
  lot_quantity integer,
  fresh_quantity integer,
  raw_frozen_quantity integer,
  freezing_quantity integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Inventory access requires an administrator.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS balance
    JOIN public.product_lots AS tracked_lot ON tracked_lot.id = balance.product_lot_id
    WHERE tracked_lot.product_id = p_product_id
  ) THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT lot.id, lot.lot_number, lot.expiration_date, location.name,
    lot.quantity::integer,
    coalesce(balance.fresh_quantity, lot.quantity::integer),
    coalesce(balance.raw_frozen_quantity, 0),
    coalesce(balance.freezing_quantity, 0)
  FROM public.product_lots AS lot
  JOIN public.production_outputs AS output ON output.id = lot.production_output_id
  LEFT JOIN public.inventory_locations AS location
    ON location.id = lot.inventory_location_id
  LEFT JOIN public.product_lot_storage_balances AS balance
    ON balance.product_lot_id = lot.id
  WHERE lot.product_id = p_product_id
    AND output.quality_status = 'released'
    AND (lot.status = 'available'
      OR (lot.status = 'depleted' AND coalesce(balance.freezing_quantity, 0) > 0))
    AND (lot.expiration_date IS NULL OR lot.expiration_date >= CURRENT_DATE)
  ORDER BY lot.expiration_date NULLS LAST, lot.created_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_product_lot_freezing_operations()
RETURNS TABLE (
  operation_id uuid,
  product_lot_id uuid,
  lot_number text,
  product_name text,
  requested_quantity integer,
  pending_quantity integer,
  reason text,
  started_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Inventory access requires an administrator.';
  END IF;
  RETURN QUERY
  SELECT operation.id, lot.id, lot.lot_number, product.name,
    operation.requested_quantity,
    operation.requested_quantity - coalesce(sum(decision.quantity), 0)::integer,
    operation.reason, operation.started_at
  FROM public.product_lot_freezing_operations AS operation
  JOIN public.product_lots AS lot ON lot.id = operation.product_lot_id
  JOIN public.products AS product ON product.id = lot.product_id
  LEFT JOIN public.product_lot_freezing_decisions AS decision
    ON decision.operation_id = operation.id
  WHERE operation.status = 'in_progress'
  GROUP BY operation.id, lot.id, product.name
  HAVING operation.requested_quantity - coalesce(sum(decision.quantity), 0) > 0
  ORDER BY operation.started_at;
END;
$function$;

REVOKE ALL ON TABLE public.product_lot_storage_balances,
  public.product_lot_freezing_operations,
  public.product_lot_freezing_decisions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_lot_storage_balances,
  public.product_lot_freezing_operations,
  public.product_lot_freezing_decisions TO authenticated;

CREATE OR REPLACE FUNCTION public.start_product_lot_freezing(
  p_product_lot_id uuid,
  p_quantity integer,
  p_reason text,
  p_idempotency_key uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  existing_operation public.product_lot_freezing_operations%ROWTYPE;
  product_lot public.product_lots%ROWTYPE;
  balance public.product_lot_storage_balances%ROWTYPE;
  product_id uuid;
  product_available numeric;
  operation_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Freezing requires an administrator.';
  END IF;

  IF p_product_lot_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
    OR p_reason IS NULL OR NULLIF(btrim(p_reason), '') IS NULL
    OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Freezing request is invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'product-lot-freezing-start:' || p_idempotency_key::text, 0
  ));

  SELECT * INTO existing_operation
  FROM public.product_lot_freezing_operations
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing_operation.product_lot_id IS DISTINCT FROM p_product_lot_id
      OR existing_operation.requested_quantity IS DISTINCT FROM p_quantity
      OR existing_operation.reason IS DISTINCT FROM btrim(p_reason) THEN
      RAISE EXCEPTION 'Freezing idempotency key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;
    RETURN existing_operation.id;
  END IF;

  SELECT lot.product_id INTO product_id
  FROM public.product_lots AS lot
  WHERE lot.id = p_product_lot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finished-product lot was not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products AS product
    JOIN public.preparation_types AS preparation
      ON preparation.id = product.preparation_type_id
    WHERE product.id = product_id
      AND lower(btrim(preparation.name)) = 'crudo'
  ) THEN
    RAISE EXCEPTION 'Storage-condition freezing is only available for raw-prepared products.'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM public.products AS product
  WHERE product.id = product_id
  FOR UPDATE;

  SELECT * INTO product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = p_product_lot_id
  FOR UPDATE;
  IF product_lot.status <> 'available' OR product_lot.quantity <= 0
    OR NOT EXISTS (
      SELECT 1 FROM public.production_outputs AS output
      WHERE output.id = product_lot.production_output_id
        AND output.quality_status = 'released'
    ) THEN
    RAISE EXCEPTION 'Finished-product lot is not available for freezing.'
      USING ERRCODE = '23514';
  END IF;

  IF product_lot.quantity <> trunc(product_lot.quantity) THEN
    RAISE EXCEPTION 'Finished-product lot quantity must be whole pieces.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.product_lot_storage_balances (
    product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity
  ) VALUES (
    product_lot.id, product_lot.quantity::integer, 0, 0
  ) ON CONFLICT (product_lot_id) DO NOTHING;

  SELECT * INTO balance
  FROM public.product_lot_storage_balances AS current_balance
  WHERE current_balance.product_lot_id = p_product_lot_id
  FOR UPDATE;

  SELECT coalesce(sum(stock.available_quantity), 0)
  INTO product_available
  FROM public.inventory_available_to_promise AS stock
  WHERE stock.item_type = 'product'
    AND stock.item_id = product_id;

  IF p_quantity > balance.fresh_quantity
    OR p_quantity > product_available THEN
    RAISE EXCEPTION
      'Insufficient fresh availability. Lot has % pieces; product availability after reservations is % pieces.',
      balance.fresh_quantity, greatest(product_available, 0)
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.product_lot_freezing_operations (
    product_lot_id, requested_quantity, reason, idempotency_key, started_by
  ) VALUES (
    product_lot.id, p_quantity, btrim(p_reason), p_idempotency_key, auth.uid()
  ) RETURNING id INTO operation_id;

  UPDATE public.product_lot_storage_balances
  SET fresh_quantity = fresh_quantity - p_quantity,
    freezing_quantity = freezing_quantity + p_quantity,
    updated_at = now()
  WHERE product_lot_id = product_lot.id;

  UPDATE public.product_lots
  SET quantity = quantity - p_quantity,
    status = CASE WHEN quantity - p_quantity = 0 THEN 'depleted' ELSE status END,
    updated_at = now()
  WHERE id = product_lot.id;

  INSERT INTO public.inventory_movements (
    item_type, item_id, product_id, movement_type, quantity,
    reference_type, reference_id, warehouse_id, created_by, notes
  ) VALUES (
    'product', product_id, product_id, 'exit', p_quantity,
    'product_lot_freezing_start', operation_id, product_lot.warehouse_id,
    auth.uid(), btrim(p_reason)
  );

  RETURN operation_id;
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
  existing_decision public.product_lot_freezing_decisions%ROWTYPE;
  freezing_operation public.product_lot_freezing_operations%ROWTYPE;
  product_lot public.product_lots%ROWTYPE;
  balance public.product_lot_storage_balances%ROWTYPE;
  pending_quantity integer;
  decision_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Freezing decisions require an administrator.';
  END IF;

  IF p_operation_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
    OR p_destination IS NULL
    OR p_destination NOT IN ('fresh', 'raw_frozen')
    OR p_reason IS NULL OR NULLIF(btrim(p_reason), '') IS NULL
    OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Freezing decision is invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'product-lot-freezing-decision:' || p_idempotency_key::text, 0
  ));

  SELECT * INTO existing_decision
  FROM public.product_lot_freezing_decisions
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing_decision.operation_id IS DISTINCT FROM p_operation_id
      OR existing_decision.quantity IS DISTINCT FROM p_quantity
      OR existing_decision.destination IS DISTINCT FROM p_destination
      OR existing_decision.reason IS DISTINCT FROM btrim(p_reason)
      OR existing_decision.conservation_verified
        IS DISTINCT FROM coalesce(p_conservation_verified, false) THEN
      RAISE EXCEPTION 'Freezing decision key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;
    RETURN existing_decision.id;
  END IF;

  SELECT * INTO freezing_operation
  FROM public.product_lot_freezing_operations AS operation
  WHERE operation.id = p_operation_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Freezing operation was not found.' USING ERRCODE = 'P0002';
  END IF;

  IF p_destination = 'fresh' AND coalesce(p_conservation_verified, false) IS NOT TRUE THEN
    RAISE EXCEPTION
      'Returning pieces to fresh requires authorized conservation verification.'
      USING ERRCODE = '23514';
  END IF;

  SELECT * INTO product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = freezing_operation.product_lot_id;
  PERFORM 1 FROM public.products AS product
  WHERE product.id = product_lot.product_id
  FOR UPDATE;
  SELECT * INTO product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = freezing_operation.product_lot_id
  FOR UPDATE;

  SELECT * INTO balance
  FROM public.product_lot_storage_balances AS current_balance
  WHERE current_balance.product_lot_id = product_lot.id
  FOR UPDATE;

  SELECT freezing_operation.requested_quantity - coalesce(sum(decision.quantity), 0)
  INTO pending_quantity
  FROM public.product_lot_freezing_decisions AS decision
  WHERE decision.operation_id = freezing_operation.id;

  IF p_quantity > pending_quantity OR pending_quantity <= 0 THEN
    RAISE check_violation USING MESSAGE = 'Decision exceeds pending freezing quantity.';
  END IF;

  INSERT INTO public.product_lot_freezing_decisions (
    operation_id, product_lot_id, quantity, destination, reason,
    conservation_verified, idempotency_key, decided_by
  ) VALUES (
    freezing_operation.id, product_lot.id, p_quantity, p_destination,
    btrim(p_reason), coalesce(p_conservation_verified, false),
    p_idempotency_key, auth.uid()
  ) RETURNING id INTO decision_id;

  UPDATE public.product_lot_storage_balances
  SET freezing_quantity = freezing_quantity - p_quantity,
    fresh_quantity = fresh_quantity
      + CASE WHEN p_destination = 'fresh' THEN p_quantity ELSE 0 END,
    raw_frozen_quantity = raw_frozen_quantity
      + CASE WHEN p_destination = 'raw_frozen' THEN p_quantity ELSE 0 END,
    updated_at = now()
  WHERE product_lot_id = product_lot.id
    AND freezing_quantity >= p_quantity;
  IF NOT FOUND THEN
    RAISE check_violation USING MESSAGE = 'Decision exceeds pending freezing quantity.';
  END IF;

  UPDATE public.product_lots
  SET quantity = quantity + p_quantity,
    status = 'available',
    updated_at = now()
  WHERE id = product_lot.id;

  INSERT INTO public.inventory_movements (
    item_type, item_id, product_id, movement_type, quantity,
    reference_type, reference_id, warehouse_id, created_by, notes
  ) VALUES (
    'product', product_lot.product_id, product_lot.product_id, 'entry', p_quantity,
    'product_lot_freezing_decision', decision_id, product_lot.warehouse_id,
    auth.uid(), btrim(p_reason)
  );

  IF pending_quantity = p_quantity THEN
    UPDATE public.product_lot_freezing_operations
    SET status = 'resolved', resolved_at = now()
    WHERE id = freezing_operation.id;
  END IF;

  RETURN decision_id;
END;
$function$;

-- Serialize reservation creation with finished-product freezing by locking
-- the same product rows before reading available-to-promise stock.
CREATE OR REPLACE FUNCTION public.confirm_sales_order(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  order_status text;
  picking_id uuid;
  product_key uuid;
  unavailable record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Sales order confirmation requires an administrator.';
  END IF;

  SELECT status INTO order_status
  FROM public.sales_orders
  WHERE id = p_order_id
  FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Sales order is not a confirmable draft.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.sales_order_items
    WHERE sales_order_id = p_order_id
  ) THEN
    RAISE EXCEPTION 'Sales order has no items.';
  END IF;

  FOR product_key IN
    SELECT DISTINCT item.product_id
    FROM public.sales_order_items AS item
    WHERE item.sales_order_id = p_order_id
    ORDER BY item.product_id
  LOOP
    PERFORM 1 FROM public.products AS product
    WHERE product.id = product_key
    FOR UPDATE;
  END LOOP;

  SELECT item.product_id, item.quantity,
    coalesce(sum(stock.available_quantity), 0) AS available
  INTO unavailable
  FROM public.sales_order_items AS item
  LEFT JOIN public.inventory_available_to_promise AS stock
    ON stock.item_type = 'product' AND stock.item_id = item.product_id
  WHERE item.sales_order_id = p_order_id
  GROUP BY item.product_id, item.quantity
  HAVING coalesce(sum(stock.available_quantity), 0) < item.quantity
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para producto %. Disponible %. Requerido %.',
      unavailable.product_id, unavailable.available, unavailable.quantity;
  END IF;

  INSERT INTO public.inventory_reservations (
    item_type, item_id, reference_type, reference_id, quantity, status, notes
  ) SELECT 'product', item.product_id, 'sales_order', p_order_id,
      item.quantity, 'active', 'Reserva por pedido de venta'
    FROM public.sales_order_items AS item
    WHERE item.sales_order_id = p_order_id;

  INSERT INTO public.picking_orders (sales_order_id, status)
  VALUES (p_order_id, 'pending')
  RETURNING id INTO picking_id;

  INSERT INTO public.picking_order_items (picking_order_id, product_id, quantity)
  SELECT picking_id, item.product_id, item.quantity
  FROM public.sales_order_items AS item
  WHERE item.sales_order_id = p_order_id;

  UPDATE public.sales_orders SET status = 'confirmed', updated_at = now()
  WHERE id = p_order_id;
  RETURN picking_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.start_product_lot_freezing(uuid, integer, text, uuid)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.resolve_product_lot_freezing(uuid, integer, text, boolean, text, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.start_product_lot_freezing(uuid, integer, text, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_product_lot_freezing(uuid, integer, text, boolean, text, uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.get_product_lot_storage_pick_suggestion(uuid, text),
  public.get_product_lot_storage_balances(uuid),
  public.get_pending_product_lot_freezing_operations()
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_product_lot_storage_pick_suggestion(uuid, text),
  public.get_product_lot_storage_balances(uuid),
  public.get_pending_product_lot_freezing_operations()
  TO authenticated;
