-- Remove table capabilities that are not governed by row-level security.
-- CRUD privileges remain unchanged and continue to be controlled by RLS.

REVOKE TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- Prevent future tables created by postgres from restoring these grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER
ON TABLES
FROM anon, authenticated;
