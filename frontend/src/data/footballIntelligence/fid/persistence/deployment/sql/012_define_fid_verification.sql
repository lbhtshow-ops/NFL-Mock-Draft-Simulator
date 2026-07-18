-- Authoritative read-only PostgreSQL/Supabase deployment acceptance oracle.
WITH expected_tables(table_name) AS (
  VALUES
    ('fid_record_revisions'::text),
    ('fid_persistence_idempotency'::text),
    ('fid_persistence_batches'::text),
    ('fid_persistence_batch_operations'::text),
    ('fid_persistence_effect_receipts'::text),
    ('fid_persistence_audit_events'::text),
    ('fid_persistence_migrations'::text)
),
observed_tables(table_name) AS (
  SELECT t.table_name::text COLLATE "C"
  FROM information_schema.tables AS t
  WHERE (t.table_schema::text COLLATE "C") = ('fid'::text COLLATE "C")
    AND (t.table_type::text COLLATE "C") = ('BASE TABLE'::text COLLATE "C")
),
comparison AS (
  SELECT
    (SELECT pg_catalog.jsonb_agg(e.table_name ORDER BY e.table_name COLLATE "C") FROM expected_tables AS e) AS expected_value,
    (SELECT pg_catalog.jsonb_agg(o.table_name ORDER BY o.table_name COLLATE "C") FROM observed_tables AS o) AS observed_value
)
SELECT
  'tables.exact_inventory'::text AS verification_key,
  c.expected_value,
  c.observed_value,
  CASE WHEN c.observed_value = c.expected_value THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact inventory of seven governed FID persistence tables.'::text AS details
FROM comparison AS c;

WITH expected_counts(table_name, column_count) AS (
  VALUES
    ('fid_record_revisions'::text, 34::integer),
    ('fid_persistence_idempotency'::text, 14::integer),
    ('fid_persistence_batches'::text, 15::integer),
    ('fid_persistence_batch_operations'::text, 10::integer),
    ('fid_persistence_effect_receipts'::text, 19::integer),
    ('fid_persistence_audit_events'::text, 14::integer),
    ('fid_persistence_migrations'::text, 12::integer)
),
observed_counts(table_name, column_count) AS (
  SELECT c.table_name::text COLLATE "C", pg_catalog.count(*)::integer
  FROM information_schema.columns AS c
  WHERE (c.table_schema::text COLLATE "C") = ('fid'::text COLLATE "C")
  GROUP BY c.table_name::text COLLATE "C"
)
SELECT
  ('columns.count.'::text || e.table_name)::text AS verification_key,
  pg_catalog.to_jsonb(e.column_count) AS expected_value,
  pg_catalog.to_jsonb(o.column_count) AS observed_value,
  CASE WHEN o.column_count = e.column_count THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact table column count.'::text AS details
FROM expected_counts AS e
LEFT JOIN observed_counts AS o ON (e.table_name COLLATE "C") = (o.table_name COLLATE "C")
ORDER BY e.table_name COLLATE "C";

