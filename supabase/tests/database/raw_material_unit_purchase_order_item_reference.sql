BEGIN;
SELECT set_config('test.material_id', gen_random_uuid()::text, true), set_config('test.old_unit_id', gen_random_uuid()::text, true), set_config('test.new_unit_id', gen_random_uuid()::text, true), set_config('test.supplier_id', gen_random_uuid()::text, true), set_config('test.order_id', gen_random_uuid()::text, true);
INSERT INTO public.units_of_measure (id, name, code)
VALUES
  (current_setting('test.old_unit_id')::uuid, 'Purchase order old unit', 'poou-' || left(current_setting('test.old_unit_id'), 7)),
  (current_setting('test.new_unit_id')::uuid, 'Purchase order new unit', 'ponu-' || left(current_setting('test.new_unit_id'), 7));
INSERT INTO public.raw_materials (id, slug, name, description, unit_of_measure_id, current_stock, minimum_stock, average_cost, last_cost)
VALUES (current_setting('test.material_id')::uuid, 'unit-purchase-order-' || left(current_setting('test.material_id'), 8), 'Materia prima en compra', 'Descripcion original', current_setting('test.old_unit_id')::uuid, 5.5, 2, 2.1, 3.2);
INSERT INTO public.suppliers (id, name)
VALUES (current_setting('test.supplier_id')::uuid, 'Proveedor prueba unidad ' || left(current_setting('test.supplier_id'), 8));
INSERT INTO public.purchase_orders (id, order_number, supplier_id, status)
VALUES (current_setting('test.order_id')::uuid, 'UNIT-PO-' || left(current_setting('test.order_id'), 8), current_setting('test.supplier_id')::uuid, 'draft');
INSERT INTO public.purchase_order_items (purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity)
VALUES (current_setting('test.order_id')::uuid, current_setting('test.material_id')::uuid, 3.5, 30.25, 105.875, 0);

DO $test$
DECLARE
  target_unit uuid; rejected boolean;
BEGIN
  FOREACH target_unit IN ARRAY ARRAY[current_setting('test.new_unit_id')::uuid, NULL::uuid] LOOP
    rejected := false;
    BEGIN
      UPDATE public.raw_materials SET name = 'Nombre no persistente', description = 'Descripcion no persistente', unit_of_measure_id = target_unit WHERE id = current_setting('test.material_id')::uuid;
      RAISE EXCEPTION 'Unit mutation unexpectedly succeeded' USING ERRCODE = 'PZ012';
    EXCEPTION WHEN check_violation THEN rejected := true;
      WHEN SQLSTATE 'PZ012' THEN rejected := false;
    END;
    IF NOT rejected THEN RAISE EXCEPTION 'A purchase_order_items reference did not block unit mutation' USING ERRCODE = 'PZ011'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id = current_setting('test.material_id')::uuid AND name = 'Materia prima en compra' AND description = 'Descripcion original' AND unit_of_measure_id = current_setting('test.old_unit_id')::uuid AND current_stock = 5.5 AND minimum_stock = 2 AND average_cost = 2.1 AND last_cost = 3.2) THEN
      RAISE EXCEPTION 'Rejected purchase order reference changed the raw material row';
    END IF;
  END LOOP;
END;
$test$;
ROLLBACK;
