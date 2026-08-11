BEGIN;

DO $test$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*)
  INTO bad_count
  FROM (
    SELECT count(*) AS actual, 1 AS expected
    FROM public.categories
    WHERE slug = 'seed-products'

    UNION ALL

    SELECT count(*), 1
    FROM public.product_families
    WHERE slug = 'seed-family'

    UNION ALL

    SELECT count(*), 1
    FROM public.flavors
    WHERE slug = 'seed-flavor'

    UNION ALL

    SELECT count(*), 1
    FROM public.preparation_types
    WHERE slug = 'seed-preparation'

    UNION ALL

    SELECT count(*), 1
    FROM public.units_of_measure
    WHERE code = 'SEED'

    UNION ALL

    SELECT count(*), 1
    FROM public.products
    WHERE slug = 'seed-test-product'

    UNION ALL

    SELECT count(*), 0
    FROM public.products
    WHERE slug = 'seed-local-product'
  ) AS checks
  WHERE actual <> expected;

  IF bad_count <> 0 THEN
    RAISE EXCEPTION
      'Test seed is not deterministic or environment isolation failed';
  END IF;
END;
$test$;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.categories c
      ON c.id = p.category_id
    JOIN public.product_families pf
      ON pf.id = p.family_id
    JOIN public.flavors f
      ON f.id = p.flavor_id
    JOIN public.preparation_types pt
      ON pt.id = p.preparation_type_id
    JOIN public.units_of_measure u
      ON u.id = p.unit_of_measure_id
    WHERE p.slug = 'seed-test-product'
      AND p.status = 'draft'
      AND p.is_active IS TRUE
      AND c.slug = 'seed-products'
      AND pf.slug = 'seed-family'
      AND pf.category_id = p.category_id
      AND f.slug = 'seed-flavor'
      AND pt.slug = 'seed-preparation'
      AND u.code = 'SEED'
  ) THEN
    RAISE EXCEPTION
      'Test product does not satisfy the canonical seed contract';
  END IF;
END;
$test$;

ROLLBACK;
