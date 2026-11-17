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
      AND raw_frozen_quantity = 30
      AND freezing_quantity = 10
  ) OR NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'fe800000-0000-4000-8000-000000000001'
      AND quantity = 38
  ) THEN
    RAISE EXCEPTION 'concurrent freezing starts exceeded or corrupted the product-lot balance';
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
