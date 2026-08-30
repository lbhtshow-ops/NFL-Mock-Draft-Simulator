# Sprint 17C.43 result governance and oracle reconciliation

## Scope and preservation

This is one repository-only package. It records the single Sprint 17C.42 result, consumes that authorization, adjudicates every returned detail, and adds deterministic sanitized regressions. It changes no historical SQL, migration, authorization, or evidence artifact. No database, Supabase, RPC, role, privilege, identifier, prospect, FIIS, promotion, cohort, or simulator operation occurred.

The audited repository is `lbhtshow-ops/NFL-Mock-Draft-Simulator`, branch `main`, upstream `origin/fid-persistence-v1.0.1`. Governed migrations remain exactly 001–014; 015 is absent and 014 remains unapplied. The inherited dirty worktree is preserved. The authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`.

## PostgreSQL 17 semantic model

Function ownership, direct ACL entries, and effective authority are separate facts. Ownership carries inherent authority and must not be treated as an unexpected grant merely because an owner ACL item is materialized. `aclexplode(proacl)` reports ACL entries; `has_function_privilege` answers effective privilege, including authority available through PUBLIC. PostgreSQL gives PUBLIC EXECUTE on functions by default unless it is revoked. The protected migration 011 explicitly revokes function EXECUTE from PUBLIC, anon, authenticated, and service_role, then explicitly grants it only to service_role. Migration 008 assigns ownership to `fid_function_owner`. Migrations 009–010 force RLS and define the owner service boundary; migration 011 grants only the table rights needed by that security-definer function. Migration 012 verifies that boundary. These states remain the authoritative intended state.

## Adjudication

| Detail | Adjudication | Shared cause |
|---|---|---|
| `FUNCTION_EXECUTE_ANON` | Genuine effective mismatch, derived from PUBLIC rather than a direct anon grant | `PUBLIC_EXECUTE_DIRECT_ACL` |
| `FUNCTION_EXECUTE_AUTHENTICATED` | Genuine effective mismatch, derived from PUBLIC rather than a direct authenticated grant | `PUBLIC_EXECUTE_DIRECT_ACL` |
| `FUNCTION_EXECUTE_FID_FUNCTION_OWNER` | Oracle defect: inherent owner authority/owner ACL representation is mislabeled as an unexpected direct grant | `OWNER_AUTHORITY_MODELING` |
| `FUNCTION_EXECUTE_PUBLIC` | Genuine direct ACL mismatch against migration 011 | `PUBLIC_EXECUTE_DIRECT_ACL` |
| `FUNCTION_EXECUTE_SERVICE_ROLE` | Genuine missing direct grant; effective PRESENT is explained by PUBLIC. The single observed classification conflates direct and effective state and contradicts `MISSING_DIRECT_PRIVILEGE` | `PUBLIC_EXECUTE_DIRECT_ACL` |
| `MIGRATION_014_ROLLBACK_STATE` | Rollback oracle defect. The returned migration-014 metadata count is zero and protected reconciliation is authoritative for absent 014 objects. The composite oracle improperly emits a conflict without exposing which subordinate predicate caused it | `ROLLBACK_ORACLE` |

The four PUBLIC-related rows preserve principal-level visibility but represent one remediation root cause plus the independently required direct service-role grant. Revoking PUBLIC resolves PUBLIC, anon, and authenticated effective authority and removes PUBLIC as service_role's accidental effective source; service_role still requires its explicit migration-011 grant.

The governed model remains 261 units: 260 object-bound ACL units plus one inventory invariant. No unit is removed. The successor changes interpretation and root-cause grouping, not governed-unit cardinality.

## Five versus six

The 17C.27 aggregate and 17C.40 detail SQL nominally evaluate the same five function-principal units and one rollback unit. The captured preflight has no principal-level detail, so repository evidence cannot prove which of the six later details was absent from the earlier count, nor whether target state changed between observations. The difference is therefore preserved as unresolved temporal/oracle evidence; it is not guessed away and does not justify replay. A future observation is unnecessary for the repository corrections, but if governance later requires target reconciliation it must be a new, narrowly authorized read-only observation that returns separate direct, owner-derived, PUBLIC-derived, and effective booleans plus rollback subordinate predicates.

## Corrected successor contract

Future result oracles must expose `direct_acl_present`, `owner_authority_present`, `public_acl_present`, `public_derived_effective_present`, and `effective_privilege_present` separately. A missing-direct row must display the direct observed classification (`ABSENT`), never the combined effective classification. Owner authority must be expected and classified as ownership-derived, not as a direct-grant mismatch. Rollback classification must derive separately from governed 014 object inventory and migration-014 metadata inventory; verified absence in both is `MIGRATION_014_FULLY_ROLLED_BACK`. Principal observations remain individually countable governed units while `root_cause_id` prevents four PUBLIC effects from being presented as four independent remediation causes.

Final package status: `READY_FOR_CORRECTED_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_RESULT_REVIEW`. This is not amendment or migration-014 execution readiness and creates no execution authorization.
