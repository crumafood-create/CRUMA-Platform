DO $test$
BEGIN
  -- The incompatible classification committed first. The transfer waited,
  -- re-read it, and left the lot and movement history untouched. The runner
  -- then restored the destination policy for the second concurrency order.
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = 'ed100000-0000-4000-8000-000000000002'
      AND location_use = 'raw_material'
      AND storage_condition = 'refrigerated' AND is_active
  ) OR NOT EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE id = 'ed400000-0000-4000-8000-000000000001'
      AND inventory_location_id = 'ed100000-0000-4000-8000-000000000001'
      AND status = 'available' AND quantity = 0.5000 AND remaining_value = 10
  ) OR EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE reference_type = 'raw_material_lot_location_transfer'
      AND reference_id = 'ed500000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION 'A transfer that waited for reclassification did not reject atomically against the committed location policy.';
  END IF;

  -- The transfer acquired shared locks first. Reclassification waited, then
  -- rejected because the destination now contains physical inventory.
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = 'ed100000-0000-4000-8000-000000000002'
      AND location_use = 'raw_material'
      AND storage_condition = 'refrigerated' AND is_active
  ) OR NOT EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE id = 'ed400000-0000-4000-8000-000000000001'
      AND inventory_location_id = 'ed100000-0000-4000-8000-000000000002'
      AND status = 'available' AND quantity = 0.5000 AND remaining_value = 10
  ) OR (SELECT current_stock FROM public.raw_materials
        WHERE id = 'ed300000-0000-4000-8000-000000000001') <> 0.5000
    OR (SELECT count(*) FROM public.inventory_movements
        WHERE reference_type = 'raw_material_lot_location_transfer'
          AND reference_id = 'ed500000-0000-4000-8000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'A concurrent transfer and location reclassification left incompatible or duplicated inventory state.';
  END IF;
END;
$test$;
