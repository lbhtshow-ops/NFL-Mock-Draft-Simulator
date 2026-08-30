-- SPRINT 17C.5 FAILED MIGRATION 014 COMMIT-STATE RECONCILIATION POSTGRESQL CORRECTION. READ-ONLY.
-- Exact target: project ahmorpzcaapvoymiqlkv. Return all sanitized result sets and stop.

-- BLOCK A1: session identity and relevant role attributes.
SELECT pg_catalog.current_setting('server_version') AS server_version,
       CURRENT_USER AS current_user,
       SESSION_USER AS session_user,
       pg_catalog.current_database() AS current_database;

SELECT role.rolname, role.rolcanlogin, role.rolsuper, role.rolinherit,
       role.rolcreaterole, role.rolcreatedb, role.rolreplication, role.rolbypassrls
FROM pg_catalog.pg_roles AS role
WHERE role.rolname IN ('postgres','fid_function_owner')
ORDER BY role.rolname COLLATE "C";

-- BLOCK A2: direct and indirect PostgreSQL 17 membership evidence. No role is assumed or set.
WITH RECURSIVE membership_path AS (
  SELECT membership.member AS source_member_oid,
         membership.roleid AS reached_role_oid,
         1 AS path_depth,
         membership.admin_option,
         membership.inherit_option,
         membership.set_option,
         membership.inherit_option AS path_inherit_option,
         membership.set_option AS path_set_option,
         ARRAY[membership.member,membership.roleid]::oid[] AS visited_roles
  FROM pg_catalog.pg_auth_members AS membership
  JOIN pg_catalog.pg_roles AS member_role ON member_role.oid=membership.member
  WHERE member_role.rolname='postgres'
  UNION ALL
  SELECT path.source_member_oid,
         membership.roleid,
         path.path_depth+1,
         membership.admin_option,
         membership.inherit_option,
         membership.set_option,
         path.path_inherit_option AND membership.inherit_option,
         path.path_set_option AND membership.set_option,
         path.visited_roles||membership.roleid
  FROM membership_path AS path
  JOIN pg_catalog.pg_auth_members AS membership ON membership.member=path.reached_role_oid
  WHERE NOT membership.roleid=ANY(path.visited_roles)
)
SELECT source.rolname AS source_member,
       reached.rolname AS granted_role,
       path.path_depth,
       path.admin_option,
       path.inherit_option,
       path.set_option,
       path.path_inherit_option,
       path.path_set_option,
       CASE WHEN reached.rolname='fid_function_owner' AND path.path_set_option
         THEN 'SET_ROLE_PATH_AVAILABLE'
         WHEN reached.rolname='fid_function_owner'
         THEN 'MEMBERSHIP_PATH_WITHOUT_SET_ROLE_CAPABILITY'
         ELSE 'INTERMEDIATE_MEMBERSHIP_PATH'
       END AS sanitized_classification
FROM membership_path AS path
JOIN pg_catalog.pg_roles AS source ON source.oid=path.source_member_oid
JOIN pg_catalog.pg_roles AS reached ON reached.oid=path.reached_role_oid
ORDER BY path.path_depth, reached.rolname COLLATE "C";

WITH roles AS (
  SELECT pg_catalog.to_regrole('postgres') AS member_oid,
         pg_catalog.to_regrole('fid_function_owner') AS target_oid
)
SELECT member_oid::pg_catalog.regrole AS member_role,
       target_oid::pg_catalog.regrole AS target_role,
       CASE WHEN member_oid IS NULL OR target_oid IS NULL THEN false
            ELSE pg_catalog.pg_has_role(member_oid,target_oid,'MEMBER') END AS member_capability,
       CASE WHEN member_oid IS NULL OR target_oid IS NULL THEN false
            ELSE pg_catalog.pg_has_role(member_oid,target_oid,'USAGE') END AS inherited_usage_capability,
       CASE WHEN member_oid IS NULL OR target_oid IS NULL THEN false
            ELSE pg_catalog.pg_has_role(member_oid,target_oid,'SET') END AS set_role_capability,
       CASE
         WHEN target_oid IS NULL THEN 'TARGET_ROLE_MISSING'
         WHEN member_oid IS NULL THEN 'MEMBERSHIP_RELATIONSHIP_MISSING'
         WHEN pg_catalog.pg_has_role(member_oid,target_oid,'SET') THEN 'SET_ROLE_CAPABILITY_CONFIRMED'
         WHEN pg_catalog.pg_has_role(member_oid,target_oid,'MEMBER') THEN 'MEMBER_WITHOUT_SET_ROLE_CAPABILITY'
         ELSE 'MEMBERSHIP_RELATIONSHIP_MISSING'
       END AS sanitized_classification
