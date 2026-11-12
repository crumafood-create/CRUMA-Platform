DO $test$
DECLARE
  order_a uuid;
  order_b uuid;
BEGIN
  SELECT production_order_id INTO order_a
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000002';
  SELECT production_order_id INTO order_b
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000003';

  IF NOT EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = order_a AND production_status = 'in_progress'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.production_orders
    WHERE id = order_b AND production_status = 'released'
  ) THEN
    RAISE EXCEPTION
      'concurrent reservations did not leave only the winning order started';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE id = 'e1880000-0000-4000-8000-000000000001'
      AND quantity = 0.5
      AND status = 'available'
  ) THEN
    RAISE EXCEPTION
      'concurrent reservations changed the source lot by an incorrect amount';
  END IF;

  IF (
    SELECT count(*) FROM public.production_order_product_lot_reservations
    WHERE production_order_id = order_a
      AND product_lot_id = 'e1880000-0000-4000-8000-000000000001'
      AND reserved_quantity = 1
  ) <> 1 OR EXISTS (
    SELECT 1 FROM public.production_order_product_lot_reservations
    WHERE production_order_id = order_b
  ) THEN
    RAISE EXCEPTION
      'a rejected concurrent start left a partial reservation';
  END IF;

  IF (
    SELECT count(*) FROM public.production_order_lifecycle_operations
    WHERE operation = 'start'
      AND idempotency_key IN (
        'e1860000-0000-4000-8000-000000000006',
        'e1860000-0000-4000-8000-000000000007'
      )
  ) <> 1 THEN
    RAISE EXCEPTION
      'exactly one concurrent start must be audited';
  END IF;
END;
$test$;