WITH expected_columns(ordinal_position, column_name, data_type, is_nullable, column_default) AS (
  VALUES
    (1::integer, 'persistence_id'::text, 'text'::text, 'NO'::text, NULL::text),
    (2::integer, 'canonical_record_id'::text, 'text'::text, 'NO'::text, NULL::text),
    (3::integer, 'record_revision'::text, 'integer'::text, 'NO'::text, NULL::text),
    (4::integer, 'predecessor_persistence_id'::text, 'text'::text, 'YES'::text, NULL::text),
    (5::integer, 'predecessor_record_id'::text, 'text'::text, 'YES'::text, NULL::text),
    (6::integer, 'predecessor_revision'::text, 'integer'::text, 'YES'::text, NULL::text),
    (7::integer, 'target_contract'::text, 'text'::text, 'NO'::text, NULL::text),
    (8::integer, 'contract_version'::text, 'text'::text, 'NO'::text, NULL::text),
    (9::integer, 'schema_version'::text, 'text'::text, 'NO'::text, NULL::text),
    (10::integer, 'persistence_envelope'::text, 'jsonb'::text, 'NO'::text, NULL::text),
    (11::integer, 'record_payload'::text, 'jsonb'::text, 'NO'::text, NULL::text),
    (12::integer, 'source_refs'::text, 'ARRAY'::text, 'NO'::text, NULL::text),
    (13::integer, 'evidence_refs'::text, 'ARRAY'::text, 'NO'::text, NULL::text),
    (14::integer, 'review_refs'::text, 'ARRAY'::text, 'NO'::text, NULL::text),
    (15::integer, 'blocker_refs'::text, 'ARRAY'::text, 'NO'::text, NULL::text),
    (16::integer, 'verification'::text, 'jsonb'::text, 'NO'::text, NULL::text),
    (17::integer, 'provenance'::text, 'jsonb'::text, 'NO'::text, NULL::text),
    (18::integer, 'lifecycle'::text, 'jsonb'::text, 'NO'::text, NULL::text),
    (19::integer, 'notes'::text, 'text'::text, 'YES'::text, NULL::text),
    (20::integer, 'extensions'::text, 'jsonb'::text, 'NO'::text, NULL::text),
    (21::integer, 'created_at'::text, 'timestamp with time zone'::text, 'NO'::text, NULL::text),
    (22::integer, 'created_by'::text, 'text'::text, 'NO'::text, NULL::text),
    (23::integer, 'request_id'::text, 'text'::text, 'NO'::text, NULL::text),
    (24::integer, 'operation_id'::text, 'text'::text, 'NO'::text, NULL::text),
    (25::integer, 'batch_id'::text, 'text'::text, 'YES'::text, NULL::text),
    (26::integer, 'idempotency_key'::text, 'text'::text, 'YES'::text, NULL::text),
    (27::integer, 'content_hash'::text, 'text'::text, 'NO'::text, NULL::text),
    (28::integer, 'status'::text, 'text'::text, 'NO'::text, NULL::text),
    (29::integer, 'relationship_source_contract'::text, 'text'::text, 'YES'::text, NULL::text),
    (30::integer, 'relationship_source_record_id'::text, 'text'::text, 'YES'::text, NULL::text),
    (31::integer, 'relationship_target_contract'::text, 'text'::text, 'YES'::text, NULL::text),
    (32::integer, 'relationship_target_record_id'::text, 'text'::text, 'YES'::text, NULL::text),
    (33::integer, 'relationship_type'::text, 'text'::text, 'YES'::text, NULL::text),
    (34::integer, 'relationship_direction'::text, 'text'::text, 'YES'::text, NULL::text)
),
observed_columns(ordinal_position, column_name, data_type, is_nullable, column_default) AS (
  SELECT
    c.ordinal_position::integer,
    c.column_name::text COLLATE "C",
    c.data_type::text COLLATE "C",
    c.is_nullable::text COLLATE "C",
    c.column_default::text COLLATE "C"
  FROM information_schema.columns AS c
  WHERE (c.table_schema::text COLLATE "C") = ('fid'::text COLLATE "C")
    AND (c.table_name::text COLLATE "C") = ('fid_record_revisions'::text COLLATE "C")
)
SELECT
  (('canonical_column.'::text COLLATE "C") || COALESCE(e.column_name COLLATE "C", o.column_name COLLATE "C"))::text AS verification_key,
  pg_catalog.to_jsonb(e) AS expected_value,
  pg_catalog.to_jsonb(o) AS observed_value,
  CASE WHEN
    e.ordinal_position IS NOT DISTINCT FROM o.ordinal_position
    AND (e.column_name COLLATE "C") IS NOT DISTINCT FROM (o.column_name COLLATE "C")
    AND (e.data_type COLLATE "C") IS NOT DISTINCT FROM (o.data_type COLLATE "C")
    AND (e.is_nullable COLLATE "C") IS NOT DISTINCT FROM (o.is_nullable COLLATE "C")
    AND (e.column_default COLLATE "C") IS NOT DISTINCT FROM (o.column_default COLLATE "C")
  THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact canonical column ordinal, name, type, nullability, and default.'::text AS details
FROM expected_columns AS e
FULL JOIN observed_columns AS o USING (ordinal_position)
ORDER BY COALESCE(e.ordinal_position, o.ordinal_position);

