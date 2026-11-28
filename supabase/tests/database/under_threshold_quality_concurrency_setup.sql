INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('f9100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'under-threshold-a@example.test', now(), now()),
  ('f9100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'under-threshold-b@example.test', now(), now());
INSERT INTO public.profiles (id, full_name, email, role) VALUES
  ('f9100000-0000-4000-8000-000000000001', 'Quality Admin A', 'under-threshold-a@example.test', 'admin'),
  ('f9100000-0000-4000-8000-000000000002', 'Quality Admin B', 'under-threshold-b@example.test', 'admin');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('f9100000-0000-4000-8000-000000000001', 'admin'),
  ('f9100000-0000-4000-8000-000000000002', 'admin');
INSERT INTO public.warehouses (id, code, name)
VALUES ('f9200000-0000-4000-8000-000000000001', 'QA-RACE', 'Quality Race Warehouse');
INSERT INTO public.inventory_locations (id, slug, name, zone, is_active, location_use, storage_condition)
VALUES ('f9300000-0000-4000-8000-000000000001', 'qa-race-freezer', 'Quality Race Freezer', 'FREEZER', true, 'finished_product', 'frozen');
INSERT INTO public.products (id, slug, internal_code, name, status)
VALUES ('f9400000-0000-4000-8000-000000000001', 'under-threshold-race-product', 'QA-RACE', 'Under Threshold Race Product', 'active');
INSERT INTO public.recipes (id, product_id, name, is_active)
VALUES ('f9500000-0000-4000-8000-000000000001', 'f9400000-0000-4000-8000-000000000001', 'Under Threshold Race Recipe', true);
INSERT INTO public.production_orders (id, production_number, recipe_id, production_status, planned_quantity, produced_quantity, completed_at)
VALUES ('f9600000-0000-4000-8000-000000000001', 'QA-RACE-ORDER', 'f9500000-0000-4000-8000-000000000001', 'completed', 2, 2, now());
INSERT INTO public.production_outputs (id, production_order_id, product_id, quantity_produced, quality_status)
VALUES ('f9700000-0000-4000-8000-000000000001', 'f9600000-0000-4000-8000-000000000001', 'f9400000-0000-4000-8000-000000000001', 2, 'released');
INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id, production_output_id, expiration_date,
  initial_quantity, quantity, status, warehouse_id, inventory_location_id
) VALUES (
  'f9800000-0000-4000-8000-000000000001', 'f9400000-0000-4000-8000-000000000001', 'QA-RACE-LOT',
  'f9600000-0000-4000-8000-000000000001', 'f9700000-0000-4000-8000-000000000001', CURRENT_DATE + 30,
  2, 0, 'available', 'f9200000-0000-4000-8000-000000000001', 'f9300000-0000-4000-8000-000000000001'
);
INSERT INTO public.product_lot_storage_balances (
  product_lot_id, fresh_quantity, raw_frozen_quantity, freezing_quantity,
  quality_sampling_pending_quantity, quality_sampling_reserved_quantity, frozen_location_id
) VALUES (
  'f9800000-0000-4000-8000-000000000001', 0, 0, 0, 2, 0, 'f9300000-0000-4000-8000-000000000001'
);
