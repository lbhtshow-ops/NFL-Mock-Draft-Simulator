# Controlled Deployment Runbook — Migration 014

Status: reviewed preparation only; execution prohibited until the Sprint 17C blocker is corrected and independently re-reviewed.

Target: **LBHT FID Persistence Test**. The operator must verify organization, display name, and project ID directly in Supabase Dashboard. Never identify the target by display name alone.

## Stage 0 — Repository verification (pause)

Confirm the reviewed migration filename and SHA-256, migration hashes 001–013, branch/worktree state, and that no migration changed after review. Stop on any mismatch.

## Stage 1 — Dashboard verification (pause)

Confirm organization, project name, project ID, active state, and explicit non-production classification. Stop if paused, production, or any identifier differs from the authorized deployment record.

## Stage 2 — Read-only environment preflight (pause)

Run only `017c_read_only_target_preflight.sql`. Verify PostgreSQL version; the zero-argument `pg_catalog.gen_random_uuid` identity and `uuid` result; all four roles; `fid` schema; current role privileges; absence of all 014 objects; and baseline table estimates. The query does not invoke the UUID function. Stop unless every assumption matches.

## Stage 3 — Recovery preparation (pause)

Record schema state and prior acceptance status. Determine the project’s actual backup/recovery capability without assuming point-in-time recovery. Define the incident owner and reconciliation record. The default response to failure is stop and inspect; no destructive rollback migration is authorized.

## Stage 4 — Migration execution (pause)

After explicit user authorization, paste only the byte-for-byte reviewed migration and execute once. Stop on any error. Never edit SQL interactively to make it work. Preserve sanitized error output. An uncertain response prohibits retry until object-state reconciliation proves whether the transaction committed.

## Stage 5 — Structural acceptance (pause)

Run read-only Blocks 2 and 3. Verify three tables, columns, PK/FK/composite FK/unique/check constraints, indexes, function identity/configuration, RLS and FORCE RLS, policies, grants/revocations, UUID capability, and absence of unauthorized objects.

## Stage 6 — Behavioral acceptance (pause)

Use approved synthetic non-person data only. Run Block 4 inside one explicit `BEGIN`/`ROLLBACK`: success, matching success replay, collision, matching collision replay, conflict, case sensitivity, rollback, and reference lifecycle. Values are sensitive operator-only material and must not enter general diagnostics. Do not create canonical identities or records.

## Stage 7 — Security acceptance (pause)

Verify anon/authenticated RPC and table denial, direct-table denial for service role, approved function execution, ledger update/delete denial, candidate redaction, raw-error normalization, and the function owner’s effective forced-RLS path. Stop on any unauthorized access.

## Stage 8 — Final reconciliation (pause)

Run Block 7 and reconcile exact structural state and rollback-contained row counts. Confirm no duplicate issuance, unexpected objects, identities, or records. Produce a sanitized acceptance report and readiness decision.

## Recovery matrix

- Failure before commit: confirm no 014 objects; do not retry until reconciled.
- Migration succeeds but acceptance fails: stop; prepare an additive corrective migration.
- SQL Editor status uncertain: inspect catalogs read-only before any retry.
- Partial objects after operator modification/separate execution: stop; do not manually complete or delete them.
- Unexpected behavioral rows: stop; retain for incident review until cleanup is separately authorized.
- Unauthorized access: revoke operational authorization and begin security review.
- Missing UUID capability: stop; governance amendment required before changing mechanisms.
- Forced-RLS access failure: stop; inspect role attributes, ownership, grants, and policies.
- Duplicate execution attempt: stop; reconcile existing objects.
- Project pauses: stop and re-verify project identity/state after recovery.