WITH expected_constraints(constraint_name) AS (
  VALUES
    ('fid_record_revisions_pk'::text), ('fid_record_revision_unique'::text),
    ('fid_predecessor_fk'::text), ('fid_revision_positive_check'::text),
    ('fid_revision_shape_check'::text), ('fid_relationship_projection_shape_check'::text),
    ('fid_persistence_idempotency_pk'::text), ('fid_persistence_idempotency_request_hash_unique'::text),
    ('fid_persistence_batches_pk'::text), ('fid_batch_count_check'::text),
    ('fid_persistence_batch_operations_pk'::text), ('fid_batch_operation_order_unique'::text),
    ('fid_batch_operation_batch_fk'::text), ('fid_batch_operation_index_check'::text),
    ('fid_persistence_effect_receipts_pk'::text), ('fid_effect_receipt_batch_fk'::text),
    ('fid_persistence_audit_events_pk'::text), ('fid_persistence_migrations_pk'::text),
    ('fid_schema_version_environment_unique'::text)
),
observed_constraints(constraint_name) AS (
  SELECT con.conname::text COLLATE "C"
  FROM pg_catalog.pg_constraint AS con
  JOIN pg_catalog.pg_class AS cls ON cls.oid = con.conrelid
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = cls.relnamespace
  WHERE (ns.nspname::text COLLATE "C") = ('fid'::text COLLATE "C")
),
comparison AS (
  SELECT
    (SELECT pg_catalog.jsonb_agg(e.constraint_name ORDER BY e.constraint_name COLLATE "C") FROM expected_constraints AS e) AS expected_value,
    (SELECT pg_catalog.jsonb_agg(o.constraint_name ORDER BY o.constraint_name COLLATE "C") FROM observed_constraints AS o) AS observed_value
)
SELECT
  'constraints.exact_inventory'::text AS verification_key,
  c.expected_value,
  c.observed_value,
  CASE WHEN c.observed_value = c.expected_value THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact constraint inventory for the seven governed tables.'::text AS details
FROM comparison AS c;

WITH expected_indexes(index_name) AS (
  VALUES
    ('fid_record_revisions_pk'::text), ('fid_record_revision_unique'::text),
    ('fid_record_latest_lookup_idx'::text), ('fid_record_predecessor_idx'::text),
    ('fid_relationship_source_idx'::text), ('fid_relationship_target_idx'::text),
    ('fid_relationship_type_direction_idx'::text), ('fid_persistence_idempotency_pk'::text),
    ('fid_persistence_idempotency_request_hash_unique'::text), ('fid_idempotency_batch_idx'::text),
    ('fid_persistence_batches_pk'::text), ('fid_persistence_batch_operations_pk'::text),
    ('fid_batch_operation_order_unique'::text), ('fid_batch_operation_order_idx'::text),
    ('fid_persistence_effect_receipts_pk'::text), ('fid_effect_receipt_batch_idx'::text),
    ('fid_persistence_audit_events_pk'::text), ('fid_audit_batch_time_idx'::text),
    ('fid_persistence_migrations_pk'::text), ('fid_schema_version_environment_unique'::text),
    ('fid_migration_sequence_idx'::text)
),
observed_indexes(index_name) AS (
  SELECT i.indexname::text COLLATE "C"
  FROM pg_catalog.pg_indexes AS i
  WHERE (i.schemaname::text COLLATE "C") = ('fid'::text COLLATE "C")
),
comparison AS (
  SELECT
    (SELECT pg_catalog.jsonb_agg(e.index_name ORDER BY e.index_name COLLATE "C") FROM expected_indexes AS e) AS expected_value,
    (SELECT pg_catalog.jsonb_agg(o.index_name ORDER BY o.index_name COLLATE "C") FROM observed_indexes AS o) AS observed_value
)
SELECT
  'indexes.exact_inventory'::text AS verification_key,
  c.expected_value,
  c.observed_value,
  CASE WHEN c.observed_value = c.expected_value THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact explicit and constraint-owned index inventory.'::text AS details
FROM comparison AS c;

