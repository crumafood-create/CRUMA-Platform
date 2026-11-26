-- Keep a release's location classification stable until its lot is recorded.
-- FOR SHARE conflicts with the row lock taken by updates to location policy.
CREATE OR REPLACE FUNCTION public.guard_mass_output_storage_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  output_mass_quantity numeric;
  has_release_decision boolean;
  location_use text;
  storage_condition text;
  location_active boolean;
BEGIN
  SELECT output.mass_quantity_produced
  INTO output_mass_quantity
  FROM public.production_outputs AS output
  WHERE output.id = NEW.production_output_id;

  IF output_mass_quantity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.quality_release_decisions AS decision
    WHERE decision.production_output_id = NEW.production_output_id
      AND decision.decision = 'release'
  ) INTO has_release_decision;
  IF NOT has_release_decision THEN
    RETURN NEW;
  END IF;

  SELECT location.location_use, location.storage_condition,
         location.is_active AND location.deleted_at IS NULL
  INTO location_use, storage_condition, location_active
  FROM public.inventory_locations AS location
  WHERE location.id = NEW.inventory_location_id
  FOR SHARE;

  IF NOT FOUND OR location_active IS DISTINCT FROM true
     OR location_use IS DISTINCT FROM 'prepared_ingredient'
     OR storage_condition IS DISTINCT FROM 'refrigerated' THEN
    RAISE EXCEPTION 'Intermediate mass requires an active refrigerated semielaborado location.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.route_new_finished_product_lot_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  output_mass_quantity numeric;
  location_use text;
  storage_condition text;
  operation_id uuid;
  has_release_decision boolean;
BEGIN
  SELECT output.mass_quantity_produced
  INTO output_mass_quantity
  FROM public.production_outputs AS output
  WHERE output.id = NEW.production_output_id;

  IF output_mass_quantity IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.quality_release_decisions AS decision
    WHERE decision.production_output_id = NEW.production_output_id
      AND decision.decision = 'release'
  ) INTO has_release_decision;
  IF NOT has_release_decision THEN
    RETURN NEW;
  END IF;

  SELECT location.location_use, location.storage_condition
  INTO location_use, storage_condition
  FROM public.inventory_locations AS location
  WHERE location.id = NEW.inventory_location_id
    AND location.is_active
    AND location.deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND OR location_use IS NULL OR storage_condition IS NULL THEN
    RAISE EXCEPTION 'Finished product release requires a classified compatible location.'
      USING ERRCODE = '23514';
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

COMMENT ON FUNCTION public.guard_mass_output_storage_location() IS
  'Locks the configured semielaborado location while validating intermediate-mass release.';
COMMENT ON FUNCTION public.route_new_finished_product_lot_storage() IS
  'Locks the classified finished-product location while routing a Quality release to waiting or freezing.';
