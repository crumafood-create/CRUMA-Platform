-- Settle production costs atomically and idempotently.

CREATE TABLE
  public.production_cost_settlement_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key uuid NOT NULL UNIQUE,
    production_cost_id uuid NOT NULL
      REFERENCES public.production_costs(id)
      ON DELETE RESTRICT,
    production_order_id uuid NOT NULL
      REFERENCES public.production_orders(id)
      ON DELETE RESTRICT,
    production_output_id uuid NOT NULL
      REFERENCES public.production_outputs(id)
      ON DELETE RESTRICT,
    calculation_version integer NOT NULL
      CHECK (calculation_version > 0),
    material_cost numeric(18,4) NOT NULL
      CHECK (material_cost >= 0),
    labor_cost numeric(18,4) NOT NULL
      CHECK (labor_cost >= 0),
    overhead_cost numeric(18,4) NOT NULL
      CHECK (overhead_cost >= 0),
    total_cost numeric(18,4) NOT NULL
      CHECK (total_cost >= 0),
    unit_cost numeric(18,4) NOT NULL
      CHECK (unit_cost >= 0),
    source_consumption_count integer NOT NULL
      CHECK (source_consumption_count > 0),
    settled_by uuid NOT NULL
      REFERENCES public.profiles(id)
      ON DELETE RESTRICT,
    settled_at timestamptz NOT NULL
      DEFAULT now(),
    created_at timestamptz NOT NULL
      DEFAULT now(),
    UNIQUE (
      production_cost_id,
      calculation_version
    )
  );

CREATE INDEX
  production_cost_settlement_order_idx
ON public.production_cost_settlement_operations (
  production_order_id,
  settled_at DESC
);

ALTER TABLE
  public.production_cost_settlement_operations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  production_cost_settlement_operations_admin_read
ON public.production_cost_settlement_operations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE
  public.production_cost_settlement_operations
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.production_cost_settlement_operations
TO authenticated;

