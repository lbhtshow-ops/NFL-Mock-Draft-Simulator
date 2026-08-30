# Sprint 17C.41 future controlled diagnostic execution runbook

## Authority boundary

This runbook is execution preparation only. It is not an execution authorization. Do not connect to Supabase, open a SQL editor session, or execute any statement unless a later checkpoint grants a separate, active authorization for exactly one controlled diagnostic attempt.

The prior Sprint 17C.23, 17C.26, and 17C.29 authorizations are consumed and cannot be reused. This runbook grants no retry, repair, capability amendment, Migration 014, RPC, deployment, or application-write authority.

## Fixed artifact

- File: `017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql`
- SHA-256: `8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E`
- Expected result identity: `SPLIT_AUTHORITY_25_FIELD_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT`
- Expected result version: `17C.40.1`
- Expected mode: `MISMATCH_DETAIL_DIAGNOSTIC`

Before any future attempt, independently hash the exact file bytes and stop if the hash differs.

## Externally attested target

An authorized operator must verify these dashboard facts outside the SQL result immediately before execution:

- Organization: Lunch Break Hot Take
- Project: LBHT FID Persistence Test
- Project reference: ahmorpzcaapvoymiqlkv
- Region: us-east-1
- Branch: main
- Dashboard database source: Primary Database
- Governed environment: DEDICATED_NON_PRODUCTION_TEST
- Database role/session: postgres

The SQL can observe database/session evidence but cannot prove the dashboard organization, project, region, branch, or source. Do not treat `overall_target_verified = false` as a defect; it enforces this split authority.

## One-attempt procedure after separate authorization

1. Record the new authorization identifier, exact scope, operator, timestamp, and externally verified target facts.
2. Reconfirm the fixed filename and SHA-256. Use the complete file byte-for-byte; do not select or edit excerpts.
3. Start the single authorized attempt. At attempt start, mark that future authorization consumed.
4. Execute the file once against the externally verified Primary Database session as `postgres`.
5. Capture the full SQL error, if any, or every visible value in the single returned row, including the complete `mismatch_details` JSON array. Preserve the original field order and raw output.
6. Stop after the first attempt regardless of outcome. Do not retry, repair, amend privileges, run Migration 014, invoke an RPC, or execute follow-up SQL.
7. Evaluate the capture with the Sprint 17C.41 result evaluator classifications. A mismatch is diagnostic evidence, not repair permission.

## Expected 25-field order

`result_identity`, `result_version`, `mode`, `classification`, `operation`, `read_only`, `mutation_count`, `metadata_storage_present`, `migration_014_metadata_count`, `database_observed_target_evidence`, `database_evidence_complete`, `externally_authorized_target_binding`, `external_target_attestation_required`, `overall_target_verified`, `acl_matrix_object_bound_units`, `acl_matrix_inventory_units`, `acl_matrix_governance_units`, `expected_increment_count`, `captured_preflight_mismatch_count`, `mismatch_count`, `detail_count`, `count_reconciled`, `captured_count_reconciled`, `evidence_complete`, `mismatch_details`.

## Mandatory stop conditions

Stop and preserve evidence for: SQL error; uncertain completion; zero or multiple rows; field/order drift; incomplete database evidence; missing metadata storage; nonzero Migration 014 metadata; wrong database/session evidence; wrong external binding metadata; count/detail disagreement; or any target-attestation doubt. Route the captured evidence to governance. None of these conditions authorizes another attempt.