WITH expected_function(function_name, arguments, result_type, default_count, volatility, parallel_mode, security_definer, owner_name, configuration) AS (
  VALUES (
    'fid_execute_atomic_persistence_batch'::text,
    'batch_id text, ordered_operations jsonb, requested_atomicity text, preconditions jsonb, expected_repository jsonb, idempotency jsonb, audit jsonb, source_refs jsonb'::text,
    'jsonb'::text, 0::integer, 'v'::text, 'u'::text, true::boolean,
    'fid_function_owner'::text, ARRAY['search_path=pg_catalog, fid']::text[]
  )
),
observed_functions(function_name, arguments, result_type, default_count, volatility, parallel_mode, security_definer, owner_name, configuration) AS (
  SELECT
    proc.proname::text COLLATE "C",
    pg_catalog.pg_get_function_identity_arguments(proc.oid)::text COLLATE "C",
    pg_catalog.pg_get_function_result(proc.oid)::text COLLATE "C",
    proc.pronargdefaults::integer,
    proc.provolatile::text COLLATE "C",
    proc.proparallel::text COLLATE "C",
    proc.prosecdef,
    owner_role.rolname::text COLLATE "C",
    proc.proconfig::text[] COLLATE "C"
  FROM pg_catalog.pg_proc AS proc
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = proc.pronamespace
  JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = proc.proowner
  WHERE (ns.nspname::text COLLATE "C") = ('fid'::text COLLATE "C")
),
exact_comparison AS (
  SELECT
    pg_catalog.to_jsonb(e) AS expected_value,
    pg_catalog.to_jsonb(o) AS observed_value,
    (e.function_name COLLATE "C") IS NOT DISTINCT FROM (o.function_name COLLATE "C")
    AND (e.arguments COLLATE "C") IS NOT DISTINCT FROM (o.arguments COLLATE "C")
    AND (e.result_type COLLATE "C") IS NOT DISTINCT FROM (o.result_type COLLATE "C")
    AND e.default_count IS NOT DISTINCT FROM o.default_count
    AND (e.volatility COLLATE "C") IS NOT DISTINCT FROM (o.volatility COLLATE "C")
    AND (e.parallel_mode COLLATE "C") IS NOT DISTINCT FROM (o.parallel_mode COLLATE "C")
    AND e.security_definer IS NOT DISTINCT FROM o.security_definer
    AND (e.owner_name COLLATE "C") IS NOT DISTINCT FROM (o.owner_name COLLATE "C")
    AND pg_catalog.to_jsonb(e.configuration) IS NOT DISTINCT FROM pg_catalog.to_jsonb(o.configuration) AS exact_match
  FROM expected_function AS e
  FULL JOIN observed_functions AS o ON (o.function_name COLLATE "C") = (e.function_name COLLATE "C")
),
function_count AS (
  SELECT pg_catalog.count(*)::integer AS observed_count FROM observed_functions
)
SELECT
  'function.atomic.exact'::text AS verification_key,
  c.expected_value,
  c.observed_value,
  CASE WHEN c.exact_match THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact function schema, identity arguments, return type, defaults, volatility, parallel mode, security, owner, and search path.'::text AS details
FROM exact_comparison AS c
UNION ALL
SELECT
  'functions.no_unexpected'::text,
  pg_catalog.to_jsonb(1::integer),
  pg_catalog.to_jsonb(fc.observed_count),
  CASE WHEN fc.observed_count = 1 THEN 'PASS'::text ELSE 'FAIL'::text END,
  'No unexpected additional functions exist in schema fid.'::text
FROM function_count AS fc;

WITH expected_tables(table_name) AS (
  VALUES
    ('fid_record_revisions'::text), ('fid_persistence_idempotency'::text),
    ('fid_persistence_batches'::text), ('fid_persistence_batch_operations'::text),
    ('fid_persistence_effect_receipts'::text), ('fid_persistence_audit_events'::text),
    ('fid_persistence_migrations'::text)
),
observed_rls(table_name, rls_enabled, rls_forced) AS (
  SELECT cls.relname::text COLLATE "C", cls.relrowsecurity, cls.relforcerowsecurity
  FROM pg_catalog.pg_class AS cls
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = cls.relnamespace
  WHERE (ns.nspname::text COLLATE "C") = ('fid'::text COLLATE "C") AND cls.relkind = 'r'::"char"
),
comparison AS (
  SELECT
    e.table_name,
    o.rls_enabled,
    o.rls_forced
  FROM expected_tables AS e
  LEFT JOIN observed_rls AS o ON (e.table_name COLLATE "C") = (o.table_name COLLATE "C")
)
SELECT
  'rls.all_seven_enabled_forced'::text AS verification_key,
  pg_catalog.jsonb_build_object('tableCount', 7, 'rlsEnabled', true, 'rlsForced', true) AS expected_value,
  pg_catalog.jsonb_build_object(
    'tableCount', pg_catalog.count(*),
    'rlsEnabled', pg_catalog.count(*) FILTER (WHERE c.rls_enabled),
    'rlsForced', pg_catalog.count(*) FILTER (WHERE c.rls_forced)
  ) AS observed_value,
  CASE WHEN pg_catalog.count(*) = 7 AND pg_catalog.bool_and(c.rls_enabled) AND pg_catalog.bool_and(c.rls_forced) THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'All seven governed tables have RLS enabled and FORCE RLS enabled.'::text AS details
