INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('fe000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'storage-admin-1@example.test', now(), now()),
  ('fe000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'storage-admin-2@example.test', now(), now());
INSERT INTO public.profiles (id, full_name, email, role) VALUES
  ('fe000000-0000-4000-8000-000000000001', 'Storage Admin One', 'storage-admin-1@example.test', 'admin'),
  ('fe000000-0000-4000-8000-000000000002', 'Storage Admin Two', 'storage-admin-2@example.test', 'admin');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('fe000000-0000-4000-8000-000000000001', 'admin'),
  ('fe000000-0000-4000-8000-000000000002', 'admin');
INSERT INTO public.warehouses (id, code, name)
VALUES ('fe100000-0000-4000-8000-000000000001', 'STOR-RACE', 'Storage Race Warehouse');
INSERT INTO public.inventory_locations (id, slug, name)
VALUES ('fe200000-0000-4000-8000-000000000001', 'storage-race', 'Storage Race Location');
INSERT INTO public.inventory_locations (id, slug, name, zone, location_use, storage_condition)
VALUES ('fe200000-0000-4000-8000-000000000002', 'storage-race-freezer', 'Storage Race Freezer', 'FREEZER', 'finished_product', 'frozen');
INSERT INTO public.preparation_types (id, slug, name)
VALUES ('fe300000-0000-4000-8000-000000000001', 'storage-race-raw', 'Crudo');
INSERT INTO public.products (id, preparation_type_id, slug, internal_code, name, status)
VALUES ('fe400000-0000-4000-8000-000000000001', 'fe300000-0000-4000-8000-000000000001', 'storage-race', 'STOR-RACE', 'Storage Race Product', 'active');
INSERT INTO public.recipes (id, product_id, name, is_active)
VALUES ('fe500000-0000-4000-8000-000000000001', 'fe400000-0000-4000-8000-000000000001', 'Storage Race Recipe', true);
INSERT INTO public.production_orders (
  id, production_number, recipe_id, production_status,
  planned_quantity, produced_quantity, completed_at
) VALUES (
  'fe600000-0000-4000-8000-000000000001', 'STOR-RACE-ORDER',
  'fe500000-0000-4000-8000-000000000001', 'completed', 48, 48, now()
);
INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status
) VALUES (
  'fe700000-0000-4000-8000-000000000001',
  'fe600000-0000-4000-8000-000000000001',
  'fe400000-0000-4000-8000-000000000001', 48, 'released'
);
INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id,
  expiration_date, initial_quantity, quantity, status,
  warehouse_id, inventory_location_id
) VALUES (
  'fe800000-0000-4000-8000-000000000001',
  'fe400000-0000-4000-8000-000000000001', 'STOR-RACE-LOT',
  'fe600000-0000-4000-8000-000000000001',
  'fe700000-0000-4000-8000-000000000001', CURRENT_DATE + 90,
  48, 48, 'available', 'fe100000-0000-4000-8000-000000000001',
  'fe200000-0000-4000-8000-000000000001'
);
INSERT INTO public.inventory_movements (
  item_type, item_id, product_id, movement_type, quantity,
  reference_type, reference_id, warehouse_id, created_by, notes
) VALUES (
  'product', 'fe400000-0000-4000-8000-000000000001',
  'fe400000-0000-4000-8000-000000000001', 'entry', 48,
  'production_lot', 'fe800000-0000-4000-8000-000000000001',
  'fe100000-0000-4000-8000-000000000001',
  'fe000000-0000-4000-8000-000000000001', 'Storage race fixture'
);
INSERT INTO public.customers (id, customer_code, name)
VALUES ('fe900000-0000-4000-8000-000000000001', 'STOR-RACE', 'Storage Race Customer');
INSERT INTO public.sales_orders (
  id, order_number, customer_id, status, subtotal, total
) VALUES (
  'fea00000-0000-4000-8000-000000000001', 'STOR-RACE-SO',
  'fe900000-0000-4000-8000-000000000001', 'draft', 20, 20
);
INSERT INTO public.sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price, discount, total
) VALUES (
  'feb00000-0000-4000-8000-000000000001',
  'fea00000-0000-4000-8000-000000000001',
  'fe400000-0000-4000-8000-000000000001', 20, 1, 0, 20
);