FROM roles;

-- BLOCK B: exact table, function, and index object existence and owner classification.
WITH expected_relations(object_category,object_name,expected_relkind) AS (
  VALUES
    ('TABLE','fid_identifier_reservations','r'),
    ('TABLE','fid_identifier_issuance_ledger','r'),
    ('TABLE','fid_identifier_issuance_idempotency','r'),
    ('INDEX','fid_identifier_reservations_operation_idx','i'),
    ('INDEX','fid_identifier_reservations_authorization_idx','i'),
    ('INDEX','fid_identifier_issuance_ledger_operation_idx','i'),
    ('INDEX','fid_identifier_issuance_ledger_authorization_idx','i'),
    ('INDEX','fid_identifier_issuance_idempotency_request_idx','i'),
    ('INDEX','fid_identifier_issuance_idempotency_recovery_idx','i')
), observed AS (
  SELECT expected.object_category, expected.object_name, expected.expected_relkind,
         class.oid, class.relkind, namespace.nspname, class.relowner::pg_catalog.regrole AS owner
  FROM expected_relations AS expected
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class
    ON class.relnamespace=namespace.oid AND class.relname=expected.object_name
)
SELECT object_category, object_name, nspname AS schema_name, relkind AS object_kind, owner,
       CASE WHEN oid IS NULL THEN 'OBJECT_ABSENT'
            WHEN relkind=expected_relkind::"char" THEN 'EXPECTED_OBJECT_PRESENT'
            ELSE 'UNEXPECTED_SAME_NAME_RELATION_PRESENT'
       END AS sanitized_classification
FROM observed
UNION ALL
SELECT 'FUNCTION', 'fid_execute_prospect_identifier_issuance_transaction', namespace.nspname,
       'f'::"char", function.proowner::pg_catalog.regrole,
       CASE WHEN function.oid IS NULL THEN 'OBJECT_ABSENT' ELSE 'EXPECTED_OBJECT_PRESENT' END
FROM (SELECT 1) AS seed
LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
LEFT JOIN pg_catalog.pg_proc AS function
  ON function.pronamespace=namespace.oid
 AND function.proname='fid_execute_prospect_identifier_issuance_transaction'
 AND pg_catalog.pg_get_function_identity_arguments(function.oid)=
   'request_contract_version text, request_id text, operation_id text, idempotency_ref text, authorization_ref text, generation_invocation_ref text, generation_result_ref text, candidate_identifier text, identifier_layer text, namespace text, strategy_ref text, convention_ref text, generator_port_ref text, adapter_ref text, provider_ref text, attempt_number integer, attempt_policy_ref text, environment text, actor_ref text, expected_policy_refs jsonb, audit_refs jsonb';

-- BLOCK C1: sanitized table structural summaries.
WITH expected_tables(table_name,expected_columns,expected_constraints) AS (
  VALUES
    ('fid_identifier_reservations',23,14),
    ('fid_identifier_issuance_ledger',24,9),
    ('fid_identifier_issuance_idempotency',26,15)
)
SELECT expected.table_name,
       class.relowner::pg_catalog.regrole AS owner,
       class.relpersistence AS persistence_type,
       class.relrowsecurity AS rls_enabled,
       class.relforcerowsecurity AS forced_rls_enabled,
       COALESCE((SELECT COUNT(*)::integer FROM pg_catalog.pg_attribute AS attribute WHERE attribute.attrelid=class.oid AND attribute.attnum>0 AND NOT attribute.attisdropped),0) AS column_count,
       COALESCE((SELECT COUNT(*)::integer FROM pg_catalog.pg_constraint AS constraint_record WHERE constraint_record.conrelid=class.oid),0) AS constraint_count,
       expected.expected_columns,
       expected.expected_constraints,
       CASE WHEN class.oid IS NULL THEN 'TABLE_ABSENT'
            WHEN class.relkind<>'r' THEN 'UNEXPECTED_SAME_NAME_RELATION_PRESENT'
            ELSE 'TABLE_PRESENT'
       END AS sanitized_classification
FROM expected_tables AS expected
LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
LEFT JOIN pg_catalog.pg_class AS class
  ON class.relnamespace=namespace.oid AND class.relname=expected.table_name
