-- Record one exclusive destination for each weighed mass surplus and preserve
-- its path through the next same-variety batch and Quality release.

ALTER TABLE public.production_order_product_lot_reservations
  ADD COLUMN surplus_disposition text,
  ADD COLUMN surplus_disposition_reason text,
  ADD COLUMN surplus_disposition_at timestamptz,
  ADD COLUMN surplus_disposition_by uuid REFERENCES public.profiles(id),
  ADD COLUMN surplus_destination_production_order_id uuid
    REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  ADD COLUMN surplus_destination_output_id uuid
    REFERENCES public.production_outputs(id) ON DELETE RESTRICT,
  ADD COLUMN surplus_destination_product_lot_id uuid
    REFERENCES public.product_lots(id) ON DELETE RESTRICT,
  ADD CONSTRAINT production_mass_surplus_disposition_check CHECK (
    (surplus_disposition IS NULL
      AND surplus_disposition_reason IS NULL
      AND surplus_disposition_at IS NULL
      AND surplus_disposition_by IS NULL
      AND surplus_destination_production_order_id IS NULL
      AND surplus_destination_output_id IS NULL
      AND surplus_destination_product_lot_id IS NULL)
    OR
    (surplus_quantity IS NOT NULL
      AND surplus_quantity > 0
      AND surplus_disposition_at IS NOT NULL
      AND surplus_disposition_by IS NOT NULL
      AND (
        (surplus_disposition = 'waste'
          AND surplus_disposition_reason IS NOT NULL
          AND surplus_destination_production_order_id IS NULL
          AND surplus_destination_output_id IS NULL
          AND surplus_destination_product_lot_id IS NULL)
        OR
        (surplus_disposition = 'reuse'
          AND surplus_disposition_reason IS NULL
          AND surplus_destination_production_order_id IS NOT NULL
          AND (surplus_destination_product_lot_id IS NULL
            OR surplus_destination_output_id IS NOT NULL))
      ))
  );

ALTER TABLE public.production_outputs
  ADD COLUMN mass_quantity_produced numeric(18,4),
  ADD CONSTRAINT production_outputs_mass_quantity_check CHECK (
    mass_quantity_produced IS NULL
    OR (mass_quantity_produced > 0
      AND mass_quantity_produced::text NOT IN ('NaN', 'Infinity', '-Infinity')
      AND mass_quantity_produced = round(mass_quantity_produced, 4))
  );

CREATE UNIQUE INDEX production_outputs_mass_order_unique
  ON public.production_outputs(production_order_id)
  WHERE mass_quantity_produced IS NOT NULL;

CREATE TABLE public.production_mass_output_completion_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  production_order_id uuid NOT NULL UNIQUE
    REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  production_output_id uuid NOT NULL UNIQUE
    REFERENCES public.production_outputs(id) ON DELETE RESTRICT,
  actual_mass_quantity numeric(18,4) NOT NULL
    CHECK (actual_mass_quantity > 0),
  completed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_mass_output_completion_operations
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY production_mass_output_completion_operations_admin_read
  ON public.production_mass_output_completion_operations
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
REVOKE ALL ON public.production_mass_output_completion_operations
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.production_mass_output_completion_operations
  TO authenticated;

