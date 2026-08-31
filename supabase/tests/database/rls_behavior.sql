BEGIN;

-- Test identities.
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
)
VALUES
  (
    '90000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'rls-admin@example.test',
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'rls-owner@example.test',
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'rls-member@example.test',
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'rls-outsider@example.test',
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'rls-profile-new@example.test',
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'rls-profile-other@example.test',
    now(),
    now()
  );

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role
)
VALUES
  (
    '90000000-0000-0000-0000-000000000001',
    'RLS Admin',
    'rls-admin@example.test',
    'admin'
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    'RLS Owner',
    'rls-owner@example.test',
    'client'
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    'RLS Member',
    'rls-member@example.test',
    'client'
  ),
  (
    '90000000-0000-0000-0000-000000000004',
    'RLS Outsider',
    'rls-outsider@example.test',
    'client'
  );

INSERT INTO public.user_roles (
  id,
  user_id,
  role
)
VALUES
  (
    '93000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    'admin'
  ),
  (
    '93000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000003',
    'customer'
  );

INSERT INTO public.products (
  id,
  slug,
  name,
  status,
  deleted_at
)
VALUES
  (
    '91000000-0000-0000-0000-000000000001',
    'rls-active-product',
    'RLS Active Product',
    'active',
    NULL
  ),
  (
    '91000000-0000-0000-0000-000000000002',
    'rls-draft-product',
    'RLS Draft Product',
    'draft',
    NULL
  ),
  (
    '91000000-0000-0000-0000-000000000003',
    'rls-deleted-product',
    'RLS Deleted Product',
    'active',
    now()
  );

INSERT INTO public.units_of_measure (
  id,
  name,
  code
)
VALUES
  (
    '94000000-0000-0000-0000-000000000001',
    'RLS Main Unit',
    'RLS-U1'
  ),
  (
    '94000000-0000-0000-0000-000000000004',
    'RLS Delete Unit',
    'RLS-U4'
  );

INSERT INTO public.tenants (
  id,
  name,
  slug,
  owner_id
)
VALUES
  (
    '92000000-0000-0000-0000-000000000001',
    'RLS Main Tenant',
    'rls-main-tenant',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    '92000000-0000-0000-0000-000000000002',
    'RLS Delete Tenant',
    'rls-delete-tenant',
    '90000000-0000-0000-0000-000000000002'
  );

INSERT INTO public.tenant_members (
  tenant_id,
  user_id,
  role
)
VALUES
  (
    '92000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000002',
    'owner'
  ),
  (
    '92000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000003',
    'member'
  ),
  (
    '92000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002',
    'owner'
  );

-- Anonymous users can only read active, non-deleted products.
SET LOCAL ROLE anon;

SELECT set_config(
  'request.jwt.claim.sub',
  '',
  true
);

DO $test$
DECLARE
  visible_products integer;
BEGIN
  SELECT count(*)
  INTO visible_products
  FROM public.products
  WHERE id IN (
    '91000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000002',
    '91000000-0000-0000-0000-000000000003'
  );

  IF visible_products <> 1 THEN
    RAISE EXCEPTION
      'anon expected 1 visible product, found %',
      visible_products;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE id = '91000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'anon cannot read the active product';
  END IF;
END;
$test$;

RESET ROLE;

-- A normal authenticated user cannot write products.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000003',
  true
);

DO $test$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.products
  SET name = 'Unexpected normal-user update'
  WHERE id = '91000000-0000-0000-0000-000000000001';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 0 THEN
    RAISE EXCEPTION
      'normal user unexpectedly updated % product rows',
      affected_rows;
  END IF;

  BEGIN
    INSERT INTO public.products (
      id,
      slug,
      name,
      status
    )
    VALUES (
      '91000000-0000-0000-0000-000000000004',
      'rls-normal-user-product',
      'Unexpected Normal User Product',
      'draft'
    );

    RAISE EXCEPTION 'normal user unexpectedly inserted a product';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  UPDATE public.units_of_measure
  SET name = 'Unexpected normal-user unit update'
  WHERE id = '94000000-0000-0000-0000-000000000001';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 0 THEN
    RAISE EXCEPTION
      'normal user unexpectedly updated % unit rows',
      affected_rows;
  END IF;

  DELETE FROM public.units_of_measure
  WHERE id = '94000000-0000-0000-0000-000000000004';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 0 THEN
    RAISE EXCEPTION
      'normal user unexpectedly deleted % unit rows',
      affected_rows;
  END IF;

  BEGIN
    INSERT INTO public.units_of_measure (id, name, code)
    VALUES (
      '94000000-0000-0000-0000-000000000002',
      'Unexpected Normal User Unit',
      'RLS-U2'
    );

    RAISE EXCEPTION 'normal user unexpectedly inserted a unit';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

