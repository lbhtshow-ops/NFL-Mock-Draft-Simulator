# Sprint 17C.60 one-execution rollback diagnostic runbook

Authorization: `FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_ROLLBACK_DIAGNOSTIC_ONE_EXECUTION_017C60_V1`.

Verify the exact dedicated non-production target, Primary Database, role `postgres`, artifact `017c60a_fid_atomic_function_acl_transaction_local_rollback_diagnostic.sql`, and SHA-256 `41F6C2F40E4F42E38DE7A1FF784B8644BB7E8ABE57D4FA8DE09E1782535CA759`.

Open one new blank SQL Editor query. Load the complete file byte-for-byte and execute it once from `BEGIN;` through the explicit final `ROLLBACK;`. Do not edit, partially select, or execute individual statements. Beginning execution permanently consumes the authorization under every outcome. Dashboard Retry is prohibited.

Capture every visible result set, the complete 47-field row, complete untruncated predicate details, final rollback status, and any SQLSTATE, error, warning, timeout, disconnect, missing/truncated output, or uncertain response. Stop after the response.

The exact `REVOKE` and `GRANT` are transaction-local diagnostic mutations only. No persistent mutation, remediation, retry, repair, cleanup, post-verification, capability amendment, Migration 014, RPC, role change, application operation, or second execution is authorized. Explicit rollback is mandatory.
