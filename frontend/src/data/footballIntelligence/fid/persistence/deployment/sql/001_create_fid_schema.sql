-- FID Sprint 31 test-only static migration. Manual review and manual application required.
DO $fid_role_verification$
DECLARE
  role_record record;
BEGIN
  SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit
  INTO role_record FROM pg_catalog.pg_roles WHERE rolname = 'fid_function_owner';
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Required database role fid_function_owner is missing'; END IF;
  IF role_record.rolcanlogin OR role_record.rolsuper OR role_record.rolcreatedb OR role_record.rolcreaterole OR role_record.rolreplication OR role_record.rolbypassrls OR role_record.rolinherit THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Required database role fid_function_owner has unsafe attributes';
  END IF;
END
$fid_role_verification$;
CREATE SCHEMA fid;
