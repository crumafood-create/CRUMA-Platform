DO $test$
BEGIN
  IF (SELECT status FROM public.sales_orders
      WHERE id = 'fea00000-0000-4000-8000-000000000001') <> 'draft'
    OR EXISTS (SELECT 1 FROM public.inventory_reservations
      WHERE reference_id = 'fea00000-0000-4000-8000-000000000001'
        AND status = 'active') THEN
    RAISE EXCEPTION 'the reservation race committed despite the freezing lock';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lot_storage_balances
    WHERE product_lot_id = 'fe800000-0000-4000-8000-000000000001'
      AND fresh_quantity = 8
      AND raw_frozen_quantity = 25
      AND quality_sampling_pending_quantity = 0
      AND quality_sampling_reserved_quantity = 5
      AND freezing_quantity = 10
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'fe800000-0000-4000-8000-000000000001'
      AND quantity = 33
  ) THEN
    RAISE EXCEPTION 'concurrent freezing starts exceeded or corrupted the product-lot balance';
  END IF;

  IF (SELECT count(*) FROM public.product_lot_quality_samples
      WHERE product_lot_id = 'fe800000-0000-4000-8000-000000000001'
        AND ((purpose = 'immediate_inspection' AND quantity = 2)
          OR (purpose = 'safety_retention' AND quantity = 3))) <> 2 THEN
    RAISE EXCEPTION 'concurrent freeze confirmations did not reserve one complete quality sample';
  END IF;

  IF (SELECT count(*) FROM public.product_lot_freezing_operations
      WHERE product_lot_id = 'fe800000-0000-4000-8000-000000000001') <> 2
    OR (SELECT count(*) FROM public.inventory_movements
      WHERE reference_type = 'product_lot_freezing_start'
        AND item_id = 'fe400000-0000-4000-8000-000000000001') <> 2 THEN
    RAISE EXCEPTION 'concurrent freezing duplicated an operation or movement';
  END IF;
END;
$test$;
