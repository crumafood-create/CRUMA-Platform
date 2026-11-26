BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('ec000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'location-race-admin@example.test', now(), now());
INSERT INTO public.profiles (id, full_name, email, role) VALUES
  ('ec000000-0000-4000-8000-000000000001', 'Location Race Admin', 'location-race-admin@example.test', 'admin');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('ec000000-0000-4000-8000-000000000001', 'admin');

INSERT INTO public.warehouses (id, code, name) VALUES
  ('ec100000-0000-4000-8000-000000000001', 'LOC-RACE', 'Location Race Warehouse');

INSERT INTO public.inventory_locations (
  id, slug, name, zone, location_use, storage_condition, is_active
) VALUES
  ('ec200000-0000-4000-8000-000000000001', 'location-race-mass', 'Location Race Mass', 'REFRIGERATOR', 'prepared_ingredient', 'refrigerated', true),
  ('ec200000-0000-4000-8000-000000000002', 'location-race-finished', 'Location Race Finished', 'REFRIGERATOR', 'finished_product', 'refrigerated', true);

INSERT INTO public.units_of_measure (id, name, code) VALUES
  ('ec300000-0000-4000-8000-000000000001', 'Kilogram', 'loc-race-kg'),
  ('ec300000-0000-4000-8000-000000000002', 'Piece', 'loc-race-piece');

INSERT INTO public.preparation_types (id, slug, name) VALUES
  ('ec400000-0000-4000-8000-000000000001', 'location-race-raw', 'Crudo');

INSERT INTO public.products (id, preparation_type_id, slug, internal_code, name, status, unit_of_measure_id) VALUES
  ('ec500000-0000-4000-8000-000000000001', 'ec400000-0000-4000-8000-000000000001', 'location-race-mass-product', 'LOC-RACE-MASS', 'Location Race Mass', 'active', 'ec300000-0000-4000-8000-000000000001'),
  ('ec500000-0000-4000-8000-000000000002', 'ec400000-0000-4000-8000-000000000001', 'location-race-finished-product', 'LOC-RACE-FG', 'Location Race Finished Product', 'active', 'ec300000-0000-4000-8000-000000000002');

INSERT INTO public.recipes (id, product_id, name, yield_quantity, unit_of_measure_id, is_active) VALUES
  ('ec600000-0000-4000-8000-000000000001', 'ec500000-0000-4000-8000-000000000001', 'Location Race Mass Recipe', 2.15, 'ec300000-0000-4000-8000-000000000001', true),
  ('ec600000-0000-4000-8000-000000000002', 'ec500000-0000-4000-8000-000000000002', 'Location Race Finished Recipe', 4, 'ec300000-0000-4000-8000-000000000002', true);

INSERT INTO public.production_orders (
  id, production_number, recipe_id, production_status, planned_quantity,
  produced_quantity, completed_at
) VALUES
  ('ec700000-0000-4000-8000-000000000001', 'LOC-RACE-MASS-ORDER', 'ec600000-0000-4000-8000-000000000001', 'completed', 1, 1, now()),
  ('ec700000-0000-4000-8000-000000000002', 'LOC-RACE-FG-ORDER', 'ec600000-0000-4000-8000-000000000002', 'completed', 4, 4, now());

INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced,
  mass_quantity_produced, quality_status
) VALUES
  ('ec800000-0000-4000-8000-000000000001', 'ec700000-0000-4000-8000-000000000001', 'ec500000-0000-4000-8000-000000000001', 1, 2.15, 'pending'),
  ('ec800000-0000-4000-8000-000000000002', 'ec700000-0000-4000-8000-000000000002', 'ec500000-0000-4000-8000-000000000002', 4, NULL, 'pending');

INSERT INTO public.quality_inspections (
  id, production_order_id, production_output_id, inspector_id,
  subject_type, status, result, sampled_quantity,
  accepted_quantity, rejected_quantity
) VALUES
  ('ec900000-0000-4000-8000-000000000001', 'ec700000-0000-4000-8000-000000000001', 'ec800000-0000-4000-8000-000000000001', 'ec000000-0000-4000-8000-000000000001', 'production_output', 'passed', 'ok', 1, 1, 0),
  ('ec900000-0000-4000-8000-000000000002', 'ec700000-0000-4000-8000-000000000002', 'ec800000-0000-4000-8000-000000000002', 'ec000000-0000-4000-8000-000000000001', 'production_output', 'passed', 'ok', 1, 1, 0);

COMMIT;
