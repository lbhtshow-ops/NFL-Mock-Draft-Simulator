-- SPRINT 17C.2 STAGE 2 SUCCESSOR. READ-ONLY. MANUAL EXECUTION ONLY AFTER AUTHORIZATION.
-- Exact target: project ahmorpzcaapvoymiqlkv, verified separately in Supabase Dashboard.
-- Return the complete sanitized result sets for review. Stop after this preflight.

-- BLOCK 1: approved 017c session and database observations.
SELECT pg_catalog.current_setting('server_version') AS server_version,
       CURRENT_USER AS current_user,
       SESSION_USER AS session_user,
       pg_catalog.current_database() AS current_database;

-- BLOCK 2: zero-argument UUID capability identity only; the function is not invoked.
SELECT n.nspname AS function_schema, p.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_catalog.pg_get_function_result(p.oid) AS result_type,
       p.provolatile, p.prosecdef
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
WHERE n.nspname='pg_catalog' AND p.proname='gen_random_uuid'
  AND pg_catalog.pg_get_function_identity_arguments(p.oid)='';

-- BLOCK 3: required role existence and security-relevant attributes.
SELECT rolname, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls, rolinherit
FROM pg_catalog.pg_roles
WHERE rolname IN ('service_role','anon','authenticated','fid_function_owner')
ORDER BY rolname COLLATE "C";

-- BLOCK 4: FID schema ownership and relevant current/target role privileges.
SELECT nspname, nspowner::pg_catalog.regrole AS schema_owner,
       pg_catalog.has_schema_privilege(CURRENT_USER,nspname,'USAGE') AS current_user_usage,
       pg_catalog.has_schema_privilege(CURRENT_USER,nspname,'CREATE') AS current_user_create,
       pg_catalog.has_schema_privilege('fid_function_owner',nspname,'USAGE') AS function_owner_usage,
       pg_catalog.has_schema_privilege('service_role',nspname,'USAGE') AS service_role_usage
FROM pg_catalog.pg_namespace WHERE nspname='fid';

-- BLOCK 5: migration 014 table and RPC conflicts.
SELECT c.relkind, n.nspname, c.relname, c.relowner::pg_catalog.regrole AS owner
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relname IN ('fid_identifier_reservations','fid_identifier_issuance_ledger','fid_identifier_issuance_idempotency')
UNION ALL
SELECT 'f', n.nspname, p.proname, p.proowner::pg_catalog.regrole
FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction';

-- BLOCK 6: approved existing FID table inventory estimates.
SELECT c.relname, c.reltuples::bigint AS planner_estimated_rows
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relkind='r' ORDER BY c.relname COLLATE "C";

-- BLOCK 7: exact governed migration 001-013 metadata summary.
WITH expected AS (
  SELECT ARRAY[
    'fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables',
    'fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function',
    'fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification',
    '013_record_fid_deployment_metadata'
  ]::text[] AS migration_ids
), observed AS (
  SELECT metadata.*
  FROM fid.fid_persistence_migrations AS metadata
), classified AS (
  SELECT COUNT(*)::integer AS total_metadata_rows,
         COUNT(*) FILTER (
           WHERE migration_id='013_record_fid_deployment_metadata'
             AND schema_version='FID-SUPABASE-SCHEMA-V1'
             AND package_version='FID-SUPABASE-TEST-DEPLOYMENT-1.0.1'
             AND deployment_environment='DEDICATED_NON_PRODUCTION_TEST'
             AND deployment_status='DEPLOYED'
             AND verification_status='VERIFIED'
             AND migration_sequence=13
             AND applied_migration_ids=(SELECT migration_ids FROM expected)
             AND expected_migration_count=13
             AND compatibility_floor='FID-SUPABASE-SCHEMA-V1'
             AND compatibility_ceiling='FID-SUPABASE-SCHEMA-V1'
             AND recorded_at='2026-07-18T03:12:05Z'::timestamptz
         )::integer AS exact_governed_rows,
         COALESCE(SUM(pg_catalog.cardinality(applied_migration_ids)),0)::integer AS recorded_identifier_occurrences
  FROM observed
)
SELECT total_metadata_rows, exact_governed_rows, recorded_identifier_occurrences,
       CASE
         WHEN total_metadata_rows=1 AND exact_governed_rows=1 AND recorded_identifier_occurrences=13
           THEN 'EXACT_MIGRATIONS_001_THROUGH_013_APPLIED_AND_VERIFIED'
         WHEN total_metadata_rows=0 THEN 'MIGRATION_METADATA_MISSING'
         WHEN exact_governed_rows=0 THEN 'MIGRATION_METADATA_CONFLICTING_OR_PARTIAL'
         ELSE 'MIGRATION_METADATA_DUPLICATED_OR_UNEXPECTED'
       END AS sanitized_classification
FROM classified;

