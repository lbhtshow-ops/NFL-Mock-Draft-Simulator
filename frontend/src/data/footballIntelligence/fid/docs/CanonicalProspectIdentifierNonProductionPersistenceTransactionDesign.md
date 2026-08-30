# Canonical Prospect Identifier Non-Production Persistence Transaction Design

## Purpose and scope

This Sprint 16 declaration defines the future, narrow Postgres transaction that may convert an already governed generated candidate into reservation and issuance-ledger state. It is `CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DESIGN@1.0.0`, owned by `FID_PROSPECT_IDENTITY_ISSUANCE_TRANSACTION_OWNER`, and remains designed but unimplemented.

The current Sprint 15B runtime supplies a dependency-injected `IssuerTransactionPort` handoff after authentication, authorization, and generation. Sprint 16 preserves that interface and the Sprint 15A 1.1.0 runtime outcomes. It does not add an Edge Function entry point, adapter, SQL, migration, database call, or production capability.

## Repository audit and bindings

The design binds the Sprint 5 authorization decision, Sprint 6 issuer architecture and its distinct collision/reservation/ledger/transaction/recovery/clock responsibilities, Sprint 12 encoding policy, Sprint 14 trusted boundary, Sprint 15A runtime contracts, and Sprint 15B non-production runtime package. Those documents remain authoritative and are not duplicated here.

The existing FID persistence deployment package contains 13 ordered SQL units (`001`–`013`) beneath the FID persistence deployment area; the root Supabase migration directory contains one research-repository migration. Existing relevant FID objects are `fid_record_revisions`, `fid_persistence_idempotency`, and the `fid.fid_execute_atomic_persistence_batch` RPC precedent. None owns identifier reservation or issuance-ledger semantics, so the record-revision and generic persistence-idempotency tables are not overloaded.

The established RPC precedent is `SECURITY DEFINER`, owned by the narrow `fid_function_owner`, with fixed `search_path = pg_catalog, fid`, fully qualified references, revoke-first privileges, forced RLS, browser denial, minimum function-owner policies, and service-role execute access through a server boundary. Sprint 16 adopts that future security direction subject to implementation security review.

## Contracts and candidate handling

The request, result, and failure contracts are respectively `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_REQUEST@1.0.0`, `...RESULT@1.0.0`, and `...FAILURE@1.0.0`. Requests carry governed references, namespace/layer, attempt metadata, and the candidate that is the transaction subject. They reject entropy, separately encoded entropy, personal or scouting facts, credentials, clients, callbacks, retry commands, and client-selected policy implementations.

The candidate is sensitive pre-issuance operational data. Future storage must preserve case, separately bind the namespace, enforce the approved prefix and exact full length, and prevent general logging or snapshots. The result independently reports collision checking, commit-time uniqueness, reservation, issuance, ledger, identity, record, and persistence claims. This transaction reserves and records issuance only; it neither creates nor binds a canonical identity or record.

Failures distinguish malformed input, authorization and attempt mismatch, collision, idempotency conflict, reservation/ledger conflict, rollback, unknown commit, database availability, recovery, and unavailable implementation. No failure initiates retry. Only the issuer may consider a bounded next attempt after a governed collision result.

## Atomic transaction and RPC boundary

The smallest atomic unit is authoritative candidate collision determination, reservation insert-or-match, issuance-ledger insert-or-match, and idempotent operation-result recording. All required issuance-state writes commit together or none do. Application preflight checks, randomness, single-thread assumptions, and retries are not uniqueness controls.

The proposed future RPC is `fid.fid_execute_prospect_identifier_issuance_transaction(...)`, returning a governed JSON result. Its arguments are contract/version, request, operation, idempotency, authorization, generation, candidate, namespace/layer, strategy/convention/port/adapter/provider, attempt, environment, actor, expected-policy, and audit references. It receives no credential and is callable only through the Edge Function service boundary.

The ordered declaration has 17 stages: validate request, versions, environment, authorization, generation binding, candidate, namespace, attempt and idempotency; check an existing operation; establish the transaction; determine authoritative collision; create or validate reservation; create or validate ledger; finalize the idempotent result; commit; return a sanitized result. Every stage has `executionPermission: false`.

## Storage, constraints, concurrency, and recovery

The minimum future object set is:

- `fid.fid_identifier_reservations`
- `fid.fid_identifier_issuance_ledger`
- `fid.fid_identifier_issuance_idempotency`
- `fid.fid_execute_prospect_identifier_issuance_transaction`

No separate recovery table is currently justified. Required guards include case-sensitive namespace-plus-candidate uniqueness, unique idempotency and operation references, one ledger event per reservation, ledger-to-reservation referential integrity, namespace/prefix/full-length checks, positive attempt, non-production environment, and lifecycle checks. Lookup indexes cover operation, authorization, request fingerprint, and recovery references.

The isolation decision is `READ COMMITTED` with deterministic transaction-scoped advisory locks ordered by idempotency reference, namespace-plus-candidate, then operation ID. Unique constraints remain the final collision guard. Same-candidate concurrency produces one success and a collision or replay; same-idempotency concurrency produces one execution and replay or in-progress behavior.

Any reservation, ledger, or idempotency-finalization failure rolls back all writes. A response lost after possible commit becomes `IDENTIFIER_TRANSACTION_RECOVERY_REQUIRED`; the caller must reconcile by governed idempotency, operation, request, reservation, and ledger references and must not regenerate blindly. Database transaction time supplies authoritative audit/state-transition timestamps. Client timestamps and identifier timestamps are rejected; no expiry policy is invented.

## Migration and testing architecture

The future 11-stage package validates prerequisites; adds reservation, ledger, and issuance-idempotency storage; adds constraints/indexes; adds the RPC; forces RLS and policies; applies revoke-first privileges; adds a read-only acceptance oracle; and adds governed metadata plus disablement guidance. No migration is created in Sprint 16.

Future tests cover schema/constraints, format and case sensitivity, atomic commit/rollback, concurrent collision and replay, version/authorization/attempt rejection, post-commit recovery, raw-error sanitization, RLS/browser denial, service-boundary allowance, absence of entropy/token storage, and production prohibition. Integration is limited to synthetic data, the trusted runtime path, a future adapter, and local non-production Supabase. Production, real prospects, identity/record creation, FIIS, promotion, and simulator registration remain excluded.

## Capability, permissions, and activation

The transaction, RPC, three storage responsibilities, recovery boundary, migration package, and tests are designed only. They are not implemented, database-validated, runtime-bound, deployed, or approved for non-production or production. Every create/write/execute/connect/check/reserve/issue/persist/bind/deploy/activate permission remains false.

Activation requires exact contract conformance, migration and security review, RLS/privilege review, concurrency and recovery tests, a recovery runbook, browser denial, a server-only credential boundary, and isolated non-production scope. Remaining implementation choices include column types, request-fingerprint canonicalization, reference formats, error mapping, lock-key derivation, audit retention, and any future revocation policy.

Readiness after this design is `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_IMPLEMENTATION`. The exact next sprint is **Canonical Prospect Identifier Non-Production Persistence Transaction Implementation**.
