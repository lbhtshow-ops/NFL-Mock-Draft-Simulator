-- Sprint 17C.40: split-authority 25-field mismatch-detail SQL successor.
BEGIN TRANSACTION READ ONLY;

WITH
constants AS (
  SELECT 'Lunch Break Hot Take'::text organization,'LBHT FID Persistence Test'::text project_name,
    'ahmorpzcaapvoymiqlkv'::text project_id,'us-east-1'::text region,'main'::text branch,
    'Primary Database'::text database_source,'DEDICATED_NON_PRODUCTION_TEST'::text governed_environment,
    ARRAY['fid_record_revisions','fid_persistence_effect_receipts','fid_persistence_audit_events',
      'fid_persistence_idempotency','fid_persistence_batches','fid_persistence_batch_operations','fid_persistence_migrations']::text[] governed_tables,
    ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']::text[] table_privileges
),
database_observed_target AS (
  SELECT pg_catalog.current_database()::text database_name,CURRENT_USER::text current_user_name,
    SESSION_USER::text session_user_name,
    pg_catalog.current_database()='postgres' AND CURRENT_USER='postgres' AND SESSION_USER='postgres' database_evidence_complete
),
identities AS (
  SELECT (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='fid_function_owner') owner_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='postgres') postgres_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role') service_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon') anon_oid,
    (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='authenticated') authenticated_oid,
    (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='fid') fid_oid
),
prerequisites AS (
  SELECT i.*,owner_oid IS NOT NULL AND postgres_oid IS NOT NULL AND service_oid IS NOT NULL AND anon_oid IS NOT NULL
    AND authenticated_oid IS NOT NULL AND fid_oid IS NOT NULL
    AND pg_catalog.to_regclass('fid.fid_persistence_migrations') IS NOT NULL AS complete FROM identities i
),
principals AS (
  SELECT p.complete,v.* FROM prerequisites p CROSS JOIN LATERAL (VALUES
    ('fid_function_owner'::text,p.owner_oid),('service_role',p.service_oid),('anon',p.anon_oid),
    ('authenticated',p.authenticated_oid),('PUBLIC',0::oid)) v(principal_ref,principal_oid)
),
membership AS (
  SELECT p.complete,count(m.*)=1 AS member_exact,
    COALESCE(bool_and(m.admin_option),false) admin_state,COALESCE(bool_and(m.inherit_option),false) inherit_state,
    COALESCE(bool_and(m.set_option),false) set_state
  FROM prerequisites p LEFT JOIN pg_catalog.pg_auth_members m ON p.complete AND m.roleid=p.owner_oid AND m.member=p.postgres_oid
  GROUP BY p.complete
),
state AS (
  SELECT m.*,CASE WHEN p.complete THEN COALESCE(pg_catalog.has_schema_privilege(p.owner_oid,p.fid_oid,'CREATE'),false) ELSE false END create_state
  FROM membership m CROSS JOIN prerequisites p
),
tables AS (
  SELECT t.table_name,p.complete,c.oid table_oid,c.relowner,
    p.complete AND c.oid IS NOT NULL AND c.relkind='r' AND c.relowner=p.postgres_oid AS acl_ready
  FROM constants k CROSS JOIN LATERAL unnest(k.governed_tables) t(table_name) CROSS JOIN prerequisites p
  LEFT JOIN pg_catalog.pg_class c ON c.relnamespace=p.fid_oid AND c.relname=t.table_name
),
table_policy AS (
  SELECT t.*,q.principal_ref,q.principal_oid,v.privilege_name,
    q.principal_ref='fid_function_owner' AND v.privilege_name=ANY(CASE t.table_name
      WHEN 'fid_record_revisions' THEN ARRAY['SELECT','INSERT'] WHEN 'fid_persistence_effect_receipts' THEN ARRAY['SELECT','INSERT']
      WHEN 'fid_persistence_audit_events' THEN ARRAY['SELECT','INSERT'] WHEN 'fid_persistence_idempotency' THEN ARRAY['SELECT','INSERT','UPDATE']
      WHEN 'fid_persistence_batches' THEN ARRAY['SELECT','INSERT','UPDATE'] WHEN 'fid_persistence_batch_operations' THEN ARRAY['SELECT','INSERT','UPDATE']
      ELSE ARRAY[]::text[] END) expected
  FROM tables t CROSS JOIN principals q CROSS JOIN constants k CROSS JOIN LATERAL unnest(k.table_privileges) v(privilege_name)
),
table_acl AS (
  SELECT x.*,
    CASE WHEN x.acl_ready THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name) FROM pg_catalog.pg_class c
      LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=x.principal_oid WHERE c.oid=x.table_oid),false) ELSE false END direct_acl,
    CASE WHEN NOT x.acl_ready THEN false WHEN x.principal_ref='PUBLIC' THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name)
      FROM pg_catalog.pg_class c LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=0 WHERE c.oid=x.table_oid),false)
      ELSE COALESCE(pg_catalog.has_table_privilege(x.principal_oid,x.table_oid,x.privilege_name),false) END effective_acl,
    CASE WHEN x.acl_ready THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name AND a.is_grantable) FROM pg_catalog.pg_class c
      LEFT JOIN LATERAL pg_catalog.aclexplode(c.relacl) a ON a.grantee=x.principal_oid WHERE c.oid=x.table_oid),false) ELSE false END grantable
  FROM table_policy x
),
schema_policy AS (
  SELECT q.*,v.privilege_name,CASE WHEN q.principal_ref IN ('fid_function_owner','service_role') AND v.privilege_name='USAGE' THEN true ELSE false END expected
  FROM principals q CROSS JOIN (VALUES ('USAGE'::text),('CREATE')) v(privilege_name)
),
schema_acl AS (
  SELECT x.*,
    CASE WHEN x.complete THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name) FROM prerequisites p
      JOIN pg_catalog.pg_namespace n ON n.oid=p.fid_oid LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=x.principal_oid),false) ELSE false END direct_acl,
    CASE WHEN NOT x.complete THEN false WHEN x.principal_ref='PUBLIC' THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name)
      FROM prerequisites p JOIN pg_catalog.pg_namespace n ON n.oid=p.fid_oid LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=0),false)
      ELSE COALESCE(pg_catalog.has_schema_privilege(x.principal_oid,(SELECT fid_oid FROM prerequisites),x.privilege_name),false) END effective_acl,
    CASE WHEN x.complete THEN COALESCE((SELECT bool_or(a.privilege_type=x.privilege_name AND a.is_grantable) FROM prerequisites p
      JOIN pg_catalog.pg_namespace n ON n.oid=p.fid_oid LEFT JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a ON a.grantee=x.principal_oid),false) ELSE false END grantable
  FROM schema_policy x
),
governed_function AS (
  SELECT p.*,pg_catalog.to_regprocedure('fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)') function_oid
  FROM prerequisites p
),
function_policy AS (SELECT q.*,q.principal_ref='service_role' expected FROM principals q),
function_acl AS (
  SELECT x.*,g.function_oid,
    CASE WHEN g.complete AND g.function_oid IS NOT NULL THEN COALESCE((SELECT bool_or(a.privilege_type='EXECUTE') FROM pg_catalog.pg_proc p
      LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=x.principal_oid WHERE p.oid=g.function_oid),false) ELSE false END direct_acl,
    CASE WHEN NOT g.complete OR g.function_oid IS NULL THEN false WHEN x.principal_ref='PUBLIC' THEN COALESCE((SELECT bool_or(a.privilege_type='EXECUTE')
      FROM pg_catalog.pg_proc p LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=0 WHERE p.oid=g.function_oid),false)
      ELSE COALESCE(pg_catalog.has_function_privilege(x.principal_oid,g.function_oid,'EXECUTE'),false) END effective_acl,
    CASE WHEN g.complete AND g.function_oid IS NOT NULL THEN COALESCE((SELECT bool_or(a.privilege_type='EXECUTE' AND a.is_grantable)
      FROM pg_catalog.pg_proc p LEFT JOIN LATERAL pg_catalog.aclexplode(p.proacl) a ON a.grantee=x.principal_oid WHERE p.oid=g.function_oid),false) ELSE false END grantable
  FROM function_policy x CROSS JOIN governed_function g
),
metadata_ref AS (SELECT pg_catalog.to_regclass('fid.fid_persistence_migrations')::pg_catalog.regclass relation_ref),
metadata_xml AS (
  SELECT relation_ref,CASE WHEN relation_ref IS NULL THEN NULL ELSE pg_catalog.query_to_xml(pg_catalog.format(
    'SELECT count(*) AS metadata_total, count(*) FILTER (WHERE migration_id LIKE %L) AS metadata_014, count(*) FILTER (WHERE migration_id=%L AND migration_sequence=13 AND expected_migration_count=13) AS metadata_013_exact FROM %s',
    '014%','013_record_fid_deployment_metadata',relation_ref),false,true,'') END evidence FROM metadata_ref
),
metadata AS (
  SELECT relation_ref,COALESCE(((pg_catalog.xpath('/table/row/metadata_total/text()',evidence))[1]::text)::bigint,0) metadata_total,
    COALESCE(((pg_catalog.xpath('/table/row/metadata_014/text()',evidence))[1]::text)::bigint,0) metadata_014,
    COALESCE(((pg_catalog.xpath('/table/row/metadata_013_exact/text()',evidence))[1]::text)::bigint,0) metadata_013_exact FROM metadata_xml
),
unresolved AS (
  SELECT v.ordinal,v.unresolved_id,v.governed_object_ref FROM prerequisites p CROSS JOIN LATERAL (VALUES
    (1,'MISSING_FID_FUNCTION_OWNER','role:fid_function_owner',p.owner_oid),(2,'MISSING_POSTGRES_ROLE','role:postgres',p.postgres_oid),
    (3,'MISSING_SERVICE_ROLE','role:service_role',p.service_oid),(4,'MISSING_ANON_ROLE','role:anon',p.anon_oid),
    (5,'MISSING_AUTHENTICATED_ROLE','role:authenticated',p.authenticated_oid),(6,'MISSING_FID_SCHEMA','schema:fid',p.fid_oid),
    (7,'MISSING_OPTIONAL_METADATA_STORAGE','metadata:fid.fid_persistence_migrations',pg_catalog.to_regclass('fid.fid_persistence_migrations')::oid))
    v(ordinal,unresolved_id,governed_object_ref,resolved_oid) WHERE v.resolved_oid IS NULL
),
state_conflicts AS (
  SELECT 1 ordinal,'UNEXPECTED_MEMBERSHIP_SET_TRUE' conflict_id,'membership:postgres->fid_function_owner' governed_object_ref FROM state WHERE complete AND set_state
  UNION ALL SELECT 2,'UNEXPECTED_OWNER_CREATE_TRUE','schema:fid' FROM state WHERE complete AND create_state
),
raw_mismatches AS (
  SELECT 'EXECUTION_IDENTITY' unit_id,'ROLE_EXECUTION_IDENTITY' mismatch_id,'role' object_class,'role:postgres' governed_object_ref,
    'postgres' principal_ref,'EXECUTION_IDENTITY' check_type,'POSTGRES' expected_classification,'OTHER' observed_classification
  FROM prerequisites WHERE complete AND (CURRENT_USER<>'postgres' OR SESSION_USER<>'postgres')
  UNION ALL SELECT 'OWNER_ATTRIBUTES','OWNER_RESTRICTED_ATTRIBUTES','role','role:fid_function_owner','fid_function_owner','ROLE_ATTRIBUTES','RESTRICTED','EXPANDED'
  FROM prerequisites p WHERE p.complete AND EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE oid=p.owner_oid AND
    (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
  UNION ALL SELECT 'MEMBERSHIP_SHAPE','OWNER_MEMBERSHIP_SHAPE','membership','membership:postgres->fid_function_owner','postgres','MEMBER_ADMIN_INHERIT','MEMBER_ONE_ADMIN_TRUE_INHERIT_FALSE','MISMATCH'
  FROM state WHERE complete AND NOT (member_exact AND admin_state AND NOT inherit_state)
  UNION ALL SELECT 'FID_SCHEMA_CONTROL','FID_SCHEMA_CONTROL','schema','schema:fid','postgres','OWNER_OR_CREATE_GRANT_OPTION','PRESENT','MISSING'
  FROM prerequisites p WHERE p.complete AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid=p.fid_oid AND
    (n.nspowner=p.postgres_oid OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(n.nspacl) a WHERE a.grantee=p.postgres_oid AND a.privilege_type='CREATE' AND a.is_grantable)))
  UNION ALL SELECT 'SCHEMA_ACL:'||principal_ref||':'||privilege_name,'SCHEMA_'||upper(principal_ref)||'_'||privilege_name,'schema','schema:fid',principal_ref,
    CASE WHEN grantable THEN 'UNEXPECTED_GRANT_OPTION' WHEN direct_acl<>expected THEN CASE WHEN expected THEN 'MISSING_DIRECT_PRIVILEGE' ELSE 'UNEXPECTED_DIRECT_PRIVILEGE' END
      ELSE CASE WHEN expected THEN 'MISSING_EFFECTIVE_PRIVILEGE' ELSE 'UNEXPECTED_EFFECTIVE_PRIVILEGE' END END,
    CASE WHEN expected THEN 'PRESENT' ELSE 'ABSENT' END,CASE WHEN direct_acl OR effective_acl THEN 'PRESENT' ELSE 'ABSENT' END
  FROM schema_acl CROSS JOIN state WHERE schema_acl.complete AND
    ((privilege_name='CREATE' AND principal_ref='fid_function_owner' AND (grantable OR direct_acl<>create_state OR effective_acl<>create_state))
      OR (NOT(privilege_name='CREATE' AND principal_ref='fid_function_owner') AND (direct_acl<>expected OR effective_acl<>expected OR grantable)))
  UNION ALL SELECT 'OTHER_SCHEMA_CREATE','OWNER_CREATE_OTHER_SCHEMA','schema','schema:other_non_system','fid_function_owner','UNEXPECTED_CREATE','ABSENT','PRESENT'
  FROM prerequisites p WHERE p.complete AND EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.oid<>p.fid_oid AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\'
    AND n.nspname<>'information_schema' AND n.nspname<>ALL(ARRAY['auth','storage','extensions','graphql','graphql_public','realtime','supabase_functions','vault','_analytics','_realtime','net'])
    AND pg_catalog.has_schema_privilege(p.owner_oid,n.oid,'CREATE'))
  UNION ALL SELECT 'TABLE_INVENTORY','FID_TABLE_INVENTORY','inventory','inventory:fid_tables',NULL,'EXACT_TABLE_INVENTORY','SEVEN_GOVERNED_TABLES_ONLY','CONFLICT'
  FROM prerequisites p,constants c WHERE p.complete AND ((SELECT count(*) FROM pg_catalog.pg_class WHERE relnamespace=p.fid_oid AND relkind='r' AND relname=ANY(c.governed_tables))<>7
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=p.fid_oid AND relkind='r' AND NOT relname=ANY(c.governed_tables))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=p.fid_oid AND relname=ANY(c.governed_tables) AND relkind<>'r')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=p.fid_oid AND relkind IN('v','m','f','p')))
  UNION ALL SELECT 'TABLE_PREREQUISITE:'||table_name,'TABLE_'||upper(table_name)||'_PREREQUISITE','table','table:fid.'||table_name,'postgres','EXISTS_RELKIND_OWNER','ORDINARY_TABLE_OWNED_BY_POSTGRES','MISSING_OR_WRONG_OWNER'
  FROM tables WHERE complete AND NOT acl_ready
  UNION ALL SELECT 'TABLE_ACL:'||table_name||':'||principal_ref||':'||privilege_name,'TABLE_'||upper(table_name)||'_'||upper(principal_ref)||'_'||privilege_name,
    'table','table:fid.'||table_name,principal_ref,CASE WHEN grantable THEN 'UNEXPECTED_GRANT_OPTION' WHEN direct_acl<>expected THEN
      CASE WHEN expected THEN 'MISSING_DIRECT_PRIVILEGE' ELSE 'UNEXPECTED_DIRECT_PRIVILEGE' END ELSE CASE WHEN expected THEN 'MISSING_EFFECTIVE_PRIVILEGE' ELSE 'UNEXPECTED_EFFECTIVE_PRIVILEGE' END END,
    CASE WHEN expected THEN 'PRESENT' ELSE 'ABSENT' END,CASE WHEN direct_acl OR effective_acl THEN 'PRESENT' ELSE 'ABSENT' END
  FROM table_acl WHERE complete AND acl_ready AND (direct_acl<>expected OR effective_acl<>expected OR grantable)
  UNION ALL SELECT 'SEQUENCE_INVENTORY','FID_SEQUENCE_INVENTORY','inventory','inventory:fid_sequences',NULL,'EXACT_ZERO_SEQUENCE_INVENTORY','ZERO','UNEXPECTED_SEQUENCE'
  FROM prerequisites p WHERE p.complete AND EXISTS(SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=p.fid_oid AND relkind='S')
  UNION ALL SELECT 'FUNCTION_INVENTORY','FID_FUNCTION_INVENTORY','inventory','inventory:fid_functions',NULL,'EXACT_FUNCTION_INVENTORY','ONE_GOVERNED_FUNCTION','CONFLICT'
  FROM prerequisites p WHERE p.complete AND (SELECT count(*) FROM pg_catalog.pg_proc WHERE pronamespace=p.fid_oid)<>1
  UNION ALL SELECT 'FUNCTION_SECURITY','GOVERNED_FUNCTION_SECURITY','function','function:fid.fid_execute_atomic_persistence_batch','fid_function_owner','OWNER_SECURITY_CONFIGURATION','MATCH','MISMATCH'
  FROM governed_function g WHERE g.complete AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=g.function_oid AND p.proowner=g.owner_oid AND p.prosecdef AND p.proconfig=ARRAY['search_path=pg_catalog, fid'])
  UNION ALL SELECT 'UNEXPECTED_ISSUANCE_FUNCTION','UNEXPECTED_ISSUANCE_FUNCTION','function','function:fid.fid_execute_prospect_identifier_issuance_transaction',NULL,'UNEXPECTED_FUNCTION','ABSENT','PRESENT'
  FROM prerequisites p WHERE p.complete AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc WHERE pronamespace=p.fid_oid AND proname='fid_execute_prospect_identifier_issuance_transaction')
  UNION ALL SELECT 'FUNCTION_ACL:'||principal_ref,'FUNCTION_EXECUTE_'||upper(principal_ref),'function','function:fid.fid_execute_atomic_persistence_batch',principal_ref,
    CASE WHEN grantable THEN 'UNEXPECTED_GRANT_OPTION' WHEN direct_acl<>expected THEN CASE WHEN expected THEN 'MISSING_DIRECT_PRIVILEGE' ELSE 'UNEXPECTED_DIRECT_PRIVILEGE' END ELSE 'EFFECTIVE_PRIVILEGE_MISMATCH' END,
    CASE WHEN expected THEN 'PRESENT' ELSE 'ABSENT' END,CASE WHEN direct_acl OR effective_acl THEN 'PRESENT' ELSE 'ABSENT' END
  FROM function_acl WHERE complete AND function_oid IS NOT NULL AND (direct_acl<>expected OR effective_acl<>(expected OR principal_ref='fid_function_owner') OR grantable)
  UNION ALL SELECT 'ROLLBACK_STATE','MIGRATION_014_ROLLBACK_STATE','metadata','metadata:migration_014',NULL,'ROLLBACK_INVENTORY','ROLLED_BACK_UNAPPLIED','CONFLICT'
  FROM metadata WHERE relation_ref IS NOT NULL AND (metadata_total<>1 OR metadata_014<>0 OR metadata_013_exact<>1
    OR pg_catalog.to_regclass('fid.fid_identifier_reservations') IS NOT NULL OR pg_catalog.to_regclass('fid.fid_identifier_issuance_ledger') IS NOT NULL
    OR pg_catalog.to_regclass('fid.fid_identifier_issuance_idempotency') IS NOT NULL)
),
ordered AS (SELECT row_number() OVER(ORDER BY unit_id,mismatch_id)::integer mismatch_ordinal,* FROM raw_mismatches),
summary AS (
  SELECT count(*)::integer mismatch_count,COALESCE(jsonb_agg(jsonb_build_object('mismatch_ordinal',mismatch_ordinal,'increment_unit_id',unit_id,
    'mismatch_id',mismatch_id,'object_class',object_class,'governed_object_ref',governed_object_ref,'principal_ref',principal_ref,
    'check_type',check_type,'expected_classification',expected_classification,'observed_classification',observed_classification,
    'severity','BLOCKING','recovery_classification','GOVERNANCE_REVIEW_REQUIRED') ORDER BY mismatch_ordinal),'[]'::jsonb) mismatch_details FROM ordered
),
unresolved_summary AS (SELECT COALESCE(jsonb_agg(jsonb_build_object('unresolved_ordinal',ordinal,'unresolved_id',unresolved_id,'governed_object_ref',governed_object_ref,'severity','UNRESOLVED') ORDER BY ordinal),'[]'::jsonb) unresolved_details FROM unresolved),
state_summary AS (SELECT COALESCE(jsonb_agg(jsonb_build_object('state_ordinal',ordinal,'state_conflict_id',conflict_id,'governed_object_ref',governed_object_ref,'expected_classification','FALSE','observed_classification','TRUE') ORDER BY ordinal),'[]'::jsonb) state_conflicts FROM state_conflicts)
SELECT 'SPLIT_AUTHORITY_25_FIELD_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT'::text result_identity,'17C.40.1'::text result_version,
  'MISMATCH_DETAIL_DIAGNOSTIC'::text mode,
  CASE WHEN NOT d.database_evidence_complete THEN 'DATABASE_SESSION_EVIDENCE_MISMATCH'
    WHEN jsonb_array_length(u.unresolved_details)>0 THEN 'EVIDENCE_UNRESOLVED_EXTERNAL_TARGET_ATTESTATION_REQUIRED'
    WHEN s.mismatch_count=0 AND jsonb_array_length(x.state_conflicts)=0 THEN 'NO_MISMATCHES_EXTERNAL_TARGET_ATTESTATION_REQUIRED'
    ELSE 'MISMATCH_DETAIL_REVIEW_REQUIRED_EXTERNAL_TARGET_ATTESTATION_REQUIRED' END::text classification,s.mismatch_count,s.mismatch_details,
  jsonb_array_length(s.mismatch_details) detail_count,s.mismatch_count=jsonb_array_length(s.mismatch_details) count_reconciled,
  5::integer captured_preflight_mismatch_count,s.mismatch_count=5 captured_count_reconciled,u.unresolved_details,x.state_conflicts,
  st.set_state expected_before_set_state,st.create_state expected_before_create_state,
  jsonb_build_object('member_exact',st.member_exact,'admin_state',st.admin_state,'inherit_state',st.inherit_state,'set_state',st.set_state) membership_evidence,
  (m.relation_ref IS NOT NULL)::boolean metadata_storage_present,m.metadata_014::bigint migration_014_metadata_count,
  (d.database_evidence_complete AND jsonb_array_length(u.unresolved_details)=0
    AND NOT EXISTS (SELECT 1 FROM tables WHERE table_oid IS NULL)
    AND g.function_oid IS NOT NULL)::boolean evidence_complete,
  jsonb_build_object('authority_source','POSTGRESQL_17_DATABASE_SESSION','verification_boundary','DATABASE_SESSION_OBSERVABLE',
    'database_name',d.database_name,'current_user',d.current_user_name,'session_user',d.session_user_name,
    'expected_database_name','postgres','expected_current_user','postgres','expected_session_user','postgres',
    'database_evidence_complete',d.database_evidence_complete) database_observed_target_evidence,
  jsonb_build_object('authority_source','CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION@1.0.0',
    'verification_boundary','STAGE_1_OPERATOR_DASHBOARD_ATTESTATION',
    'verification_status','REQUIRED_NOT_DATABASE_OBSERVED',
    'organization',c.organization,'project_name',c.project_name,'project_reference',c.project_id,'region',c.region,
    'branch',c.branch,'dashboard_database_source',c.database_source,'governed_environment',c.governed_environment) externally_authorized_target_binding,
  d.database_evidence_complete,true external_target_attestation_required,false overall_target_verified,
  true read_only,0::integer mutation_count
FROM summary s CROSS JOIN unresolved_summary u CROSS JOIN state_summary x CROSS JOIN state st
  CROSS JOIN constants c CROSS JOIN database_observed_target d CROSS JOIN metadata m CROSS JOIN governed_function g;

COMMIT;