-- An administrator can write products.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000001',
  true
);

DO $test$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.products
  SET name = 'RLS Active Product Updated By Admin'
  WHERE id = '91000000-0000-0000-0000-000000000001';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION
      'admin expected to update 1 product row, updated %',
      affected_rows;
  END IF;

  INSERT INTO public.products (
    id,
    slug,
    name,
    status
  )
  VALUES (
    '91000000-0000-0000-0000-000000000005',
    'rls-admin-product',
    'RLS Admin Product',
    'draft'
  );

  UPDATE public.units_of_measure
  SET name = 'RLS Main Unit Updated By Admin'
  WHERE id = '94000000-0000-0000-0000-000000000001';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION
      'admin expected to update 1 unit row, updated %',
      affected_rows;
  END IF;

  INSERT INTO public.units_of_measure (id, name, code)
  VALUES (
    '94000000-0000-0000-0000-000000000003',
    'RLS Admin Unit',
    'RLS-U3'
  );

  DELETE FROM public.units_of_measure
  WHERE id = '94000000-0000-0000-0000-000000000004';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION
      'admin expected to delete 1 unit row, deleted %',
      affected_rows;
  END IF;
END;
$test$;

RESET ROLE;

-- A user can read and update only their own profile.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000003',
  true
);

DO $test$
DECLARE
  own_profiles integer;
  other_profiles integer;
  affected_rows integer;
BEGIN
  SELECT count(*)
  INTO own_profiles
  FROM public.profiles
  WHERE id = '90000000-0000-0000-0000-000000000003';

  SELECT count(*)
  INTO other_profiles
  FROM public.profiles
  WHERE id = '90000000-0000-0000-0000-000000000002';

  IF own_profiles <> 1 OR other_profiles <> 0 THEN
    RAISE EXCEPTION
      'profile visibility mismatch: own %, other %',
      own_profiles,
      other_profiles;
  END IF;

  UPDATE public.profiles
  SET full_name = 'RLS Member Updated'
  WHERE id = '90000000-0000-0000-0000-000000000003';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION
      'user expected to update own profile, updated % rows',
      affected_rows;
  END IF;

  UPDATE public.profiles
  SET full_name = 'Unexpected Other Profile Update'
  WHERE id = '90000000-0000-0000-0000-000000000002';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 0 THEN
    RAISE EXCEPTION
      'user unexpectedly updated % other profiles',
      affected_rows;
  END IF;
END;
$test$;

RESET ROLE;

-- A user can insert their own profile but cannot insert another user's profile.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000005',
  true
);

DO $test$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role
  )
  VALUES (
    '90000000-0000-0000-0000-000000000005',
    'RLS New Profile',
    'rls-profile-new@example.test',
    'client'
  );

  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      role
    )
    VALUES (
      '90000000-0000-0000-0000-000000000006',
      'Unexpected Other Profile',
      'rls-profile-other@example.test',
      'client'
    );

    RAISE EXCEPTION 'user unexpectedly inserted another profile';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$test$;

RESET ROLE;

-- A normal user sees only their own roles.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000003',
  true
);

DO $test$
DECLARE
  visible_roles integer;
BEGIN
  SELECT count(*)
  INTO visible_roles
  FROM public.user_roles
  WHERE user_id IN (
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000003'
  );

  IF visible_roles <> 1 THEN
    RAISE EXCEPTION
      'normal user expected 1 visible role, found %',
      visible_roles;
  END IF;
END;
$test$;

RESET ROLE;

-- An administrator sees roles belonging to other users.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000001',
  true
);

DO $test$
DECLARE
  visible_roles integer;
BEGIN
  SELECT count(*)
  INTO visible_roles
  FROM public.user_roles
  WHERE user_id IN (
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000003'
  );

  IF visible_roles <> 2 THEN
    RAISE EXCEPTION
      'admin expected 2 visible roles, found %',
      visible_roles;
  END IF;
END;
$test$;

RESET ROLE;

