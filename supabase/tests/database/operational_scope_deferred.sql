-- Verify the agreed single-organization, single-plant schema after migrations.
-- Keep operational warehouses and global authorization; defer hierarchy data.

BEGIN;

DO $test$
DECLARE
  admin_source text;
BEGIN
  IF to_regclass('public.warehouses') IS NULL THEN
    RAISE EXCEPTION 'Operational warehouses must remain available.';
  END IF;

  IF to_regclass('public.tenants') IS NULL
    OR to_regclass('public.tenant_members') IS NULL THEN
    RAISE EXCEPTION 'Existing tenant identity relations must remain intact.';
  END IF;

  IF to_regclass('public.organizations') IS NOT NULL
    OR to_regclass('public.plants') IS NOT NULL THEN
    RAISE EXCEPTION 'Organization and plant hierarchy must remain deferred.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'warehouses'
      AND column_name IN ('tenant_id', 'plant_id')
  ) THEN
    RAISE EXCEPTION 'Warehouses must not depend on organization or plant scopes.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'warehouses'
      AND (indexdef ILIKE '%tenant_id%' OR indexdef ILIKE '%plant_id%')
  ) THEN
    RAISE EXCEPTION 'Warehouse scope indexes must be removed.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.warehouses'::regclass
      AND (pg_get_constraintdef(oid) ILIKE '%tenant_id%'
        OR pg_get_constraintdef(oid) ILIKE '%plant_id%')
  ) THEN
    RAISE EXCEPTION 'Warehouse scope constraints must be removed.';
  END IF;

  SELECT pg_get_functiondef('public.is_admin(uuid)'::regprocedure)
  INTO admin_source;

  IF admin_source NOT LIKE '%public.user_roles%'
    OR admin_source NOT LIKE '%role = ''admin''%'
    OR admin_source LIKE '%tenant_members%' THEN
    RAISE EXCEPTION 'Global authorization must continue to use user_roles.';
  END IF;
END;
$test$;

ROLLBACK;
