WITH role_oids AS (
  SELECT (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='postgres') AS postgres_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner') AS owner_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role') AS service_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon') AS anon_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='authenticated') AS authenticated_oid
), targets AS (
  SELECT r.*, (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='fid') AS schema_oid,
    pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')::oid AS function_oid
  FROM role_oids r
), membership AS (
  SELECT m.admin_option,m.inherit_option,m.set_option FROM targets t JOIN pg_catalog.pg_auth_members m ON m.roleid=t.owner_oid AND m.member=t.postgres_oid
), authority AS (
  SELECT t.*, COALESCE(n.nspowner=t.postgres_oid OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE acl.grantee=t.postgres_oid AND acl.privilege_type='CREATE' AND acl.is_grantable),false) AS schema_grant_authority
  FROM targets t LEFT JOIN pg_catalog.pg_namespace n ON n.oid=t.schema_oid
), governed_tables(table_name,owner_privileges) AS (
  VALUES ('fid_record_revisions',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_idempotency',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_batches',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_batch_operations',ARRAY['SELECT','INSERT','UPDATE']::text[]),('fid_persistence_effect_receipts',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_audit_events',ARRAY['SELECT','INSERT']::text[]),('fid_persistence_migrations',ARRAY[]::text[])
), privileges(privilege_name) AS (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')),
table_checks AS (
  SELECT g.table_name,p.privilege_name,p.privilege_name=ANY(g.owner_privileges) expected_owner,
    COALESCE(pg_catalog.has_table_privilege(t.owner_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) observed_owner,
    COALESCE(pg_catalog.has_table_privilege(t.service_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR COALESCE(pg_catalog.has_table_privilege(t.anon_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) OR COALESCE(pg_catalog.has_table_privilege(t.authenticated_oid,pg_catalog.to_regclass('fid.'||g.table_name),p.privilege_name),false) runtime_has_privilege
  FROM targets t CROSS JOIN governed_tables g CROSS JOIN privileges p
), facts AS (
  SELECT CURRENT_USER='postgres' AND SESSION_USER='postgres' AS identity_exact,pg_catalog.current_setting('server_version_num')::integer=170006 AS version_exact,
    t.postgres_oid IS NOT NULL AND t.owner_oid IS NOT NULL AND t.service_oid IS NOT NULL AND t.anon_oid IS NOT NULL AND t.authenticated_oid IS NOT NULL AND t.schema_oid IS NOT NULL AND t.function_oid IS NOT NULL AS targets_resolved,
    a.schema_grant_authority,
    COALESCE((SELECT admin_option AND NOT inherit_option AND NOT set_option FROM membership),false) AS membership_before_exact,
    COALESCE(NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=t.owner_oid AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit)),false) AS owner_attributes_exact,
    COALESCE(pg_catalog.has_schema_privilege(t.postgres_oid,t.schema_oid,'USAGE') AND pg_catalog.has_schema_privilege(t.postgres_oid,t.schema_oid,'CREATE'),false) AS deployment_schema_exact,
    COALESCE(pg_catalog.has_schema_privilege(t.owner_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.owner_oid,t.schema_oid,'CREATE'),false) AS owner_schema_before_exact,
    COALESCE(pg_catalog.has_schema_privilege(t.service_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.service_oid,t.schema_oid,'CREATE') AND NOT pg_catalog.has_schema_privilege(t.anon_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.anon_oid,t.schema_oid,'CREATE') AND NOT pg_catalog.has_schema_privilege(t.authenticated_oid,t.schema_oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(t.authenticated_oid,t.schema_oid,'CREATE'),false) AS runtime_schema_exact,
    COALESCE((SELECT pg_catalog.bool_and(expected_owner=observed_owner AND NOT runtime_has_privilege) FROM table_checks),false) AND (SELECT pg_catalog.count(*)=7 FROM pg_catalog.pg_class c WHERE c.relnamespace=t.schema_oid AND c.relkind='r') AS table_boundary_exact,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) acl WHERE c.relnamespace=t.schema_oid AND c.relkind='r' AND acl.grantee=0) AS public_table_exact,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace=t.schema_oid AND c.relkind='S') AS sequence_inventory_exact,
    COALESCE(pg_catalog.has_function_privilege(t.owner_oid,t.function_oid,'EXECUTE') AND pg_catalog.has_function_privilege(t.service_oid,t.function_oid,'EXECUTE') AND NOT pg_catalog.has_function_privilege(t.anon_oid,t.function_oid,'EXECUTE') AND NOT pg_catalog.has_function_privilege(t.authenticated_oid,t.function_oid,'EXECUTE'),false) AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) acl WHERE p.oid=t.function_oid AND acl.grantee=0 AND acl.privilege_type='EXECUTE') AS function_boundary_exact,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) acl WHERE n.oid=t.schema_oid AND acl.grantee=0 AND acl.privilege_type IN ('USAGE','CREATE')) AS public_schema_exact,
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>t.schema_oid AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND COALESCE(pg_catalog.has_schema_privilege(t.owner_oid,n.oid,'CREATE'),false)) AS no_other_owner_create,
    pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NULL AND pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NULL AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.pronamespace=t.schema_oid AND p.proname='fid_execute_prospect_identifier_issuance_transaction') AND NOT EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id LIKE '014%') AND (SELECT pg_catalog.count(*) FROM fid.fid_persistence_migrations)=1 AND EXISTS(SELECT 1 FROM fid.fid_persistence_migrations WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND expected_migration_count=13) AS migration_state_exact
  FROM targets t JOIN authority a ON true
)
SELECT 'ahmorpzcaapvoymiqlkv'::text project_id,'DEDICATED_NON_PRODUCTION_TEST'::text environment,
  CASE WHEN identity_exact AND version_exact AND targets_resolved AND schema_grant_authority AND membership_before_exact AND owner_attributes_exact AND deployment_schema_exact AND owner_schema_before_exact AND runtime_schema_exact AND table_boundary_exact AND public_table_exact AND sequence_inventory_exact AND function_boundary_exact AND public_schema_exact AND no_other_owner_create AND migration_state_exact THEN 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTED_PREFLIGHT_PASSED' ELSE 'FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTED_PREFLIGHT_BLOCKED' END classification,
  identity_exact,version_exact,targets_resolved,schema_grant_authority,membership_before_exact,owner_attributes_exact,deployment_schema_exact,owner_schema_before_exact,runtime_schema_exact,table_boundary_exact,public_table_exact,sequence_inventory_exact,function_boundary_exact,public_schema_exact,no_other_owner_create,migration_state_exact
FROM facts;
