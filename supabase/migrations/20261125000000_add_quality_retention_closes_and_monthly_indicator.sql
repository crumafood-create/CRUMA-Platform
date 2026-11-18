CREATE TABLE public.quality_retention_daily_closes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  close_date date NOT NULL UNIQUE,
  closed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  closed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quality_retention_daily_close_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_close_id uuid NOT NULL
    REFERENCES public.quality_retention_daily_closes(id) ON DELETE RESTRICT,
  sample_id uuid NOT NULL
    REFERENCES public.product_lot_quality_samples(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  UNIQUE (daily_close_id, sample_id)
);

CREATE INDEX quality_retention_daily_close_items_sample_idx
  ON public.quality_retention_daily_close_items (sample_id, daily_close_id);

ALTER TABLE public.quality_retention_daily_closes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_retention_daily_close_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY quality_retention_daily_closes_admin_read
  ON public.quality_retention_daily_closes FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY quality_retention_daily_close_items_admin_read
  ON public.quality_retention_daily_close_items FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.quality_retention_daily_closes
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.quality_retention_daily_close_items
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.quality_retention_daily_closes,
  public.quality_retention_daily_close_items TO authenticated;

CREATE FUNCTION public.close_quality_retention_day(p_close_date date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_close_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Quality daily close requires an administrator.';
  END IF;
  IF p_close_date IS DISTINCT FROM
    (now() AT TIME ZONE 'America/Mexico_City')::date THEN
    RAISE EXCEPTION 'Quality close date is invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'quality-retention-daily-close:' || p_close_date::text, 0
  ));

  INSERT INTO public.quality_retention_daily_closes (close_date, closed_by)
  VALUES (p_close_date, auth.uid())
  ON CONFLICT (close_date) DO NOTHING
  RETURNING id INTO v_close_id;

  IF v_close_id IS NULL THEN
    SELECT close_record.id INTO v_close_id
    FROM public.quality_retention_daily_closes AS close_record
    WHERE close_record.close_date = p_close_date;
    RETURN v_close_id;
  END IF;

  INSERT INTO public.quality_retention_daily_close_items (
    daily_close_id, sample_id, quantity
  )
  SELECT v_close_id, sample.id, sample.quantity
  FROM public.product_lot_quality_samples AS sample
  WHERE sample.purpose = 'safety_retention'
    AND sample.status = 'in_custody';

  RETURN v_close_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.close_quality_retention_day(date)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_quality_retention_day(date)
  TO authenticated;

