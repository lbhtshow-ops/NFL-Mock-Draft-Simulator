WITH role_oids AS (
  SELECT (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='postgres') postgres_oid,(SELECT oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner') owner_oid,(SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role') service_oid,(SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon') anon_oid,(SELECT oid FROM pg_catalog.pg_roles WHERE rolname='authenticated') authenticated_oid
), targets AS (
  SELECT r.*,(SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='fid') schema_oid,pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')::oid function_oid FROM role_oids r
), governed_tables(table_name,owner_privileges) AS (
  VALUES ('fid_record_revisions',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_idempotency',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_batches',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_batch_operations',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_effect_receipts',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_audit_events',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_migrations',ARRAY[]::text[])
), privileges(privilege_name) AS (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')),
table_checks AS (
  SELECT p.privilege_name=ANY(g.owner_privileges) expected_owner,COALESCE(pg_catalog.has_table_privilege(t.owner_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) observed_owner,
    COALESCE(pg_catalog.has_table_privilege(t.service_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR COALESCE(pg_catalog.has_table_privilege(t.anon_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR COALESCE(pg_catalog.has_table_privilege(t.authenticated_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) runtime_expansion
  FROM targets t CROSS JOIN governed_tables g CROSS JOIN privileges p
), facts AS (
  SELECT CURRENT_USER='postgres' AND SESSION_USER='postgres' identity_exact,pg_catalog.current_setting('server_version_num')::integer=170006 version_exact,
    t.postgres_oid IS NOT NULL AND t.owner_oid IS NOT NULL AND t.service_oid IS NOT NULL AND t.anon_oid IS NOT NULL AND t.authenticated_oid IS NOT NULL AND t.schema_oid IS NOT NULL AND t.function_oid IS NOT NULL targets_resolved,
    COALESCE((SELECT m.admin_option FROM pg_catalog.pg_auth_members m WHERE m.roleid=t.owner_oid AND m.member=t.postgres_oid),false) admin_true,
    COALESCE((SELECT NOT m.inherit_option FROM pg_catalog.pg_auth_members m WHERE m.roleid=t.owner_oid AND m.member=t.postgres_oid),false) inherit_false,
    COALESCE(pg_catalog.pg_has_role(t.postgres_oid,t.owner_oid,'SET'),false) set_true,
    COALESCE(pg_catalog.has_schema_privilege(t.owner_oid,t.schema_oid,'USAGE'),false) usage_true,
    COALESCE(pg_catalog.has_schema_privilege(t.owner_oid,t.schema_oid,'CREATE'),false) create_true,
    COALESCE(NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=t.owner_oid AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)),false) restricted_exact,
    COALESCE((SELECT pg_catalog.bool_and(expected_owner=observed_owner) FROM table_checks),false) owner_table_exact,
    COALESCE(NOT EXISTS(SELECT 1 FROM table_checks WHERE runtime_expansion),false) runtime_tables_no_expansion,
    COALESCE(pg_catalog.has_schema_privilege(t.service_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.service_oid,t.schema_oid,'CREATE') AND NOT pg_catalog.has_schema_privilege(t.anon_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.anon_oid,t.schema_oid,'CREATE') AND NOT pg_catalog.has_schema_privilege(t.authenticated_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.authenticated_oid,t.schema_oid,'CREATE'),false) runtime_schema_exact,
    COALESCE(pg_catalog.has_function_privilege(t.owner_oid,t.function_oid,'EXECUTE') AND pg_catalog.has_function_privilege(t.service_oid,t.function_oid,'EXECUTE') AND NOT pg_catalog.has_function_privilege(t.anon_oid,t.function_oid,'EXECUTE') AND NOT pg_catalog.has_function_privilege(t.authenticated_oid,t.function_oid,'EXECUTE'),false) function_roles_exact,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>t.schema_oid AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND COALESCE(pg_catalog.has_schema_privilege(t.owner_oid,n.oid,'CREATE'),false)) no_other_create,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE n.oid=t.schema_oid AND acl.grantee=0 AND acl.privilege_type IN ('USAGE','CREATE')) AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) acl WHERE c.relnamespace=t.schema_oid AND c.relkind='r' AND acl.grantee=0) AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) acl WHERE p.oid=t.function_oid AND acl.grantee=0 AND acl.privilege_type='EXECUTE') public_no_expansion,
    pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.pronamespace=t.schema_oid AND p.proname='fid_execute_prospect_identifier_issuance_transaction') AND NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') AND (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)=1 AND EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) migration_state_exact
  FROM targets t
)
SELECT CASE
  WHEN NOT identity_exact OR NOT version_exact OR NOT targets_resolved THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED'
  WHEN NOT no_other_create OR NOT runtime_tables_no_expansion OR NOT public_no_expansion OR NOT runtime_schema_exact OR NOT function_roles_exact THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_UNEXPECTED_PRIVILEGE_EXPANSION'
  WHEN NOT admin_true OR NOT inherit_false OR NOT usage_true OR NOT restricted_exact OR NOT owner_table_exact OR NOT migration_state_exact THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT'
  WHEN NOT set_true AND NOT create_true THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_NOT_APPLIED'
  WHEN set_true AND create_true THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED'
  WHEN set_true<>create_true THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PARTIALLY_APPLIED'
  ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED' END classification,
  identity_exact,version_exact,targets_resolved,admin_true,inherit_false,set_true,usage_true,create_true,restricted_exact,owner_table_exact,runtime_tables_no_expansion,runtime_schema_exact,function_roles_exact,no_other_create,public_no_expansion,migration_state_exact
FROM facts;
