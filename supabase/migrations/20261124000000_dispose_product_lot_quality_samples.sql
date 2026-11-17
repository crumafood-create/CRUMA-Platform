ALTER TABLE public.product_lot_quality_samples
  DROP CONSTRAINT product_lot_quality_samples_status_check,
  ADD CONSTRAINT product_lot_quality_samples_status_check CHECK (
    status IN (
      'pending_inspection', 'in_custody', 'pending_disposition',
      'partially_disposed', 'returned_to_lot', 'direct_waste',
      'mixed_disposition'
    )
  );

DROP INDEX public.product_lot_quality_samples_pending_idx;
CREATE INDEX product_lot_quality_samples_pending_idx
  ON public.product_lot_quality_samples (status, created_at)
  WHERE status IN (
    'pending_inspection', 'in_custody', 'pending_disposition',
    'partially_disposed'
  );

CREATE TABLE public.product_lot_quality_sample_dispositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL
    REFERENCES public.product_lot_quality_samples(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  destination text NOT NULL
    CHECK (destination IN ('returned_to_lot', 'direct_waste')),
  return_authorized boolean NOT NULL DEFAULT false,
  authorized_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (NULLIF(btrim(reason), '') IS NOT NULL),
  idempotency_key uuid NOT NULL UNIQUE,
  decided_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_lot_quality_sample_disposition_authorization_check CHECK (
    (destination = 'returned_to_lot' AND return_authorized AND authorized_by IS NOT NULL)
    OR (destination = 'direct_waste' AND NOT return_authorized AND authorized_by IS NULL)
  )
);

CREATE INDEX product_lot_quality_sample_dispositions_sample_idx
  ON public.product_lot_quality_sample_dispositions (sample_id, decided_at);

ALTER TABLE public.product_lot_quality_sample_dispositions ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_lot_quality_sample_dispositions_admin_read
  ON public.product_lot_quality_sample_dispositions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
REVOKE ALL ON TABLE public.product_lot_quality_sample_dispositions
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_lot_quality_sample_dispositions
  TO authenticated;

