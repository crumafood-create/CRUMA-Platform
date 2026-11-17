-- Hold raw-frozen finished-product quality samples outside sales inventory.
ALTER TABLE public.product_lot_storage_balances
  ADD COLUMN quality_sampling_pending_quantity integer NOT NULL DEFAULT 0
    CHECK (quality_sampling_pending_quantity >= 0),
  ADD COLUMN quality_sampling_reserved_quantity integer NOT NULL DEFAULT 0
    CHECK (quality_sampling_reserved_quantity >= 0);

CREATE TABLE public.product_lot_quality_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_lot_id uuid NOT NULL
    REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  purpose text NOT NULL
    CHECK (purpose IN ('immediate_inspection', 'safety_retention')),
  quantity integer NOT NULL,
  status text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at timestamptz,
  destination text,
  reason text,
  CONSTRAINT product_lot_quality_samples_quantity_check CHECK (
    (purpose = 'immediate_inspection' AND quantity = 2)
    OR (purpose = 'safety_retention' AND quantity = 3)
  ),
  CONSTRAINT product_lot_quality_samples_status_check CHECK (
    status IN ('pending_inspection', 'in_custody', 'returned_to_lot',
      'direct_waste', 'pending_disposition')
  ),
  CONSTRAINT product_lot_quality_samples_decision_check CHECK (
    (decided_at IS NULL AND decided_by IS NULL AND destination IS NULL AND reason IS NULL)
    OR (decided_at IS NOT NULL AND decided_by IS NOT NULL
      AND destination IS NOT NULL AND NULLIF(btrim(reason), '') IS NOT NULL)
  ),
  UNIQUE (product_lot_id, purpose)
);

CREATE INDEX product_lot_quality_samples_pending_idx
  ON public.product_lot_quality_samples (status, created_at)
  WHERE status IN ('pending_inspection', 'in_custody', 'pending_disposition');

ALTER TABLE public.product_lot_quality_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_lot_quality_samples_admin_read
  ON public.product_lot_quality_samples FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
REVOKE ALL ON TABLE public.product_lot_quality_samples FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_lot_quality_samples TO authenticated;

DROP FUNCTION public.get_product_lot_storage_balances(uuid);
CREATE FUNCTION public.get_product_lot_storage_balances(
  p_product_id uuid
) RETURNS TABLE (
  product_lot_id uuid,
  lot_number text,
  expiration_date date,
  location_name text,
  lot_quantity integer,
  fresh_quantity integer,
  raw_frozen_quantity integer,
  freezing_quantity integer,
  quality_sampling_pending_quantity integer,
  quality_sampling_reserved_quantity integer
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
    coalesce(balance.freezing_quantity, 0),
    coalesce(balance.quality_sampling_pending_quantity, 0),
    coalesce(balance.quality_sampling_reserved_quantity, 0)
  FROM public.product_lots AS lot
  JOIN public.production_outputs AS output ON output.id = lot.production_output_id
  LEFT JOIN public.inventory_locations AS location
    ON location.id = lot.inventory_location_id
  LEFT JOIN public.product_lot_storage_balances AS balance
    ON balance.product_lot_id = lot.id
  WHERE lot.product_id = p_product_id
    AND output.quality_status = 'released'
    AND (lot.status = 'available'
      OR (lot.status = 'depleted' AND (
        coalesce(balance.freezing_quantity, 0) > 0
        OR coalesce(balance.quality_sampling_pending_quantity, 0) > 0
        OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0
      )))
    AND (lot.expiration_date IS NULL OR lot.expiration_date >= CURRENT_DATE
      OR coalesce(balance.quality_sampling_pending_quantity, 0) > 0
      OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0)
  ORDER BY lot.expiration_date NULLS LAST, lot.created_at;
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
  sampling_total integer;
  sampling_reserved integer := 0;
  inventory_quantity integer;
  decision_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Freezing decisions require an administrator.';
  END IF;
  IF p_operation_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0
    OR p_destination IS NULL OR p_destination NOT IN ('fresh', 'raw_frozen')
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
  WHERE operation.id = p_operation_id FOR UPDATE;
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
  WHERE product.id = product_lot.product_id FOR UPDATE;
  SELECT * INTO product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = freezing_operation.product_lot_id FOR UPDATE;
  SELECT * INTO balance
  FROM public.product_lot_storage_balances AS current_balance
  WHERE current_balance.product_lot_id = product_lot.id FOR UPDATE;

  SELECT freezing_operation.requested_quantity - coalesce(sum(decision.quantity), 0)
  INTO pending_quantity
  FROM public.product_lot_freezing_decisions AS decision
  WHERE decision.operation_id = freezing_operation.id;
  IF p_quantity > pending_quantity OR pending_quantity <= 0 THEN
    RAISE check_violation USING MESSAGE = 'Decision exceeds pending freezing quantity.';
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
  ELSE
    inventory_quantity := p_quantity;
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
      + CASE WHEN p_destination = 'raw_frozen' THEN inventory_quantity ELSE 0 END,
    quality_sampling_pending_quantity = CASE
      WHEN p_destination <> 'raw_frozen'
        OR balance.quality_sampling_reserved_quantity > 0
        THEN quality_sampling_pending_quantity
      WHEN sampling_reserved = 5 THEN 0
      ELSE quality_sampling_pending_quantity + p_quantity
    END,
    quality_sampling_reserved_quantity = quality_sampling_reserved_quantity
      + sampling_reserved,
    updated_at = now()
  WHERE product_lot_id = product_lot.id
    AND freezing_quantity >= p_quantity;
  IF NOT FOUND THEN
    RAISE check_violation USING MESSAGE = 'Decision exceeds pending freezing quantity.';
  END IF;

  IF sampling_reserved = 5 THEN
    INSERT INTO public.product_lot_quality_samples (
      product_lot_id, purpose, quantity, status, created_by
    ) VALUES
      (product_lot.id, 'immediate_inspection', 2, 'pending_inspection', auth.uid()),
      (product_lot.id, 'safety_retention', 3, 'in_custody', auth.uid());
  END IF;

  UPDATE public.product_lots
  SET quantity = quantity + inventory_quantity,
    status = CASE WHEN quantity + inventory_quantity > 0
      THEN 'available' ELSE status END,
    updated_at = now()
  WHERE id = product_lot.id;

  IF inventory_quantity > 0 THEN
    INSERT INTO public.inventory_movements (
      item_type, item_id, product_id, movement_type, quantity,
      reference_type, reference_id, warehouse_id, created_by, notes
    ) VALUES (
      'product', product_lot.product_id, product_lot.product_id, 'entry', inventory_quantity,
      'product_lot_freezing_decision', decision_id, product_lot.warehouse_id,
      auth.uid(), btrim(p_reason)
    );
  END IF;

  IF pending_quantity = p_quantity THEN
    UPDATE public.product_lot_freezing_operations
    SET status = 'resolved', resolved_at = now()
    WHERE id = freezing_operation.id;
  END IF;
  RETURN decision_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_product_lot_storage_balances(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_product_lot_storage_balances(uuid)
  TO authenticated;