FROM comparison AS c;

WITH governed_tables(table_name, owner_policy_count) AS (
  VALUES
    ('fid_record_revisions'::text, 2::integer),
    ('fid_persistence_idempotency'::text, 3::integer),
    ('fid_persistence_batches'::text, 3::integer),
    ('fid_persistence_batch_operations'::text, 3::integer),
    ('fid_persistence_effect_receipts'::text, 2::integer),
    ('fid_persistence_audit_events'::text, 2::integer),
    ('fid_persistence_migrations'::text, 0::integer)
),
observed_policies AS (
  SELECT
    policy.tablename::text COLLATE "C" AS table_name,
    policy.policyname::text COLLATE "C" AS policy_name,
    policy.permissive::text COLLATE "C" AS permissive_mode,
    CASE WHEN pg_catalog.cardinality(policy.roles) = 1 THEN policy.roles[1]::text COLLATE "C" ELSE NULL::text COLLATE "C" END AS role_name,
    policy.cmd::text COLLATE "C" AS command_name,
    policy.qual::text COLLATE "C" AS using_expression,
    policy.with_check::text COLLATE "C" AS check_expression
  FROM pg_catalog.pg_policies AS policy
  WHERE (policy.schemaname::text COLLATE "C") = ('fid'::text COLLATE "C")
),
classified AS (
  SELECT
    p.*,
    (p.role_name COLLATE "C") = ('fid_function_owner'::text COLLATE "C") AS is_owner,
    CASE
      WHEN (p.role_name COLLATE "C") = ('fid_function_owner'::text COLLATE "C") THEN
        (p.permissive_mode COLLATE "C") = ('PERMISSIVE'::text COLLATE "C")
        AND (p.policy_name COLLATE "C") = ((p.table_name COLLATE "C") || ('_fid_function_owner_'::text COLLATE "C") || pg_catalog.lower(p.command_name COLLATE "C") || ('_allow'::text COLLATE "C"))
        AND (
          ((p.command_name COLLATE "C") IN ('SELECT'::text COLLATE "C", 'DELETE'::text COLLATE "C") AND (p.using_expression COLLATE "C") = ('true'::text COLLATE "C") AND p.check_expression IS NULL)
          OR ((p.command_name COLLATE "C") = ('INSERT'::text COLLATE "C") AND p.using_expression IS NULL AND (p.check_expression COLLATE "C") = ('true'::text COLLATE "C"))
          OR ((p.command_name COLLATE "C") = ('UPDATE'::text COLLATE "C") AND (p.using_expression COLLATE "C") = ('true'::text COLLATE "C") AND (p.check_expression COLLATE "C") = ('true'::text COLLATE "C"))
        )
      WHEN (p.role_name COLLATE "C") IN ('public'::text COLLATE "C", 'anon'::text COLLATE "C", 'authenticated'::text COLLATE "C") THEN
        (p.permissive_mode COLLATE "C") = (CASE WHEN (p.role_name COLLATE "C") = ('public'::text COLLATE "C") THEN 'PERMISSIVE'::text COLLATE "C" ELSE 'RESTRICTIVE'::text COLLATE "C" END)
        AND (p.policy_name COLLATE "C") = ((p.table_name COLLATE "C") || ('_'::text COLLATE "C") || (p.role_name COLLATE "C") || ('_'::text COLLATE "C") || pg_catalog.lower(p.command_name COLLATE "C") || ('_deny'::text COLLATE "C"))
        AND (
          ((p.command_name COLLATE "C") IN ('SELECT'::text COLLATE "C", 'DELETE'::text COLLATE "C") AND (p.using_expression COLLATE "C") = ('false'::text COLLATE "C") AND p.check_expression IS NULL)
          OR ((p.command_name COLLATE "C") = ('INSERT'::text COLLATE "C") AND p.using_expression IS NULL AND (p.check_expression COLLATE "C") = ('false'::text COLLATE "C"))
          OR ((p.command_name COLLATE "C") = ('UPDATE'::text COLLATE "C") AND (p.using_expression COLLATE "C") = ('false'::text COLLATE "C") AND (p.check_expression COLLATE "C") = ('false'::text COLLATE "C"))
        )
      ELSE false
    END AS shape_valid
  FROM observed_policies AS p
),
per_table AS (
  SELECT
    g.table_name,
    g.owner_policy_count,
    pg_catalog.count(c.policy_name)::integer AS total_count,
    pg_catalog.count(c.policy_name) FILTER (WHERE c.is_owner)::integer AS owner_count,
    pg_catalog.count(c.policy_name) FILTER (WHERE NOT c.is_owner)::integer AS browser_count,
    pg_catalog.count(c.policy_name) FILTER (WHERE NOT c.shape_valid)::integer AS invalid_count
  FROM governed_tables AS g
  LEFT JOIN classified AS c ON (g.table_name COLLATE "C") = (c.table_name COLLATE "C")
  GROUP BY g.table_name, g.owner_policy_count
),
summary AS (
  SELECT
    (SELECT pg_catalog.count(*)::integer FROM observed_policies) AS total_count,
    (SELECT pg_catalog.count(*)::integer FROM classified WHERE is_owner) AS owner_count,
    (SELECT pg_catalog.count(*)::integer FROM classified WHERE NOT is_owner) AS browser_count,
    (SELECT pg_catalog.count(*)::integer FROM classified WHERE NOT shape_valid) AS invalid_count,
    pg_catalog.bool_and(p.total_count = 12 + p.owner_policy_count AND p.owner_count = p.owner_policy_count AND p.browser_count = 12 AND p.invalid_count = 0) AS per_table_valid
  FROM per_table AS p
)
SELECT
  'policies.exact_count_and_shape'::text AS verification_key,
  pg_catalog.jsonb_build_object('total', 99, 'ownerAllow', 15, 'browserDeny', 84, 'invalid', 0, 'perTableValid', true) AS expected_value,
  pg_catalog.jsonb_build_object('total', s.total_count, 'ownerAllow', s.owner_count, 'browserDeny', s.browser_count, 'invalid', s.invalid_count, 'perTableValid', s.per_table_valid) AS observed_value,
  CASE WHEN s.total_count = 99 AND s.owner_count = 15 AND s.browser_count = 84 AND s.invalid_count = 0 AND s.per_table_valid THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exact 99-policy inventory with command-specific NULL-aware deny and allow shapes.'::text AS details