CREATE OR REPLACE FUNCTION
public.settle_production_cost(
  p_production_order_id uuid,
  p_labor_cost numeric,
  p_overhead_cost numeric,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  order_row
    public.production_orders%ROWTYPE;
  output_row
    public.production_outputs%ROWTYPE;
  existing_operation
    public.production_cost_settlement_operations%ROWTYPE;
  v_labor_cost numeric(18,4);
  v_overhead_cost numeric(18,4);
  v_material_cost numeric(18,4);
  v_total_cost numeric(18,4);
  v_unit_cost numeric(18,4);
  v_consumption_count integer;
  v_cost_id uuid;
  v_version integer;
  v_now timestamptz := now();
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Production cost settlement requires an administrator.';
  END IF;

  IF p_production_order_id IS NULL THEN
    RAISE EXCEPTION
      'Production order is required.'
      USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Idempotency key is required.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    p_labor_cost IS NULL
    OR p_overhead_cost IS NULL
    OR p_labor_cost < 0
    OR p_overhead_cost < 0
    OR p_labor_cost::text IN (
      'NaN',
      'Infinity',
      '-Infinity'
    )
    OR p_overhead_cost::text IN (
      'NaN',
      'Infinity',
      '-Infinity'
    )
  ) THEN
    RAISE EXCEPTION
      'Production costs must be finite non-negative values.'
      USING ERRCODE = '22023';
  END IF;

  v_labor_cost :=
    round(p_labor_cost, 4);

  v_overhead_cost :=
    round(p_overhead_cost, 4);

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_idempotency_key::text,
      0
    )
  );

  SELECT *
  INTO existing_operation
  FROM
    public.production_cost_settlement_operations
  WHERE idempotency_key =
    p_idempotency_key;

  IF FOUND THEN
    IF (
      existing_operation.production_order_id
        IS DISTINCT FROM
          p_production_order_id
      OR existing_operation.labor_cost
        IS DISTINCT FROM
          v_labor_cost
      OR existing_operation.overhead_cost
        IS DISTINCT FROM
          v_overhead_cost
    ) THEN
      RAISE EXCEPTION
        'Idempotency key was reused with different data.'
        USING ERRCODE = '23505';
    END IF;

    RETURN
      existing_operation.production_cost_id;
  END IF;

  SELECT *
  INTO order_row
  FROM public.production_orders
  WHERE id = p_production_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production order was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF order_row.production_status
    IS DISTINCT FROM 'completed'
  THEN
    RAISE EXCEPTION
      'Production order must be completed.'
      USING ERRCODE = '23514';
  END IF;

  IF coalesce(
    order_row.produced_quantity,
    0
  ) <= 0 THEN
    RAISE EXCEPTION
      'Produced quantity must be positive.'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO output_row
  FROM public.production_outputs
  WHERE production_order_id =
    order_row.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Production output was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF output_row.quality_status
    IS DISTINCT FROM 'pending'
  THEN
    RAISE EXCEPTION
      'Production cost is frozen after quality disposition.'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1
  FROM
    public.production_order_consumptions
      AS consumption
  JOIN public.production_order_items
      AS item
    ON item.id =
      consumption.production_order_item_id
  WHERE item.production_order_id =
    order_row.id
  FOR UPDATE OF consumption;

  IF NOT EXISTS (
    SELECT 1
    FROM public.production_order_items
    WHERE production_order_id =
      order_row.id
  ) OR EXISTS (
    SELECT 1
    FROM public.production_order_items
      AS item
    WHERE item.production_order_id =
      order_row.id
      AND (
        item.status
          IS DISTINCT FROM 'completed'
        OR item.consumed_quantity
          IS DISTINCT FROM
            coalesce(
              (
                SELECT sum(
                  consumption.quantity
                )
                FROM
                  public.production_order_consumptions
                    AS consumption
                WHERE
                  consumption.production_order_item_id =
                    item.id
              ),
              0
            )
      )
  ) THEN
    RAISE EXCEPTION
      'Production consumption is incomplete.'
      USING ERRCODE = '23514';
  END IF;

  SELECT
    round(
      sum(consumption.total_cost),
      4
    ),
    count(*)::integer
  INTO
    v_material_cost,
    v_consumption_count
  FROM
    public.production_order_consumptions
      AS consumption
  JOIN public.production_order_items
      AS item
    ON item.id =
      consumption.production_order_item_id
  WHERE item.production_order_id =
    order_row.id;

  IF (
    v_consumption_count = 0
    OR v_material_cost IS NULL
  ) THEN
    RAISE EXCEPTION
      'Production order has no consumption snapshots.'
      USING ERRCODE = '23514';
  END IF;

  v_total_cost := round(
    v_material_cost +
      v_labor_cost +
      v_overhead_cost,
    4
  );

  v_unit_cost := round(
    v_total_cost /
      order_row.produced_quantity,
    4
  );

  SELECT
    cost.id,
    cost.calculation_version + 1
  INTO
    v_cost_id,
    v_version
  FROM public.production_costs
    AS cost
  WHERE cost.production_order_id =
    order_row.id;

  v_version := coalesce(
    v_version,
    1
  );

  INSERT INTO public.production_costs (
    production_order_id,
    material_cost,
    labor_cost,
    overhead_cost,
    total_cost,
    unit_cost,
    calculated_by,
    calculated_at,
    calculation_version,
    source_consumption_count
  )
  VALUES (
    order_row.id,
    v_material_cost,
    v_labor_cost,
    v_overhead_cost,
    v_total_cost,
    v_unit_cost,
    auth.uid(),
    v_now,
    v_version,
    v_consumption_count
  )
  ON CONFLICT (production_order_id)
  DO UPDATE
  SET
    material_cost =
      EXCLUDED.material_cost,
    labor_cost =
      EXCLUDED.labor_cost,
    overhead_cost =
      EXCLUDED.overhead_cost,
    total_cost =
      EXCLUDED.total_cost,
    unit_cost =
      EXCLUDED.unit_cost,
    calculated_by =
      EXCLUDED.calculated_by,
    calculated_at =
      EXCLUDED.calculated_at,
    calculation_version =
      EXCLUDED.calculation_version,
    source_consumption_count =
      EXCLUDED.source_consumption_count,
    updated_at = v_now
  RETURNING id
  INTO v_cost_id;

  INSERT INTO
    public.production_cost_history (
      production_cost_id,
      production_order_id,
      version,
      material_cost,
      labor_cost,
      overhead_cost,
      total_cost,
      unit_cost,
      source_consumption_count,
      calculated_by,
      calculated_at
    )
  VALUES (
    v_cost_id,
    order_row.id,
    v_version,
    v_material_cost,
    v_labor_cost,
    v_overhead_cost,
    v_total_cost,
    v_unit_cost,
    v_consumption_count,
    auth.uid(),
    v_now
  );

  UPDATE public.production_orders
  SET
    actual_cost = v_total_cost,
    updated_at = v_now
  WHERE id = order_row.id;

  UPDATE public.production_outputs
  SET
    unit_cost = v_unit_cost,
    total_cost = v_total_cost
  WHERE id = output_row.id;

  INSERT INTO
    public.production_cost_settlement_operations (
      idempotency_key,
      production_cost_id,
      production_order_id,
      production_output_id,
      calculation_version,
      material_cost,
      labor_cost,
      overhead_cost,
      total_cost,
      unit_cost,
      source_consumption_count,
      settled_by,
      settled_at
    )
  VALUES (
    p_idempotency_key,
    v_cost_id,
    order_row.id,
    output_row.id,
    v_version,
    v_material_cost,
    v_labor_cost,
    v_overhead_cost,
    v_total_cost,
    v_unit_cost,
    v_consumption_count,
    auth.uid(),
    v_now
  );

  RETURN v_cost_id;
END;
$$;

REVOKE ALL ON FUNCTION
  public.calculate_production_cost(
    uuid,
    numeric,
    numeric
  )
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.settle_production_cost(
    uuid,
    numeric,
    numeric,
    uuid
  )
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.settle_production_cost(
    uuid,
    numeric,
    numeric,
    uuid
  )
TO authenticated;
