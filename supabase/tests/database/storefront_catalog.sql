BEGIN;

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

DO $test$
BEGIN
  IF to_regclass('public.storefront_products') IS NULL THEN
    RAISE EXCEPTION 'storefront_products table does not exist';
  END IF;
  IF NOT has_table_privilege('anon', 'public.storefront_products', 'SELECT') THEN
    RAISE EXCEPTION 'anon can not read storefront_products';
  END IF;
  IF has_table_privilege('anon', 'public.storefront_products', 'INSERT') THEN
    RAISE EXCEPTION 'anon can insert storefront products';
  END IF;
END;
$test$;

SET LOCAL ROLE anon;

DO $test$
DECLARE
  visible_slugs text[];
  published_price numeric;
BEGIN
  SELECT array_agg(slug ORDER BY slug), max(price)
  INTO visible_slugs, published_price
  FROM public.storefront_products;

  IF visible_slugs IS DISTINCT FROM ARRAY['ficha-publicada']::text[] THEN
    RAISE EXCEPTION 'RLS exposed unexpected storefront products: %', visible_slugs;
  END IF;
  IF published_price IS DISTINCT FROM 149.90::numeric THEN
    RAISE EXCEPTION 'public storefront price is incorrect: %', published_price;
  END IF;
END;
$test$;

RESET ROLE;

UPDATE public.products
SET status = 'draft'
WHERE id = '8f100000-0000-0000-0000-000000000001';

DO $test$
BEGIN
  IF (SELECT is_published FROM public.storefront_products
      WHERE slug = 'ficha-publicada') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'deactivating a product did not unpublish its storefront product';
  END IF;
END;
$test$;

ROLLBACK;
