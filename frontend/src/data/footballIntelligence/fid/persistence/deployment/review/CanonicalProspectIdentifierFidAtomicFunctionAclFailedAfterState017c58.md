# Sprint 17C.58 failed after-state reconciliation review

Status: `READY_FOR_ONE_CONTROLLED_FID_ATOMIC_FUNCTION_ACL_FAILED_AFTER_STATE_READ_ONLY_RECONCILIATION_EXECUTION`.

The fixed-hash 017c54a attempt consumed authorization `CORRECTED_OWNER_PRESERVING_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_ONE_EXECUTION_017C57_V1` and raised SQLSTATE `P0001`, `after-state ACL mismatch`, at inline block line 103. Zero rows were visible and COMMIT was not reached. The record does not identify a failed predicate and does not infer current database state from transactional expectations.

The protected assertion combines direct ACL counts, effective privileges, and ownership into one Boolean. PostgreSQL effective EXECUTE can remain available through role membership/inheritance independently of PUBLIC and direct grants. Therefore PUBLIC revocation alone does not prove anon or authenticated ineffective.

Additive successor 017c58a, SHA-256 `8F723344492AC678939930DCBA82D3B657106158AD3793543D36D7BAC929D1C1`, returns one sanitized 61-field row in one read-only transaction. It separates direct, effective, ownership-derived, default-ACL, and four membership-path signals; emits one detail for each of 13 after-state predicates; reconciles counts; and distinguishes unchanged, applied, partial, oracle-mismatch, inconsistent, and unresolved states. Its three JSONB builders use 38, 42, and 42 arguments.

All gates passed. Exactly one immutable authorization permits one complete read-only execution. It authorizes no remediation or mutation.

No SQL or database action occurred during Sprint 17C.58.