ORDER BY expected.table_name COLLATE "C";

-- BLOCK C2: exact governed constraints, including primary, unique, check, and foreign keys.
WITH expected_constraints(table_name,constraint_name,expected_type) AS (
  VALUES
    ('fid_identifier_reservations','fid_identifier_reservations_pkey','p'),
    ('fid_identifier_reservations','fid_identifier_reservations_transaction_unique','u'),
    ('fid_identifier_reservations','fid_identifier_reservations_operation_unique','u'),
    ('fid_identifier_reservations','fid_identifier_reservations_generation_result_unique','u'),
    ('fid_identifier_reservations','fid_identifier_reservations_namespace_candidate_unique','u'),
    ('fid_identifier_reservations','fid_identifier_reservations_transaction_binding_unique','u'),
    ('fid_identifier_reservations','fid_identifier_reservations_refs_nonempty','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_references_distinct','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_attempt_positive','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_environment_check','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_status_check','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_policy_refs_check','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_audit_refs_check','c'),
    ('fid_identifier_reservations','fid_identifier_reservations_candidate_check','c'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_pkey','p'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_transaction_unique','u'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_reservation_unique','u'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_operation_unique','u'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_outcome_binding_unique','u'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_refs_distinct','c'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_status_check','c'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_reservation_fkey','f'),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_reservation_binding_fkey','f'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_pkey','p'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_transaction_unique','u'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_operation_unique','u'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_generation_result_unique','u'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_reservation_unique','u'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_ledger_unique','u'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_ref_nonempty','c'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_attempt_positive','c'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_environment_check','c'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_outcome_check','c'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_reference_outcome_check','c'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_refs_distinct','c'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_reservation_fkey','f'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_ledger_fkey','f'),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_outcome_binding_fkey','f')
), observed AS (
  SELECT expected.table_name, expected.constraint_name, expected.expected_type,
         constraint_record.oid, constraint_record.contype
  FROM expected_constraints AS expected
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class
    ON class.relnamespace=namespace.oid AND class.relname=expected.table_name AND class.relkind='r'
  LEFT JOIN pg_catalog.pg_constraint AS constraint_record
    ON constraint_record.conrelid=class.oid AND constraint_record.conname=expected.constraint_name
)
SELECT table_name, constraint_name, contype AS observed_type,
       CASE WHEN oid IS NULL THEN 'EXPECTED_CONSTRAINT_ABSENT'
            WHEN contype=expected_type::"char" THEN 'EXPECTED_CONSTRAINT_PRESENT'
            ELSE 'CONSTRAINT_TYPE_CONFLICT'
       END AS sanitized_classification
FROM observed
ORDER BY table_name COLLATE "C", constraint_name COLLATE "C";

-- BLOCK D: exact function structural properties and sanitized definition hash; function is not invoked.
SELECT namespace.nspname AS function_schema,
       function.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(function.oid) AS identity_arguments,
       pg_catalog.pg_get_function_result(function.oid) AS return_type,
       language.lanname AS language,
       function.provolatile AS volatility,
       function.proparallel AS parallel_safety,
       function.prosecdef AS security_definer,
       function.proowner::pg_catalog.regrole AS owner,
       function.proconfig AS configured_settings,
       pg_catalog.md5(pg_catalog.pg_get_functiondef(function.oid)) AS function_definition_md5,
       CASE WHEN function.oid IS NULL THEN 'FUNCTION_ABSENT' ELSE 'FUNCTION_PRESENT_NOT_INVOKED' END AS sanitized_classification
FROM (SELECT 1) AS seed
LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
LEFT JOIN pg_catalog.pg_proc AS function
  ON function.pronamespace=namespace.oid
 AND function.proname='fid_execute_prospect_identifier_issuance_transaction'
 AND pg_catalog.pg_get_function_identity_arguments(function.oid)=
   'request_contract_version text, request_id text, operation_id text, idempotency_ref text, authorization_ref text, generation_invocation_ref text, generation_result_ref text, candidate_identifier text, identifier_layer text, namespace text, strategy_ref text, convention_ref text, generator_port_ref text, adapter_ref text, provider_ref text, attempt_number integer, attempt_policy_ref text, environment text, actor_ref text, expected_policy_refs jsonb, audit_refs jsonb'
LEFT JOIN pg_catalog.pg_language AS language ON language.oid=function.prolang;

