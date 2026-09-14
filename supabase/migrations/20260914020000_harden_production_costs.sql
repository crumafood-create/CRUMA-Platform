ALTER TABLE public.production_order_consumptions
  ADD COLUMN unit_cost numeric(18,4),
  ADD COLUMN total_cost numeric(18,4);

UPDATE public.production_order_consumptions consumption
SET unit_cost = lot.unit_cost,
    total_cost = round(consumption.quantity * lot.unit_cost, 4)
FROM public.raw_material_lots lot
WHERE lot.id = consumption.raw_material_lot_id;

ALTER TABLE public.production_order_consumptions
  ALTER COLUMN unit_cost SET NOT NULL,
  ALTER COLUMN total_cost SET NOT NULL,
  ADD CONSTRAINT production_consumption_cost_check CHECK (
    quantity > 0
    AND unit_cost >= 0
    AND total_cost = round(quantity * unit_cost, 4)
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.snapshot_production_consumption_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_unit_cost numeric(18,4);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.raw_material_lot_id IS NOT DISTINCT FROM OLD.raw_material_lot_id
       AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity THEN
      NEW.unit_cost := OLD.unit_cost;
      NEW.total_cost := OLD.total_cost;
      RETURN NEW;
    END IF;
  END IF;

  SELECT lot.unit_cost INTO STRICT v_unit_cost
  FROM public.raw_material_lots lot
  WHERE lot.id = NEW.raw_material_lot_id;

  NEW.unit_cost := v_unit_cost;
  NEW.total_cost := round(NEW.quantity * v_unit_cost, 4);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_production_consumption_cost() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER snapshot_production_consumption_cost
BEFORE INSERT OR UPDATE
ON public.production_order_consumptions
FOR EACH ROW EXECUTE FUNCTION public.snapshot_production_consumption_cost();

ALTER TABLE public.production_costs
  ADD COLUMN calculated_by uuid,
  ADD COLUMN calculated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN calculation_version integer NOT NULL DEFAULT 1,
  ADD COLUMN source_consumption_count integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT production_cost_amounts_check CHECK (
    material_cost >= 0 AND labor_cost >= 0 AND overhead_cost >= 0
    AND total_cost >= 0 AND unit_cost >= 0
  ),
  ADD CONSTRAINT production_cost_version_check CHECK (
    calculation_version > 0 AND source_consumption_count >= 0
  );

CREATE TABLE public.production_cost_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_cost_id uuid NOT NULL REFERENCES public.production_costs(id) ON DELETE CASCADE,
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  material_cost numeric(18,4) NOT NULL CHECK (material_cost >= 0),
  labor_cost numeric(18,4) NOT NULL CHECK (labor_cost >= 0),
  overhead_cost numeric(18,4) NOT NULL CHECK (overhead_cost >= 0),
  total_cost numeric(18,4) NOT NULL CHECK (total_cost >= 0),
  unit_cost numeric(18,4) NOT NULL CHECK (unit_cost >= 0),
  source_consumption_count integer NOT NULL CHECK (source_consumption_count > 0),
  calculated_by uuid NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (production_cost_id, version)
);

CREATE INDEX production_cost_history_order_idx
  ON public.production_cost_history(production_order_id, version DESC);

ALTER TABLE public.production_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_cost_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS production_costs_admin_read ON public.production_costs;
CREATE POLICY production_costs_admin_read ON public.production_costs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY production_cost_history_admin_read ON public.production_cost_history
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.production_costs FROM anon, authenticated;
REVOKE ALL ON TABLE public.production_cost_history FROM anon, authenticated;
GRANT SELECT ON TABLE public.production_costs TO authenticated;
GRANT SELECT ON TABLE public.production_cost_history TO authenticated;

