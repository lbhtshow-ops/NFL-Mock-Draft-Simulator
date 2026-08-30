# Sprint 17C.24 consumed attempt and visible-result correction

Status: `READY_FOR_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_REVIEW`.

This sprint is repository-only and authorizes no execution. It made no Supabase connection, executed no SQL or RPC, and changed no database object, role, membership, ACL, privilege, ownership, policy, or migration.

## Consumed attempt

The user manually used authorization `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_ONE_EXECUTION_017C23_V1`, version `17C.23.1`, for its sole permitted attempt against project `ahmorpzcaapvoymiqlkv`. The verified preflight hash was `A58B83C605C9488985355CC3A38A44306B479D80E1B80C3F0A7CC9EBEA3222C2`. The Dashboard displayed `Success. No rows returned.` with no displayed SQL error, zero visible rows, and no visible governed classification.

The evidence is therefore `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_RESULT_INCOMPLETE`. It proves neither that the ACL preflight passed nor that it failed. The authorization was consumed when the attempt began and cannot authorize a retry.

## Root cause and correction

The protected 17C.19 preflight emits its governed classification only with `RAISE NOTICE` and has no ordinary final `SELECT`. The returned evidence contains no captured notice payload.

The additive successor preserves the anonymous-block checks, but transfers one sanitized JSON summary through `set_config(..., true)` inside an explicit `READ ONLY` transaction. The setting is overwritten with `PENDING` before evaluation, preventing stale reuse. An unexpected SQL error aborts the transaction before the final query. A stable ordinary `SELECT` reads and validates the transaction-local value, returns one row with 16 fixed columns, and the following transaction end automatically clears the local value. It contains no sensitive, candidate, or identifier values.

The protected successor SHA-256 is `C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A`.

PostgreSQL documents that `set_config` with `is_local=true` applies only to the current transaction and that `SET LOCAL` effects end whether the transaction commits or rolls back. PostgreSQL also enforces the explicit transaction as read-only. Supabase documents that Dashboard SQL Editor executes query syntax against the project's PostgreSQL database. Dashboard presentation of this exact successor remains subject to the required separate independent review; no execution is authorized here.

## Safety and coverage

The optional migration metadata relation is resolved with `to_regclass` before use. When absent, the successor writes a visible unresolved summary and never prepares the dynamic relation query. When present, the only dynamic statement is the constant aggregate metadata SELECT using the resolved `regclass`; no client-controlled SQL or identifier is accepted.

The corrected 261-unit matrix coverage remains intact: five governed principals, schema USAGE/CREATE and grant authority, restricted owner attributes, membership ADMIN/INHERIT/SET, seven exact tables and their ACL boundaries, exact function identity/ownership/security/search path/EXECUTE boundary, other-schema CREATE denial, direct/effective ACL and grant-option checks, zero-sequence inventory, unexpected-object rejection, and migration-014 object/metadata absence.

No temporary or persistent object, database helper, session-persistent setting, execution authorization, retry authorization, amendment authorization, or migration authorization was created.
