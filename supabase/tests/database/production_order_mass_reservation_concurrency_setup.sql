BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
VALUES (
  'e1800000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'mass-reservation-admin@example.test',
  now(),
  now()
);

INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  'e1800000-0000-4000-8000-000000000001',
  'Mass Reservation Admin',
  'mass-reservation-admin@example.test',
  'admin'
);

INSERT INTO public.user_roles (user_id, role)
VALUES ('e1800000-0000-4000-8000-000000000001', 'admin');

INSERT INTO public.units_of_measure (id, name, code)
VALUES
  ('e1810000-0000-4000-8000-000000000001', 'Kilogram', 'mass-reservation-kg'),
  ('e1810000-0000-4000-8000-000000000002', 'Piece', 'mass-reservation-piece');

INSERT INTO public.products (id, slug, internal_code, name, status, unit_of_measure_id)
VALUES
  (
    'e1820000-0000-4000-8000-000000000001',
    'mass-reservation-dough',
    'MRC-DOUGH',
    'Mass Reservation Dough',
    'active',
    'e1810000-0000-4000-8000-000000000001'
  ),
  (
    'e1820000-0000-4000-8000-000000000002',
    'mass-reservation-final',
    'MRC-FINAL',
    'Mass Reservation Final Product',
    'active',
    'e1810000-0000-4000-8000-000000000002'
  );

INSERT INTO public.raw_materials (
  id, slug, internal_code, name, unit_of_measure_id,
  current_stock, average_cost, last_cost, is_active
)
VALUES (
  'e1830000-0000-4000-8000-000000000001',
  'mass-reservation-flour',
  'MRC-FLOUR',
  'Mass Reservation Flour',
  'e1810000-0000-4000-8000-000000000001',
  0,
  0,
  0,
  true
);

INSERT INTO public.recipes (
  id, product_id, name, yield_quantity, unit_of_measure_id, is_active
)
VALUES
  (
    'e1840000-0000-4000-8000-000000000001',
    'e1820000-0000-4000-8000-000000000001',
    'Mass Reservation Dough Recipe',
    2,
    'e1810000-0000-4000-8000-000000000001',
    true
  ),
  (
    'e1840000-0000-4000-8000-000000000002',
    'e1820000-0000-4000-8000-000000000002',
    'Mass Reservation Final Recipe',
    100,
    'e1810000-0000-4000-8000-000000000002',
    true
  );

INSERT INTO public.recipe_items (id, recipe_id, raw_material_id, quantity)
VALUES (
  'e1850000-0000-4000-8000-000000000001',
  'e1840000-0000-4000-8000-000000000001',
  'e1830000-0000-4000-8000-000000000001',
  1
);

INSERT INTO public.recipe_items (id, recipe_id, product_id, quantity)
VALUES (
  'e1850000-0000-4000-8000-000000000002',
  'e1840000-0000-4000-8000-000000000002',
  'e1820000-0000-4000-8000-000000000001',
  2
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  'e1800000-0000-4000-8000-000000000001',
  true
);

SELECT public.create_production_order_draft(
  'e1840000-0000-4000-8000-000000000001',
  2,
  'Fixture mass lot order',
  'e1860000-0000-4000-8000-000000000001'
);

RESET ROLE;

UPDATE public.production_orders
SET production_status = 'completed',
  produced_quantity = 2,
  completed_at = now()
WHERE id = (
  SELECT production_order_id
  FROM public.production_order_lifecycle_operations
  WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000001'
);

INSERT INTO public.production_outputs (
  id, production_order_id, product_id, quantity_produced, quality_status
)
VALUES (
  'e1870000-0000-4000-8000-000000000001',
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000001'
  ),
  'e1820000-0000-4000-8000-000000000001',
  2,
  'released'
);

INSERT INTO public.product_lots (
  id, product_id, lot_number, production_order_id,
  production_output_id, initial_quantity, quantity, status
)
VALUES (
  'e1880000-0000-4000-8000-000000000001',
  'e1820000-0000-4000-8000-000000000001',
  'MRC-RACE-LOT',
  (
    SELECT production_order_id
    FROM public.production_order_lifecycle_operations
    WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000001'
  ),
  'e1870000-0000-4000-8000-000000000001',
  1.5,
  1.5,
  'available'
);

SET LOCAL ROLE authenticated;

SELECT public.create_production_order_draft(
  'e1840000-0000-4000-8000-000000000002',
  50,
  'Concurrent mass reservation A',
  'e1860000-0000-4000-8000-000000000002'
);
SELECT public.create_production_order_draft(
  'e1840000-0000-4000-8000-000000000002',
  50,
  'Concurrent mass reservation B',
  'e1860000-0000-4000-8000-000000000003'
);

SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id FROM public.production_order_lifecycle_operations
    WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000002'
  ),
  'release', NULL,
  'e1860000-0000-4000-8000-000000000004'
);
SELECT public.transition_production_order_lifecycle(
  (
    SELECT production_order_id FROM public.production_order_lifecycle_operations
    WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000003'
  ),
  'release', NULL,
  'e1860000-0000-4000-8000-000000000005'
);

COMMIT;
