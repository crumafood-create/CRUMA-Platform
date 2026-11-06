-- Keep the historical migration chain reproducible while deferring unused
-- organization and plant scopes for the single-organization, single-plant app.
-- Refuse to discard any rows or warehouse assignments if this migration runs
-- in an environment that already has them.
-- This migration requires 20261002140000_add_operational_scope_hierarchy.sql
-- to have run first; do not apply it directly to an environment missing those
-- historical tables. Supabase's migration runner provides the transaction.

LOCK TABLE public.organizations, public.plants, public.warehouses
  IN ACCESS EXCLUSIVE MODE;

DO $guard$
DECLARE
  has_scoped_rows boolean;
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.organizations)'
      INTO has_scoped_rows;
    IF has_scoped_rows THEN
      RAISE EXCEPTION
        'Cannot defer operational hierarchy while public.organizations contains rows.'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF to_regclass('public.plants') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.plants)'
      INTO has_scoped_rows;
    IF has_scoped_rows THEN
      RAISE EXCEPTION
        'Cannot defer operational hierarchy while public.plants contains rows.'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF to_regclass('public.warehouses') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'warehouses'
        AND column_name = 'tenant_id'
    ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.warehouses WHERE tenant_id IS NOT NULL)'
      INTO has_scoped_rows;
    IF has_scoped_rows THEN
      RAISE EXCEPTION
        'Cannot defer operational hierarchy while warehouses.tenant_id contains assignments.'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF to_regclass('public.warehouses') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'warehouses'
        AND column_name = 'plant_id'
    ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.warehouses WHERE plant_id IS NOT NULL)'
      INTO has_scoped_rows;
    IF has_scoped_rows THEN
      RAISE EXCEPTION
        'Cannot defer operational hierarchy while warehouses.plant_id contains assignments.'
        USING ERRCODE = '55000';
    END IF;
  END IF;
END;
$guard$;

DROP POLICY IF EXISTS organizations_admin_write ON public.organizations;
DROP POLICY IF EXISTS plants_admin_write ON public.plants;

ALTER TABLE public.warehouses
  DROP CONSTRAINT IF EXISTS warehouses_plant_scope_fkey,
  DROP CONSTRAINT IF EXISTS warehouses_scope_pair_check;

DROP INDEX IF EXISTS public.warehouses_scoped_code_unique;
DROP INDEX IF EXISTS public.warehouses_plant_idx;

ALTER TABLE public.warehouses
  DROP COLUMN IF EXISTS tenant_id,
  DROP COLUMN IF EXISTS plant_id;

DROP TABLE IF EXISTS public.plants;
DROP TABLE IF EXISTS public.organizations;
