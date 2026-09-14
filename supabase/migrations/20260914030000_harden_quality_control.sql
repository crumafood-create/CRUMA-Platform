ALTER TABLE public.production_outputs
  ADD COLUMN quality_status text NOT NULL DEFAULT 'pending',
  ADD CONSTRAINT production_outputs_quality_status_check
    CHECK (quality_status IN ('pending', 'hold', 'released', 'rejected'));

CREATE TABLE public.quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  production_output_id uuid NOT NULL REFERENCES public.production_outputs(id) ON DELETE RESTRICT,
  inspector_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'hold')),
  result text CHECK (result IN ('ok', 'rework', 'reject')),
  sampled_quantity integer NOT NULL CHECK (sampled_quantity > 0),
  accepted_quantity integer NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity integer NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  inspected_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (accepted_quantity + rejected_quantity <= sampled_quantity)
);

CREATE TABLE public.quality_inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
  criterion text NOT NULL CHECK (btrim(criterion) <> ''),
  expected_value text,
  actual_value text,
  passed boolean NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quality_defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
  defect_type text NOT NULL CHECK (btrim(defect_type) <> ''),
  severity text NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  quantity integer NOT NULL CHECK (quantity > 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quality_release_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.quality_inspections(id) ON DELETE RESTRICT,
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  production_output_id uuid NOT NULL REFERENCES public.production_outputs(id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('release', 'hold', 'reject')),
  approved_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inspection_id)
);

CREATE INDEX quality_inspections_order_idx
  ON public.quality_inspections(production_order_id, inspected_at DESC);
CREATE INDEX quality_inspections_output_idx
  ON public.quality_inspections(production_output_id, inspected_at DESC);
CREATE INDEX quality_defects_inspection_idx
  ON public.quality_defects(inspection_id);
CREATE INDEX quality_release_decisions_output_idx
  ON public.quality_release_decisions(production_output_id, approved_at DESC);

CREATE TRIGGER quality_inspections_updated_at
BEFORE UPDATE ON public.quality_inspections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_release_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY quality_inspections_admin_read ON public.quality_inspections
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY quality_inspection_items_admin_read ON public.quality_inspection_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY quality_defects_admin_read ON public.quality_defects
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY quality_release_decisions_admin_read ON public.quality_release_decisions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.quality_inspections,
  public.quality_inspection_items,
  public.quality_defects,
  public.quality_release_decisions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.quality_inspections,
  public.quality_inspection_items,
  public.quality_defects,
  public.quality_release_decisions TO authenticated;

