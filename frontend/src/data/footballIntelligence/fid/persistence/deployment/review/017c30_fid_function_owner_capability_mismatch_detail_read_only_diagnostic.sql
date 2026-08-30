-- Sprint 17C.30: additive read-only mismatch-detail diagnostic.
BEGIN TRANSACTION READ ONLY;

WITH RECURSIVE
constants AS (
  SELECT
    'ahmorpzcaapvoymiqlkv'::text AS project_id,
    ARRAY['fid_record_revisions','fid_persistence_effect_receipts','fid_persistence_audit_events',
      'fid_persistence_idempotency','fid_persistence_batches','fid_persistence_batch_operations',
      'fid_persistence_migrations']::text[] AS governed_tables,
    ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']::text[] AS table_privileges
),
roles AS (
  SELECT
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner') AS owner_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='postgres') AS postgres_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role') AS service_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon') AS anon_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='authenticated') AS authenticated_oid,
    (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='fid') AS fid_oid
),
principals AS (
  SELECT * FROM roles r CROSS JOIN LATERAL (VALUES
    ('fid_function_owner'::text,r.owner_oid),('service_role',r.service_oid),('anon',r.anon_oid),
    ('authenticated',r.authenticated_oid),('PUBLIC',0::oid)) p(principal_ref,principal_oid)
),
table_policy AS (
  SELECT table_name, privilege_name, p.principal_ref, p.principal_oid,
    p.principal_ref='fid_function_owner' AND privilege_name=ANY(CASE table_name
      WHEN 'fid_record_revisions' THEN ARRAY['SELECT','INSERT']
      WHEN 'fid_persistence_effect_receipts' THEN ARRAY['SELECT','INSERT']
      WHEN 'fid_persistence_audit_events' THEN ARRAY['SELECT','INSERT']
      WHEN 'fid_persistence_idempotency' THEN ARRAY['SELECT','INSERT','UPDATE']
      WHEN 'fid_persistence_batches' THEN ARRAY['SELECT','INSERT','UPDATE']
      WHEN 'fid_persistence_batch_operations' THEN ARRAY['SELECT','INSERT','UPDATE']
      ELSE ARRAY[]::text[] END) AS expected
  FROM constants c CROSS JOIN LATERAL unnest(c.governed_tables) table_name
  CROSS JOIN LATERAL unnest(c.table_privileges) privilege_name CROSS JOIN principals p
),
table_acl AS (
  SELECT x.*,
    COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name) FROM pg_catalog.pg_class c
      LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=x.principal_oid
      WHERE c.relnamespace=r.fid_oid AND c.relname=x.table_name AND c.relkind='r'),false) AS direct_acl,
    CASE WHEN x.principal_ref='PUBLIC' THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name)
      FROM pg_catalog.pg_class c LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=0
      WHERE c.relnamespace=r.fid_oid AND c.relname=x.table_name AND c.relkind='r'),false)
      ELSE COALESCE(pg_catalog.has_table_privilege(x.principal_oid,pg_catalog.format('%I.%I','fid',x.table_name),x.privilege_name),false) END AS effective_acl,
    COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name AND a.is_grantable) FROM pg_catalog.pg_class c
      LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=x.principal_oid
      WHERE c.relnamespace=r.fid_oid AND c.relname=x.table_name AND c.relkind='r'),false) AS grantable
  FROM table_policy x CROSS JOIN roles r
),
schema_policy AS (
  SELECT p.principal_ref,p.principal_oid,privilege_name,
    CASE WHEN p.principal_ref IN ('fid_function_owner','service_role') AND privilege_name='USAGE' THEN true ELSE false END AS expected
  FROM principals p CROSS JOIN (VALUES ('USAGE'::text),('CREATE')) v(privilege_name)
),
schema_acl AS (
  SELECT x.*,
    COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name) FROM pg_catalog.pg_namespace n
      LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=x.principal_oid WHERE n.oid=r.fid_oid),false) AS direct_acl,
    CASE WHEN x.principal_ref='PUBLIC' THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name)
      FROM pg_catalog.pg_namespace n LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=0 WHERE n.oid=r.fid_oid),false)
      ELSE COALESCE(pg_catalog.has_schema_privilege(x.principal_oid,r.fid_oid,x.privilege_name),false) END AS effective_acl,
    COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name AND a.is_grantable) FROM pg_catalog.pg_namespace n
      LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=x.principal_oid WHERE n.oid=r.fid_oid),false) AS grantable
  FROM schema_policy x CROSS JOIN roles r
),
function_policy AS (
  SELECT p.*, p.principal_ref='service_role' AS expected FROM principals p
),
function_acl AS (
  SELECT x.*,
    COALESCE((SELECT bool_or(a.privilege_type='EXECUTE') FROM pg_catalog.pg_proc p
      LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=x.principal_oid
      WHERE p.oid=pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')),false) AS direct_acl,
    CASE WHEN x.principal_ref='PUBLIC' THEN COALESCE((SELECT bool_or(a.privilege_type='EXECUTE') FROM pg_catalog.pg_proc p
      LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=0
      WHERE p.oid=pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')),false)
      ELSE COALESCE(pg_catalog.has_function_privilege(x.principal_oid,
        'fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)','EXECUTE'),false) END AS effective_acl,
    COALESCE((SELECT bool_or(a.privilege_type='EXECUTE' AND a.is_grantable) FROM pg_catalog.pg_proc p
      LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=x.principal_oid
      WHERE p.oid=pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')),false) AS grantable
  FROM function_policy x
),
metadata_ref AS (
  SELECT pg_catalog.to_regclass('fid.fid_persistence_migrations')::pg_catalog.regclass AS relation_ref
),
metadata_xml AS (
  SELECT relation_ref, CASE WHEN relation_ref IS NULL THEN NULL ELSE pg_catalog.query_to_xml(pg_catalog.format(
    'SELECT count(*) AS metadata_total, count(*) FILTER (WHERE migration_id LIKE %L) AS metadata_014, count(*) FILTER (WHERE migration_id=%L AND migration_sequence=13 AND expected_migration_count=13) AS metadata_013_exact FROM %s',
    '014%','013_record_fid_deployment_metadata',relation_ref),false,true,'') END AS evidence FROM metadata_ref
),
metadata AS (
  SELECT relation_ref,
    COALESCE(((pg_catalog.xpath('/table/row/metadata_total/text()',evidence))[1]::text)::bigint,0) AS metadata_total,
    COALESCE(((pg_catalog.xpath('/table/row/metadata_014/text()',evidence))[1]::text)::bigint,0) AS metadata_014,
    COALESCE(((pg_catalog.xpath('/table/row/metadata_013_exact/text()',evidence))[1]::text)::bigint,0) AS metadata_013_exact
  FROM metadata_xml
),
observations AS (
  SELECT COALESCE((SELECT bool_and(m.admin_option AND NOT m.inherit_option) FROM pg_catalog.pg_auth_members m,roles r
      WHERE m.roleid=r.owner_oid AND m.member=r.postgres_oid),false) AS membership_shape,
    COALESCE((SELECT bool_and(m.set_option) FROM pg_catalog.pg_auth_members m,roles r
      WHERE m.roleid=r.owner_oid AND m.member=r.postgres_oid),false) AS set_state,
    COALESCE(pg_catalog.has_schema_privilege(r.owner_oid,r.fid_oid,'CREATE'),false) AS create_state
  FROM roles r
),
raw_mismatches AS (
  SELECT 'ROLE_EXECUTION_IDENTITY'::text mismatch_id,'role'::text object_class,'postgres'::text governed_object_ref,
    'postgres'::text principal_ref,'EXECUTION_IDENTITY'::text check_type,'MATCH'::text expected_classification,'MISMATCH'::text observed_classification,
    'BLOCKING'::text severity,'GOVERNANCE_REVIEW_REQUIRED'::text recovery_classification
  WHERE CURRENT_USER<>'postgres' OR SESSION_USER<>'postgres'
  UNION ALL SELECT 'OWNER_RESTRICTED_ATTRIBUTES','role','fid_function_owner','fid_function_owner','ROLE_ATTRIBUTES','RESTRICTED','MISMATCH','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE oid=r.owner_oid AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
  UNION ALL SELECT 'OWNER_MEMBERSHIP_OPTIONS','membership','fid_function_owner<-postgres','postgres','ADMIN_INHERIT_SET','ADMIN_TRUE_INHERIT_FALSE_SET_FALSE','MISMATCH','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM observations WHERE NOT membership_shape
  UNION ALL SELECT 'FID_SCHEMA_CONTROL','schema','fid','postgres','OWNER_OR_CREATE_GRANT_OPTION','PRESENT','MISSING','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid=r.fid_oid AND (n.nspowner=r.postgres_oid OR EXISTS
    (SELECT 1 FROM pg_catalog.aclexplode(n.nspacl) a WHERE a.grantee=r.postgres_oid AND a.privilege_type='CREATE' AND a.is_grantable)))
  UNION ALL SELECT 'SCHEMA_'||upper(principal_ref)||'_'||privilege_name,'schema','fid',principal_ref,
    CASE WHEN grantable THEN 'UNEXPECTED_GRANT_OPTION' WHEN direct_acl<>expected THEN CASE WHEN expected THEN 'MISSING_DIRECT_PRIVILEGE' ELSE 'UNEXPECTED_DIRECT_PRIVILEGE' END
      ELSE CASE WHEN expected THEN 'MISSING_EFFECTIVE_PRIVILEGE' ELSE 'UNEXPECTED_EFFECTIVE_PRIVILEGE' END END,
    CASE WHEN expected THEN 'PRESENT' ELSE 'ABSENT' END,CASE WHEN direct_acl OR effective_acl THEN 'PRESENT' ELSE 'ABSENT' END,'BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM schema_acl CROSS JOIN observations WHERE
    (privilege_name='CREATE' AND principal_ref='fid_function_owner' AND (grantable OR direct_acl<>create_state OR effective_acl<>create_state))
    OR (NOT (privilege_name='CREATE' AND principal_ref='fid_function_owner') AND (direct_acl<>expected OR effective_acl<>expected OR grantable))
  UNION ALL SELECT 'OWNER_CREATE_OTHER_SCHEMA','schema','other_non_system_schema','fid_function_owner','UNEXPECTED_CREATE','ABSENT','PRESENT','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>r.fid_oid AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\'
    AND n.nspname<>'information_schema' AND n.nspname<>ALL(ARRAY['auth','storage','extensions','graphql','graphql_public','realtime','supabase_functions','vault','_analytics','_realtime','net'])
    AND pg_catalog.has_schema_privilege(r.owner_oid,n.oid,'CREATE'))
  UNION ALL SELECT 'FID_TABLE_INVENTORY','inventory','fid.tables',NULL,'EXACT_TABLE_INVENTORY','SEVEN_GOVERNED_TABLES_ONLY','CONFLICT','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r,constants c WHERE (SELECT count(*) FROM pg_catalog.pg_class WHERE relnamespace=r.fid_oid AND relkind='r' AND relname=ANY(c.governed_tables))<>7
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=r.fid_oid AND relkind='r' AND NOT relname=ANY(c.governed_tables))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=r.fid_oid AND relname=ANY(c.governed_tables) AND relkind<>'r')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=r.fid_oid AND relkind IN ('v','m','f','p'))
  UNION ALL SELECT 'TABLE_'||upper(t.table_name)||'_OWNER','table','fid.'||t.table_name,'postgres','OBJECT_OWNER','POSTGRES','MISMATCH','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM (SELECT unnest(governed_tables) table_name FROM constants) t,roles r WHERE NOT EXISTS
    (SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace=r.fid_oid AND c.relname=t.table_name AND c.relkind='r' AND c.relowner=r.postgres_oid)
  UNION ALL SELECT 'TABLE_'||upper(table_name)||'_'||upper(principal_ref)||'_'||privilege_name,'table','fid.'||table_name,principal_ref,
    CASE WHEN grantable THEN 'UNEXPECTED_GRANT_OPTION' WHEN direct_acl<>expected THEN CASE WHEN expected THEN 'MISSING_DIRECT_PRIVILEGE' ELSE 'UNEXPECTED_DIRECT_PRIVILEGE' END
      ELSE CASE WHEN expected THEN 'MISSING_EFFECTIVE_PRIVILEGE' ELSE 'UNEXPECTED_EFFECTIVE_PRIVILEGE' END END,
    CASE WHEN expected THEN 'PRESENT' ELSE 'ABSENT' END,CASE WHEN direct_acl OR effective_acl THEN 'PRESENT' ELSE 'ABSENT' END,'BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM table_acl WHERE direct_acl<>expected OR effective_acl<>expected OR grantable
  UNION ALL SELECT 'FID_SEQUENCE_INVENTORY','inventory','fid.sequences',NULL,'EXACT_ZERO_SEQUENCE_INVENTORY','ZERO','UNEXPECTED_SEQUENCE','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=r.fid_oid AND relkind='S')
  UNION ALL SELECT 'FID_FUNCTION_INVENTORY','inventory','fid.functions',NULL,'EXACT_FUNCTION_INVENTORY','ONE_GOVERNED_FUNCTION','CONFLICT','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE (SELECT count(*) FROM pg_catalog.pg_proc WHERE pronamespace=r.fid_oid)<>1
  UNION ALL SELECT 'GOVERNED_FUNCTION_SECURITY','function','fid.fid_execute_atomic_persistence_batch','fid_function_owner','OWNER_SECURITY_CONFIGURATION','MATCH','MISMATCH','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)')
    AND p.proowner=r.owner_oid AND p.prosecdef AND p.proconfig=ARRAY['search_path=pg_catalog, fid'])
  UNION ALL SELECT 'UNEXPECTED_ISSUANCE_FUNCTION','function','fid.fid_execute_prospect_identifier_issuance_transaction',NULL,'UNEXPECTED_FUNCTION','ABSENT','PRESENT','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM roles r WHERE EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE pronamespace=r.fid_oid AND proname='fid_execute_prospect_identifier_issuance_transaction')
  UNION ALL SELECT 'FUNCTION_EXECUTE_'||upper(principal_ref),'function','fid.fid_execute_atomic_persistence_batch',principal_ref,
    CASE WHEN grantable THEN 'UNEXPECTED_GRANT_OPTION' WHEN direct_acl<>expected THEN CASE WHEN expected THEN 'MISSING_DIRECT_PRIVILEGE' ELSE 'UNEXPECTED_DIRECT_PRIVILEGE' END ELSE 'EFFECTIVE_PRIVILEGE_MISMATCH' END,
    CASE WHEN expected THEN 'PRESENT' ELSE 'ABSENT' END,CASE WHEN direct_acl OR effective_acl THEN 'PRESENT' ELSE 'ABSENT' END,'BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM function_acl WHERE direct_acl<>expected OR effective_acl<>(expected OR principal_ref='fid_function_owner') OR grantable
  UNION ALL SELECT 'OPTIONAL_METADATA_STORAGE','metadata','fid.fid_persistence_migrations',NULL,'METADATA_STORAGE','PRESENT','MISSING','UNRESOLVED','READ_ONLY_EVIDENCE_REQUIRED'
  FROM metadata WHERE relation_ref IS NULL
  UNION ALL SELECT 'MIGRATION_014_ROLLBACK_STATE','metadata','fid.migration_014_state',NULL,'ROLLBACK_INVENTORY','ROLLED_BACK_UNAPPLIED','CONFLICT','BLOCKING','GOVERNANCE_REVIEW_REQUIRED'
  FROM metadata WHERE relation_ref IS NOT NULL AND (metadata_total<>1 OR metadata_014<>0 OR metadata_013_exact<>1
    OR pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL
    OR pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL)
),
ordered AS (
  SELECT row_number() OVER (ORDER BY mismatch_id,governed_object_ref,principal_ref NULLS FIRST)::integer AS mismatch_ordinal,* FROM raw_mismatches
),
summary AS (
  SELECT count(*)::integer AS mismatch_count,
    count(*) FILTER (WHERE observed_classification IN ('MISSING','UNRESOLVED'))::integer AS unresolved_count,
    count(*) FILTER (WHERE object_class='inventory')::integer AS inventory_conflict_count,
    COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('mismatch_ordinal',mismatch_ordinal,'mismatch_id',mismatch_id,
      'object_class',object_class,'governed_object_ref',governed_object_ref,'principal_ref',principal_ref,'check_type',check_type,
      'expected_classification',expected_classification,'observed_classification',observed_classification,'severity',severity,
      'recovery_classification',recovery_classification) ORDER BY mismatch_ordinal),'[]'::jsonb) AS mismatch_details
  FROM ordered
)
SELECT
  'FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT'::text AS result_identity,
  '17C.30.1'::text AS result_version,
  CASE WHEN s.mismatch_count=0 THEN 'NO_MISMATCHES' ELSE 'MISMATCH_DETAIL_REVIEW_REQUIRED' END::text AS classification,
  s.mismatch_count, o.set_state AS expected_before_set_state, o.create_state AS expected_before_create_state,
  s.unresolved_count, s.inventory_conflict_count, s.mismatch_details,
  c.project_id, 'Primary Database'::text AS database, 'main'::text AS branch, 'postgres'::text AS sql_role,
  true AS read_only, 0::integer AS mutation_count
FROM summary s CROSS JOIN observations o CROSS JOIN constants c;

COMMIT;
