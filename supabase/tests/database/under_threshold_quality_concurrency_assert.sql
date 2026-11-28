DO $test$
BEGIN
  IF (SELECT count(*) FROM public.product_lot_small_quantity_quality_decisions
      WHERE product_lot_id = 'f9800000-0000-4000-8000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'concurrent Quality decisions created more than one decision or no decision';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'f9800000-0000-4000-8000-000000000001' AND quantity = 2
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances
    WHERE product_lot_id = 'f9800000-0000-4000-8000-000000000001'
      AND quality_sampling_pending_quantity = 0 AND raw_frozen_quantity = 2
      AND quality_rejected_pending_quantity = 0 AND quality_waste_quantity = 0
  ) THEN
    RAISE EXCEPTION 'concurrent decisions released or deducted the held pieces more than once';
  END IF;
  IF (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type = 'product_lot_small_quantity_quality_decision'
        AND item_id = 'f9400000-0000-4000-8000-000000000001' AND quantity = 2) <> 1 THEN
    RAISE EXCEPTION 'concurrent decisions duplicated the inventory entry movement';
  END IF;
END;
$test$;
