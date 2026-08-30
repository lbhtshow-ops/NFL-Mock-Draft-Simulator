WITH facts AS (
  SELECT CURRENT_USER='postgres' AND SESSION_USER='postgres' AS identity_exact,
    EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner') AND EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='fid') AS target_exists,
    COALESCE((SELECT m.admin_option FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.roleid JOIN pg_catalog.pg_roles u ON u.oid=m.member WHERE r.rolname='fid_function_owner' AND u.rolname='postgres'),false) AS admin_true,
    COALESCE((SELECT NOT m.inherit_option FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.roleid JOIN pg_catalog.pg_roles u ON u.oid=m.member WHERE r.rolname='fid_function_owner' AND u.rolname='postgres'),false) AS inherit_false,
    COALESCE(pg_catalog.pg_has_role('postgres','fid_function_owner','SET'),false) AS set_true,
    COALESCE(pg_catalog.has_schema_privilege('fid_function_owner','fid','USAGE'),false) AS usage_true,
    COALESCE(pg_catalog.has_schema_privilege('fid_function_owner','fid','CREATE'),false) AS create_true,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname<>'fid' AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND pg_catalog.has_schema_privilege('fid_function_owner',n.oid,'CREATE')) AS no_other_create,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner' AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)) AS restricted_exact,
    pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction') AND NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') AND (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)=1 AND EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) AS migration_014_absent
)
SELECT CASE
  WHEN NOT identity_exact OR NOT target_exists THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED'
  WHEN NOT admin_true OR NOT inherit_false OR NOT usage_true OR NOT restricted_exact OR NOT migration_014_absent THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT'
  WHEN NOT no_other_create THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_UNEXPECTED_PRIVILEGE_EXPANSION'
  WHEN NOT set_true AND NOT create_true THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_NOT_APPLIED'
  WHEN set_true AND create_true THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED'
  WHEN set_true <> create_true THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PARTIALLY_APPLIED'
  ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED' END AS classification,
  identity_exact, target_exists, admin_true, inherit_false, set_true, usage_true, create_true, no_other_create, restricted_exact, migration_014_absent
FROM facts;
