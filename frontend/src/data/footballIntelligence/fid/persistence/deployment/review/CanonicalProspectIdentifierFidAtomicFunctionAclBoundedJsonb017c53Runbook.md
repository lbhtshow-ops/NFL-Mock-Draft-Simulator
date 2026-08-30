# One-execution bounded-JSONB reconciliation runbook

Use only while `FID_ATOMIC_FUNCTION_ACL_BOUNDED_JSONB_RECONCILIATION_ONE_EXECUTION_017C53_V1` is `ACTIVE_UNCONSUMED`.

1. Verify Lunch Break Hot Take / LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` / us-east-1 / main / Primary Database / postgres / DEDICATED_NON_PRODUCTION_TEST. The Dashboard `PRODUCTION` label means primary-branch topology only.
2. Verify `017c52a_fid_atomic_function_acl_failed_remediation_bounded_jsonb_reconciliation.sql` SHA-256 is `1C77EABD93C9F8D9EA86B0D975D73B688A53476029C5EEAFB6081DDB06CD4001`.
3. Copy and execute the complete file byte-for-byte in a fresh Dashboard SQL Editor tab. Do not edit or partially select it.
4. Authorization is consumed immediately when execution begins under every outcome. Never retry or reuse it.
5. Capture all 53 fields, the complete untruncated `failed_baseline_predicates`, `failed_baseline_predicate_count`, numeric `detail_count`, and `detail_count_matches_failed_count`.
6. Stop after the response under every outcome. Do not execute any protected retry, remediation, post-verification, capability amendment, Migration 014, RPC, mutation, identifier/prospect, or simulator operation.