CREATE OR REPLACE FUNCTION public.dispose_production_mass_surplus_as_waste(
  p_reservation_id uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  reservation public.production_order_product_lot_reservations%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Production mass surplus disposition requires an administrator.';
  END IF;
  IF p_reservation_id IS NULL OR NULLIF(btrim(p_reason), '') IS NULL
    OR char_length(btrim(p_reason)) > 500 THEN
    RAISE EXCEPTION 'Indica el sobrante y el motivo de merma.'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO reservation
  FROM public.production_order_product_lot_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mass surplus was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF reservation.surplus_quantity IS NULL
    OR reservation.surplus_quantity <= 0
    OR reservation.consumed_quantity IS NULL
    OR reservation.surplus_disposition IS NOT NULL THEN
    RAISE EXCEPTION 'Mass surplus already has a destination or is not resolvable.'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.production_order_product_lot_reservations
  SET surplus_disposition = 'waste',
    surplus_disposition_reason = btrim(p_reason),
    surplus_disposition_at = now(),
    surplus_disposition_by = auth.uid()
  WHERE id = reservation.id;
  RETURN reservation.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_production_order_with_mass_surplus_reuse(
  p_production_order_id uuid,
  p_reservation_ids uuid[],
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  order_row public.production_orders%ROWTYPE;
  reservation public.production_order_product_lot_reservations%ROWTYPE;
  existing_operation public.production_order_lifecycle_operations%ROWTYPE;
  target_product_id uuid;
  requested_ids uuid[];
  stored_ids uuid[];
  matched_count integer := 0;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Production order start requires an administrator.';
  END IF;
  IF p_production_order_id IS NULL OR p_idempotency_key IS NULL
    OR coalesce(cardinality(p_reservation_ids), 0) = 0
    OR array_position(p_reservation_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Selecciona al menos un sobrante para reutilizar.'
      USING ERRCODE = '22023';
  END IF;
  SELECT array_agg(id ORDER BY id) INTO requested_ids
  FROM (SELECT DISTINCT unnest(p_reservation_ids) AS id) unique_ids;
  IF cardinality(requested_ids) <> cardinality(p_reservation_ids) THEN
    RAISE EXCEPTION 'No repitas sobrantes en la misma preparación.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );
  SELECT * INTO existing_operation
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing_operation.production_order_id IS DISTINCT FROM p_production_order_id
      OR existing_operation.operation IS DISTINCT FROM 'start' THEN
      RAISE unique_violation USING MESSAGE = 'Idempotency key was reused.';
    END IF;
    SELECT array_agg(id ORDER BY id) INTO stored_ids
    FROM public.production_order_product_lot_reservations
    WHERE surplus_disposition = 'reuse'
      AND surplus_destination_production_order_id = p_production_order_id;
    IF stored_ids IS DISTINCT FROM requested_ids THEN
      RAISE unique_violation USING MESSAGE = 'Idempotency key was reused with different surpluses.';
    END IF;
    RETURN p_production_order_id;
  END IF;

  SELECT * INTO order_row
  FROM public.production_orders
  WHERE id = p_production_order_id
  FOR UPDATE;
  IF NOT FOUND OR order_row.production_status IS DISTINCT FROM 'released' THEN
    RAISE EXCEPTION 'Only released production orders can reuse mass surplus.'
      USING ERRCODE = '23514';
  END IF;
  SELECT recipe.product_id INTO target_product_id
  FROM public.recipes AS recipe
  WHERE recipe.id = order_row.recipe_id;
  IF target_product_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.recipe_items
    WHERE product_id = target_product_id
  ) THEN
    RAISE EXCEPTION 'The destination order must produce an intermediate mass variety.'
      USING ERRCODE = '23514';
  END IF;

  FOR reservation IN
    SELECT source.*
    FROM public.production_order_product_lot_reservations AS source
    WHERE source.id = ANY(requested_ids)
    ORDER BY source.id
    FOR UPDATE
  LOOP
    IF reservation.surplus_quantity IS NULL
      OR reservation.surplus_quantity <= 0
      OR reservation.consumed_quantity IS NULL
      OR reservation.surplus_disposition IS NOT NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.product_lots AS source_lot
        WHERE source_lot.id = reservation.product_lot_id
          AND source_lot.product_id = target_product_id
      ) THEN
      RAISE EXCEPTION 'El sobrante no está pendiente o pertenece a otra variedad de masa.'
        USING ERRCODE = '23514';
    END IF;
    UPDATE public.production_order_product_lot_reservations
    SET surplus_disposition = 'reuse',
      surplus_disposition_at = now(),
      surplus_disposition_by = auth.uid(),
      surplus_destination_production_order_id = order_row.id
    WHERE id = reservation.id;
    matched_count := matched_count + 1;
  END LOOP;
  IF matched_count <> cardinality(requested_ids) THEN
    RAISE EXCEPTION 'Uno o más sobrantes ya no están disponibles.'
      USING ERRCODE = '23514';
  END IF;

  PERFORM public.transition_production_order_lifecycle(
    order_row.id, 'start', NULL, p_idempotency_key
  );
  RETURN order_row.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_production_order_with_mass_output(
  p_production_order_id uuid,
  p_actual_mass_quantity numeric,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  order_row public.production_orders%ROWTYPE;
  existing_output public.production_outputs%ROWTYPE;
  existing_completion public.production_mass_output_completion_operations%ROWTYPE;
  output_id uuid;
  v_product_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE = 'Production completion requires an administrator.';
  END IF;
  IF p_production_order_id IS NULL OR p_idempotency_key IS NULL
    OR p_actual_mass_quantity IS NULL OR p_actual_mass_quantity <= 0
    OR p_actual_mass_quantity::text IN ('NaN', 'Infinity', '-Infinity')
    OR p_actual_mass_quantity <> round(p_actual_mass_quantity, 4) THEN
    RAISE EXCEPTION 'El peso real debe ser positivo en kg con hasta cuatro decimales.'
      USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );
  SELECT * INTO order_row FROM public.production_orders
  WHERE id = p_production_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production order was not found.' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO existing_output FROM public.production_outputs
  WHERE production_order_id = order_row.id
    AND mass_quantity_produced IS NOT NULL;
  IF FOUND THEN
    SELECT * INTO existing_completion
    FROM public.production_mass_output_completion_operations
    WHERE production_order_id = order_row.id;
    IF existing_output.mass_quantity_produced IS DISTINCT FROM p_actual_mass_quantity
      OR NOT FOUND
      OR existing_completion.idempotency_key IS DISTINCT FROM p_idempotency_key THEN
      RAISE unique_violation USING MESSAGE = 'Mass output was already completed with different data.';
    END IF;
    RETURN existing_output.id;
  END IF;
  IF order_row.production_status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'Production order must be in progress.' USING ERRCODE = '23514';
  END IF;
  SELECT recipe.product_id INTO v_product_id
  FROM public.recipes AS recipe WHERE recipe.id = order_row.recipe_id;
  IF v_product_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.recipe_items AS ingredient
    WHERE ingredient.product_id = v_product_id
  ) THEN
    RAISE EXCEPTION 'Production order does not produce an intermediate mass variety.'
      USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.production_order_items
    WHERE production_order_id = order_row.id
  ) OR EXISTS (
    SELECT 1 FROM public.production_order_items
    WHERE production_order_id = order_row.id
      AND status IS DISTINCT FROM 'completed'
  ) THEN
    RAISE EXCEPTION 'Todos los ingredientes de la preparación deben estar consumidos.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.production_outputs (
    production_order_id, product_id, quantity_produced,
    mass_quantity_produced, quality_status
  ) VALUES (order_row.id, v_product_id, 1, p_actual_mass_quantity, 'pending')
  RETURNING id INTO output_id;

  UPDATE public.production_order_product_lot_reservations
  SET surplus_destination_output_id = output_id
  WHERE surplus_disposition = 'reuse'
    AND surplus_destination_production_order_id = order_row.id;

  UPDATE public.production_orders
  SET production_status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = order_row.id;

  INSERT INTO public.production_mass_output_completion_operations (
    idempotency_key, production_order_id, production_output_id,
    actual_mass_quantity, completed_by
  ) VALUES (
    p_idempotency_key, order_row.id, output_id,
    p_actual_mass_quantity, auth.uid()
  );
  RETURN output_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_mass_output_quantity_to_product_lot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  actual_mass numeric(18,4);