-- BLOCK E1: exact expected policies with sanitized predicate-presence observations.
WITH expected_policies(table_name,policy_name,expected_command,expected_permissive) AS (
  VALUES
    ('fid_identifier_reservations','fid_identifier_reservations_public_deny','*',true),
    ('fid_identifier_reservations','fid_identifier_reservations_anon_deny','*',false),
    ('fid_identifier_reservations','fid_identifier_reservations_authenticated_deny','*',false),
    ('fid_identifier_reservations','fid_identifier_reservations_owner_select','r',true),
    ('fid_identifier_reservations','fid_identifier_reservations_owner_insert','a',true),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_public_deny','*',true),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_anon_deny','*',false),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_authenticated_deny','*',false),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_owner_select','r',true),
    ('fid_identifier_issuance_ledger','fid_identifier_issuance_ledger_owner_insert','a',true),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_public_deny','*',true),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_anon_deny','*',false),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_authenticated_deny','*',false),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_owner_select','r',true),
    ('fid_identifier_issuance_idempotency','fid_identifier_issuance_idempotency_owner_insert','a',true)
)
SELECT expected.table_name, expected.policy_name,
       policy.polcmd AS command, policy.polpermissive AS permissive,
       ARRAY(
         SELECT CASE WHEN policy_role.role_oid=0 THEN 'PUBLIC' ELSE role.rolname END
         FROM pg_catalog.unnest(policy.polroles) AS policy_role(role_oid)
         LEFT JOIN pg_catalog.pg_roles AS role ON role.oid=policy_role.role_oid
         ORDER BY CASE WHEN policy_role.role_oid=0 THEN 'PUBLIC' ELSE role.rolname END COLLATE "C"
       ) AS roles,
       policy.polqual IS NOT NULL AS using_predicate_present,
       policy.polwithcheck IS NOT NULL AS check_predicate_present,
       CASE WHEN policy.oid IS NULL THEN 'EXPECTED_POLICY_ABSENT'
            WHEN policy.polcmd=expected.expected_command::"char" AND policy.polpermissive=expected.expected_permissive THEN 'EXPECTED_POLICY_PRESENT'
            ELSE 'POLICY_PROPERTY_CONFLICT'
       END AS sanitized_classification
FROM expected_policies AS expected
LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
LEFT JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname=expected.table_name
LEFT JOIN pg_catalog.pg_policy AS policy ON policy.polrelid=class.oid AND policy.polname=expected.policy_name
ORDER BY expected.table_name COLLATE "C", expected.policy_name COLLATE "C";

-- BLOCK E2: effective table, schema, and function privileges for governed roles.
WITH roles(role_name) AS (VALUES ('PUBLIC'),('anon'),('authenticated'),('service_role'),('fid_function_owner')),
tables(table_name) AS (VALUES ('fid_identifier_reservations'),('fid_identifier_issuance_ledger'),('fid_identifier_issuance_idempotency')),
privileges(privilege_name) AS (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'))
SELECT roles.role_name, tables.table_name, privileges.privilege_name,
       CASE
         WHEN class.oid IS NULL THEN false
         WHEN roles.role_name='PUBLIC' THEN EXISTS (
           SELECT 1 FROM pg_catalog.aclexplode(COALESCE(class.relacl,pg_catalog.acldefault('r',class.relowner))) AS acl
           WHERE acl.grantee=0 AND acl.privilege_type=privileges.privilege_name
         )
         ELSE pg_catalog.has_table_privilege(roles.role_name,class.oid,privileges.privilege_name)
       END AS privilege_present
FROM roles CROSS JOIN tables CROSS JOIN privileges
LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
LEFT JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname=tables.table_name AND class.relkind='r'
ORDER BY roles.role_name COLLATE "C", tables.table_name COLLATE "C", privileges.privilege_name COLLATE "C";

SELECT role_name,
       CASE WHEN role_name='PUBLIC' THEN EXISTS (SELECT 1 FROM pg_catalog.pg_namespace AS namespace CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(namespace.nspacl,pg_catalog.acldefault('n',namespace.nspowner))) AS acl WHERE namespace.nspname='fid' AND acl.grantee=0 AND acl.privilege_type='USAGE') ELSE pg_catalog.has_schema_privilege(role_name,'fid','USAGE') END AS schema_usage,
       CASE WHEN role_name='PUBLIC' THEN EXISTS (SELECT 1 FROM pg_catalog.pg_namespace AS namespace CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(namespace.nspacl,pg_catalog.acldefault('n',namespace.nspowner))) AS acl WHERE namespace.nspname='fid' AND acl.grantee=0 AND acl.privilege_type='CREATE') ELSE pg_catalog.has_schema_privilege(role_name,'fid','CREATE') END AS schema_create
