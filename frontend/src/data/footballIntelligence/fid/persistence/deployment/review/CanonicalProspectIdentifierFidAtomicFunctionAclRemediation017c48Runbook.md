# One-execution owner-preserving ACL remediation runbook

Use only while authorization `OWNER_PRESERVING_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_ONE_EXECUTION_017C48_V1` is ACTIVE_UNCONSUMED.

1. Verify the Dashboard target: Lunch Break Hot Take / LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` / us-east-1 / main / Primary Database / postgres. `PRODUCTION` is only the primary-branch topology label for this DEDICATED_NON_PRODUCTION_TEST target.
2. Verify `017c47a_fid_atomic_function_acl_owner_preserving_remediation.sql` SHA-256 is `9F94425D99A6941FFF41246B4D655F340725C018B45A9844817D4867D9AD9C68`.
3. Copy the complete file byte-for-byte into a fresh SQL Editor tab. Do not edit or partially select it.
4. Execute exactly once. Authorization is consumed immediately when the attempt begins, including success, SQL error, timeout, interruption, uncertain response, or unknown completion. Never retry or reuse it.
5. Capture the complete untruncated Dashboard response and any SQLSTATE/error.
6. Stop immediately. Do not execute preflight again, reconciliation, post-verification, Migration 014, the capability amendment, any additional ACL/role statement, RPC, identifier, UUID, or prospect operation. A later repository review must adjudicate the captured result before any further database action.