-- BLOCK 8: sanitized per-identifier presence, duplication, and unexpected-identifier review.
WITH expected AS (
  SELECT migration_id, ordinal_position::integer
  FROM pg_catalog.unnest(ARRAY[
    'fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables',
    'fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function',
    'fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification',
    '013_record_fid_deployment_metadata'
  ]::text[]) WITH ORDINALITY AS expected_ids(migration_id,ordinal_position)
), recorded AS (
  SELECT applied_id AS migration_id, COUNT(*)::integer AS occurrence_count
  FROM fid.fid_persistence_migrations AS metadata
  CROSS JOIN LATERAL pg_catalog.unnest(metadata.applied_migration_ids) AS applied(applied_id)
  GROUP BY applied_id
), expected_results AS (
  SELECT expected.ordinal_position, expected.migration_id,
         COALESCE(recorded.occurrence_count,0) AS occurrence_count,
         CASE COALESCE(recorded.occurrence_count,0)
           WHEN 0 THEN 'MISSING'
           WHEN 1 THEN 'EXACT'
           ELSE 'DUPLICATED'
         END AS sanitized_classification
  FROM expected LEFT JOIN recorded USING (migration_id)
), unexpected_results AS (
  SELECT NULL::integer AS ordinal_position, recorded.migration_id, recorded.occurrence_count,
         'UNEXPECTED'::text AS sanitized_classification
  FROM recorded LEFT JOIN expected USING (migration_id)
  WHERE expected.migration_id IS NULL
)
SELECT ordinal_position, migration_id, occurrence_count, sanitized_classification
FROM expected_results
UNION ALL
SELECT ordinal_position, migration_id, occurrence_count, sanitized_classification
FROM unexpected_results
ORDER BY ordinal_position NULLS LAST, migration_id COLLATE "C";

-- BLOCK 9: read-only ownership-transfer capability and schema compatibility.
WITH executing_role AS (
  SELECT role.oid, role.rolname, role.rolsuper
  FROM pg_catalog.pg_roles AS role
  WHERE role.rolname=CURRENT_USER
), target_role AS (
  SELECT role.oid, role.rolname
  FROM pg_catalog.pg_roles AS role
  WHERE role.rolname='fid_function_owner'
), fid_schema AS (
  SELECT namespace.oid, namespace.nspowner
  FROM pg_catalog.pg_namespace AS namespace
  WHERE namespace.nspname='fid'
)
SELECT executing_role.rolname AS executing_role,
       target_role.rolname AS target_owner_role,
       executing_role.rolsuper AS executing_role_superuser,
       CASE WHEN target_role.oid IS NULL THEN false
            ELSE pg_catalog.pg_has_role(executing_role.oid,target_role.oid,'MEMBER') END AS executing_role_is_target_member,
       pg_catalog.has_schema_privilege(executing_role.oid,fid_schema.oid,'USAGE') AS executing_role_schema_usage,
       pg_catalog.has_schema_privilege(executing_role.oid,fid_schema.oid,'CREATE') AS executing_role_schema_create,
       CASE WHEN target_role.oid IS NULL THEN false
            ELSE pg_catalog.has_schema_privilege(target_role.oid,fid_schema.oid,'USAGE') END AS target_owner_schema_usage,
       CASE
         WHEN target_role.oid IS NULL THEN 'TARGET_OWNER_ROLE_MISSING'
         WHEN executing_role.rolsuper
           AND pg_catalog.has_schema_privilege(executing_role.oid,fid_schema.oid,'CREATE')
           AND pg_catalog.has_schema_privilege(target_role.oid,fid_schema.oid,'USAGE')
           THEN 'OWNERSHIP_TRANSFER_CAPABILITY_CONFIRMED_BY_SUPERUSER'
         WHEN pg_catalog.pg_has_role(executing_role.oid,target_role.oid,'MEMBER')
           AND pg_catalog.has_schema_privilege(executing_role.oid,fid_schema.oid,'CREATE')
           AND pg_catalog.has_schema_privilege(target_role.oid,fid_schema.oid,'USAGE')
           THEN 'OWNERSHIP_TRANSFER_CAPABILITY_CONFIRMED_BY_MEMBERSHIP'
         ELSE 'OWNERSHIP_TRANSFER_CAPABILITY_NOT_CONFIRMED'
       END AS sanitized_classification
FROM executing_role CROSS JOIN fid_schema LEFT JOIN target_role ON true;

-- BLOCK 10: exact migration 014 schema-scoped index-name conflicts.
WITH expected_indexes(index_name,ordinal_position) AS (
  VALUES
    ('fid_identifier_reservations_operation_idx'::text,1),
    ('fid_identifier_reservations_authorization_idx'::text,2),
    ('fid_identifier_issuance_ledger_operation_idx'::text,3),
    ('fid_identifier_issuance_ledger_authorization_idx'::text,4),
    ('fid_identifier_issuance_idempotency_request_idx'::text,5),
    ('fid_identifier_issuance_idempotency_recovery_idx'::text,6)
), conflicts AS (
  SELECT expected_indexes.ordinal_position, expected_indexes.index_name,
         COUNT(class.oid)::integer AS conflicting_relation_count,
         pg_catalog.string_agg(DISTINCT class.relkind::text,',' ORDER BY class.relkind::text) AS conflicting_relation_kinds
  FROM expected_indexes
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname='fid'
  LEFT JOIN pg_catalog.pg_class AS class
    ON class.relnamespace=namespace.oid AND class.relname=expected_indexes.index_name
  GROUP BY expected_indexes.ordinal_position, expected_indexes.index_name
)
SELECT ordinal_position, index_name, conflicting_relation_count, conflicting_relation_kinds,
       CASE WHEN conflicting_relation_count=0 THEN 'AVAILABLE' ELSE 'CONFLICT' END AS sanitized_classification
FROM conflicts ORDER BY ordinal_position;
