-- Quality may resolve a frozen lot below the 2 + 3 sampling threshold only
-- after a documented full inspection and an explicit witness-sample exception.

ALTER TABLE public.product_lot_storage_balances
  ADD COLUMN quality_rejected_pending_quantity integer NOT NULL DEFAULT 0
    CHECK (quality_rejected_pending_quantity >= 0);

CREATE TABLE public.product_lot_small_quantity_quality_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_lot_id uuid NOT NULL REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  inspected_quantity integer NOT NULL CHECK (inspected_quantity > 0),
  accepted_quantity integer NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity integer NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  destructive_quantity integer NOT NULL DEFAULT 0 CHECK (destructive_quantity >= 0),
  process_verified boolean NOT NULL,
  conservation_verified boolean NOT NULL,
  conservation_evidence text NOT NULL
    CHECK (NULLIF(btrim(conservation_evidence), '') IS NOT NULL),
  witness_sample_status text NOT NULL
    DEFAULT 'sin muestra testigo por excepción autorizada'
    CHECK (witness_sample_status = 'sin muestra testigo por excepción autorizada'),
  witness_sample_exception_reason text NOT NULL
    CHECK (NULLIF(btrim(witness_sample_exception_reason), '') IS NOT NULL),
  reason text NOT NULL CHECK (NULLIF(btrim(reason), '') IS NOT NULL),
  idempotency_key uuid NOT NULL UNIQUE,
  decided_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at timestamptz NOT NULL DEFAULT now(),
  CHECK (accepted_quantity + rejected_quantity + destructive_quantity = inspected_quantity),
  CHECK (accepted_quantity = 0 OR
    (process_verified AND conservation_verified AND conservation_evidence ~* 'folio=[^;[:space:]]+;[[:space:]]*fecha/hora=[^;]+;[[:space:]]*lectura=[^;]+;[[:space:]]*especificacion=[^;]+'))
);

CREATE INDEX product_lot_small_quantity_quality_decisions_lot_idx
  ON public.product_lot_small_quantity_quality_decisions(product_lot_id, decided_at);

ALTER TABLE public.product_lot_small_quantity_quality_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_lot_small_quantity_quality_decisions_admin_read
  ON public.product_lot_small_quantity_quality_decisions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
REVOKE ALL ON TABLE public.product_lot_small_quantity_quality_decisions
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.product_lot_small_quantity_quality_decisions TO authenticated;

