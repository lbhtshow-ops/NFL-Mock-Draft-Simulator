# Sprint 17C.54 corrected owner-preserving ACL remediation

Status: `READY_FOR_CORRECTED_OWNER_PRESERVING_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_CONTROLLED_DEPLOYMENT_REVIEW`.

This repository-only package records the single successful Sprint 17C.53 read-only reconciliation. Its authorization is consumed permanently and is not reusable. The captured 53-field row classifies the target as `FID_ATOMIC_FUNCTION_ACL_RECONCILIATION_EXACT_UNCHANGED_PRE_REMEDIATION_STATE`; it reports zero failed predicates, zero details, complete evidence, zero Migration 014 metadata and objects, `read_only=true`, and `mutation_count=0`. The externally attested target remains separate from PostgreSQL-observed evidence, so `overall_target_verified=false` is preserved exactly.

The protected `017c47a` defect is `(array_agg(p.proconfig))[1]`. `proconfig` is already `text[]`; aggregating it creates a higher-dimensional array, and one scalar subscript does not recover the original configuration array. That makes the protected combined assertion reject the proven exact configuration. The successor first proves function cardinality, then captures `p.proconfig` directly with `SELECT ... INTO STRICT`.

The successor has one explicit transaction and exactly two mutations: revoke EXECUTE from `PUBLIC`, `anon`, and `authenticated`, then grant EXECUTE to `service_role`. It neither revokes from nor grants to `fid_function_owner`. All identity, property, restricted-owner, before-ACL, rollback, after-ACL, and protected-property assertions are independently diagnosable and occur in the required order. Errors propagate; there is no exception handler, intermediate commit, or partial-success path.

The protected `017c46a` preflight remains exact for the required captured before-state. Protected `017c47b` reconciliation and `017c47c` post-verification remain exact for the approved owner-retaining after-state, use guarded optional metadata discovery, remain read-only and sanitized, return one visible row, and distinguish direct, effective, and ownership-derived authority. No companion successor is required. The protected 261-unit `017c47` matrix already expresses owner direct/effective EXECUTE and ownership authority, so it is reused unchanged.

No authorization is created by this sprint. No SQL, database, application, RPC, reconciliation, remediation, post-verification, capability amendment, or Migration 014 operation was executed.
