# Canonical Prospect Identifier Migration 014 Inconsistent Replay Correction

Sprint 17B.3 corrects deployment-review finding `DR-014-001` in the unapplied migration 014. The original matching-replay branch compared request bindings and then returned `v_existing.result_payload` without proving that the JSON agreed with authoritative relational status and reference columns.

The correction is deliberately narrow. Relational idempotency columns remain authoritative; `result_payload` is only a replay representation. The RPC now validates that the payload is an object with the supported contract identity/version, status, caller-known idempotency reference, transaction reference, safe claims, and no prohibited sensitive/error keys. UUID payload text is compared to canonical lowercase serialization of relational UUIDs without casting untrusted payload text.

For success replay, relational reservation and ledger references must exist, all three references must differ, both referenced rows must exist, and their reservation/transaction binding must agree. Payload reservation and ledger references must match. For collision replay, both relational references must be null and the payload must contain JSON-null reservation and ledger keys without reservation, issuance, or ledger-write claims.

Malformed, missing, wrongly typed, unsupported, cross-linked, or conflicting state returns a sanitized `IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED` result. It includes the caller-known idempotency reference, null persistence references, `INCONSISTENT_STORED_STATE`, and no candidate, stored payload, raw error, constraint, authorization payload, identity claim, record claim, or retry instruction. The stored row is never repaired.

Consistent replay is reconstructed from relational columns rather than returning unrestricted JSON. Replay remains under the idempotency lock and exits before transaction UUID assignment, candidate locking, collision determination, reservation/ledger insertion, or any write. Both consistent and inconsistent replay are UUID-free, write-free, and retry-free.

New success and collision payloads now store `idempotencyRef`, allowing the required consistency comparison. Table definitions, RPC identity/signature, lock order, candidate uniqueness/validation, UUID lifecycle outside replay, RLS, policies, grants, and revocations are unchanged. No migration 015 was created.

The static oracle now checks replay-region status/reference comparisons, success/collision combinations, recovery ordering, reconstruction, absence of direct payload return, absence of replay UUID generation/collision queries/payload repair, and the original architecture. It remains lexical analysis and cannot replace PostgreSQL parsing or controlled target acceptance.

Migration 014 remains unapplied and requires an independent corrected deployment re-review.

Readiness: `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT_REVIEW`.

Exact next sprint: **Corrected Migration 014 Persistence Transaction Deployment Re-Review**.