FROM summary AS s;

WITH governed_tables(table_name, owner_allowed_privileges) AS (
  VALUES
    ('fid_record_revisions'::text, ARRAY['SELECT', 'INSERT']::text[]),
    ('fid_persistence_idempotency'::text, ARRAY['SELECT', 'INSERT', 'UPDATE']::text[]),
    ('fid_persistence_batches'::text, ARRAY['SELECT', 'INSERT', 'UPDATE']::text[]),
    ('fid_persistence_batch_operations'::text, ARRAY['SELECT', 'INSERT', 'UPDATE']::text[]),
    ('fid_persistence_effect_receipts'::text, ARRAY['SELECT', 'INSERT']::text[]),
    ('fid_persistence_audit_events'::text, ARRAY['SELECT', 'INSERT']::text[]),
    ('fid_persistence_migrations'::text, ARRAY[]::text[])
),
table_privilege_names(privilege_name) AS (
  VALUES ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text), ('DELETE'::text), ('TRUNCATE'::text), ('REFERENCES'::text), ('TRIGGER'::text)
),
role_table_checks AS (
  SELECT
    role_name.role_name,
    table_spec.table_name,
    privilege.privilege_name,
    CASE
      WHEN (role_name.role_name COLLATE "C") = ('fid_function_owner'::text COLLATE "C") THEN (privilege.privilege_name COLLATE "C") = ANY(table_spec.owner_allowed_privileges)
      ELSE false
    END AS expected_has_privilege,
    pg_catalog.has_table_privilege(role_name.role_name, ('fid.'::text || table_spec.table_name)::text, privilege.privilege_name) AS observed_has_privilege
  FROM (VALUES ('service_role'::text), ('anon'::text), ('authenticated'::text), ('fid_function_owner'::text)) AS role_name(role_name)
  CROSS JOIN governed_tables AS table_spec
  CROSS JOIN table_privilege_names AS privilege
),
table_summary AS (
  SELECT pg_catalog.bool_and(c.expected_has_privilege = c.observed_has_privilege) AS valid
  FROM role_table_checks AS c
),
schema_function_checks(check_name, expected_has_privilege, observed_has_privilege) AS (
  VALUES
    ('service_role.schema_usage'::text, true, pg_catalog.has_schema_privilege('service_role', 'fid', 'USAGE')),
    ('service_role.schema_create'::text, false, pg_catalog.has_schema_privilege('service_role', 'fid', 'CREATE')),
    ('service_role.function_execute'::text, true, pg_catalog.has_function_privilege('service_role', 'fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)', 'EXECUTE')),
    ('anon.schema_usage'::text, false, pg_catalog.has_schema_privilege('anon', 'fid', 'USAGE')),
    ('anon.schema_create'::text, false, pg_catalog.has_schema_privilege('anon', 'fid', 'CREATE')),
    ('anon.function_execute'::text, false, pg_catalog.has_function_privilege('anon', 'fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)', 'EXECUTE')),
    ('authenticated.schema_usage'::text, false, pg_catalog.has_schema_privilege('authenticated', 'fid', 'USAGE')),
    ('authenticated.schema_create'::text, false, pg_catalog.has_schema_privilege('authenticated', 'fid', 'CREATE')),
    ('authenticated.function_execute'::text, false, pg_catalog.has_function_privilege('authenticated', 'fid.fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)', 'EXECUTE')),
    ('fid_function_owner.schema_usage'::text, true, pg_catalog.has_schema_privilege('fid_function_owner', 'fid', 'USAGE')),
    ('fid_function_owner.schema_create'::text, false, pg_catalog.has_schema_privilege('fid_function_owner', 'fid', 'CREATE'))
),
schema_function_summary AS (
  SELECT pg_catalog.bool_and(c.expected_has_privilege = c.observed_has_privilege) AS valid
  FROM schema_function_checks AS c
)
SELECT
  'privileges.minimum_and_exact_table_access'::text AS verification_key,
  pg_catalog.jsonb_build_object('tablePrivilegesExact', true, 'schemaAndFunctionPrivilegesExact', true, 'deleteAllowed', false) AS expected_value,
  pg_catalog.jsonb_build_object('tablePrivilegesExact', t.valid, 'schemaAndFunctionPrivilegesExact', s.valid, 'deleteAllowed', EXISTS (SELECT 1 FROM role_table_checks WHERE (privilege_name COLLATE "C") = ('DELETE'::text COLLATE "C") AND observed_has_privilege)) AS observed_value,
  CASE WHEN t.valid AND s.valid AND NOT EXISTS (SELECT 1 FROM role_table_checks WHERE (privilege_name COLLATE "C") = ('DELETE'::text COLLATE "C") AND observed_has_privilege) THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Effective privileges for service_role, anon, authenticated, and fid_function_owner match the governed minimum.'::text AS details
