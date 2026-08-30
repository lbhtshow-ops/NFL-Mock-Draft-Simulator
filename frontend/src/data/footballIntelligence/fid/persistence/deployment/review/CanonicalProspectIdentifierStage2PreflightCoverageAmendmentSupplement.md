# Canonical Prospect Identifier Stage 2 Preflight Coverage Amendment Supplement

Status: `READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_EXECUTION`

This additive amendment authorizes only `017c2_stage2_read_only_target_preflight_successor.sql`, SHA-256 `D9956965EACC8F022E6FE962EFC06F6604711A9159C25728AEADE248BCE7BBAE`, for manual read-only execution against exact project `ahmorpzcaapvoymiqlkv`. The original `017c_read_only_target_preflight.sql` remains unchanged at SHA-256 `F7B56039B54334AB3D0D13C64B0B1E0C8DFC0E02273C5BF696FA018F02D29524` and is not the authorized execution artifact.

## Preserved coverage

Blocks 1–6 preserve the approved server version, current/session/database identity, zero-argument `pg_catalog.gen_random_uuid` identity, required roles, `fid` schema ownership and privileges, migration 014 table/RPC conflict, and FID table-estimate observations. The UUID function and issuance RPC are not invoked.

## Closed gaps

Blocks 7–8 derive the governed metadata model from migrations 002 and 013. They require the exact single deployed-and-verified metadata row and exact ordered migration identifiers 001–013. Sanitized classifications identify missing, conflicting/partial, duplicated, unexpected, and exact states without returning payloads or sensitive data.

Block 9 reports current execution identity, `fid_function_owner`, superuser state, `pg_has_role(...,'MEMBER')`, current-role schema usage/create, and target-owner schema usage. `OWNERSHIP_TRANSFER_CAPABILITY_CONFIRMED_BY_SUPERUSER` or `OWNERSHIP_TRANSFER_CAPABILITY_CONFIRMED_BY_MEMBERSHIP` is required. Any other classification blocks migration readiness.

Block 10 checks all six schema-scoped names derived directly from migration 014:

1. `fid_identifier_reservations_operation_idx`
2. `fid_identifier_reservations_authorization_idx`
3. `fid_identifier_issuance_ledger_operation_idx`
4. `fid_identifier_issuance_ledger_authorization_idx`
5. `fid_identifier_issuance_idempotency_request_idx`
6. `fid_identifier_issuance_idempotency_recovery_idx`

Every row must be `AVAILABLE` with a zero conflict count.

## Manual result gate

Return every result set without adding credentials, URLs, tokens, connection strings, or unrelated data. Stop on any SQL error, missing expected row, non-exact migration classification, missing/unsafe role, unconfirmed ownership transfer, absent schema privilege, migration 014 object, index conflict, unexpected FID data, or other mismatch. Passing this preflight does not authorize migration 014; its results require a separate review and decision.

## Exact next action

Manually execute only the authorized Stage 2 read-only preflight successor against the exact Supabase test target, return its complete sanitized results for review, and stop. Do not execute migration 014.
