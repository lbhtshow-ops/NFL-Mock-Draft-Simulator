# Canonical Prospect Identifier Migration 014 Controlled Execution Authorization Supplement

Status: `READY_FOR_CONTROLLED_CORRECTED_MIGRATION_014_EXECUTION`

The complete sanitized `017c3` results satisfy Stage 2 for exact project `ahmorpzcaapvoymiqlkv`. PostgreSQL 17.6 accepted all ten read-only blocks. Required roles, schema privileges, exact migrations 001–013 metadata, ownership-transfer capability, and all object/index availability checks passed. Planner estimates of `-1` mean statistics have no current analyzed estimate; they are not negative row counts or evidence of production data.

The historical `017c2` SQLSTATE `0A000` failure is separate, corrected evidence. It performed zero mutations and does not apply to the successful `017c3` run.

## Authorized operation

Only `014_create_fid_identifier_issuance_transaction.sql`, SHA-256 `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD`, may be pasted byte-for-byte into the Supabase Dashboard SQL Editor for project `ahmorpzcaapvoymiqlkv` and executed once as role `postgres` in one Dashboard operation.

The original hash `3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13` is prohibited.

## Stop and recovery boundary

Stop immediately on any SQL error. Do not edit SQL, repair objects ad hoc, retry partially, or rerun blindly. Preserve sanitized error output. If the response is uncertain, perform no retry until separately authorized read-only catalog reconciliation establishes whether the operation committed. If any partial state is observed, stop and follow the controlled runbook recovery matrix; no destructive rollback is authorized.

On success, capture the complete execution result and stop. Post-deployment acceptance is not authorized by this supplement. Do not invoke the issuance RPC, generate candidates, populate prospects, create canonical identities or records, activate an Edge Function/runtime, or perform any production operation.

## Exact next action

Manually execute exactly once the corrected migration 014 with SHA-256 `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD` against the authorized Supabase test project `ahmorpzcaapvoymiqlkv`, capture the complete execution result, and stop. Do not invoke the issuance RPC or perform any prospect operation.