FROM (VALUES ('PUBLIC'),('anon'),('authenticated'),('service_role'),('fid_function_owner')) AS roles(role_name)
ORDER BY role_name COLLATE "C";

WITH function_oid AS (
  SELECT function.oid
  FROM pg_catalog.pg_proc AS function
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid=function.pronamespace
  WHERE namespace.nspname='fid'
    AND function.proname='fid_execute_prospect_identifier_issuance_transaction'
    AND pg_catalog.pg_get_function_identity_arguments(function.oid)=
      'request_contract_version text, request_id text, operation_id text, idempotency_ref text, authorization_ref text, generation_invocation_ref text, generation_result_ref text, candidate_identifier text, identifier_layer text, namespace text, strategy_ref text, convention_ref text, generator_port_ref text, adapter_ref text, provider_ref text, attempt_number integer, attempt_policy_ref text, environment text, actor_ref text, expected_policy_refs jsonb, audit_refs jsonb'
)
SELECT roles.role_name,
       CASE
         WHEN function_oid.oid IS NULL THEN false
         WHEN roles.role_name='PUBLIC' THEN EXISTS (SELECT 1 FROM pg_catalog.pg_proc AS function CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(function.proacl,pg_catalog.acldefault('f',function.proowner))) AS acl WHERE function.oid=function_oid.oid AND acl.grantee=0 AND acl.privilege_type='EXECUTE')
         ELSE pg_catalog.has_function_privilege(roles.role_name,function_oid.oid,'EXECUTE')
       END AS execute_privilege
FROM (VALUES ('PUBLIC'),('anon'),('authenticated'),('service_role'),('fid_function_owner')) AS roles(role_name)
LEFT JOIN function_oid ON true
ORDER BY roles.role_name COLLATE "C";

-- BLOCK F: exact row counts without returning payloads; absent tables remain classifiable.
WITH expected_tables(table_name) AS (
  VALUES ('fid_identifier_reservations'),('fid_identifier_issuance_ledger'),('fid_identifier_issuance_idempotency')
), counted AS (
  SELECT expected.table_name, class.oid,
         CASE WHEN class.oid IS NULL THEN NULL::bigint
              ELSE ((pg_catalog.xpath('/table/row/row_count/text()',
                pg_catalog.query_to_xml(pg_catalog.format('SELECT count(*) AS row_count FROM fid.%I',expected.table_name),false,true,'')))[1]::text)::bigint
         END AS row_count
  FROM expected_tables AS expected
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class
    ON class.relnamespace=namespace.oid AND class.relname=expected.table_name AND class.relkind='r'
)
SELECT table_name, row_count,
       CASE WHEN oid IS NULL THEN 'TABLE_ABSENT'
            WHEN row_count=0 THEN 'TABLE_PRESENT_EMPTY'
            ELSE 'TABLE_PRESENT_NONEMPTY_RECONCILIATION_REQUIRED'
       END AS sanitized_classification
FROM counted ORDER BY table_name COLLATE "C";

-- BLOCK G: governed migration metadata remains exact at migration 013; no rows are changed.
WITH expected_ids AS (
  SELECT ARRAY['fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables','fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function','fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification','013_record_fid_deployment_metadata']::text[] AS ids
), summary AS (
  SELECT COUNT(*)::integer AS total_metadata_rows,
         COUNT(*) FILTER (WHERE migration_id='013_record_fid_deployment_metadata' AND migration_sequence=13 AND deployment_status='DEPLOYED' AND verification_status='VERIFIED' AND applied_migration_ids=(SELECT ids FROM expected_ids) AND expected_migration_count=13)::integer AS exact_013_rows,
         COUNT(*) FILTER (WHERE migration_id COLLATE "C" LIKE '%014%' OR migration_sequence=14 OR 'fid-014-identifier-issuance-transaction'=ANY(applied_migration_ids))::integer AS migration_014_metadata_rows
  FROM fid.fid_persistence_migrations
)
SELECT total_metadata_rows, exact_013_rows, migration_014_metadata_rows,
       CASE WHEN total_metadata_rows=1 AND exact_013_rows=1 AND migration_014_metadata_rows=0 THEN 'MIGRATION_METADATA_REMAINS_EXACTLY_AT_VERIFIED_013'
            WHEN migration_014_metadata_rows>0 THEN 'UNEXPECTED_MIGRATION_014_METADATA_PRESENT'
            ELSE 'MIGRATION_METADATA_PARTIAL_DUPLICATED_OR_CONFLICTING'
       END AS sanitized_classification