CREATE FUNCTION public.decide_under_threshold_frozen_lot_quality(
  p_product_lot_id uuid,
  p_inspected_quantity integer,
  p_accepted_quantity integer,
  p_rejected_quantity integer,
  p_destructive_quantity integer,
  p_process_verified boolean,
  p_conservation_verified boolean,
  p_conservation_evidence text,
  p_witness_sample_exception_reason text,
  p_reason text,
  p_idempotency_key uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_lot public.product_lots%ROWTYPE;
  v_balance public.product_lot_storage_balances%ROWTYPE;
  v_existing public.product_lot_small_quantity_quality_decisions%ROWTYPE;
  v_product_id uuid;
  v_decision_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Frozen-lot Quality decisions require an administrator.';
  END IF;
  IF p_product_lot_id IS NULL OR p_inspected_quantity IS NULL OR p_inspected_quantity <= 0
    OR p_accepted_quantity IS NULL OR p_accepted_quantity < 0
    OR p_rejected_quantity IS NULL OR p_rejected_quantity < 0
    OR p_destructive_quantity IS NULL OR p_destructive_quantity < 0
    OR p_accepted_quantity + p_rejected_quantity + p_destructive_quantity <> p_inspected_quantity
    OR p_process_verified IS NULL OR p_conservation_verified IS NULL
    OR NULLIF(btrim(p_conservation_evidence), '') IS NULL
    OR NULLIF(btrim(p_witness_sample_exception_reason), '') IS NULL
    OR NULLIF(btrim(p_reason), '') IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Under-threshold frozen-lot Quality decision is invalid.' USING ERRCODE = '22023';
  END IF;
  IF p_accepted_quantity > 0 AND (NOT p_process_verified OR NOT p_conservation_verified
    OR btrim(p_conservation_evidence) !~* '^folio=[^;[:space:]]+;[[:space:]]*fecha/hora=[^;]+;[[:space:]]*lectura=[^;]+;[[:space:]]*especificacion=[^;]+$') THEN
    RAISE check_violation USING MESSAGE = 'Accepted pieces require verified process and positive conservation-record evidence.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'under-threshold-quality-decision:' || p_idempotency_key::text, 0
  ));
  SELECT * INTO v_existing
  FROM public.product_lot_small_quantity_quality_decisions AS decision
  WHERE decision.idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.product_lot_id IS DISTINCT FROM p_product_lot_id
      OR v_existing.inspected_quantity IS DISTINCT FROM p_inspected_quantity
      OR v_existing.accepted_quantity IS DISTINCT FROM p_accepted_quantity
      OR v_existing.rejected_quantity IS DISTINCT FROM p_rejected_quantity
      OR v_existing.destructive_quantity IS DISTINCT FROM p_destructive_quantity
      OR v_existing.process_verified IS DISTINCT FROM p_process_verified
      OR v_existing.conservation_verified IS DISTINCT FROM p_conservation_verified
      OR v_existing.conservation_evidence IS DISTINCT FROM btrim(p_conservation_evidence)
      OR v_existing.witness_sample_exception_reason IS DISTINCT FROM btrim(p_witness_sample_exception_reason)
      OR v_existing.reason IS DISTINCT FROM btrim(p_reason)
      OR v_existing.decided_by IS DISTINCT FROM auth.uid() THEN
      RAISE unique_violation USING MESSAGE = 'Under-threshold Quality decision key was reused with different data.';
    END IF;
    RETURN v_existing.id;
  END IF;

  SELECT lot.product_id INTO v_product_id
  FROM public.product_lots AS lot WHERE lot.id = p_product_lot_id;
  IF NOT FOUND THEN RAISE no_data_found USING MESSAGE = 'Finished-product lot was not found.'; END IF;
  PERFORM 1 FROM public.products AS product WHERE product.id = v_product_id FOR UPDATE;
  SELECT * INTO v_lot FROM public.product_lots AS lot WHERE lot.id = p_product_lot_id FOR UPDATE;
  SELECT * INTO v_balance FROM public.product_lot_storage_balances AS balance
  WHERE balance.product_lot_id = p_product_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE check_violation USING MESSAGE = 'Lot has no frozen Quality balance awaiting disposition.'; END IF;
  IF v_balance.quality_sampling_pending_quantity <= 0
    OR v_balance.quality_sampling_pending_quantity >= 5
    OR p_inspected_quantity <> v_balance.quality_sampling_pending_quantity THEN
    RAISE check_violation USING MESSAGE = 'Inspect the entire under-threshold quantity currently held for Quality.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.production_outputs AS output
    WHERE output.id = v_lot.production_output_id AND output.quality_status = 'released'
  ) THEN
    RAISE check_violation USING MESSAGE = 'Finished-product output must have an approved Quality release.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations AS location
    WHERE location.id = v_balance.frozen_location_id
      AND location.location_use = 'finished_product'
      AND location.storage_condition = 'frozen'
      AND location.is_active AND location.deleted_at IS NULL
  ) THEN
    RAISE check_violation USING MESSAGE = 'Lot must remain in an active configured finished-product freezer.';
  END IF;
  INSERT INTO public.product_lot_small_quantity_quality_decisions (
    product_lot_id, inspected_quantity, accepted_quantity, rejected_quantity,
    destructive_quantity, process_verified, conservation_verified, conservation_evidence,
    witness_sample_status, witness_sample_exception_reason, reason,
    idempotency_key, decided_by
  ) VALUES (
    p_product_lot_id, p_inspected_quantity, p_accepted_quantity, p_rejected_quantity,
    p_destructive_quantity, p_process_verified, p_conservation_verified, btrim(p_conservation_evidence),
    'sin muestra testigo por excepción autorizada',
    btrim(p_witness_sample_exception_reason), btrim(p_reason),
    p_idempotency_key, auth.uid()
  ) RETURNING id INTO v_decision_id;

  UPDATE public.product_lot_storage_balances AS balance
  SET quality_sampling_pending_quantity = balance.quality_sampling_pending_quantity - p_inspected_quantity,
      raw_frozen_quantity = balance.raw_frozen_quantity + p_accepted_quantity,
      quality_rejected_pending_quantity = balance.quality_rejected_pending_quantity + p_rejected_quantity,
      quality_waste_quantity = balance.quality_waste_quantity + p_destructive_quantity,
      updated_at = now()
  WHERE balance.product_lot_id = p_product_lot_id
    AND balance.quality_sampling_pending_quantity >= p_inspected_quantity;
  IF NOT FOUND THEN RAISE check_violation USING MESSAGE = 'Under-threshold Quality balance changed before disposition.'; END IF;

  IF p_accepted_quantity > 0 THEN
    UPDATE public.product_lots AS lot
    SET quantity = lot.quantity + p_accepted_quantity,
        status = 'available', updated_at = now()
    WHERE lot.id = p_product_lot_id;
    INSERT INTO public.inventory_movements (
      item_type, item_id, product_id, movement_type, quantity,
      reference_type, reference_id, warehouse_id, created_by, notes
    ) VALUES (
      'product', v_lot.product_id, v_lot.product_id, 'entry', p_accepted_quantity,
      'product_lot_small_quantity_quality_decision', v_decision_id,
      v_lot.warehouse_id, auth.uid(), btrim(p_reason)
    );
  END IF;
  RETURN v_decision_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.decide_under_threshold_frozen_lot_quality(
  uuid, integer, integer, integer, integer, boolean, boolean, text, text, text, uuid
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.decide_under_threshold_frozen_lot_quality(
  uuid, integer, integer, integer, integer, boolean, boolean, text, text, text, uuid
) TO authenticated;

DROP FUNCTION public.get_product_lot_storage_balances(uuid);
CREATE FUNCTION public.get_product_lot_storage_balances(p_product_id uuid)
RETURNS TABLE (
  product_lot_id uuid, lot_number text, expiration_date date, location_name text,
  lot_quantity integer, fresh_quantity integer, raw_frozen_quantity integer,
  freezing_quantity integer, refrigerated_wait_quantity integer,
  quality_waste_quantity integer, refrigerated_wait_location_name text,
  freezing_location_name text, frozen_location_name text,
  quality_sampling_pending_quantity integer, quality_sampling_reserved_quantity integer,
  quality_rejected_pending_quantity integer, cumulative_frozen_quantity bigint,
  sampling_plan_remaining_quantity integer, quality_decision_history jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE insufficient_privilege USING MESSAGE = 'Inventory access requires an administrator.'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances AS tracked
    JOIN public.product_lots AS tracked_lot ON tracked_lot.id = tracked.product_lot_id
    WHERE tracked_lot.product_id = p_product_id
  ) THEN RETURN; END IF;
  RETURN QUERY
  SELECT lot.id, lot.lot_number, lot.expiration_date, location.name, lot.quantity::integer,
    coalesce(balance.fresh_quantity, lot.quantity::integer), coalesce(balance.raw_frozen_quantity, 0),
    coalesce(balance.freezing_quantity, 0), coalesce(balance.refrigerated_wait_quantity, 0),
    coalesce(balance.quality_waste_quantity, 0), wait_location.name, process_location.name, frozen_location.name,
    coalesce(balance.quality_sampling_pending_quantity, 0), coalesce(balance.quality_sampling_reserved_quantity, 0),
    coalesce(balance.quality_rejected_pending_quantity, 0),
    coalesce((SELECT sum(decision.quantity)::bigint FROM public.product_lot_freezing_decisions AS decision
      WHERE decision.product_lot_id = lot.id AND decision.destination = 'raw_frozen'), 0),
    CASE WHEN EXISTS (SELECT 1 FROM public.product_lot_quality_samples AS sample
        WHERE sample.product_lot_id = lot.id)
      THEN 0
      ELSE greatest(0, 5 - coalesce(balance.quality_sampling_pending_quantity, 0)
        - coalesce(balance.quality_sampling_reserved_quantity, 0))
    END::integer,
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', decision.id,
      'inspected_quantity', decision.inspected_quantity,
      'accepted_quantity', decision.accepted_quantity,
      'rejected_quantity', decision.rejected_quantity,
      'destructive_quantity', decision.destructive_quantity,
      'conservation_evidence', decision.conservation_evidence,
      'witness_sample_status', decision.witness_sample_status,
      'witness_sample_exception_reason', decision.witness_sample_exception_reason,
      'reason', decision.reason,
      'decided_by', coalesce(decider.full_name, decider.email, decision.decided_by::text),
      'decided_at', decision.decided_at
    ) ORDER BY decision.decided_at, decision.id)
      FROM public.product_lot_small_quantity_quality_decisions AS decision
      LEFT JOIN public.profiles AS decider ON decider.id = decision.decided_by
      WHERE decision.product_lot_id = lot.id), '[]'::jsonb)
  FROM public.product_lots AS lot
  JOIN public.production_outputs AS output ON output.id = lot.production_output_id
  LEFT JOIN public.inventory_locations AS location ON location.id = lot.inventory_location_id
  LEFT JOIN public.product_lot_storage_balances AS balance ON balance.product_lot_id = lot.id
  LEFT JOIN public.inventory_locations AS wait_location ON wait_location.id = balance.refrigerated_wait_location_id
  LEFT JOIN public.inventory_locations AS process_location ON process_location.id = balance.freezing_location_id
  LEFT JOIN public.inventory_locations AS frozen_location ON frozen_location.id = balance.frozen_location_id
  WHERE lot.product_id = p_product_id AND output.quality_status = 'released'
    AND (lot.status = 'available' OR coalesce(balance.freezing_quantity, 0) > 0
      OR coalesce(balance.refrigerated_wait_quantity, 0) > 0
      OR coalesce(balance.quality_sampling_pending_quantity, 0) > 0
      OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0
      OR coalesce(balance.quality_rejected_pending_quantity, 0) > 0)
    AND (lot.expiration_date IS NULL OR lot.expiration_date >= CURRENT_DATE
      OR coalesce(balance.quality_sampling_pending_quantity, 0) > 0
      OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0
      OR coalesce(balance.quality_rejected_pending_quantity, 0) > 0)
  ORDER BY lot.expiration_date NULLS LAST, lot.created_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_product_lot_storage_balances(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_product_lot_storage_balances(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_inventory_location_storage_policy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.raw_materials AS material
    WHERE material.default_inventory_location_id = NEW.id
      AND (material.default_storage_use IS DISTINCT FROM NEW.location_use
           OR material.required_storage_condition IS DISTINCT FROM NEW.storage_condition
           OR NOT NEW.is_active OR NEW.deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Location classification conflicts with an assigned material destination.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.raw_material_lots AS lot
    JOIN public.raw_materials AS material ON material.id = lot.raw_material_id
    WHERE lot.inventory_location_id = NEW.id
      AND lot.quantity > 0
      AND (lot.storage_condition IS DISTINCT FROM NEW.storage_condition
           OR material.default_storage_use IS DISTINCT FROM NEW.location_use
           OR material.required_storage_condition IS DISTINCT FROM NEW.storage_condition
           OR NOT NEW.is_active OR NEW.deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Location classification conflicts with physical raw-material lots stored there.'
      USING ERRCODE = '23514';
  END IF;

  IF (NEW.location_use IS DISTINCT FROM OLD.location_use
      OR NEW.storage_condition IS DISTINCT FROM OLD.storage_condition
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at)
     AND EXISTS (
       SELECT 1 FROM public.product_lots AS lot
       LEFT JOIN public.product_lot_storage_balances AS balance ON balance.product_lot_id = lot.id
       WHERE (lot.inventory_location_id = NEW.id AND lot.status = 'available' AND lot.quantity > 0)
         OR (lot.inventory_location_id = NEW.id AND coalesce(balance.fresh_quantity, 0) > 0)
         OR (balance.refrigerated_wait_location_id = NEW.id AND balance.refrigerated_wait_quantity > 0)
         OR (balance.freezing_location_id = NEW.id AND balance.freezing_quantity > 0)
         OR (balance.frozen_location_id = NEW.id AND balance.raw_frozen_quantity > 0)
         OR (balance.quality_rejected_pending_quantity > 0 AND (
           lot.inventory_location_id = NEW.id OR balance.refrigerated_wait_location_id = NEW.id
           OR balance.freezing_location_id = NEW.id OR balance.frozen_location_id = NEW.id))
         OR EXISTS (SELECT 1 FROM public.product_lot_freezing_operations AS operation
           WHERE operation.product_lot_id = lot.id AND operation.status = 'in_progress'
             AND operation.process_location_id = NEW.id)
         OR ((coalesce(balance.quality_sampling_pending_quantity, 0) > 0
             OR coalesce(balance.quality_sampling_reserved_quantity, 0) > 0
             OR EXISTS (SELECT 1 FROM public.product_lot_quality_samples AS sample
               WHERE sample.product_lot_id = lot.id AND sample.status IN (
                 'pending_inspection', 'in_custody', 'pending_disposition')))
           AND (lot.inventory_location_id = NEW.id OR balance.refrigerated_wait_location_id = NEW.id
             OR balance.freezing_location_id = NEW.id OR balance.frozen_location_id = NEW.id))
     ) THEN
    RAISE EXCEPTION 'Resolve available, waiting, freezing, frozen, or quality-custody product quantities before changing this location.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

COMMENT ON TABLE public.product_lot_small_quantity_quality_decisions IS
  'Audits full non-destructive Quality inspection, explicit witness-sample exceptions, and disposition of frozen lots below the standard 2+3 sampling threshold.';

COMMENT ON FUNCTION public.guard_inventory_location_storage_policy() IS
  'Protects configured material destinations, all occupied raw-material lots, and finished-product balances or quality custody from incompatible location changes.';
