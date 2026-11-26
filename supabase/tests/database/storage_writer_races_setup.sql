INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('fd000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'storage-writer-1@example.test', now(), now()),
  ('fd000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'storage-writer-2@example.test', now(), now());
INSERT INTO public.profiles (id, full_name, email, role) VALUES
  ('fd000000-0000-4000-8000-000000000001', 'Storage Writer Admin 1', 'storage-writer-1@example.test', 'admin'),
  ('fd000000-0000-4000-8000-000000000002', 'Storage Writer Admin 2', 'storage-writer-2@example.test', 'admin');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('fd000000-0000-4000-8000-000000000001', 'admin'),
  ('fd000000-0000-4000-8000-000000000002', 'admin');

INSERT INTO public.warehouses (id, code, name)
VALUES ('fd100000-0000-4000-8000-000000000001', 'STORAGE-WRITER-RACE', 'Storage Writer Race Warehouse');
INSERT INTO public.inventory_locations (id, slug, name, zone, location_use, storage_condition) VALUES
  ('fd200000-0000-4000-8000-000000000001', 'storage-writer-source', 'Storage Writer Source', 'REFRIGERATOR', 'finished_product', 'refrigerated'),
  ('fd200000-0000-4000-8000-000000000002', 'storage-writer-freeze-policy-first', 'Storage Writer Freeze Policy First', 'FREEZER', 'finished_product', 'frozen'),
  ('fd200000-0000-4000-8000-000000000003', 'storage-writer-freeze-operation-first', 'Storage Writer Freeze Operation First', 'FREEZER', 'finished_product', 'frozen'),
  ('fd200000-0000-4000-8000-000000000004', 'storage-writer-wait-policy-first', 'Storage Writer Wait Policy First', 'FREEZER', 'finished_product', 'frozen'),
  ('fd200000-0000-4000-8000-000000000005', 'storage-writer-wait-operation-first', 'Storage Writer Wait Operation First', 'FREEZER', 'finished_product', 'frozen'),
  ('fd200000-0000-4000-8000-000000000006', 'storage-writer-default-policy-first', 'Storage Writer Default Policy First', 'REFRIGERATOR', 'raw_material', 'refrigerated'),
  ('fd200000-0000-4000-8000-000000000007', 'storage-writer-default-location-first', 'Storage Writer Default Location First', 'REFRIGERATOR', 'raw_material', 'refrigerated');

INSERT INTO public.preparation_types (id, slug, name)
VALUES ('fd300000-0000-4000-8000-000000000001', 'storage-writer-raw', 'Crudo');
INSERT INTO public.products (id, preparation_type_id, slug, internal_code, name, status)
VALUES ('fd400000-0000-4000-8000-000000000001', 'fd300000-0000-4000-8000-000000000001', 'storage-writer-race', 'STORAGE-WRITER-RACE', 'Storage Writer Race Product', 'active');
INSERT INTO public.recipes (id, product_id, name, is_active)
VALUES ('fd500000-0000-4000-8000-000000000001', 'fd400000-0000-4000-8000-000000000001', 'Storage Writer Race Recipe', true);
INSERT INTO public.production_orders (
  id, production_number, recipe_id, production_status,
  planned_quantity, produced_quantity, completed_at
) VALUES (
  'fd600000-0000-4000-8000-000000000001', 'STORAGE-WRITER-RACE-ORDER',
  'fd500000-0000-4000-8000-000000000001', 'completed', 40, 40, now()
);
INSERT INTO public.production_outputs (id, production_order_id, product_id, quantity_produced, quality_status)
VALUES ('fd710000-0000-4000-8000-000000000001', 'fd600000-0000-4000-8000-000000000001', 'fd400000-0000-4000-8000-000000000001', 40, 'released');
INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status,
  warehouse_id, inventory_location_id
) VALUES
  ('fd800000-0000-4000-8000-000000000001', 'fd400000-0000-4000-8000-000000000001', 'STORAGE-WRITER-FREEZE-POLICY', 'fd600000-0000-4000-8000-000000000001', 'fd710000-0000-4000-8000-000000000001', CURRENT_DATE + 90, 10, 10, 'available', 'fd100000-0000-4000-8000-000000000001', 'fd200000-0000-4000-8000-000000000001'),
  ('fd800000-0000-4000-8000-000000000002', 'fd400000-0000-4000-8000-000000000001', 'STORAGE-WRITER-FREEZE-OPERATION', 'fd600000-0000-4000-8000-000000000001', 'fd710000-0000-4000-8000-000000000001', CURRENT_DATE + 90, 10, 10, 'available', 'fd100000-0000-4000-8000-000000000001', 'fd200000-0000-4000-8000-000000000001'),
  ('fd800000-0000-4000-8000-000000000003', 'fd400000-0000-4000-8000-000000000001', 'STORAGE-WRITER-WAIT-POLICY', 'fd600000-0000-4000-8000-000000000001', 'fd710000-0000-4000-8000-000000000001', CURRENT_DATE + 90, 10, 0, 'depleted', 'fd100000-0000-4000-8000-000000000001', 'fd200000-0000-4000-8000-000000000001'),
  ('fd800000-0000-4000-8000-000000000004', 'fd400000-0000-4000-8000-000000000001', 'STORAGE-WRITER-WAIT-OPERATION', 'fd600000-0000-4000-8000-000000000001', 'fd710000-0000-4000-8000-000000000001', CURRENT_DATE + 90, 10, 0, 'depleted', 'fd100000-0000-4000-8000-000000000001', 'fd200000-0000-4000-8000-000000000001');
INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, refrigerated_wait_quantity,
  refrigerated_wait_location_id, freezing_quantity, freezing_location_id
) VALUES
  ('fd800000-0000-4000-8000-000000000001', 10, 0, NULL, 0, NULL),
  ('fd800000-0000-4000-8000-000000000002', 10, 0, NULL, 0, NULL),
  ('fd800000-0000-4000-8000-000000000003', 0, 10, 'fd200000-0000-4000-8000-000000000001', 0, NULL),
  ('fd800000-0000-4000-8000-000000000004', 0, 10, 'fd200000-0000-4000-8000-000000000001', 0, NULL);

INSERT INTO public.units_of_measure (id, name, code)
VALUES ('fd900000-0000-4000-8000-000000000001', 'Storage race kg', 'fd-storage-race-kg');
INSERT INTO public.raw_materials (
  id, slug, name, internal_code, unit_of_measure_id, current_stock,
  average_cost, last_cost, required_storage_condition, default_storage_use,
  default_inventory_location_id
) VALUES
  ('fda00000-0000-4000-8000-000000000001', 'storage-writer-default-policy-first', 'Storage writer default policy first', 'STORAGE-WRITER-DEFAULT-1', 'fd900000-0000-4000-8000-000000000001', 0, 0, 0, NULL, NULL, NULL),
  ('fda00000-0000-4000-8000-000000000002', 'storage-writer-default-location-first', 'Storage writer default location first', 'STORAGE-WRITER-DEFAULT-2', 'fd900000-0000-4000-8000-000000000001', 0, 0, 0, NULL, NULL, NULL);