CREATE OR REPLACE FUNCTION public.record_quality_inspection(
  p_output_id uuid,
  p_sampled_quantity integer,
  p_notes text,
  p_criteria jsonb,
  p_defects jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  production_output public.production_outputs%ROWTYPE;
  v_inspection_id uuid;
  v_failed_criteria integer;
  v_critical_defects integer;
  v_rejected_quantity integer;
  v_sampled_quantity integer := p_sampled_quantity;
  v_result text;
  v_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Quality inspection management requires an administrator.';
  END IF;
  IF p_output_id IS NULL OR p_sampled_quantity IS NULL OR p_sampled_quantity <= 0 THEN
    RAISE EXCEPTION 'Sampled quantity must be a positive integer.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_criteria) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_criteria) = 0 THEN
    RAISE EXCEPTION 'Quality inspection requires at least one criterion.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_defects) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Quality defects must be an array.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_criteria) item
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(item->>'criterion'), '') IS NULL
      OR jsonb_typeof(item->'passed') IS DISTINCT FROM 'boolean'
  ) THEN
    RAISE EXCEPTION 'Quality criterion is invalid.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_defects) defect
    WHERE jsonb_typeof(defect) IS DISTINCT FROM 'object'
      OR NULLIF(btrim(defect->>'defect_type'), '') IS NULL
      OR defect->>'severity' NOT IN ('minor', 'major', 'critical')
      OR coalesce(defect->>'quantity', '') !~ '^[1-9][0-9]*$'
  ) THEN
    RAISE EXCEPTION 'Quality defect is invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO production_output
  FROM public.production_outputs
  WHERE id = p_output_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production output was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF production_output.quality_status = 'released' THEN
    RAISE EXCEPTION 'Released production output cannot be inspected again.' USING ERRCODE = '23514';
  END IF;
  IF p_sampled_quantity > production_output.quantity_produced THEN
    RAISE EXCEPTION 'Sampled quantity exceeds produced quantity.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.production_orders production_order
    WHERE production_order.id = production_output.production_order_id
      AND production_order.production_status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Production order must be completed before inspection.' USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(sum((defect->>'quantity')::integer), 0)::integer
  INTO v_rejected_quantity
  FROM jsonb_array_elements(p_defects) defect;
  IF v_rejected_quantity > p_sampled_quantity THEN
    RAISE EXCEPTION 'Rejected quantity exceeds sampled quantity.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.quality_inspections (
    production_order_id, production_output_id, inspector_id,
    sampled_quantity, notes
  ) VALUES (
    production_output.production_order_id, production_output.id, auth.uid(),
    p_sampled_quantity, NULLIF(btrim(p_notes), '')
  ) RETURNING id INTO v_inspection_id;

  INSERT INTO public.quality_inspection_items (
    inspection_id, criterion, expected_value, actual_value, passed, notes
  )
  SELECT v_inspection_id, btrim(item->>'criterion'),
    NULLIF(btrim(item->>'expected_value'), ''),
    NULLIF(btrim(item->>'actual_value'), ''),
    (item->>'passed')::boolean,
    NULLIF(btrim(item->>'notes'), '')
  FROM jsonb_array_elements(p_criteria) item;

  INSERT INTO public.quality_defects (
    inspection_id, defect_type, severity, quantity, description
  )
  SELECT v_inspection_id, btrim(defect->>'defect_type'),
    defect->>'severity', (defect->>'quantity')::integer,
    NULLIF(btrim(defect->>'description'), '')
  FROM jsonb_array_elements(p_defects) defect;

  SELECT count(*) FILTER (WHERE NOT item.passed)::integer
  INTO v_failed_criteria
  FROM public.quality_inspection_items item
  WHERE item.inspection_id = v_inspection_id;

  SELECT count(*) FILTER (WHERE defect.severity = 'critical')::integer,
    coalesce(sum(defect.quantity), 0)::integer
  INTO v_critical_defects, v_rejected_quantity
  FROM public.quality_defects defect
  WHERE defect.inspection_id = v_inspection_id;

  v_rejected_quantity := LEAST(v_sampled_quantity, v_rejected_quantity);
  IF v_critical_defects > 0 THEN
    v_result := 'reject';
    v_status := 'failed';
  ELSIF v_failed_criteria > 0 OR v_rejected_quantity > 0 THEN
    v_result := 'rework';
    v_status := 'hold';
  ELSE
    v_result := 'ok';
    v_status := 'passed';
  END IF;

  UPDATE public.quality_inspections
  SET result = v_result,
    status = v_status,
    accepted_quantity = p_sampled_quantity - v_rejected_quantity,
    rejected_quantity = v_rejected_quantity
  WHERE id = v_inspection_id;

  UPDATE public.production_outputs
  SET quality_status = CASE
    WHEN v_status = 'failed' THEN 'rejected'
    WHEN v_status = 'hold' THEN 'hold'
    ELSE 'pending'
  END
  WHERE id = production_output.id;

  RETURN v_inspection_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_quality_release(
  p_inspection_id uuid,
  p_decision text,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  inspection public.quality_inspections%ROWTYPE;
  decision_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Quality release decisions require an administrator.';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('release', 'hold', 'reject') THEN
    RAISE EXCEPTION 'Quality decision is invalid.' USING ERRCODE = '22023';
  END IF;
  IF p_decision IN ('hold', 'reject') AND NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Quality decision reason is required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO inspection
  FROM public.quality_inspections
  WHERE id = p_inspection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quality inspection was not found.' USING ERRCODE = 'P0002';
  END IF;

  PERFORM 1 FROM public.production_outputs
  WHERE id = inspection.production_output_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.quality_inspections newer
    WHERE newer.production_output_id = inspection.production_output_id
      AND (newer.inspected_at, newer.id) > (inspection.inspected_at, inspection.id)
  ) THEN
    RAISE EXCEPTION 'A newer quality inspection exists.' USING ERRCODE = '23514';
  END IF;
  IF p_decision = 'release' AND inspection.status IS DISTINCT FROM 'passed' THEN
    RAISE EXCEPTION 'Inspection cannot be released.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.quality_release_decisions (
    inspection_id, production_order_id, production_output_id,
    decision, approved_by, reason
  ) VALUES (
    inspection.id, inspection.production_order_id, inspection.production_output_id,
    p_decision, auth.uid(), NULLIF(btrim(p_reason), '')
  ) RETURNING id INTO decision_id;

  UPDATE public.production_outputs
  SET quality_status = CASE p_decision
    WHEN 'release' THEN 'released'
    WHEN 'hold' THEN 'hold'
    ELSE 'rejected'
  END
  WHERE id = inspection.production_output_id;

  RETURN decision_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_quality_inspection(uuid, integer, text, jsonb, jsonb)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.decide_quality_release(uuid, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_quality_inspection(uuid, integer, text, jsonb, jsonb)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_quality_release(uuid, text, text)
  TO authenticated;
