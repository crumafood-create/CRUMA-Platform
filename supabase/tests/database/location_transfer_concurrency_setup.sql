BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('ed000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'location-transfer-race@example.test', now(), now());
INSERT INTO public.profiles (id, full_name, email, role) VALUES
  ('ed000000-0000-4000-8000-000000000001', 'Location Transfer Race Admin', 'location-transfer-race@example.test', 'admin');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('ed000000-0000-4000-8000-000000000001', 'admin');

INSERT INTO public.inventory_locations (id, slug, name, zone, location_use, storage_condition, is_active) VALUES
  ('ed100000-0000-4000-8000-000000000001', 'location-transfer-source', 'Location Transfer Source', 'REFRIGERATOR', 'raw_material', 'refrigerated', true),
  ('ed100000-0000-4000-8000-000000000002', 'location-transfer-destination', 'Location Transfer Destination', 'REFRIGERATOR', 'raw_material', 'refrigerated', true);
INSERT INTO public.units_of_measure (id, name, code) VALUES
  ('ed200000-0000-4000-8000-000000000001', 'Location transfer test kg', 'ed-race-kg');
INSERT INTO public.raw_materials (
  id, slug, name, internal_code, unit_of_measure_id, current_stock,
  average_cost, last_cost, required_storage_condition, default_storage_use,
  default_inventory_location_id
) VALUES (
  'ed300000-0000-4000-8000-000000000001', 'location-transfer-cheese', 'Location transfer cheese',
  'ED-LOCATION-TRANSFER-CHEESE', 'ed200000-0000-4000-8000-000000000001', 0.5000,
  20, 20, 'refrigerated', 'raw_material', 'ed100000-0000-4000-8000-000000000001'
);
INSERT INTO public.raw_material_lots (
  id, raw_material_id, lot_number, quantity, unit_cost, remaining_value,
  status, inventory_location_id, storage_condition
) VALUES (
  'ed400000-0000-4000-8000-000000000001', 'ed300000-0000-4000-8000-000000000001',
  'LOCATION-TRANSFER-RACE-LOT', 0.5000, 20, 10, 'available',
  'ed100000-0000-4000-8000-000000000001', 'refrigerated'
);

COMMIT;
