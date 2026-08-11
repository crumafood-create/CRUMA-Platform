BEGIN;

DO $test$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*)
  INTO bad_count
  FROM (
    VALUES
      ('product_families', 'category_id', 'NO'),
      ('product_families', 'updated_at', 'NO'),
      ('product_families', 'deleted_at', 'YES'),
      ('flavors', 'is_active', 'NO'),
      ('flavors', 'updated_at', 'NO'),
      ('flavors', 'deleted_at', 'YES'),
      ('units_of_measure', 'description', 'YES'),
      ('units_of_measure', 'deleted_at', 'YES')
  ) AS expected(table_name, column_name, is_nullable)
  LEFT JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = expected.table_name
   AND actual.column_name = expected.column_name
  WHERE actual.column_name IS NULL
     OR actual.is_nullable <> expected.is_nullable;

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'Expected catalog columns/nullability do not match schema contract';
  END IF;
END;
$test$;

DO $test$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flavors'
      AND column_name = 'family_id'
  ) THEN
    RAISE EXCEPTION 'flavors.family_id must not exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'preparation_types'
      AND column_name IN ('category_id', 'deleted_at')
  ) THEN
    RAISE EXCEPTION 'preparation_types must remain a global catalog';
  END IF;
END;
$test$;

DO $test$
DECLARE
  missing_constraints integer;
BEGIN
  SELECT count(*)
  INTO missing_constraints
  FROM (
    VALUES
      ('product_families_category_id_fkey'),
      ('products_family_id_fkey'),
      ('product_families_id_category_id_key'),
      ('products_family_category_fkey')
  ) AS expected(conname)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint actual
    WHERE actual.conname = expected.conname
  );

  IF missing_constraints <> 0 THEN
    RAISE EXCEPTION 'Required product family constraints are missing';
  END IF;
END;
$test$;

DO $test$
DECLARE
  category_a uuid := gen_random_uuid();
  category_b uuid := gen_random_uuid();
  family_a uuid := gen_random_uuid();
  suffix text := replace(gen_random_uuid()::text, '-', '');
BEGIN
  INSERT INTO public.categories (id, slug, name)
  VALUES
    (category_a, 'schema-a-' || suffix, 'Schema Contract A'),
    (category_b, 'schema-b-' || suffix, 'Schema Contract B');

  INSERT INTO public.product_families (
    id, category_id, slug, name
  )
  VALUES (
    family_a, category_a, 'schema-family-' || suffix, 'Schema Contract Family'
  );

  INSERT INTO public.products (
    id, slug, name, category_id, family_id
  )
  VALUES (
    gen_random_uuid(), 'schema-valid-' || suffix, 'Schema Valid',
    category_a, family_a
  );

  BEGIN
    INSERT INTO public.products (
      id, slug, name, category_id, family_id
    )
    VALUES (
      gen_random_uuid(), 'schema-invalid-' || suffix, 'Schema Invalid',
      category_b, family_a
    );

    RAISE EXCEPTION 'Mismatched product category/family was unexpectedly accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.products (
      id, slug, name, category_id, family_id
    )
    VALUES (
      gen_random_uuid(), 'schema-partial-' || suffix, 'Schema Partial',
      category_a, NULL
    );

    RAISE EXCEPTION 'Partial category/family pair was unexpectedly accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.product_families (
      id, slug, name, category_id
    )
    VALUES (
      gen_random_uuid(), 'schema-null-category-' || suffix,
      'Schema Null Category', NULL
    );

    RAISE EXCEPTION 'product_families.category_id unexpectedly accepted NULL';
  EXCEPTION
    WHEN not_null_violation THEN
      NULL;
  END;
END;
$test$;

ROLLBACK;