-- A tenant member can read the tenant and only their own membership.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000003',
  true
);

DO $test$
DECLARE
  visible_tenants integer;
  visible_memberships integer;
BEGIN
  SELECT count(*)
  INTO visible_tenants
  FROM public.tenants
  WHERE id = '92000000-0000-0000-0000-000000000001';

  SELECT count(*)
  INTO visible_memberships
  FROM public.tenant_members
  WHERE tenant_id = '92000000-0000-0000-0000-000000000001';

  IF visible_tenants <> 1 THEN
    RAISE EXCEPTION
      'tenant member expected 1 visible tenant, found %',
      visible_tenants;
  END IF;

  IF visible_memberships <> 1 THEN
    RAISE EXCEPTION
      'tenant member expected 1 visible membership, found %',
      visible_memberships;
  END IF;
END;
$test$;

RESET ROLE;

-- An outsider cannot read the tenant or update it.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000004',
  true
);

DO $test$
DECLARE
  visible_tenants integer;
  affected_rows integer;
BEGIN
  SELECT count(*)
  INTO visible_tenants
  FROM public.tenants
  WHERE id = '92000000-0000-0000-0000-000000000001';

  IF visible_tenants <> 0 THEN
    RAISE EXCEPTION
      'outsider unexpectedly sees % tenant rows',
      visible_tenants;
  END IF;

  UPDATE public.tenants
  SET name = 'Unexpected Outsider Update'
  WHERE id = '92000000-0000-0000-0000-000000000001';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 0 THEN
    RAISE EXCEPTION
      'outsider unexpectedly updated % tenant rows',
      affected_rows;
  END IF;
END;
$test$;

RESET ROLE;

-- The owner can update, create and delete owned tenants.
SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000002',
  true
);

DO $test$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.tenants
  SET name = 'RLS Main Tenant Updated'
  WHERE id = '92000000-0000-0000-0000-000000000001';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION
      'owner expected to update 1 tenant row, updated %',
      affected_rows;
  END IF;

  INSERT INTO public.tenants (
    id,
    name,
    slug,
    owner_id
  )
  VALUES (
    '92000000-0000-0000-0000-000000000003',
    'RLS Owner Created Tenant',
    'rls-owner-created-tenant',
    '90000000-0000-0000-0000-000000000002'
  );

  BEGIN
    INSERT INTO public.tenants (
      id,
      name,
      slug,
      owner_id
    )
    VALUES (
      '92000000-0000-0000-0000-000000000004',
      'Unexpected Forged Tenant',
      'rls-forged-tenant',
      '90000000-0000-0000-0000-000000000003'
    );

    RAISE EXCEPTION 'owner unexpectedly forged another owner_id';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  DELETE FROM public.tenants
  WHERE id = '92000000-0000-0000-0000-000000000002';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION
      'owner expected to delete 1 tenant row, deleted %',
      affected_rows;
  END IF;
END;
$test$;

RESET ROLE;

-- Verify persistent outcomes as the database owner before rolling back.
DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE id = '91000000-0000-0000-0000-000000000005'
  ) THEN
    RAISE EXCEPTION 'admin product insert was not persisted';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = '90000000-0000-0000-0000-000000000005'
  ) THEN
    RAISE EXCEPTION 'own profile insert was not persisted';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = '92000000-0000-0000-0000-000000000003'
  ) THEN
    RAISE EXCEPTION 'owner tenant insert was not persisted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = '92000000-0000-0000-0000-000000000004'
  ) THEN
    RAISE EXCEPTION 'forged tenant insert was persisted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = '92000000-0000-0000-0000-000000000002'
  ) THEN
    RAISE EXCEPTION 'owner tenant delete was not persisted';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.units_of_measure
    WHERE id = '94000000-0000-0000-0000-000000000001'
      AND name = 'RLS Main Unit Updated By Admin'
  ) THEN
    RAISE EXCEPTION 'admin unit update was not persisted';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.units_of_measure
    WHERE id = '94000000-0000-0000-0000-000000000003'
  ) THEN
    RAISE EXCEPTION 'admin unit insert was not persisted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.units_of_measure
    WHERE id IN (
      '94000000-0000-0000-0000-000000000002',
      '94000000-0000-0000-0000-000000000004'
    )
  ) THEN
    RAISE EXCEPTION 'unit RLS write outcomes are inconsistent';
  END IF;
END;
$test$;

ROLLBACK;
