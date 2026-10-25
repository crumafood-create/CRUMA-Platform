-- Proves the operational hierarchy can be stored without assigning
-- existing warehouses or changing who authorizes writes.
-- Run only against local Supabase:
-- pnpm db:test:operational-scope

BEGIN;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'scope-owner@example.test',
  now(),
  now()
);

INSERT INTO public.tenants (
  id,
  name,
  slug,
  owner_id
)
VALUES
  (
    'a2000000-0000-0000-0000-000000000001',
    'Scope Tenant',
    'scope-tenant',
    'a1000000-0000-0000-0000-000000000001'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'Other Scope Tenant',
    'other-scope-tenant',
    'a1000000-0000-0000-0000-000000000001'
  );

INSERT INTO public.organizations (
  id,
  tenant_id,
  code,
  name
)
VALUES
  (
    'a3000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000001',
    'ORG-A',
    'Organization A'
  ),
  (
    'a3000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'ORG-B',
    'Organization B'
  );

INSERT INTO public.plants (
  id,
  tenant_id,
  organization_id,
  code,
  name
)
VALUES
  (
    'a4000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000001',
    'a3000000-0000-0000-0000-000000000001',
    'PLT-A',
    'Plant A'
  ),
  (
    'a4000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'a3000000-0000-0000-0000-000000000002',
    'PLT-B',
    'Plant B'
  );

INSERT INTO public.warehouses (
  id,
  code,
  name
)
VALUES (
  'a5000000-0000-0000-0000-000000000001',
  'SCOPE-GLOBAL',
  'Unassigned Warehouse'
);

DO $test$
DECLARE
  tenant_id uuid;
  plant_id uuid;
  is_admin_source text;
  policy_count integer;
BEGIN
  SELECT warehouses.tenant_id, warehouses.plant_id
  INTO tenant_id, plant_id
  FROM public.warehouses
  WHERE warehouses.id = 'a5000000-0000-0000-0000-000000000001';

  IF tenant_id IS NOT NULL OR plant_id IS NOT NULL THEN
    RAISE EXCEPTION
      'new warehouse must remain global until explicitly assigned';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.warehouses
    WHERE warehouses.tenant_id IS NOT NULL
      OR warehouses.plant_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'existing warehouses must not be assigned by this migration';
  END IF;

  BEGIN
    INSERT INTO public.warehouses (
      id,
      code,
      name,
      tenant_id
    )
    VALUES (
      'a5000000-0000-0000-0000-000000000002',
      'SCOPE-PARTIAL',
      'Partial Scope Warehouse',
      'a2000000-0000-0000-0000-000000000001'
    );

    RAISE EXCEPTION 'one-sided warehouse scope was accepted';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.plants (
      id,
      tenant_id,
      organization_id,
      code,
      name
    )
    VALUES (
      'a4000000-0000-0000-0000-000000000003',
      'a2000000-0000-0000-0000-000000000001',
      'a3000000-0000-0000-0000-000000000002',
      'PLT-CROSS',
      'Cross Tenant Plant'
    );

    RAISE EXCEPTION 'cross-tenant plant reference was accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;

  INSERT INTO public.warehouses (
    id,
    code,
    name,
    tenant_id,
    plant_id
  )
  VALUES (
    'a5000000-0000-0000-0000-000000000003',
    'SCOPE-A',
    'Scoped Warehouse',
    'a2000000-0000-0000-0000-000000000001',
    'a4000000-0000-0000-0000-000000000001'
  );

  BEGIN
    INSERT INTO public.warehouses (
      id,
      code,
      name,
      tenant_id,
      plant_id
    )
    VALUES (
      'a5000000-0000-0000-0000-000000000004',
      'SCOPE-A',
      'Duplicate Scoped Warehouse',
      'a2000000-0000-0000-0000-000000000001',
      'a4000000-0000-0000-0000-000000000001'
    );

    RAISE EXCEPTION 'duplicate scoped warehouse code was accepted';
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.warehouses (
      id,
      code,
      name,
      tenant_id,
      plant_id
    )
    VALUES (
      'a5000000-0000-0000-0000-000000000006',
      'SCOPE-CROSS',
      'Cross Tenant Warehouse',
      'a2000000-0000-0000-0000-000000000001',
      'a4000000-0000-0000-0000-000000000002'
    );

    RAISE EXCEPTION 'cross-tenant warehouse reference was accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;

  INSERT INTO public.warehouses (
    id,
    code,
    name
  )
  VALUES (
    'a5000000-0000-0000-0000-000000000005',
    'SCOPE-A',
    'Global Code Warehouse'
  );

  SELECT pg_get_functiondef('public.is_admin(uuid)'::regprocedure)
  INTO is_admin_source;

  IF is_admin_source NOT LIKE '%public.user_roles%'
    OR is_admin_source NOT LIKE '%role = ''admin''%'
    OR is_admin_source LIKE '%tenant_members%'
  THEN
    RAISE EXCEPTION
      'is_admin must keep reading only user_roles.role = admin';
  END IF;

  SELECT count(*)
  INTO policy_count
  FROM pg_policy
  WHERE polrelid IN (
      'public.organizations'::regclass,
      'public.plants'::regclass,
      'public.warehouses'::regclass
    )
    AND polname IN (
      'organizations_admin_write',
      'plants_admin_write',
      'warehouses_admin_write'
    )
    AND pg_get_expr(polqual, polrelid)
      = 'is_admin(auth.uid())'
    AND pg_get_expr(polwithcheck, polrelid)
      = 'is_admin(auth.uid())';

  IF policy_count <> 3 THEN
    RAISE EXCEPTION
      'admin write policies must still use is_admin(auth.uid())';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polrelid IN (
        'public.organizations'::regclass,
        'public.plants'::regclass,
        'public.warehouses'::regclass
      )
      AND (
        pg_get_expr(polqual, polrelid) LIKE '%tenant_members%'
        OR pg_get_expr(polwithcheck, polrelid) LIKE '%tenant_members%'
      )
  ) THEN
    RAISE EXCEPTION
      'operational scope policies must not consult tenant_members';
  END IF;
END;
$test$;

ROLLBACK;