CREATE FUNCTION public.decide_product_lot_quality_sample_disposition(
  p_sample_id uuid,
  p_quality_inspection_id uuid,
  p_quantity integer,
  p_destination text,
  p_return_authorized boolean,
  p_reason text,
  p_idempotency_key uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_sample public.product_lot_quality_samples%ROWTYPE;
  v_product_lot public.product_lots%ROWTYPE;
  v_balance public.product_lot_storage_balances%ROWTYPE;
  v_existing public.product_lot_quality_sample_dispositions%ROWTYPE;
  v_disposition_id uuid;
  v_product_id uuid;
  v_remaining_quantity integer;
  v_decided_quantity integer;
  v_destination_count integer;
  v_single_destination text;
  v_reason_summary text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Quality sample disposition requires an administrator.';
  END IF;

  IF p_sample_id IS NULL OR p_quality_inspection_id IS NULL
    OR p_quantity IS NULL OR p_quantity <= 0
    OR p_destination IS NULL
    OR p_destination NOT IN ('returned_to_lot', 'direct_waste')
    OR p_reason IS NULL OR NULLIF(btrim(p_reason), '') IS NULL
    OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Quality sample disposition data is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_destination = 'returned_to_lot'
    AND coalesce(p_return_authorized, false) IS NOT TRUE THEN
    RAISE check_violation
      USING MESSAGE = 'Returning a sample requires explicit Quality authorization.';
  END IF;

  IF p_destination = 'direct_waste'
    AND coalesce(p_return_authorized, false) THEN
    RAISE EXCEPTION 'Direct quality waste cannot carry return authorization.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'product-lot-quality-sample-disposition:' || p_idempotency_key::text, 0
  ));

  SELECT * INTO v_existing
  FROM public.product_lot_quality_sample_dispositions AS disposition
  WHERE disposition.idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.sample_id IS DISTINCT FROM p_sample_id
      OR v_existing.quantity IS DISTINCT FROM p_quantity
      OR v_existing.destination IS DISTINCT FROM p_destination
      OR v_existing.return_authorized IS DISTINCT FROM coalesce(p_return_authorized, false)
      OR v_existing.reason IS DISTINCT FROM btrim(p_reason)
      OR v_existing.decided_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Quality sample disposition key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.id;
  END IF;

  SELECT * INTO v_sample
  FROM public.product_lot_quality_samples AS sample
  WHERE sample.id = p_sample_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quality sample was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF v_sample.purpose <> 'immediate_inspection'
    OR v_sample.status NOT IN ('pending_disposition', 'partially_disposed') THEN
    RAISE check_violation
      USING MESSAGE = 'Quality sample is not awaiting disposition.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.quality_inspections AS inspection
    WHERE inspection.id = p_quality_inspection_id
      AND inspection.product_lot_quality_sample_id = v_sample.id
      AND inspection.subject_type = 'product_lot_quality_sample'
  ) THEN
    RAISE check_violation
      USING MESSAGE = 'Quality sample must be inspected before disposition.';
  END IF;

  SELECT v_sample.quantity - coalesce(sum(disposition.quantity), 0)::integer
  INTO v_remaining_quantity
  FROM public.product_lot_quality_sample_dispositions AS disposition
  WHERE disposition.sample_id = v_sample.id;
  IF p_quantity > v_remaining_quantity OR v_remaining_quantity <= 0 THEN
    RAISE check_violation
      USING MESSAGE = 'Disposition quantity exceeds the sample pieces awaiting disposition.';
  END IF;

  SELECT lot.product_id INTO v_product_id
  FROM public.product_lots AS lot
  WHERE lot.id = v_sample.product_lot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quality sample lot was not found.' USING ERRCODE = 'P0002';
  END IF;
  PERFORM 1 FROM public.products AS product
  WHERE product.id = v_product_id
  FOR UPDATE;
  SELECT * INTO v_product_lot
  FROM public.product_lots AS lot
  WHERE lot.id = v_sample.product_lot_id
  FOR UPDATE;
  SELECT * INTO v_balance
  FROM public.product_lot_storage_balances AS balance
  WHERE balance.product_lot_id = v_product_lot.id
  FOR UPDATE;
  IF NOT FOUND OR v_balance.quality_sampling_reserved_quantity < p_quantity THEN
    RAISE check_violation
      USING MESSAGE = 'Quality sample reserve is inconsistent with inventory.';
  END IF;

  INSERT INTO public.product_lot_quality_sample_dispositions (
    sample_id, quantity, destination, return_authorized, authorized_by,
    reason, idempotency_key, decided_by
  ) VALUES (
    v_sample.id, p_quantity, p_destination,
    p_destination = 'returned_to_lot',
    CASE WHEN p_destination = 'returned_to_lot' THEN auth.uid() ELSE NULL END,
    btrim(p_reason), p_idempotency_key, auth.uid()
  ) RETURNING id INTO v_disposition_id;

  UPDATE public.product_lot_storage_balances AS balance
  SET quality_sampling_reserved_quantity =
        balance.quality_sampling_reserved_quantity - p_quantity,
      raw_frozen_quantity = balance.raw_frozen_quantity
        + CASE WHEN p_destination = 'returned_to_lot' THEN p_quantity ELSE 0 END,
      updated_at = now()
  WHERE balance.product_lot_id = v_product_lot.id
    AND balance.quality_sampling_reserved_quantity >= p_quantity;
  IF NOT FOUND THEN
    RAISE check_violation
      USING MESSAGE = 'Quality sample reserve is inconsistent with inventory.';
  END IF;

  IF p_destination = 'returned_to_lot' THEN
    UPDATE public.product_lots AS lot
    SET quantity = lot.quantity + p_quantity,
      status = 'available',
      updated_at = now()
    WHERE lot.id = v_product_lot.id;
  END IF;

  IF p_destination = 'returned_to_lot' THEN
    INSERT INTO public.inventory_movements (
      item_type, item_id, product_id, movement_type, quantity,
      reference_type, reference_id, warehouse_id, created_by, notes
    ) VALUES (
      'product', v_product_lot.product_id, v_product_lot.product_id,
      'entry', p_quantity, 'product_lot_quality_sample_disposition',
      v_disposition_id, v_product_lot.warehouse_id, auth.uid(), btrim(p_reason)
    );
  END IF;

  SELECT coalesce(sum(disposition.quantity), 0)::integer,
    count(DISTINCT disposition.destination)::integer,
    min(disposition.destination),
    string_agg(
      disposition.quantity::text || ' pieza(s): ' || disposition.destination ||
        ' — ' || disposition.reason,
      '; ' ORDER BY disposition.decided_at, disposition.id
    )
  INTO v_decided_quantity, v_destination_count, v_single_destination, v_reason_summary
  FROM public.product_lot_quality_sample_dispositions AS disposition
  WHERE disposition.sample_id = v_sample.id;

  IF v_decided_quantity = v_sample.quantity THEN
    UPDATE public.product_lot_quality_samples AS sample
    SET status = CASE
        WHEN v_destination_count > 1 THEN 'mixed_disposition'
        WHEN v_single_destination = 'returned_to_lot' THEN 'returned_to_lot'
        ELSE 'direct_waste'
      END,
      destination = CASE WHEN v_destination_count > 1
        THEN 'mixed' ELSE v_single_destination END,
      decided_by = auth.uid(),
      decided_at = now(),
      reason = v_reason_summary
    WHERE sample.id = v_sample.id;
  ELSE
    UPDATE public.product_lot_quality_samples AS sample
    SET status = 'partially_disposed'
    WHERE sample.id = v_sample.id;
  END IF;

  RETURN v_disposition_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.decide_product_lot_quality_sample_disposition(
  uuid, uuid, integer, text, boolean, text, uuid
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.decide_product_lot_quality_sample_disposition(
  uuid, uuid, integer, text, boolean, text, uuid
) TO authenticated;
