# Canonical Prospect Identifier Migration 014 Failed-Execution Reconciliation Supplement

Status: `READY_FOR_CONTROLLED_MIGRATION_014_FAILED_EXECUTION_READ_ONLY_RECONCILIATION`

## Failure and execution position

The exact corrected migration failed once with SQLSTATE `42501`: `must be able to SET ROLE "fid_function_owner"`. The failing `ALTER FUNCTION ... OWNER TO fid_function_owner` is migration line 249. It follows creation statements for three tables, six indexes, and the transaction function. The function comment, RLS/FORCE RLS, 15 policies, revocations, and grants follow it. This order identifies possible partial states but proves neither rollback nor partial commit; the Dashboard operation’s commit state remains unknown until catalog reconciliation.

## PostgreSQL 17 role capability

`pg_has_role(...,'MEMBER')` establishes membership in the role graph. It does not establish that every membership edge permits role assumption. PostgreSQL 17 represents separate `admin_option`, `inherit_option`, and `set_option` properties in `pg_auth_members`:

- `admin_option` governs the ability to grant that membership onward.
- `inherit_option` governs automatic privilege inheritance through the edge.
- `set_option` governs whether the member may assume the granted role with `SET ROLE`.

The ownership transfer requires the execution role to be able to assume the new owner role. The reconciliation therefore reports direct and indirect membership paths and uses `pg_has_role(postgres,fid_function_owner,'SET')` as the authoritative capability result without executing `SET ROLE`. The observed managed-platform error proves the earlier `MEMBER`-only classification was insufficient; this sprint does not infer or change Supabase-managed memberships.

## Reconciliation scope

The authorized `017c4_failed_migration_014_read_only_commit_state_reconciliation.sql` returns only catalog properties, ACL classifications, structural names/counts, a sanitized function-definition MD5, and row counts. It covers:

- session identity and PostgreSQL 17 role-membership options;
- all three tables, the exact function, six indexes, 38 constraints, and 15 policies;
- table persistence, ownership, columns, RLS/FORCE RLS, and constraint types;
- function signature, return type, language, volatility, parallel safety, security-definer state, owner, search path, and execute privileges;
- table, schema, and function privileges for PUBLIC, anon, authenticated, service_role, and fid_function_owner;
- absent/empty/nonempty table counts without returning payloads;
- governed migration metadata at migration 013 and unexpected migration 014 metadata;
- catalog-derived rollback, partial, structural-but-security-incomplete, fully applied, inconsistent, and unresolved classifications.

No retry, repair, cleanup, grant, ownership workaround, role change, rollback, or migration amendment is authorized.

## Exact next action

Manually execute only the authorized read-only migration 014 failed-execution reconciliation against Supabase test project `ahmorpzcaapvoymiqlkv`, return all sanitized result sets for review, and stop. Do not retry, repair, clean up, grant privileges, set roles, invoke the RPC, or execute migration 014.
