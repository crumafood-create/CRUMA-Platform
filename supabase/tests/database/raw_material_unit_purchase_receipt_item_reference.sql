BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.supplier_id', gen_random_uuid()::text, true), set_config('test.location_id', gen_random_uuid()::text, true), set_config('test.order_id', gen_random_uuid()::text, true), set_config('test.order_item_id', gen_random_uuid()::text, true), set_config('test.lot_id', gen_random_uuid()::text, true), set_config('test.receipt_id', gen_random_uuid()::text, true), set_config('test.receipt_item_id', gen_random_uuid()::text, true), set_config('test.profile_id', (SELECT id::text FROM public.profiles ORDER BY created_at LIMIT 1), true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Receipt old unit', 'rceu-' || left(current_setting('test.old_unit_id'), 8)),
  (current_setting('test.new_unit_id')::uuid, 'Receipt new unit', 'rcnu-' || left(current_setting('test.new_unit_id'), 8));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-receipt-' || left(current_setting('test.material_id'), 8), 'Materia prima recibida', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 2, 0, 30.25, 30.25);
INSERT INTO public.suppliers (id, name)
VALUES (current_setting('test.supplier_id')::uuid, 'Proveedor recepcion unidad ' || left(current_setting('test.supplier_id'), 8));
INSERT INTO public.inventory_locations (id, slug, name)
VALUES (current_setting('test.location_id')::uuid, 'unit-receipt-' || left(current_setting('test.location_id'), 8), 'Ubicacion prueba recepcion');
INSERT INTO public.purchase_orders (id, order_number, supplier_id, status)
VALUES (current_setting('test.order_id')::uuid, 'UNIT-RECEIPT-' || left(current_setting('test.order_id'), 8), current_setting('test.supplier_id')::uuid, 'received');
INSERT INTO public.purchase_order_items (id, purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity)
VALUES (current_setting('test.order_item_id')::uuid, current_setting('test.order_id')::uuid, current_setting('test.material_id')::uuid, 2, 30.25, 60.5, 2);
INSERT INTO public.raw_material_lots (id, raw_material_id, lot_number, quantity, unit_cost, status, inventory_location_id)
VALUES (current_setting('test.lot_id')::uuid, current_setting('test.material_id')::uuid, 'UNIT-RECEIPT-' || left(current_setting('test.lot_id'), 8), 2, 30.25, 'available', current_setting('test.location_id')::uuid);
INSERT INTO public.purchase_receipts (id, purchase_order_id, idempotency_key, received_by)
VALUES (current_setting('test.receipt_id')::uuid, current_setting('test.order_id')::uuid, current_setting('test.receipt_item_id')::uuid, current_setting('test.profile_id')::uuid);
INSERT INTO public.purchase_receipt_items (id, purchase_receipt_id, purchase_order_item_id, raw_material_lot_id, inventory_location_id, quantity)
VALUES (current_setting('test.receipt_item_id')::uuid, current_setting('test.receipt_id')::uuid, current_setting('test.order_item_id')::uuid, current_setting('test.lot_id')::uuid, current_setting('test.location_id')::uuid, 2);

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.purchase_receipt_items WHERE id = current_setting('test.receipt_item_id')::uuid AND quantity = 2) THEN
    RAISE EXCEPTION 'Purchase receipt fixture was not created';
  END IF;
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ014';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ014' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'A purchase receipt reference did not block unit mutation' USING ERRCODE = 'PZ013'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima recibida' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 2 AND minimum_stock = 0 AND average_cost = 30.25 AND last_cost = 30.25) THEN
      RAISE EXCEPTION 'Rejected purchase receipt reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
