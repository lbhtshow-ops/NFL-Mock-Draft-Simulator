# Sprint 17C.20 final controlled-deployment review

Status: `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_ADDITIONAL_CORRECTION_REQUIRED`.

This was a repository-only independent review. It made no Supabase connection, executed no SQL or RPC, created no execution authorization, and did not modify the protected amendment, the 17C.19 matrix or successors, migration 014, or historical evidence. The authoritative database state remains `MIGRATION_014_FULLY_ROLLED_BACK`.

## Independent finding

The immutable matrix has the declared cardinality of 275 and no duplicate keys. However, 15 entries are sequence privilege expectations for five principals and three privileges whose object is the synthetic value `GOVERNED_SET_MUST_BE_EMPTY`. No governed sequence object exists to bind those expectations to. The three SQL successors instead use the correct inventory-level assertion that no sequence exists in `fid`.

Consequently, the matrix contains unbound wildcard expectations and its per-entry coverage declarations overstate SQL coverage. This violates an explicit Sprint 17C.20 stop condition. The defect is bounded to the protected 17C.19 matrix/package, so this review may not repair it and may not grant execution-authorization-review readiness.

## Findings that passed

- All supplied protected SHA-256 values match; migrations are exactly 001 through 014 and migration 015 is absent.
- The amendment is one `BEGIN`/`COMMIT` transaction with before assertions, exactly the two authorized `GRANT` statements, after assertions, and no dynamic mutation or client-controlled identifier.
- Grant authority requires schema ownership or a direct grantable `CREATE` ACL; effective `CREATE` alone is insufficient.
- The seven-table boundary, table owners, role denials, schema boundary, exact function signature/owner/security mode/search path, membership options, owner attributes, other-schema `CREATE` prohibition, and migration-014 absence are represented in the successors.
- Optional metadata uses `to_regclass`, returns unresolved when absent, and performs SELECT-only dynamic SQL only after relation discovery using the resolved `regclass`.
- Reconciliation preserves all six outcomes and orders unresolved, inconsistent, exact partials, fully unapplied, and fully applied safely.
- Offline pglast evidence is hash-bound, has no database/network client, and parses the amendment, successors, dynamic SELECTs, and PL/pgSQL bodies without executing SQL.
- PostgreSQL 17 documentation supports the used role grant options, `pg_auth_members` columns, ACL expansion, privilege inquiry functions/OID forms, `to_reg*` resolution, anonymous PL/pgSQL, and SELECT-only dynamic `EXECUTE` constructs. Target identities, OIDs, ACL contents, and database state remain controlled-execution facts.
- The runbook separates target/hash verification, read-only preflight, execution authorization, one-unit amendment execution, uncertainty reconciliation, post-verification, and later migration-014 reauthorization; it does not permit blind retry.

## Required correction sprint

`SPRINT_17C21_ACL_MATRIX_EMPTY_SEQUENCE_COVERAGE_CORRECTION`: replace the 15 synthetic per-sequence rows with an explicit inventory-level zero-sequence invariant (or otherwise bind every matrix row to a real governed object), update coverage semantics and diagnostics, regenerate hashes, then repeat an independent final controlled-deployment review. No database execution is authorized.