CREATE FUNCTION public.get_quality_retention_daily_closes(p_limit integer DEFAULT 31)
RETURNS TABLE (
  close_date date,
  closed_at timestamptz,
  retained_sample_count bigint,
  retained_quantity bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Quality daily close reporting requires an administrator.';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 366 THEN
    RAISE EXCEPTION 'Quality close limit is invalid.' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT close_record.close_date, close_record.closed_at,
    count(close_item.id)::bigint, coalesce(sum(close_item.quantity), 0)::bigint
  FROM public.quality_retention_daily_closes AS close_record
  LEFT JOIN public.quality_retention_daily_close_items AS close_item
    ON close_item.daily_close_id = close_record.id
  GROUP BY close_record.id
  ORDER BY close_record.close_date DESC
  LIMIT p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_quality_retention_daily_closes(integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quality_retention_daily_closes(integer)
  TO authenticated;

CREATE FUNCTION public.get_quality_retention_monthly_indicator(p_month date)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  preparation_type_id uuid,
  preparation_name text,
  retained_quantity bigint,
  gross_production_quantity bigint,
  retention_percentage numeric,
  direct_quality_waste_quantity bigint,
  month_closed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_month_start date;
  v_month_end date;
  v_month_after date;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Quality retention reporting requires an administrator.';
  END IF;
  IF p_month IS NULL THEN
    RAISE EXCEPTION 'Quality report month is required.' USING ERRCODE = '22023';
  END IF;

  v_month_start := date_trunc('month', p_month)::date;
  v_month_after := (v_month_start + interval '1 month')::date;
  v_month_end := v_month_after - 1;

  RETURN QUERY
  WITH month_close AS (
    SELECT close_record.id, close_record.closed_at
    FROM public.quality_retention_daily_closes AS close_record
    WHERE close_record.close_date = v_month_end
  ),
  gross_production AS (
    SELECT output.product_id, product.preparation_type_id,
      sum(output.quantity_produced)::bigint AS quantity
    FROM public.production_outputs AS output
    JOIN public.production_orders AS production_order
      ON production_order.id = output.production_order_id
    JOIN public.products AS product ON product.id = output.product_id
    WHERE production_order.completed_at >=
        (v_month_start::timestamp AT TIME ZONE 'America/Mexico_City')
      AND production_order.completed_at <
        (v_month_after::timestamp AT TIME ZONE 'America/Mexico_City')
    GROUP BY output.product_id, product.preparation_type_id
  ),
  retained_samples AS (
    SELECT lot.product_id, product.preparation_type_id,
      sum(close_item.quantity)::bigint AS quantity
    FROM month_close
    JOIN public.quality_retention_daily_close_items AS close_item
      ON close_item.daily_close_id = month_close.id
    JOIN public.product_lot_quality_samples AS sample
      ON sample.id = close_item.sample_id
    JOIN public.product_lots AS lot ON lot.id = sample.product_lot_id
    JOIN public.production_outputs AS output ON output.id = lot.production_output_id
    JOIN public.production_orders AS production_order
      ON production_order.id = output.production_order_id
    JOIN public.products AS product ON product.id = output.product_id
    WHERE sample.purpose = 'safety_retention'
      AND production_order.completed_at >=
        (v_month_start::timestamp AT TIME ZONE 'America/Mexico_City')
      AND production_order.completed_at <
        (v_month_after::timestamp AT TIME ZONE 'America/Mexico_City')
    GROUP BY lot.product_id, product.preparation_type_id
  ),
  quality_waste AS (
    SELECT lot.product_id, product.preparation_type_id,
      sum(disposition.quantity)::bigint AS quantity
    FROM public.product_lot_quality_sample_dispositions AS disposition
    JOIN public.product_lot_quality_samples AS sample ON sample.id = disposition.sample_id
    JOIN public.product_lots AS lot ON lot.id = sample.product_lot_id
    JOIN public.production_outputs AS output ON output.id = lot.production_output_id
    JOIN public.products AS product ON product.id = output.product_id
    WHERE disposition.destination = 'direct_waste'
      AND disposition.decided_at >=
        (v_month_start::timestamp AT TIME ZONE 'America/Mexico_City')
      AND disposition.decided_at <
        (v_month_after::timestamp AT TIME ZONE 'America/Mexico_City')
    GROUP BY lot.product_id, product.preparation_type_id
  ),
  groups AS (
    SELECT gross_production.product_id, gross_production.preparation_type_id
    FROM gross_production
    UNION
    SELECT retained_samples.product_id, retained_samples.preparation_type_id
    FROM retained_samples
    UNION
    SELECT quality_waste.product_id, quality_waste.preparation_type_id
    FROM quality_waste
  )
  SELECT groups.product_id, product.name, groups.preparation_type_id,
    preparation.name, coalesce(retained_samples.quantity, 0),
    coalesce(gross_production.quantity, 0),
    CASE WHEN NOT EXISTS (SELECT 1 FROM month_close)
        OR coalesce(gross_production.quantity, 0) = 0 THEN NULL
      ELSE round(100.0 * coalesce(retained_samples.quantity, 0)
        / gross_production.quantity, 4)
    END,
    coalesce(quality_waste.quantity, 0),
    EXISTS (SELECT 1 FROM month_close)
  FROM groups
  JOIN public.products AS product ON product.id = groups.product_id
  LEFT JOIN public.preparation_types AS preparation
    ON preparation.id = groups.preparation_type_id
  LEFT JOIN gross_production
    ON gross_production.product_id = groups.product_id
    AND gross_production.preparation_type_id IS NOT DISTINCT FROM groups.preparation_type_id
  LEFT JOIN retained_samples
    ON retained_samples.product_id = groups.product_id
    AND retained_samples.preparation_type_id IS NOT DISTINCT FROM groups.preparation_type_id
  LEFT JOIN quality_waste
    ON quality_waste.product_id = groups.product_id
    AND quality_waste.preparation_type_id IS NOT DISTINCT FROM groups.preparation_type_id
  ORDER BY product.name, preparation.name NULLS FIRST;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_quality_retention_monthly_indicator(date)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quality_retention_monthly_indicator(date)
  TO authenticated;
