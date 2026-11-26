-- Intermediate mass remains a decimal product lot and does not use the
-- finished-product piece-count freezing ledger. New final-product releases,
-- however, must use an explicitly classified compatible destination.
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

  -- Direct historical/test lot inserts have no release decision. Only lots
  -- created by the atomic Quality release flow are routed by this trigger.
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
    AND location.deleted_at IS NULL;

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

ALTER TABLE public.inventory_locations
  DROP CONSTRAINT IF EXISTS inventory_locations_storage_classification_check,
  ADD CONSTRAINT inventory_locations_storage_classification_check
    CHECK (
      (location_use IS NULL AND storage_condition IS NULL)
      OR (location_use = 'raw_material'
          AND storage_condition IN ('dry', 'refrigerated', 'frozen'))
      OR (location_use = 'prepared_ingredient'
          AND storage_condition IN ('dry', 'refrigerated'))
      OR (location_use = 'finished_product'
          AND storage_condition IN ('refrigerated', 'frozen'))
      OR (location_use IN ('packaging', 'chemical')
          AND storage_condition = 'dry')
    );

ALTER TABLE public.raw_materials
  DROP CONSTRAINT IF EXISTS raw_materials_required_storage_condition_check,
  ADD CONSTRAINT raw_materials_required_storage_condition_check
    CHECK (
      required_storage_condition IS NULL
      OR (required_storage_condition IN ('dry', 'refrigerated', 'frozen')
          AND (required_storage_condition <> 'frozen'
               OR default_storage_use = 'raw_material'))
    );

ALTER TABLE public.raw_material_lots
  DROP CONSTRAINT IF EXISTS raw_material_lots_storage_condition_check,
  ADD CONSTRAINT raw_material_lots_storage_condition_check
    CHECK (storage_condition IS NULL OR storage_condition IN ('dry', 'refrigerated', 'frozen'));

CREATE OR REPLACE FUNCTION public.enforce_purchase_receipt_storage_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  material_id uuid;
  material_condition text;
  material_use text;
  material_location_id uuid;
  location_use text;
  location_condition text;
  location_active boolean;
  lot_location_id uuid;
  lot_condition text;
  lot_status text;
BEGIN
  SELECT item.raw_material_id INTO material_id
  FROM public.purchase_order_items AS item
  WHERE item.id = NEW.purchase_order_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase item was not found for receipt storage assignment.'
      USING ERRCODE = '23503';
  END IF;

  SELECT material.required_storage_condition,
         material.default_storage_use,
         material.default_inventory_location_id
  INTO material_condition, material_use, material_location_id
  FROM public.raw_materials AS material
  WHERE material.id = material_id
    AND material.is_active = true
    AND material.deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND OR material_condition IS NULL
     OR material_condition NOT IN ('dry', 'refrigerated', 'frozen')
     OR material_use IS DISTINCT FROM 'raw_material'
     OR material_location_id IS NULL THEN
    RAISE EXCEPTION 'Raw material storage policy is not configured for receipt.'
      USING ERRCODE = '23514';
  END IF;

  SELECT location.location_use, location.storage_condition, location.is_active
  INTO location_use, location_condition, location_active
  FROM public.inventory_locations AS location
  WHERE location.id = material_location_id AND location.deleted_at IS NULL
  FOR SHARE;
  IF NOT FOUND OR location_active IS DISTINCT FROM true
     OR location_use IS DISTINCT FROM material_use
     OR location_condition IS DISTINCT FROM material_condition THEN
    RAISE EXCEPTION 'Configured raw material storage location is inactive or incompatible.'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.inventory_location_id IS DISTINCT FROM material_location_id THEN
    RAISE EXCEPTION 'Receipt must use the configured raw material storage location.'
      USING ERRCODE = '23514';
  END IF;

  SELECT lot.inventory_location_id, lot.storage_condition, lot.status
  INTO lot_location_id, lot_condition, lot_status
  FROM public.raw_material_lots AS lot
  WHERE lot.id = NEW.raw_material_lot_id
  FOR UPDATE;
  IF NOT FOUND OR lot_location_id IS DISTINCT FROM material_location_id
     OR lot_status IS DISTINCT FROM 'quarantine'
     OR (lot_condition IS NOT NULL AND lot_condition IS DISTINCT FROM material_condition) THEN
    RAISE EXCEPTION 'Received lot does not match its configured quarantined storage.'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.raw_material_lots
  SET storage_condition = material_condition, updated_at = now()
  WHERE id = NEW.raw_material_lot_id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.route_new_finished_product_lot_storage() IS
  'Routes only atomic final-product Quality releases; intermediate mass lots retain their decimal inventory quantity and bypass piece-count storage balances.';
COMMENT ON FUNCTION public.enforce_purchase_receipt_storage_assignment() IS
  'Assigns purchased raw-material lots to their configured compatible raw-material location, including frozen incoming materials.';
