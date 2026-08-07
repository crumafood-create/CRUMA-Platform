BEGIN;

DO $test$
DECLARE
  unexpected_privileges integer;
BEGIN
  SELECT count(*)
  INTO unexpected_privileges
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN (
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER'
    );

  IF unexpected_privileges <> 0 THEN
    RAISE EXCEPTION
      'Found % dangerous table privileges for anon/authenticated',
      unexpected_privileges;
  END IF;
END;
$test$;

DO $test$
DECLARE
  unexpected_defaults integer;
BEGIN
  SELECT count(*)
  INTO unexpected_defaults
  FROM pg_default_acl AS default_acl
  JOIN pg_namespace AS namespace
    ON namespace.oid = default_acl.defaclnamespace
  CROSS JOIN LATERAL aclexplode(default_acl.defaclacl) AS privilege
  JOIN pg_roles AS grantee_role
    ON grantee_role.oid = privilege.grantee
  WHERE default_acl.defaclrole = 'postgres'::regrole
    AND namespace.nspname = 'public'
    AND default_acl.defaclobjtype = 'r'
    AND grantee_role.rolname IN ('anon', 'authenticated')
    AND privilege.privilege_type IN (
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER'
    );

  IF unexpected_defaults <> 0 THEN
    RAISE EXCEPTION
      'Found % dangerous default table privileges',
      unexpected_defaults;
  END IF;
END;
$test$;

DO $test$
BEGIN
  IF NOT has_table_privilege(
    'service_role',
    'public.products',
    'TRUNCATE'
  ) THEN
    RAISE EXCEPTION
      'service_role must retain its existing table privileges';
  END IF;
END;
$test$;

ROLLBACK;