FROM table_summary AS t
CROSS JOIN schema_function_summary AS s;

WITH observed_role AS (
  SELECT
    role.rolcanlogin,
    role.rolsuper,
    role.rolcreatedb,
    role.rolcreaterole,
    role.rolreplication,
    role.rolbypassrls,
    role.rolinherit
  FROM pg_catalog.pg_roles AS role
  WHERE (role.rolname::text COLLATE "C") = ('fid_function_owner'::text COLLATE "C")
)
SELECT
  'role.fid_function_owner.safe_attributes'::text AS verification_key,
  pg_catalog.jsonb_build_object('login', false, 'superuser', false, 'createdb', false, 'createrole', false, 'replication', false, 'bypassrls', false, 'inherit', false) AS expected_value,
  pg_catalog.jsonb_build_object('login', r.rolcanlogin, 'superuser', r.rolsuper, 'createdb', r.rolcreatedb, 'createrole', r.rolcreaterole, 'replication', r.rolreplication, 'bypassrls', r.rolbypassrls, 'inherit', r.rolinherit) AS observed_value,
  CASE WHEN NOT r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication AND NOT r.rolbypassrls AND NOT r.rolinherit THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'fid_function_owner is NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS, and NOINHERIT.'::text AS details
FROM observed_role AS r;

