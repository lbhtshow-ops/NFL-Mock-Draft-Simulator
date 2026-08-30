# Canonical Prospect Identifier Persistence-State Reference Authority and Format Amendment

## Purpose and blocker

Sprint 17B stopped because the Sprint 16 request does not carry `transactionRef`, `reservationRef`, or `issuanceLedgerRef`, yet its result, idempotency, and recovery models require all three. Sprint 16 also left `REFERENCE_ID_FORMATS` unresolved. This amendment defines those values as persistence-created outputs, not missing runtime inputs.

## Audit and evaluated options

Existing FID migrations use governed text references without implicit identity defaults and provide no reservation or ledger identity policy. Sprint 17A.1's 20-field map correctly governs request inputs; it does not govern persistence-created state. Sprint 17A.2 therefore remains unchanged.

The review rejected application assignment, client assignment, reference reuse, timestamps, sequences, counters, deterministic hashes, candidate derivation, and prefixed opaque text requiring a second random encoding policy. PostgreSQL-native UUID v4 was selected because it supports atomic database assignment, nonsemantic opacity, global uniqueness, compact indexing, JSON/URL compatibility, and multi-environment and multi-sport use. The controlled deployment review must preflight the supported PostgreSQL baseline before implementation is executed.

## Authority, source, and format

`FID_PROSPECT_IDENTITY_ISSUANCE_TRANSACTION_OWNER` owns all three identities through the atomic persistence boundary. The future narrow capability is `FID_POSTGRESQL_PERSISTENCE_STATE_REFERENCE_CAPABILITY@1.0.0`. It supports exactly transaction, reservation, and issuance-ledger reference kinds through PostgreSQL's native secure UUID v4 source. It is declared but not implemented or executable in this sprint.

Each reference uses database type `uuid` and canonical lowercase hyphenated UUID v4 text when serialized. There is no semantic prefix. The three values are separately assigned and must be pairwise distinct. Candidate, entropy-provider output, timestamps, sequences, counters, hashes, request, operation, authorization, generation, and idempotency references cannot be used as sources or substitutes.

## Lifecycle

`transactionRef` is assigned after authoritative idempotency classification and before collision determination for a new accepted request. A governed collision receives a transaction reference stored with its idempotency result but no reservation or ledger reference. Failures before acceptance expose no transaction reference. A reference allocated in a rolled-back transaction is neither observable nor reused.

`reservationRef` is assigned immediately before inserting an available candidate's reservation. It exists only for a committed reservation. Collision and rollback expose none.

`issuanceLedgerRef` is assigned after reservation insertion and immediately before the append-only ledger insertion. It exists only with a committed ledger entry and remains distinct from both transaction and reservation references.

Matching replay generates nothing and returns the exact three stored references applicable to the original outcome. Conflicting idempotency allocates no committed-state references and mutates nothing. Unknown commit reconciliation starts with the caller-known `idempotencyRef`; it returns stored references if committed or a governed recovery state if consistency cannot be established. It never generates replacements or retries blindly.

## Contracts and maps

Sprint 16 request 1.0.0 remains unchanged. The additive `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_EXECUTION_CONTEXT@1.1.0` binds policy, capability, authority, and environment. `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT@1.1.0` supports the database-created outputs while retaining redacted declaration mode.

The permanent persistence-output map contains the three database-created outputs plus `idempotencyRef` as a distinct caller-known reconciliation input. It records assignment boundary, capability, creation condition, destination, replay source, reconciliation relationship, and result destination. The Sprint 17A.1 input map is not modified.

## Sensitivity and implementation boundary

The values are opaque audit-safe persistence references allowed only in restricted audit events. General logs and snapshots may not contain their values. Client exposure remains redacted unless separately authorized.

No generator, SQL, migration, RPC, database adapter, or reference value is created here. Migration 014 remains absent. The future SQL implementation must assign each value within the first accepted atomic transaction, persist it with the idempotent result, enforce uniqueness and distinctness, and fail closed if the approved source capability is unavailable.

Readiness: `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_IMPLEMENTATION`.

Exact next sprint: **Resume Canonical Prospect Identifier Non-Production Persistence Transaction Implementation**.
