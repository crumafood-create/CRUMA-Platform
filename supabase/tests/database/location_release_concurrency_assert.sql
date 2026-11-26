DO $test$
BEGIN
  -- A location reclassification committed first; the waiting mass release
  -- must re-read the new policy and leave the production output untouched.
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = 'ec200000-0000-4000-8000-000000000001'
      AND location_use = 'finished_product'
      AND storage_condition = 'frozen'
      AND is_active
  ) OR EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE production_output_id = 'ec800000-0000-4000-8000-000000000001'
  ) OR EXISTS (
    SELECT 1 FROM public.quality_release_decisions
    WHERE production_output_id = 'ec800000-0000-4000-8000-000000000001'
  ) OR EXISTS (
    SELECT 1 FROM public.finished_product_quality_release_operations
    WHERE idempotency_key = 'eca00000-0000-4000-8000-000000000001'
  ) OR EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE reference_type = 'production_lot'
      AND item_id = 'ec500000-0000-4000-8000-000000000001'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.production_outputs
    WHERE id = 'ec800000-0000-4000-8000-000000000001'
      AND quality_status = 'pending'
      AND mass_quantity_produced = 2.15
  ) THEN
    RAISE EXCEPTION 'mass release did not reject the committed incompatible location atomically';
  END IF;

  -- Release locked and occupied the finished-product location first; the
  -- waiting reclassification must see that lot and reject its own update.
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = 'ec200000-0000-4000-8000-000000000002'
      AND location_use = 'finished_product'
      AND storage_condition = 'refrigerated'
      AND is_active
  ) OR NOT EXISTS (
    SELECT 1 FROM public.production_outputs
    WHERE id = 'ec800000-0000-4000-8000-000000000002'
      AND quality_status = 'released'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE production_output_id = 'ec800000-0000-4000-8000-000000000002'
      AND inventory_location_id = 'ec200000-0000-4000-8000-000000000002'
      AND status = 'depleted'
      AND quantity = 0
      AND initial_quantity = 4
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances
    WHERE product_lot_id = (
      SELECT id FROM public.product_lots
      WHERE production_output_id = 'ec800000-0000-4000-8000-000000000002'
    ) AND refrigerated_wait_quantity = 4
      AND refrigerated_wait_location_id = 'ec200000-0000-4000-8000-000000000002'
  ) OR (SELECT count(*) FROM public.quality_release_decisions
        WHERE production_output_id = 'ec800000-0000-4000-8000-000000000002'
          AND decision = 'release') <> 1 OR (SELECT count(*)
        FROM public.inventory_movements
        WHERE reference_type = 'finished_product_refrigerated_wait'
          AND item_id = 'ec500000-0000-4000-8000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'release/reclassification race left a location incompatible with its released lot';
  END IF;
END;
$test$;