SELECT
  'manual.password_absence'::text AS verification_key,
  pg_catalog.to_jsonb('password absent'::text) AS expected_value,
  NULL::jsonb AS observed_value,
  'MANUAL_CONFIRMATION_REQUIRED'::text AS status,
  'Password absence requires manual confirmation, and pg_authid is intentionally not queried.'::text AS details;

WITH observed_metadata AS (
  SELECT
    metadata.migration_id::text COLLATE "C" AS migration_id,
    metadata.schema_version::text COLLATE "C" AS schema_version,
    metadata.package_version::text COLLATE "C" AS package_version,
    metadata.deployment_environment::text COLLATE "C" AS deployment_environment,
    metadata.deployment_status::text COLLATE "C" AS deployment_status,
    metadata.verification_status::text COLLATE "C" AS verification_status,
    metadata.migration_sequence::integer AS migration_sequence,
    metadata.applied_migration_ids::text[] AS applied_migration_ids,
    metadata.expected_migration_count::integer AS expected_migration_count,
    metadata.compatibility_floor::text COLLATE "C" AS compatibility_floor,
    metadata.compatibility_ceiling::text COLLATE "C" AS compatibility_ceiling,
    metadata.recorded_at::timestamptz AS recorded_at
  FROM fid.fid_persistence_migrations AS metadata
),
summary AS (
  SELECT
    pg_catalog.count(*)::integer AS row_count,
    pg_catalog.bool_and(ROW(m.migration_id,m.schema_version,m.package_version,m.deployment_environment,m.deployment_status,m.verification_status,m.migration_sequence,m.applied_migration_ids,m.expected_migration_count,m.compatibility_floor,m.compatibility_ceiling,m.recorded_at) IS NOT DISTINCT FROM ROW('013_record_fid_deployment_metadata'::text,'FID-SUPABASE-SCHEMA-V1'::text,'FID-SUPABASE-TEST-DEPLOYMENT-1.0.1'::text,'DEDICATED_NON_PRODUCTION_TEST'::text,'DEPLOYED'::text,'VERIFIED'::text,13::integer,ARRAY['fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables','fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function','fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification','013_record_fid_deployment_metadata']::text[],13::integer,'FID-SUPABASE-SCHEMA-V1'::text,'FID-SUPABASE-SCHEMA-V1'::text,'2026-07-18T03:12:05Z'::timestamptz)) AS compatible,
    pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY m.migration_id COLLATE "C") AS observed_value
  FROM observed_metadata AS m
)
SELECT
  'migration_metadata.compatibility'::text AS verification_key,
  pg_catalog.jsonb_build_object('migrationId','013_record_fid_deployment_metadata','schemaVersion','FID-SUPABASE-SCHEMA-V1','packageVersion','FID-SUPABASE-TEST-DEPLOYMENT-1.0.1','deploymentEnvironment','DEDICATED_NON_PRODUCTION_TEST','deploymentStatus','DEPLOYED','verificationStatus','VERIFIED','migrationSequence',13,'appliedMigrationIds',ARRAY['fid-001-schema','fid-002-schema-version','fid-003-canonical-table','fid-004-auxiliary-tables','fid-005-relationships','fid-006-constraints','fid-007-indexes','fid-008-atomic-function','fid-009-rls','fid-010-policies','fid-011-privileges','fid-012-verification','013_record_fid_deployment_metadata']::text[],'expectedMigrationCount',13,'compatibilityFloor','FID-SUPABASE-SCHEMA-V1','compatibilityCeiling','FID-SUPABASE-SCHEMA-V1','recordedAt','2026-07-18T03:12:05Z') AS expected_value,
  s.observed_value,
  CASE WHEN s.row_count = 1 AND s.compatible THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  'Exactly one package-level metadata row must match the governed thirteen-migration package.'::text AS details
FROM summary AS s;
