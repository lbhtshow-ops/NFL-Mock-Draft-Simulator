# Sprint 17C.57 single remediation execution runbook

Authorization: `CORRECTED_OWNER_PRESERVING_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_ONE_EXECUTION_017C57_V1`.

## 1. Wait for Supabase platform stability

Do not begin while any technical-issue banner, degraded API behavior, failed-fetch symptom, or unstable SQL Editor behavior is present. Wait until the incident is resolved and the SQL Editor operates normally. Waiting does not consume authorization.

## 2. Verify the hash

Verify `017c54a_fid_atomic_function_acl_corrected_owner_preserving_remediation.sql` has SHA-256 `A185395ADB3383D3F904CBC0DAB24F99BDDBFE14E5C4BD0FF0F079348590046A`. Stop on any mismatch.

## 3. Verify the exact target

Verify organization `Lunch Break Hot Take`, project `LBHT FID Persistence Test`, reference `ahmorpzcaapvoymiqlkv`, branch `main`, Primary Database, role `postgres`, and the dedicated non-production test environment. The PRODUCTION label describes primary-branch topology only.

## 4. Load complete SQL

Load the complete file byte-for-byte. Do not edit it or select a partial fragment.

## 5. Execute once

Immediately before execution, confirm the Dashboard and API remain stable. Beginning the attempt consumes authorization permanently under every outcome. Execute once. Never click Dashboard Retry.

## 6. Capture evidence

Capture the complete Dashboard response. If an error occurs, capture the complete SQLSTATE and error. Record whether an attempt began.

## 7. Mandatory stop

Stop after the first response under every outcome. Do not retry, reconcile, post-verify, repair, clean up, execute Migration 014, invoke RPC, or perform any adjacent operation under this authorization.
