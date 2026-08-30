# Sprint 17C.60 transaction-local rollback diagnostic review

Status: `READY_FOR_ONE_CONTROLLED_FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_ROLLBACK_DIAGNOSTIC_EXECUTION`

The additive diagnostic reproduces only the protected 17C.54 ACL statements after an exact pre-state gate, observes transaction-local direct ACL, effective privilege, ownership, membership-path, function-property, restricted-owner, and Migration 014 evidence, emits one sanitized 47-field row, and then executes an unconditional explicit `ROLLBACK`. It contains no `COMMIT` statement and does not use persistent or temporary storage. The already emitted result set is the only result-preservation mechanism; no query after rollback is required or permitted by the artifact.

The five independently counted predicates are `after_public_direct_execute_absent`, `after_service_direct_execute_present`, `after_public_effective_execute_absent`, `after_anon_effective_execute_absent`, and `after_authenticated_effective_execute_absent`. Each failed predicate produces one structured detail containing identifier, expected value, observed value, pass/fail Boolean, sanitized source, and authority classification.

Classification precedence is evidence unresolved, before-state mismatch, inconsistent recovery required, exact owner-preserving after-state, explained effective-privilege oracle mismatch, direct ACL mutation failure, partial state, then inconsistent recovery fallback. Oracle mismatch requires exact direct state and a separately observed membership explanation.

Repository identity, `main`, origin, upstream, inherited dirty worktree, protected hashes, migrations 001–014, Migration 015 absence, and additive history preservation were reviewed. JSONB builder argument counts are 12, 36, 32, and 26. Fifty-eight adversarial cases cover the required identity, owner, function-property, ACL, effective privilege, membership, NULL/count/detail, JSON, transaction-boundary, safety, metadata, and visible-row cases.

`pglast` is not installed, so its parser harness was not run and no package was installed. Repository-native static and adversarial checks provide the available PostgreSQL 17-oriented review; no PostgreSQL 18 result is represented as PostgreSQL 17 semantic proof.

Authorization `FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_ROLLBACK_DIAGNOSTIC_ONE_EXECUTION_017C60_V1` is immutable, active and unconsumed, limited to one complete byte-for-byte manual execution on the exact dedicated non-production target, and consumed permanently when execution begins under every outcome. Retry, Dashboard Retry, editing, partial execution, remediation, and every persistent mutation are prohibited.

No remediation, post-verification, or Migration 014 authorization was created. No SQL or database operation occurred during Sprint 17C.60.
