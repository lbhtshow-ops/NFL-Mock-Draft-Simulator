-- SPRINT 17C DECLARATION ONLY. READ-ONLY. DO NOT EXECUTE DURING REVIEW.
-- Target must be verified in Dashboard as LBHT FID Persistence Test by project ID, not display name alone.
SELECT pg_catalog.current_setting('server_version') AS server_version,
       pg_catalog.current_user AS current_user,
       pg_catalog.session_user AS session_user,
       pg_catalog.current_database() AS current_database;

SELECT n.nspname AS function_schema, p.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_catalog.pg_get_function_result(p.oid) AS result_type,
       p.provolatile, p.prosecdef
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
WHERE n.nspname='pg_catalog' AND p.proname='gen_random_uuid'
  AND pg_catalog.pg_get_function_identity_arguments(p.oid)='';

SELECT rolname, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls, rolinherit
FROM pg_catalog.pg_roles
WHERE rolname IN ('service_role','anon','authenticated','fid_function_owner')
ORDER BY rolname COLLATE "C";

SELECT nspname, nspowner::pg_catalog.regrole AS schema_owner,
       pg_catalog.has_schema_privilege(pg_catalog.current_user,nspname,'USAGE') AS current_user_usage,
       pg_catalog.has_schema_privilege(pg_catalog.current_user,nspname,'CREATE') AS current_user_create,
       pg_catalog.has_schema_privilege('fid_function_owner',nspname,'USAGE') AS function_owner_usage,
       pg_catalog.has_schema_privilege('service_role',nspname,'USAGE') AS service_role_usage
FROM pg_catalog.pg_namespace WHERE nspname='fid';

SELECT c.relkind, n.nspname, c.relname, c.relowner::pg_catalog.regrole AS owner
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relname IN ('fid_identifier_reservations','fid_identifier_issuance_ledger','fid_identifier_issuance_idempotency')
UNION ALL
SELECT 'f', n.nspname, p.proname, p.proowner::pg_catalog.regrole
FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction';

SELECT c.relname, c.reltuples::bigint AS planner_estimated_rows
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relkind='r' ORDER BY c.relname COLLATE "C";
