# Sprint 17C.42 authorized manual execution runbook

## Active authorization

- Authorization ID: `SPLIT_AUTHORITY_MISMATCH_DETAIL_DIAGNOSTIC_ONE_EXECUTION_017C42_V1`
- Status: `ACTIVE_UNCONSUMED`
- Maximum attempts: one
- Maximum executions: one
- SQL file: `017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql`
- SHA-256: `8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E`

The authorization is consumed immediately when the attempt begins, regardless of success, SQL error, timeout, interruption, browser or network uncertainty, zero rows, multiple rows, malformed or incomplete output, or unknown completion. There is no retry.

## Exact target that must be manually verified before attempt start

- Organization: Lunch Break Hot Take
- Project: LBHT FID Persistence Test
- Project reference: ahmorpzcaapvoymiqlkv
- Region: us-east-1
- Branch: main
- Dashboard database source: Primary Database
- SQL Editor role: postgres
- Governed environment: DEDICATED_NON_PRODUCTION_TEST
- Platform branch label: PRODUCTION, meaning primary-branch topology only for this exact dedicated non-production test target

If any value differs or cannot be verified in the Dashboard, do not begin the attempt and leave the authorization unconsumed.

## Exact manual steps

1. In the Supabase Dashboard, manually verify every target value above. Confirm the SQL Editor session is for Primary Database as `postgres`.
2. Independently hash the exact repository SQL file. Stop before attempt start unless it equals the authorized SHA-256.
3. Open the complete SQL file without changing it. Copy the complete file byte-for-byte into the SQL Editor. Do not select a fragment or edit any statement.
4. Reconfirm the active authorization ID and record that attempt 1 is about to begin.
5. Begin the one authorized execution. At this instant, mark the authorization `CONSUMED`, even if the response later fails or is uncertain.
6. Capture either the complete SQLSTATE and message or the complete single returned row. Preserve the raw response and exact field order. Capture the entire `mismatch_details` JSON without UI or clipboard truncation.
7. Stop after the response. Do not execute any follow-up statement and do not retry.
8. Evaluate the capture using `FidFunctionOwnerCapabilityMismatchDetail017c41ResultEvaluator.js`. Return sanitized evidence to governance. A mismatch is diagnostic evidence only and grants no repair authority.

## Required 25-field order

`result_identity`, `result_version`, `mode`, `classification`, `mismatch_count`, `mismatch_details`, `detail_count`, `count_reconciled`, `captured_preflight_mismatch_count`, `captured_count_reconciled`, `unresolved_details`, `state_conflicts`, `expected_before_set_state`, `expected_before_create_state`, `membership_evidence`, `metadata_storage_present`, `migration_014_metadata_count`, `evidence_complete`, `database_observed_target_evidence`, `externally_authorized_target_binding`, `database_evidence_complete`, `external_target_attestation_required`, `overall_target_verified`, `read_only`, `mutation_count`.

## Outcome handling

- One complete valid row: preserve all 25 fields and full mismatch details, then stop.
- SQL error: preserve SQLSTATE and message, then stop.
- Zero or multiple rows: preserve the response, then stop.
- Malformed or incomplete output: preserve everything visible, then stop.
- Timeout, interruption, or uncertain completion: stop and classify completion as uncertain.
- Target discrepancy discovered before execution: do not begin.

Every outcome prohibits a second execution, retry, reconciliation, repair, cleanup, GRANT or REVOKE, role or membership changes, capability-amendment execution, post-amendment verification, Migration 014, RPC invocation, UUID or candidate generation, identifier issuance, prospect or cohort operations, and every database mutation.
