# Sprint 17C.22 repeat final controlled-deployment review

Status: `READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_EXECUTION_AUTHORIZATION_REVIEW`.

This status authorizes neither preflight nor amendment execution. The review made no Supabase connection, executed no SQL or RPC, created no execution authorization, and changed no protected SQL, migration, role, ACL, ownership, policy, or database object. The authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`.

## Independent findings

The corrected matrix SHA-256 was fixed before review as `E92CAE3BAA5F341ACAC12D9800603DFA09FBB04F084BACC0998581EC673F70FC`. `FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1` version `17C.21.1` contains 260 object-bound entries and one inventory invariant. Independent structural comparison proves that exactly the original five-principal by three-privilege synthetic sequence rows were removed and all other entries remain identical and ordered.

The replacement is one immutable, exact inventory invariant bound to schema `fid` and object class `sequence`, with zero before/after counts, no governed identities, three-stage coverage, inconsistent-state handling for discoveries, and explicit prohibitions on per-object ACL, ownership, and grant-option rows while empty. It cannot be interpreted as a wildcard or future nonempty policy.

Each protected 17C.19 SQL successor resolves the `fid` namespace and rejects any `pg_class` sequence (`relkind='S'`) there by incrementing `mismatch_count`. Preflight and post-verification require zero mismatches. Reconciliation evaluates mismatch-driven inconsistent state before every positive or partial outcome. Coverage matches the single invariant without fictional per-sequence ACL claims.

The broader matrix remains exact for seven tables, owner positives and denials, metadata-table denial, service-role schema/RPC boundary and table denial, browser/PUBLIC denials, exact function identity/owner/security/search path, grant options, direct/effective distinctions, object ownership, restricted owner attributes, membership options, other-schema CREATE prohibition, and migration-014 absence. No duplicate, contradictory, wildcard, placeholder, unsupported, unbound, or uncovered expectation was found.

The protected amendment remains one transaction with complete before/after assertions and exactly its two authorized grants. Optional metadata discovery remains `to_regclass`-guarded and dynamic SELECT-only. Reconciliation preserves six ordered outcomes. Parser evidence remains offline, non-executing, exact-hash-bound, and explicitly limited to PostgreSQL 18.4 grammar; PostgreSQL 17 compatibility remains separately documentation-backed.

The governed runbook requires target/hash verification, separately authorized read-only preflight, sanitized review, separate one-shot amendment authorization, stop-on-error/no-blind-retry behavior, reconciliation after uncertainty, post-verification after success, and a stop before separately reauthorizing migration 014.

Exact recommended next sprint: `SPRINT_17C23_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_EXECUTION_AUTHORIZATION_REVIEW`.