BEGIN
  SELECT output.mass_quantity_produced INTO actual_mass
  FROM public.production_outputs AS output
  WHERE output.id = NEW.production_output_id;
  IF actual_mass IS NOT NULL THEN
    NEW.initial_quantity := actual_mass;
    NEW.quantity := actual_mass;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER product_lot_mass_output_quantity
  BEFORE INSERT ON public.product_lots
  FOR EACH ROW EXECUTE FUNCTION public.apply_mass_output_quantity_to_product_lot();

CREATE OR REPLACE FUNCTION public.apply_mass_output_quantity_to_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  actual_mass numeric(18,4);
BEGIN
  IF NEW.reference_type = 'production_lot' AND NEW.reference_id IS NOT NULL THEN
    SELECT output.mass_quantity_produced INTO actual_mass
    FROM public.product_lots AS lot
    JOIN public.production_outputs AS output
      ON output.id = lot.production_output_id
    WHERE lot.id = NEW.reference_id;
    IF actual_mass IS NOT NULL THEN
      NEW.quantity := actual_mass;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER inventory_movement_mass_output_quantity
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_mass_output_quantity_to_inventory_movement();

CREATE OR REPLACE FUNCTION public.link_reused_mass_surplus_to_product_lot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.production_outputs
    WHERE id = NEW.production_output_id
      AND mass_quantity_produced IS NOT NULL
      AND quality_status = 'released'
  ) THEN
    UPDATE public.production_order_product_lot_reservations
    SET surplus_destination_product_lot_id = NEW.id
    WHERE surplus_destination_output_id = NEW.production_output_id
      AND surplus_disposition = 'reuse'
      AND surplus_destination_product_lot_id IS NULL;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER product_lot_link_reused_mass_surplus
  AFTER INSERT ON public.product_lots
  FOR EACH ROW EXECUTE FUNCTION public.link_reused_mass_surplus_to_product_lot();

REVOKE ALL ON FUNCTION public.dispose_production_mass_surplus_as_waste(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.dispose_production_mass_surplus_as_waste(uuid, text)
  TO authenticated;
REVOKE ALL ON FUNCTION public.start_production_order_with_mass_surplus_reuse(uuid, uuid[], uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.start_production_order_with_mass_surplus_reuse(uuid, uuid[], uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.complete_production_order_with_mass_output(uuid, numeric, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.complete_production_order_with_mass_output(uuid, numeric, uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.apply_mass_output_quantity_to_product_lot()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.apply_mass_output_quantity_to_inventory_movement()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.link_reused_mass_surplus_to_product_lot()
  FROM PUBLIC, anon, authenticated, service_role;
