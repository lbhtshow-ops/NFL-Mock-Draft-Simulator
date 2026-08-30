-- SPRINT 17C DECLARATION ONLY. DO NOT EXECUTE DURING REVIEW.
-- BLOCK 1 is read-only preflight: use 017c_read_only_target_preflight.sql.

-- BLOCK 2: READ-ONLY structural verification after controlled deployment.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relowner::pg_catalog.regrole AS owner
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relname LIKE 'fid_identifier_%' ORDER BY c.relname COLLATE "C";
SELECT conrelid::pg_catalog.regclass AS relation, conname, contype, pg_catalog.pg_get_constraintdef(oid) AS definition
FROM pg_catalog.pg_constraint WHERE connamespace='fid'::pg_catalog.regnamespace AND conrelid::pg_catalog.regclass::text LIKE 'fid.fid_identifier_%'
ORDER BY relation::text COLLATE "C", conname COLLATE "C";
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies WHERE schemaname='fid' AND tablename LIKE 'fid_identifier_%' ORDER BY tablename,policyname;
SELECT n.nspname, p.proname, p.prosecdef, p.provolatile, p.proconfig, p.proowner::pg_catalog.regrole AS owner,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction';

-- BLOCK 3: READ-ONLY security verification. Run role checks only through an approved reviewer session.
SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='fid' AND table_name LIKE 'fid_identifier_%' ORDER BY grantee,table_name,privilege_type;
SELECT routine_schema,routine_name,grantee,privilege_type FROM information_schema.role_routine_grants
WHERE routine_schema='fid' AND routine_name='fid_execute_prospect_identifier_issuance_transaction' ORDER BY grantee;

-- BLOCK 4: STATE-CHANGING, ROLLBACK-CONTAINED behavioral tests.
-- Sensitive operator-only test material. The controlled deployment sprint must supply approved synthetic
-- request fields and structurally valid non-person candidates, then execute the test matrix inside BEGIN/ROLLBACK.
-- Required calls: success, exact success replay, collision under a different idempotency ref, exact collision
-- replay, conflicting idempotency reuse, case-variant candidate, and an intentionally failing ledger path.
-- Do not COMMIT this block. Do not place candidate or UUID values in general output or reports.
BEGIN;
-- Operator inserts reviewed calls here without editing migration 014.
ROLLBACK;

-- BLOCK 5: STATE-CHANGING concurrency procedure, executed from two approved SQL sessions and rolled back.
-- Session A and B must call the RPC with the same idempotency ref, then with different idempotency refs and
-- the same candidate. Record only sanitized status/count assertions. Both sessions must finish with ROLLBACK.

-- BLOCK 6: DESTRUCTIVE CLEANUP IS NOT AUTHORIZED.
-- Default decision: behavioral tests are rollback-contained; therefore no synthetic rows require cleanup.
-- If committed synthetic rows exist unexpectedly, stop and prepare an additive recovery plan.

-- BLOCK 7: READ-ONLY final reconciliation.
SELECT c.relname, c.reltuples::bigint AS planner_estimated_rows
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relname IN ('fid_identifier_reservations','fid_identifier_issuance_ledger','fid_identifier_issuance_idempotency')
ORDER BY c.relname COLLATE "C";