CREATE OR REPLACE FUNCTION public.calculate_production_cost(
  p_order_id uuid,
  p_labor_cost numeric,
  p_overhead_cost numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_order public.production_orders%ROWTYPE;
  v_material_cost numeric(18,4);
  v_total_cost numeric(18,4);
  v_unit_cost numeric(18,4);
  v_consumption_count integer;
  v_cost_id uuid;
  v_version integer;
  v_now timestamptz := now();
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Production cost calculation requires an administrator.';
  END IF;
  IF p_order_id IS NULL
     OR p_labor_cost IS NULL OR p_overhead_cost IS NULL
     OR p_labor_cost < 0 OR p_overhead_cost < 0
     OR p_labor_cost::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_overhead_cost::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Production costs must be finite non-negative values.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_order
  FROM public.production_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production order was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF v_order.production_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Production order must be completed.' USING ERRCODE = '23514';
  END IF;
  IF coalesce(v_order.produced_quantity, 0) <= 0 THEN
    RAISE EXCEPTION 'Produced quantity must be positive.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.production_order_items item
    WHERE item.production_order_id = p_order_id
  ) OR EXISTS (
    SELECT 1
    FROM public.production_order_items item
    WHERE item.production_order_id = p_order_id
      AND (
        item.status IS DISTINCT FROM 'completed'
        OR item.consumed_quantity IS DISTINCT FROM coalesce((
          SELECT sum(consumption.quantity)
          FROM public.production_order_consumptions consumption
          WHERE consumption.production_order_item_id = item.id
        ), 0)
      )
  ) THEN
    RAISE EXCEPTION 'Production consumption is incomplete.' USING ERRCODE = '23514';
  END IF;

  SELECT round(sum(consumption.total_cost), 4), count(*)::integer
  INTO v_material_cost, v_consumption_count
  FROM public.production_order_consumptions consumption
  JOIN public.production_order_items item ON item.id = consumption.production_order_item_id
  WHERE item.production_order_id = p_order_id;

  IF v_consumption_count = 0 OR v_material_cost IS NULL THEN
    RAISE EXCEPTION 'Production order has no consumption snapshots.' USING ERRCODE = '23514';
  END IF;

  v_total_cost := round(v_material_cost + p_labor_cost + p_overhead_cost, 4);
  v_unit_cost := round(v_total_cost / v_order.produced_quantity, 4);

  SELECT cost.id, cost.calculation_version + 1
  INTO v_cost_id, v_version
  FROM public.production_costs cost
  WHERE cost.production_order_id = p_order_id;

  v_version := coalesce(v_version, 1);

  INSERT INTO public.production_costs (
    production_order_id, material_cost, labor_cost, overhead_cost,
    total_cost, unit_cost, calculated_by, calculated_at,
    calculation_version, source_consumption_count
  ) VALUES (
    p_order_id, v_material_cost, p_labor_cost, p_overhead_cost,
    v_total_cost, v_unit_cost, auth.uid(), v_now, v_version, v_consumption_count
  )
  ON CONFLICT (production_order_id) DO UPDATE SET
    material_cost = EXCLUDED.material_cost,
    labor_cost = EXCLUDED.labor_cost,
    overhead_cost = EXCLUDED.overhead_cost,
    total_cost = EXCLUDED.total_cost,
    unit_cost = EXCLUDED.unit_cost,
    calculated_by = EXCLUDED.calculated_by,
    calculated_at = EXCLUDED.calculated_at,
    calculation_version = EXCLUDED.calculation_version,
    source_consumption_count = EXCLUDED.source_consumption_count,
    updated_at = v_now
  RETURNING id INTO v_cost_id;

  INSERT INTO public.production_cost_history (
    production_cost_id, production_order_id, version,
    material_cost, labor_cost, overhead_cost, total_cost, unit_cost,
    source_consumption_count, calculated_by, calculated_at
  ) VALUES (
    v_cost_id, p_order_id, v_version,
    v_material_cost, p_labor_cost, p_overhead_cost, v_total_cost, v_unit_cost,
    v_consumption_count, auth.uid(), v_now
  );

  UPDATE public.production_orders
  SET actual_cost = v_total_cost, updated_at = v_now
  WHERE id = p_order_id;

  UPDATE public.production_outputs
  SET unit_cost = v_unit_cost, total_cost = round(quantity_produced * v_unit_cost, 2)
  WHERE production_order_id = p_order_id;

  RETURN v_cost_id;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_production_cost(uuid, numeric, numeric)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_production_cost(uuid, numeric, numeric)
  TO authenticated;
