# Canonical Prospect Identifier Non-Production Persistence Transaction Deployment Review

## Purpose and baseline

Sprint 17C independently reviewed unapplied migration 014, migrations 001–013, the Sprint 16 design, Sprint 17A governance/handoff, Sprint 17B reference policy, and Sprint 17B.2 adapter/deployment artifacts. The repository is on `main` with extensive inherited modified and untracked work. Review additions were isolated from it.

Migration `014_create_fid_identifier_issuance_transaction.sql` hashes to `3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13`, matching the reported baseline. It is the sole 014 and follows 001–013. Repository records contain no execution claim. No local PostgreSQL, psql, Supabase CLI, Deno, Docker, pg_isready, or SQL linter is available; nothing was installed.

## Review results

Object scope passes: three tables and one function are created, with supporting constraints, indexes, policies, comments, grants, and revocations only. Creation order is tables, indexes, function, ownership/comment, RLS/policies, then privileges. Existing objects are not rewritten.

The reservation table uses UUID references, `text COLLATE "C"`, namespace-plus-candidate uniqueness, exact namespace/layer/length checks, and no normalization. The ledger has a unique reservation relationship and composite binding to reservation, transaction, namespace, and candidate. Idempotency outcome checks require all references for success and transaction only for collision. Its composite FK prevents cross-transaction ledger/reference mixing. Immediate FKs permit the intended reservation → ledger → idempotency insertion order without a cycle.

PostgreSQL regexes enforce a colon prefix and exactly 22 characters from `[A-Za-z0-9_-]`; padding, whitespace, `+`, `/`, extra delimiters, and wrong lengths are rejected while uppercase remains valid. The four supported lengths are 29, 29, 31, and 39.

Idempotency locking and classification precede `pg_catalog.gen_random_uuid()`. Matching and conflicting paths return before assignment and writes. New requests assign transaction, then lock candidate and operation, determine collision, and either persist a transaction-only collision or insert reservation, assign ledger reference, insert ledger, and persist success. Three transaction-scoped locks use `hashtextextended(...,0::bigint)` in idempotency → candidate → operation order. Unique constraints remain final authority. No exception handler, autonomous transaction, external call, commit, or partial-success conversion exists; statement failure rolls back the RPC transaction.

The service boundary is structurally coherent: `SECURITY DEFINER`, fixed `pg_catalog, fid` search path, no dynamic SQL, explicit object qualification, forced RLS, function-owner allow policies, public/anon/authenticated deny policies, revoke-first privileges, and exact service-role execution grant. Migrations 001 and 012 require `fid_function_owner` to be NOLOGIN/NOSUPERUSER/NOBYPASSRLS. Because the function runs as that role and it has explicit SELECT/INSERT policies and privileges, FORCE RLS does not inherently block it. Target ownership, role attributes, schema usage, and effective privileges still require the prepared read-only preflight.

The server adapter maps the version discriminator plus the 20 governed fields, supplies no persistence-created reference, validates UUID-v4 result combinations, preserves uncertainty without retry, normalizes thrown/raw failures, rejects browser and production binding, and imports no Supabase SDK, client, environment, secret, or network capability.

## Blocking finding

`DR-014-001 — BLOCKER`: the matching replay branch returns `v_existing.result_payload` after request-field comparison but never verifies that the stored JSON status and references agree with `outcome_status`, `transaction_ref`, `reservation_ref`, and `issuance_ledger_ref`. Consequently, an inconsistent stored row is replayed rather than producing the governed recovery-required classification. Relational constraints protect the columns but do not bind the JSON payload to them.

Consequence: unknown/inconsistent-state recovery is incomplete, so deployment is prohibited. This is a narrow implementation defect governed by existing contracts. Migration 014 must not be silently changed in review; a Sprint 17B.3 correction should validate stored outcome/reference consistency before replay and return a sanitized recovery-required result on mismatch. No contract amendment is required.

`DR-014-002 — REVIEW_REQUIRED`: target UUID function, roles, ownership, privileges, and project identity are necessarily unresolved until authorized read-only preflight. `pg_catalog.gen_random_uuid()` is referenced consistently with repository policy, but deployment must stop if the zero-argument function is absent, outside `pg_catalog`, or does not return `uuid`. The prepared query inspects catalogs without invoking it.

`DR-014-003 — NON_BLOCKING_OBSERVATION`: the 23-check static oracle relies on regex, substring counts, and first-index ordering. It can miss invalid parsing, branch changes, semantically invalid foreign keys, payload inconsistency, and misleading occurrences in comments; it can also fail harmless formatting changes. It is supporting evidence, not proof.

## Deployment and recovery preparation

The runbook contains Stages 0–8 with explicit pause points for repository verification, Dashboard organization/name/project-ID confirmation, read-only preflight, recovery preparation, single execution, structural acceptance, rollback-contained behavioral acceptance, security acceptance, and final reconciliation. Acceptance SQL is separated into read-only, state-changing rollback-contained, concurrency, unauthorized-cleanup, and final reconciliation blocks. Synthetic test values remain operator-only sensitive material; no permanent snapshot or report contains a candidate or UUID.

Recovery defaults to stopping and catalog reconciliation. No destructive rollback is authorized. Migration failure, uncertain status, partial objects, unexpected rows, unauthorized access, missing UUID capability, forced-RLS failure, duplicate execution, and project pause each require reconciliation before retry. An additive correction is preferred over manual schema editing.

## Assessment

Status: `PERSISTENCE_TRANSACTION_DEPLOYMENT_BLOCKED`.

Readiness `READY_FOR_CONTROLLED_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT` is **not granted**.

Required next sprint: **Sprint 17B.3 — Narrow Migration 014 Inconsistent Replay Correction**, followed by renewed deployment review.
