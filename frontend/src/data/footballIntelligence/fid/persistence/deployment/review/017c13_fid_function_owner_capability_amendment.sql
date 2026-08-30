-- UNAPPLIED. Project ahmorpzcaapvoymiqlkv; DEDICATED_NON_PRODUCTION_TEST only.
-- Authorized executor and required CURRENT_USER/SESSION_USER: postgres.
BEGIN;

DO $fid_capability_before$
DECLARE
  v_owner pg_catalog.pg_roles%ROWTYPE;
  v_membership pg_catalog.pg_auth_members%ROWTYPE;
BEGIN
  IF CURRENT_USER <> 'postgres' OR SESSION_USER <> 'postgres' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_IDENTITY_MISMATCH';
  END IF;
  IF pg_catalog.current_setting('server_version_num')::integer <> 170006 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_POSTGRESQL_VERSION_MISMATCH';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'fid') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_SCHEMA_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_DEPLOYMENT_ROLE_MISSING';
  END IF;
  SELECT * INTO v_owner FROM pg_catalog.pg_roles WHERE rolname = 'fid_function_owner';
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_OWNER_ROLE_MISSING'; END IF;
  IF v_owner.rolcanlogin OR v_owner.rolsuper OR v_owner.rolcreatedb OR v_owner.rolcreaterole OR
     v_owner.rolreplication OR v_owner.rolbypassrls OR v_owner.rolinherit THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_OWNER_ATTRIBUTES_MISMATCH';
  END IF;
  SELECT membership.* INTO v_membership
  FROM pg_catalog.pg_auth_members AS membership
  JOIN pg_catalog.pg_roles AS granted_role ON granted_role.oid = membership.roleid
  JOIN pg_catalog.pg_roles AS member_role ON member_role.oid = membership.member
  WHERE granted_role.rolname = 'fid_function_owner' AND member_role.rolname = 'postgres';
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_MEMBERSHIP_MISSING'; END IF;
  IF NOT v_membership.admin_option OR v_membership.inherit_option OR v_membership.set_option THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_MEMBERSHIP_BEFORE_STATE_MISMATCH';
  END IF;
  IF NOT pg_catalog.has_schema_privilege('postgres', 'fid', 'USAGE') OR
     NOT pg_catalog.has_schema_privilege('postgres', 'fid', 'CREATE') OR
     NOT pg_catalog.has_schema_privilege('fid_function_owner', 'fid', 'USAGE') OR
     pg_catalog.has_schema_privilege('fid_function_owner', 'fid', 'CREATE') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_SCHEMA_BEFORE_STATE_MISMATCH';
  END IF;
  IF pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL OR
     pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL OR
     pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL OR
     EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction') OR
     EXISTS (SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') OR
     (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations) <> 1 OR
     NOT EXISTS (SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_MIGRATION_STATE_MISMATCH';
  END IF;
END
$fid_capability_before$;

GRANT CREATE ON SCHEMA fid TO fid_function_owner;
GRANT fid_function_owner TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET TRUE;

DO $fid_capability_after$
DECLARE
  v_owner pg_catalog.pg_roles%ROWTYPE;
  v_membership pg_catalog.pg_auth_members%ROWTYPE;
BEGIN
  SELECT * INTO STRICT v_owner FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner';
  SELECT membership.* INTO STRICT v_membership FROM pg_catalog.pg_auth_members membership
  JOIN pg_catalog.pg_roles granted_role ON granted_role.oid=membership.roleid
  JOIN pg_catalog.pg_roles member_role ON member_role.oid=membership.member
  WHERE granted_role.rolname='fid_function_owner' AND member_role.rolname='postgres';
  IF v_owner.rolcanlogin OR v_owner.rolsuper OR v_owner.rolcreatedb OR v_owner.rolcreaterole OR v_owner.rolreplication OR v_owner.rolbypassrls OR v_owner.rolinherit OR
     NOT v_membership.admin_option OR v_membership.inherit_option OR NOT v_membership.set_option OR
     NOT pg_catalog.pg_has_role('postgres','fid_function_owner','SET') OR
     NOT pg_catalog.pg_has_role('postgres','fid_function_owner','MEMBER WITH ADMIN OPTION') OR
     NOT pg_catalog.has_schema_privilege('fid_function_owner','fid','USAGE') OR
     NOT pg_catalog.has_schema_privilege('fid_function_owner','fid','CREATE') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_AFTER_STATE_MISMATCH';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname <> 'fid' AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema' AND pg_catalog.has_schema_privilege('fid_function_owner',n.oid,'CREATE')) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_UNEXPECTED_SCHEMA_CREATE';
  END IF;
  IF pg_catalog.has_schema_privilege('service_role','fid','CREATE') OR pg_catalog.has_schema_privilege('anon','fid','USAGE') OR pg_catalog.has_schema_privilege('anon','fid','CREATE') OR pg_catalog.has_schema_privilege('authenticated','fid','USAGE') OR pg_catalog.has_schema_privilege('authenticated','fid','CREATE') OR EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE n.nspname='fid' AND acl.grantee=0 AND acl.privilege_type IN ('USAGE','CREATE')) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_RUNTIME_BOUNDARY_MISMATCH';
  END IF;
  IF pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction') OR EXISTS (SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FID_CAPABILITY_AMENDMENT_MIGRATION_014_PRESENT';
  END IF;
END
$fid_capability_after$;

COMMIT;
