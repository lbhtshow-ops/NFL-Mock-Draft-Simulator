# Sprint 17C.45 controlled-deployment review

## Decision

The repository, branch, origin, upstream, migration inventory, authoritative rollback state, and protected hashes pass. The inherited dirty worktree is preserved. The exact remediation mutation is narrow and transactional, and PostgreSQL 17 ACL semantics support the intended policy. However, the protected Sprint 17C.44 companion package fails mandatory controlled-deployment gates. No execution authorization or manual execution runbook is created.

## Confirmed gates

All four units bind by schema, function name, and the full eight-argument identity string. They count the exact match, reject missing or multiple matches through unresolved/fail-closed paths, never return or invoke the function body, and use `aclexplode(proacl)` for direct ACL observations. The remediation has one `BEGIN`/`COMMIT`, exactly one governed REVOKE and one governed GRANT, complete captured-ACL assertions before mutation, after-state assertions before commit, no intermediate commit, no caught exception, no dynamic client identifier, no `SET ROLE`, no RPC call, and no table, schema, policy, role, membership, sequence, migration, or data mutation.

PostgreSQL 17 supports the intended outcome: PUBLIC function EXECUTE supplies effective authority to roles; direct ACL entries are distinct from `has_function_privilege` effective results; owner authority is independent of a removable ACL entry; and the explicit service-role grant remains after PUBLIC revocation. The mutation narrows rather than broadens access.

## Blocking defects

1. `017c44b`, `017c44c`, and `017c44d` statically reference `fid.fid_persistence_migrations`. PostgreSQL resolves that relation before evaluating the classification CASE. If the optional metadata relation or schema is missing, the statement errors and cannot return the required one-row unresolved result. This contradicts safe missing-metadata handling.
2. `017c44c` returns direct ACL booleans and owner authority but no effective privilege observations. It therefore does not satisfy the required reconciliation separation of direct ACL, effective authority, and ownership-derived authority.
3. All three companions emit literal `true AS owner_derived_authority`; this is not derived from a resolved function owner and remains misleading in unresolved cases.
4. `017c44b` has only `FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED`, `FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_UNRESOLVED`, and `FID_ATOMIC_FUNCTION_ACL_REMEDIATION_STATE_INCONSISTENT_RECOVERY_REQUIRED`. Distinct controlled blocked and already-applied preflight classifications are absent.

The protected SQL must not be modified in this sprint. A later additive fixed-hash correction must safely guard optional metadata, derive owner authority, add effective reconciliation fields, and complete the preflight state contract before authorization review can resume.

## Preflight visible contract as implemented

The 18 columns are, in order: `result_identity`, `result_version`, `classification`, `public_direct_execute`, `anon_direct_execute`, `authenticated_direct_execute`, `owner_direct_acl_entry`, `owner_derived_authority`, `service_direct_execute`, `anon_effective_execute`, `authenticated_effective_execute`, `service_effective_execute`, `migration_014_metadata_count`, `migration_014_object_count`, `external_target_attestation_required`, `overall_target_verified`, `read_only`, `mutation_count`.

Passing is `FID_ATOMIC_FUNCTION_ACL_REMEDIATION_FULLY_UNAPPLIED`; unresolved and inconsistent classifications exist as named above. Distinct blocked and already-applied classifications do not exist, which is itself a blocker.

## Parser and compatibility

The existing parse-only review reports `pglast v8.4`, PostgreSQL 18.4 grammar, `DoStmt` and `TransactionStmt` for remediation, and `SelectStmt` plus `TransactionStmt` for each companion; the PL/pgSQL body parses. That proves parser acceptance only. PostgreSQL 17 semantic review independently confirms the ACL design but also confirms that an unguarded missing relation is a statement-resolution error, not a classifiable empty observation.

No database, Supabase, SQL, ACL, RPC, identifier, prospect, migration, reconciliation, or post-verification action occurred. No authorization was created.

Final status: `FID_ATOMIC_FUNCTION_ACL_REMEDIATION_IMPLEMENTATION_CORRECTION_REQUIRED`.
