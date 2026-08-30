# Canonical Prospect Identifier Non-Production Persistence Transaction Implementation

## Status

Sprint 17B.2 implements the reviewed persistence transaction as repository artifacts only. Migration `014_create_fid_identifier_issuance_transaction.sql` is intentionally unapplied. No database, Supabase client, credential, environment value, network endpoint, or deployment is part of this implementation.

The Sprint 17B blocker was ownership and lifecycle ambiguity for database-created references. Sprint 17B.1 resolved it by assigning `transactionRef`, `reservationRef`, and `issuanceLedgerRef` to `FID_PROSPECT_IDENTITY_ISSUANCE_TRANSACTION_OWNER`, using independent PostgreSQL-native UUID v4 values during the first accepted atomic transaction. The four-entry output map remains unchanged: the three database-created references plus caller-known `idempotencyRef`.

## Repository audit and preservation

The implementation follows migrations 001–013 for `fid` schema qualification, explicit constraints, indexes, forced RLS, revoke-first privileges, narrow `service_role` function execution, `SECURITY DEFINER`, fixed `search_path`, `pg_catalog` qualification, and transaction-scoped advisory locks. Migrations 001–013 and all Sprint 16, 17A.1, 17A.2, and 17B.1 artifacts remain protected and unmodified. Migration 014 is the only added migration.

Static review identified `pg_catalog.gen_random_uuid()` as the declared PostgreSQL-native UUID v4 capability. Migration 014 neither creates nor requires authorization for a new extension. The function’s existence and UUID-v4 behavior remain a mandatory target-database preflight; they were not tested in this sprint.

## Persistence objects

`fid.fid_identifier_reservations` owns one committed, case-sensitive canonical candidate reservation. Its UUID primary key is `reservation_ref`; `transaction_ref` is unique. The authoritative uniqueness scope is `(namespace, candidate_identifier)`, using `text COLLATE "C"`. Structural checks enforce the approved namespace, layer, Base64URL alphabet, and exact length. No case folding, trimming, Unicode normalization, padding, or alternate encoding is performed.

`fid.fid_identifier_issuance_ledger` is the append-only issuance event for a reservation. Its UUID primary key is `issuance_ledger_ref`. Unique `reservation_ref` and foreign keys to the reservation establish the one-to-one relationship. Direct privileges provide `SELECT, INSERT` only to the function owner; no update or delete grant exists.

`fid.fid_identifier_issuance_idempotency` owns the caller-known text `idempotency_ref`, the stored outcome, typed request comparison fields, sanitized result, and committed references. A success row requires all three UUID references. A collision row requires `transaction_ref` and prohibits reservation and ledger references. Foreign keys link committed success references to their rows. Unique and check constraints enforce reference and outcome consistency.

All three tables use `timestamp with time zone` for `created_at`, JSONB arrays for governed policy/audit references, UUID equality for persistence-created references, and explicit primary, unique, foreign-key, and check constraints. Supporting indexes cover operation, authorization, request, and reconciliation lookup paths.

## Atomic RPC

The RPC is `fid.fid_execute_prospect_identifier_issuance_transaction` with 21 arguments: the request 1.0.0 version discriminator plus the unchanged 20 authoritative fields. The adapter permanently maps each runtime field to an explicit SQL argument and type. No persistence-created reference is accepted as input.

The function is `VOLATILE`, `PARALLEL UNSAFE`, and `SECURITY DEFINER`, with `SET search_path = pg_catalog, fid`. It validates the request and candidate structure before transaction work. It acquires deterministic transaction-scoped advisory locks through:

1. `idempotency:` plus `idempotencyRef`
2. `candidate:` plus namespace and the case-sensitive candidate
3. `operation:` plus `operationId`

Each lock uses `pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lock_text, 0::bigint))`. Unique constraints remain the final concurrency authority.

Matching replay is classified before any UUID assignment and returns the stored result with the original references. Conflicting reuse is rejected without returning the prior candidate. A new transaction explicitly assigns `transactionRef` using `pg_catalog.gen_random_uuid()` before collision determination. Collision stores the idempotent outcome and transaction reference only.

When the candidate is available, the function assigns `reservationRef`, checks it differs from `transactionRef`, inserts the reservation, then assigns `issuanceLedgerRef`, verifies all three are pairwise distinct, inserts the ledger row, and stores the committed idempotent result. These operations share the function transaction. An unhandled failure aborts the statement and rolls back all writes; no exception handler exposes a rolled-back reference.

Unknown-commit reconciliation uses exact RPC replay with `idempotencyRef`. A matching committed row returns the stored success or collision references. No row means no observable committed outcome. An inconsistent stored result produces recovery-required handling and must be manually reviewed. Blind retry and replacement reference generation are prohibited. No additional reconciliation RPC is introduced.

The SQL returns `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_RESULT@1.1.0`. UUID values are serialized from PostgreSQL `uuid` to canonical lowercase hyphenated text only at the result boundary. General runtime observations redact candidates; diagnostic snapshots contain neither candidate nor UUID values.

## Security model

RLS is enabled and forced on all three tables. Public, `anon`, and `authenticated` access is denied. Table and function privileges are revoked first. The function owner receives only the table operations needed by the RPC, and `service_role` receives schema usage plus execution of the exact function signature. Browser roles receive no mutation or execution path. The function does not create a Person, Player, Prospect, Profile, identity, canonical record, FIIS event, promotion, or simulator registration.

## Server-only adapter

`CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_RPC_TRANSACTION_ADAPTER@1.0.0` maps request 1.0.0 into the RPC and maps SQL outcomes into result 1.1.0. It accepts only an injected `CANONICAL_PROSPECT_IDENTIFIER_RPC_INVOCATION_CAPABILITY@1.0.0`; it contains no Supabase client construction, credential lookup, network call, or automatic retry. It rejects browser, production, client-bearing, credential-bearing, and operationally bound capabilities.

`CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_READY_RPC_COMPOSITION@1.3.0` binds the 1.2.0 handler declaration, 1.1.0 transaction port, 1.0.0 adapter, and 1.1.0 result contract while remaining non-operational. The injected diagnostic capability is non-networking and returns reference-redacted structural outcomes only.

## Static validation and deployment review

The migration oracle checks the three-table scope, RPC identity, explicit UUID lifecycle order, reference constraints, replay-before-assignment ordering, advisory locks, case sensitivity, fixed search path, RLS, revoke-first privileges, narrow execution grant, and prohibited SQL patterns. This is source-level evidence, not PostgreSQL parsing or target-database evidence.

Before any controlled execution, an independent reviewer must complete every preflight in `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_DEPLOYMENT_PLAN@1.0.0`, especially proving `pg_catalog.gen_random_uuid()` exists and returns UUID v4 in the authorized non-production target, confirming roles and object-name availability, confirming 001–013 hashes, and confirming 014 remains unapplied. Acceptance must then verify schema, constraints, locks, replay, collision, success, rollback, reconciliation, privileges, redaction, and server-only rejection behavior. Failed acceptance requires transaction rollback or controlled removal of only the newly introduced 014 objects, followed by manual recovery review; it must never generate replacement references.

Remaining limitations are deliberate: migration 014 has not been parsed or executed by PostgreSQL, target capability and roles are unverified, runtime capability binding is absent, controlled database acceptance is pending, and production remains prohibited.

Successful readiness is `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT_REVIEW`.

The exact next sprint is **Canonical Prospect Identifier Non-Production Persistence Transaction Deployment Review**.