FROM summary;

-- BLOCK H: catalog-derived commit-state classification. No statement order assumption is used.
WITH expected_tables(table_name,expected_columns) AS (
  VALUES ('fid_identifier_reservations',23),('fid_identifier_issuance_ledger',24),('fid_identifier_issuance_idempotency',26)
), expected_indexes(index_name) AS (
  VALUES ('fid_identifier_reservations_operation_idx'),('fid_identifier_reservations_authorization_idx'),('fid_identifier_issuance_ledger_operation_idx'),('fid_identifier_issuance_ledger_authorization_idx'),('fid_identifier_issuance_idempotency_request_idx'),('fid_identifier_issuance_idempotency_recovery_idx')
), expected_constraint_names AS (
  SELECT ARRAY[
    'fid_identifier_reservations_pkey','fid_identifier_reservations_transaction_unique','fid_identifier_reservations_operation_unique','fid_identifier_reservations_generation_result_unique','fid_identifier_reservations_namespace_candidate_unique','fid_identifier_reservations_transaction_binding_unique','fid_identifier_reservations_refs_nonempty','fid_identifier_reservations_references_distinct','fid_identifier_reservations_attempt_positive','fid_identifier_reservations_environment_check','fid_identifier_reservations_status_check','fid_identifier_reservations_policy_refs_check','fid_identifier_reservations_audit_refs_check','fid_identifier_reservations_candidate_check',
    'fid_identifier_issuance_ledger_pkey','fid_identifier_issuance_ledger_transaction_unique','fid_identifier_issuance_ledger_reservation_unique','fid_identifier_issuance_ledger_operation_unique','fid_identifier_issuance_ledger_outcome_binding_unique','fid_identifier_issuance_ledger_refs_distinct','fid_identifier_issuance_ledger_status_check','fid_identifier_issuance_ledger_reservation_fkey','fid_identifier_issuance_ledger_reservation_binding_fkey',
    'fid_identifier_issuance_idempotency_pkey','fid_identifier_issuance_idempotency_transaction_unique','fid_identifier_issuance_idempotency_operation_unique','fid_identifier_issuance_idempotency_generation_result_unique','fid_identifier_issuance_idempotency_reservation_unique','fid_identifier_issuance_idempotency_ledger_unique','fid_identifier_issuance_idempotency_ref_nonempty','fid_identifier_issuance_idempotency_attempt_positive','fid_identifier_issuance_idempotency_environment_check','fid_identifier_issuance_idempotency_outcome_check','fid_identifier_issuance_idempotency_reference_outcome_check','fid_identifier_issuance_idempotency_refs_distinct','fid_identifier_issuance_idempotency_reservation_fkey','fid_identifier_issuance_idempotency_ledger_fkey','fid_identifier_issuance_idempotency_outcome_binding_fkey'
  ]::text[] AS names
), expected_policy_names AS (
  SELECT ARRAY[
    'fid_identifier_reservations_public_deny','fid_identifier_reservations_anon_deny','fid_identifier_reservations_authenticated_deny','fid_identifier_reservations_owner_select','fid_identifier_reservations_owner_insert',
    'fid_identifier_issuance_ledger_public_deny','fid_identifier_issuance_ledger_anon_deny','fid_identifier_issuance_ledger_authenticated_deny','fid_identifier_issuance_ledger_owner_select','fid_identifier_issuance_ledger_owner_insert',
    'fid_identifier_issuance_idempotency_public_deny','fid_identifier_issuance_idempotency_anon_deny','fid_identifier_issuance_idempotency_authenticated_deny','fid_identifier_issuance_idempotency_owner_select','fid_identifier_issuance_idempotency_owner_insert'
  ]::text[] AS names
), table_state AS (
  SELECT COUNT(class.oid)::integer AS table_count,
         COUNT(class.oid) FILTER (WHERE class.relkind<>'r')::integer AS wrong_kind_count,
         COALESCE(SUM((SELECT COUNT(*) FROM pg_catalog.pg_attribute AS attribute WHERE attribute.attrelid=class.oid AND attribute.attnum>0 AND NOT attribute.attisdropped)),0)::integer AS column_count,
         COALESCE(SUM((SELECT COUNT(*) FROM pg_catalog.pg_constraint AS constraint_record WHERE constraint_record.conrelid=class.oid)),0)::integer AS constraint_count,
         COALESCE(SUM((SELECT COUNT(*) FROM pg_catalog.pg_constraint AS constraint_record WHERE constraint_record.conrelid=class.oid AND constraint_record.conname=ANY(expected_constraint_names.names))),0)::integer AS exact_constraint_count,
         COALESCE(SUM((SELECT COUNT(*) FROM pg_catalog.pg_constraint AS constraint_record WHERE constraint_record.conrelid=class.oid AND NOT constraint_record.conname=ANY(expected_constraint_names.names))),0)::integer AS unexpected_constraint_count,
         COUNT(class.oid) FILTER (WHERE class.relrowsecurity)::integer AS rls_count,
         COUNT(class.oid) FILTER (WHERE class.relforcerowsecurity)::integer AS forced_rls_count
  FROM expected_tables AS expected CROSS JOIN expected_constraint_names
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname=expected.table_name
), index_state AS (
  SELECT COUNT(class.oid) FILTER (WHERE class.relkind='i')::integer AS index_count,
         COUNT(class.oid) FILTER (WHERE class.relkind<>'i')::integer AS wrong_kind_count
  FROM expected_indexes AS expected
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname=expected.index_name
), function_state AS (
  SELECT COUNT(function.oid)::integer AS function_count,
         COUNT(function.oid) FILTER (WHERE function.proowner::pg_catalog.regrole::text='fid_function_owner' AND function.prosecdef AND function.provolatile='v' AND function.proparallel='u' AND function.proconfig=ARRAY['search_path=pg_catalog, fid']::text[])::integer AS exact_security_function_count,
         COUNT(function.oid) FILTER (WHERE pg_catalog.has_function_privilege('service_role',function.oid,'EXECUTE'))::integer AS service_execute_count,
         COUNT(function.oid) FILTER (WHERE pg_catalog.has_function_privilege('anon',function.oid,'EXECUTE') OR pg_catalog.has_function_privilege('authenticated',function.oid,'EXECUTE'))::integer AS browser_execute_count,
         COUNT(function.oid) FILTER (WHERE EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(function.proacl,pg_catalog.acldefault('f',function.proowner))) AS acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE'))::integer AS public_execute_count
  FROM pg_catalog.pg_namespace AS namespace
  LEFT JOIN pg_catalog.pg_proc AS function ON function.pronamespace=namespace.oid AND function.proname='fid_execute_prospect_identifier_issuance_transaction'
    AND pg_catalog.pg_get_function_identity_arguments(function.oid)='request_contract_version text, request_id text, operation_id text, idempotency_ref text, authorization_ref text, generation_invocation_ref text, generation_result_ref text, candidate_identifier text, identifier_layer text, namespace text, strategy_ref text, convention_ref text, generator_port_ref text, adapter_ref text, provider_ref text, attempt_number integer, attempt_policy_ref text, environment text, actor_ref text, expected_policy_refs jsonb, audit_refs jsonb'
  WHERE namespace.nspname='fid'
), policy_state AS (
  SELECT COUNT(policy.oid)::integer AS policy_count,
         COUNT(policy.oid) FILTER (WHERE policy.polname=ANY(expected_policy_names.names))::integer AS exact_policy_count,
         COUNT(policy.oid) FILTER (WHERE NOT policy.polname=ANY(expected_policy_names.names))::integer AS unexpected_policy_count
  FROM pg_catalog.pg_namespace AS namespace CROSS JOIN expected_policy_names
  JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname IN ('fid_identifier_reservations','fid_identifier_issuance_ledger','fid_identifier_issuance_idempotency')
  LEFT JOIN pg_catalog.pg_policy AS policy ON policy.polrelid=class.oid
  WHERE namespace.nspname='fid'
), acl_state AS (
  SELECT COUNT(*) FILTER (WHERE grantee_role.rolname='fid_function_owner' AND acl.privilege_type IN ('SELECT','INSERT'))::integer AS expected_owner_grants,
         COUNT(*) FILTER (WHERE (acl.grantee=0 OR grantee_role.rolname IN ('anon','authenticated','service_role')) OR (grantee_role.rolname='fid_function_owner' AND acl.privilege_type NOT IN ('SELECT','INSERT')))::integer AS forbidden_table_grants
  FROM pg_catalog.pg_namespace AS namespace
  JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname IN ('fid_identifier_reservations','fid_identifier_issuance_ledger','fid_identifier_issuance_idempotency')
  CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(class.relacl,pg_catalog.acldefault('r',class.relowner))) AS acl
  LEFT JOIN pg_catalog.pg_roles AS grantee_role ON grantee_role.oid=acl.grantee
  WHERE namespace.nspname='fid'
), row_state AS (
  SELECT COALESCE(SUM(CASE WHEN class.oid IS NULL THEN 0 ELSE ((pg_catalog.xpath('/table/row/row_count/text()',pg_catalog.query_to_xml(pg_catalog.format('SELECT count(*) AS row_count FROM fid.%I',expected.table_name),false,true,'')))[1]::text)::bigint END),0)::bigint AS total_rows
  FROM expected_tables AS expected
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class ON class.relnamespace=namespace.oid AND class.relname=expected.table_name AND class.relkind='r'
), metadata_state AS (
  SELECT COUNT(*) FILTER (WHERE migration_id COLLATE "C" LIKE '%014%' OR migration_sequence=14 OR 'fid-014-identifier-issuance-transaction'=ANY(applied_migration_ids))::integer AS migration_014_metadata_rows
  FROM fid.fid_persistence_migrations
), observed AS (
  SELECT table_state.*, index_state.index_count, index_state.wrong_kind_count AS wrong_index_kind_count,
         function_state.*, policy_state.policy_count, policy_state.exact_policy_count, policy_state.unexpected_policy_count, acl_state.expected_owner_grants, acl_state.forbidden_table_grants,
         row_state.total_rows, metadata_state.migration_014_metadata_rows
  FROM table_state CROSS JOIN index_state CROSS JOIN function_state CROSS JOIN policy_state CROSS JOIN acl_state CROSS JOIN row_state CROSS JOIN metadata_state
)
SELECT table_count, wrong_kind_count, column_count, constraint_count, exact_constraint_count, unexpected_constraint_count,
       rls_count, forced_rls_count, index_count, wrong_index_kind_count, function_count,
       exact_security_function_count, service_execute_count, browser_execute_count, public_execute_count,
       policy_count, exact_policy_count, unexpected_policy_count, expected_owner_grants, forbidden_table_grants,
       total_rows, migration_014_metadata_rows,
       CASE
         WHEN total_rows>0 OR migration_014_metadata_rows>0 OR wrong_kind_count>0 OR wrong_index_kind_count>0 OR unexpected_constraint_count>0 OR unexpected_policy_count>0
           THEN 'MIGRATION_014_STATE_INCONSISTENT_RECOVERY_REQUIRED'
         WHEN table_count=0 AND index_count=0 AND function_count=0 AND policy_count=0
           THEN 'MIGRATION_014_FULLY_ROLLED_BACK'
         WHEN table_count<3 OR index_count<6 OR function_count<1 OR column_count<73 OR constraint_count<38 OR exact_constraint_count<38
           THEN 'MIGRATION_014_PARTIALLY_APPLIED'
         WHEN table_count=3 AND index_count=6 AND function_count=1 AND column_count=73 AND constraint_count=38
          AND (exact_security_function_count<>1 OR rls_count<>3 OR forced_rls_count<>3 OR policy_count<>15 OR exact_policy_count<>15 OR expected_owner_grants<>6 OR forbidden_table_grants<>0 OR service_execute_count<>1 OR browser_execute_count<>0 OR public_execute_count<>0)
           THEN 'MIGRATION_014_STRUCTURALLY_APPLIED_OWNERSHIP_OR_PRIVILEGES_INCOMPLETE'
         WHEN table_count=3 AND index_count=6 AND function_count=1 AND column_count=73 AND constraint_count=38
          AND exact_constraint_count=38 AND unexpected_constraint_count=0 AND exact_security_function_count=1 AND rls_count=3 AND forced_rls_count=3 AND policy_count=15 AND exact_policy_count=15 AND unexpected_policy_count=0 AND expected_owner_grants=6 AND forbidden_table_grants=0 AND service_execute_count=1 AND browser_execute_count=0 AND public_execute_count=0
           THEN 'MIGRATION_014_FULLY_APPLIED_BUT_EXECUTION_RESPONSE_INCONSISTENT'
         ELSE 'MIGRATION_014_COMMIT_STATE_UNRESOLVED'
       END AS commit_state_classification
FROM observed;
