# One-execution guarded reconciliation runbook

Use only while `FID_ATOMIC_FUNCTION_ACL_GUARDED_RECONCILIATION_ONE_EXECUTION_017C51_V1` is `ACTIVE_UNCONSUMED`.

1. Verify Lunch Break Hot Take / LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` / us-east-1 / main / Primary Database / postgres / DEDICATED_NON_PRODUCTION_TEST. `PRODUCTION` is only the primary-branch topology label.
2. Verify `017c51a_fid_atomic_function_acl_failed_remediation_guarded_reconciliation.sql` SHA-256 is `5FC74BFDA1C5D746EF4443ED353A91E1F9622E07D77BAC72C90CE1A389669698`.
3. Copy the complete file byte-for-byte into a fresh Dashboard SQL Editor tab. Do not edit or partially select it.
4. Execute exactly once. Authorization is consumed immediately when the attempt begins, including success, error, timeout, interruption, missing/malformed row, uncertain response, or incomplete capture. Never retry or reuse it.
5. Capture the complete ordinary row, the untruncated `failed_baseline_predicates`, `failed_baseline_predicate_count`, numeric `detail_count`, and `detail_count_matches_failed_count`.
6. Stop after the response under every outcome. Do not execute remediation, replay, post-verification, Migration 014, the capability amendment, an RPC, mutation, UUID/identifier generation, or prospect/simulator operation.
