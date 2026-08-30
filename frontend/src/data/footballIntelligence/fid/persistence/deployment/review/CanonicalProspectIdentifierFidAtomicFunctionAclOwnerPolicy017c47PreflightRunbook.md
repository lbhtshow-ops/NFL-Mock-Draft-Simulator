# One-execution preflight runbook — Sprint 17C.47

This runbook applies only while authorization `FID_ATOMIC_FUNCTION_ACL_OWNER_POLICY_017C47_PREFLIGHT_ONE_EXECUTION_V1` is ACTIVE_UNCONSUMED.

1. In the Supabase Dashboard verify: Lunch Break Hot Take / LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` / us-east-1 / main / Primary Database / postgres. `PRODUCTION` is only the primary-branch topology label for this DEDICATED_NON_PRODUCTION_TEST project.
2. Verify SHA-256 `A915F8FD37B2591D98B6B983BE8C21861341D6B1277C1A2F77B8FD6FED60CCD2` for `017c46a_fid_atomic_function_acl_corrected_preflight.sql`.
3. Copy the complete file byte-for-byte into a fresh SQL Editor tab. Do not edit it or select a subset.
4. Execute exactly once. Authorization is consumed immediately when execution begins, regardless of outcome; never retry or reuse it.
5. Capture every visible column and every untruncated structured value from the single row, or capture the complete SQLSTATE/error. Zero/multiple/malformed/incomplete rows, timeout, interruption, uncertainty, and every classification still consume authorization.
6. Stop immediately after the response. Do not run remediation, reconciliation, post-verification, capability amendment, Migration 014, ACL/role changes, RPCs, or identifier/prospect operations.
