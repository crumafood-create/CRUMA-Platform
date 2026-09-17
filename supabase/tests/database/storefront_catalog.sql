BEGIN;

SELECT plan(5);

INSERT INTO public.products (id, name, slug)
VALUES
  ('8f100000-0000-0000-0000-000000000001', 'Ficha publicada', 'ficha-publicada'),
  ('8f100000-0000-0000-0000-000000000002', 'Ficha borrador', 'ficha-borrador');

INSERT INTO public.storefront_products (
  product_id, slug, name, short_description, category_slug, category_name,
  presentation, price, image_url, image_alt, is_published, published_at
)
VALUES
  (
    '8f100000-0000-0000-0000-000000000001', 'ficha-publicada', 'Ficha publicada',
    'Visible para visitantes.', 'tequenos', 'Tequeños', 'Caja con 12 piezas', 149.90,
    'https://poglpqvmbrfcvtuspvtx.supabase.co/storage/v1/object/public/products/publicada.jpg',
    'Ficha publicada', true, now() - interval '1 minute'
  ),
  (
    '8f100000-0000-0000-0000-000000000002', 'ficha-borrador', 'Ficha borrador',
    'No visible para visitantes.', 'tequenos', 'Tequeños', 'Caja con 12 piezas', 129.90,
    NULL, '', false, NULL
  );

SELECT has_table('public', 'storefront_products', 'existe la proyección pública');

SELECT ok(
  has_table_privilege('anon', 'public.storefront_products', 'SELECT'),
  'anon puede leer la proyección pública'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.storefront_products', 'INSERT'),
  'anon no puede insertar fichas'
);

SET LOCAL ROLE anon;

SELECT results_eq(
  $$ SELECT slug FROM public.storefront_products ORDER BY slug $$,
  ARRAY['ficha-publicada']::text[],
  'RLS oculta borradores a visitantes'
);

SELECT is(
  (SELECT price FROM public.storefront_products WHERE slug = 'ficha-publicada'),
  149.90::numeric,
  'la lectura pública conserva el precio autorizado'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
