-- SPRINT 17C.1 DECLARATION ONLY. DO NOT EXECUTE DURING REVIEW.
-- Corrected migration required SHA-256:
-- 18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD
-- The original hash 3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13
-- is historical evidence and MUST NOT be authorized for deployment.

-- BLOCK A — READ-ONLY POST-DEPLOYMENT REPLAY STRUCTURE
SELECT p.prosecdef, p.proconfig, p.proowner::pg_catalog.regrole AS owner,
       pg_catalog.pg_get_functiondef(p.oid) LIKE '%INCONSISTENT_STORED_STATE%' AS recovery_branch_present,
       pg_catalog.pg_get_functiondef(p.oid) NOT LIKE '%RETURN v_existing.result_payload%' AS unrestricted_payload_return_absent
FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
WHERE n.nspname='fid' AND p.proname='fid_execute_prospect_identifier_issuance_transaction';

-- BLOCK B — STATE-CHANGING BUT ROLLBACK-CONTAINED SAFE BEHAVIOR
-- Within one explicit BEGIN/ROLLBACK, use approved operator-only synthetic values to verify consistent success
-- replay, consistent collision replay, exact stored references, no extra rows, and unchanged row timestamps.
BEGIN;
-- Approved RPC calls and sanitized count assertions are inserted by the authorized deployment operator.
ROLLBACK;

-- BLOCK C — PRIVILEGED INTEGRITY INJECTION; SEPARATE AUTHORIZATION REQUIRED
-- Never run as part of ordinary deployment acceptance. In a disposable/rollback-contained authorized session,
-- mutate only synthetic idempotency result_payload representations to test status/idempotency/transaction/
-- reservation/ledger mismatch, malformed UUID text, missing linked rows, and cross-transaction links.
-- Every case must return IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED, must expose no stored payload, and must be
-- enclosed by BEGIN/ROLLBACK. If the required privilege or isolation cannot be proven, skip and retain static
-- model evidence. Do not disable constraints, RLS, or triggers; do not commit injected state.

-- BLOCK D — READ-ONLY FINAL RECONCILIATION
SELECT c.relname, c.reltuples::bigint AS planner_estimated_rows
FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
WHERE n.nspname='fid' AND c.relname IN ('fid_identifier_reservations','fid_identifier_issuance_ledger','fid_identifier_issuance_idempotency')
ORDER BY c.relname COLLATE "C";
