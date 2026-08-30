# Canonical Prospect Identifier Corrected Migration 014 Deployment Re-Review

## Purpose and baseline

Sprint 17C.1 independently re-reviewed the Sprint 17B.3 correction of `DR-014-001`. The original Sprint 17C evidence remains unchanged. The original migration hash was `3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13`; the corrected repository file is exactly `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD`. Migration 015 is absent and repository records contain no execution claim.

## Correction scope and closure

The semantic change is confined to matching-replay validation, recovery handling, replay reconstruction, one local consistency variable, and adding `idempotencyRef` to newly stored result representations. Table identities/schemas, RPC identity/signature/arguments/return type, UUID capability and new-transaction lifecycle, lock order, candidate rules and uniqueness, collision/success writes, insertion order, atomicity, RLS, policies, privileges, `SECURITY DEFINER`, and fixed search path are unchanged.

`DR-014-001` is closed. The RPC no longer returns `v_existing.result_payload`. Relational idempotency status and reference columns are authoritative. Stored JSON must be an object with the supported identity/version, matching status, matching caller-known idempotency reference, and canonical text matching each applicable relational UUID. It cannot override success/collision classification or returned persistence references.

Success replay requires non-null, pairwise-distinct transaction/reservation/ledger references, matching payload references, an existing reservation bound to the transaction, and an existing ledger bound to that reservation and transaction. Composite indexes/keys support these immutable committed-row lookups. The idempotency lock is obtained first; append-only state makes the read sequence concurrency-safe.

Collision replay requires relational null reservation/ledger references, matching collision status and transaction reference, explicit JSON-null payload reference keys, and no reservation, issuance, or ledger-write claim. Both outcomes require false identity/record claims and true persisted representation.

Missing, JSON-null, non-object, wrongly typed, unsupported, malformed, mismatched, cross-linked, or prohibited state produces a sanitized `IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED` result. Payload UUID text is never cast to `uuid`; it is compared to lowercase relational serialization, so malformed or uppercase text fails closed without a cast exception. Recovery returns no stored payload, candidate, raw error, constraint name, stack trace, or fabricated reference and performs no repair or retry.

Consistent replay is reconstructed from relational columns with result identity/version, exact original status, `MATCHING_COMPLETED_REPLAY`, caller-known idempotency reference, original persistence references, false identity/record claims, and true persistence claim. The server adapter maps it into `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT@1.1.0`; recovery-required mapping also validates without adapter repair.

Replay completes under the idempotency lock before `pg_catalog.gen_random_uuid()`, candidate/operation locks, collision query, reservation insert, ledger insert, or idempotency write. Static review finds no replay write, UUID generation, collision query, stored-payload return, repair, or retry path.

## Oracle and historical interpretation

The strengthened oracle checks the original defect class, contract/status/reference comparisons, success/collision combinations, recovery branch ordering, replay reconstruction, and absence of replay writes, UUID generation, collision query, and payload repair. It remains lexical: it depends on identifiers/formatting, proves presence more readily than dominance, can be affected by dead code/comments, and cannot substitute for PostgreSQL parsing or target acceptance.

The protected Sprint 17C diagnostic reports 28/30. Its original-hash and original-unvalidated-payload assertions are classified `EXPECTED_HISTORICAL_EVIDENCE_DIVERGENCE`, not regressions. The other 28 historical assertions pass.

## Preflight, acceptance, and runbook

The existing read-only preflight still covers PostgreSQL version, zero-argument `pg_catalog.gen_random_uuid`, roles, `fid` schema, current role context, conflicting objects, ownership, and schema privileges. Dashboard stages remain responsible for organization, exact project ID, active/unpaused state, and non-production confirmation. Linked-row reads add no privilege: the function-owner policies and SELECT grants already cover reservation and ledger tables under forced RLS.

An additive acceptance supplement separates read-only function inspection, rollback-contained safe replay tests, separately authorized privileged integrity injection, and final reconciliation. Integrity injection must use synthetic state in a disposable or proven rollback-contained session, may not disable RLS or constraints, and is skipped if those safeguards cannot be proven.

The runbook supplement requires the corrected hash and explicitly prohibits deployment of the original hash. It records the expected historical divergence and adds stop conditions for missing recovery markers, unrestricted payload return, replay side effects, recovery leakage, forced-RLS linked-row failure, and unexpected reconciliation state.

## Findings and decision

- `PASS`: corrected hash, authorized scope, DR-014-001 closure, relational authority, success/collision invariants, malformed payload safety, linked-row validation, recovery result, replay reconstruction, result mapping, and prior architecture preservation.
- `NON_BLOCKING_OBSERVATION`: the static oracle remains lexical and target behavior remains unexecuted.
- `REVIEW_REQUIRED`: target read-only preflight remains a mandatory controlled-deployment condition, not a repository blocker.
- `BLOCKER`: none.

Readiness: `READY_FOR_CONTROLLED_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT`.

Exact next sprint: **Controlled Canonical Prospect Identifier Non-Production Persistence Transaction Deployment**.
