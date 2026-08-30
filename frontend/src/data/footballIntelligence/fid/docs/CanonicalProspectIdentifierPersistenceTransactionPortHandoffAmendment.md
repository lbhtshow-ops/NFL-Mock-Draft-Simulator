# Canonical Prospect Identifier Persistence Transaction Port Handoff Amendment

## Purpose and history

Sprint 17 originally stopped because Sprint 15B's historical transaction handoff carried only candidate, request, and operation references. Sprint 17A.1 activated authoritative generation-result, attempt, authorization, and runtime-governance bindings. Sprint 17A.2 now implements the additive server-only handoff that constructs the exact Sprint 16 request without inference.

The legacy Sprint 15B handler, transaction double, composition, exports, and three-field interface remain unchanged. They are historical and are not compatible with the successor port.

## Successor boundary

The successor is `CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT@1.1.0`, implemented for non-production but not database-bound. It accepts `PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_REQUEST@1.0.0` directly. Partial and legacy handoffs are rejected.

The additive handler is `CANONICAL_PROSPECT_IDENTIFIER_TRUSTED_RUNTIME_HANDLER@1.2.0`; the dormant test/development composition is `CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_HANDOFF_COMPOSITION@1.2.0`. Both are server-only. No operational endpoint is created.

## Request construction and field sources

The builder consumes the Sprint 17A.1 validated governance binding, authorization result, generation invocation, generation result, and issuer context. It uses the permanent 20-field source map unchanged. Candidate, request, operation, authorization, generation invocation/result, layer, namespace, strategy, convention, generator port, adapter, provider, attempt, environment, actor, policy, and idempotency bindings each retain their authoritative source.

Sprint 16 stores the output-size and encoding policy references in `expectedPolicyRefs`. Required audit references combine the issuer/runtime and minimal authorization audit references. The builder rejects absent audit or policy bindings and preserves its caller inputs.

Authentication supplies actor identity only. The authorization result independently binds the actor, request, operation, environment, layer, namespace, strategy, convention, and attempt scope. The handler rejects cross-contract mismatches before request construction or handoff.

## Handler, replay, and failures

The handler validates the server environment, authentication, authorization, issuer context, generation invocation/result, candidate structure, runtime governance binding, and complete transaction request. It then invokes port 1.1.0 exactly once. It never retries.

A matching completed replay stops before issuer context access, generation, request construction, and port invocation. Conflicting idempotency stops before generation. Unknown commit and recovery-required outcomes return a sanitized recovery response and prohibit blind retry. Raw database errors and candidate values never appear in responses.

## Non-persisting transaction double

The test-only 1.1.0 double simulates success, collision, matching replay, idempotency conflict, reservation failure, ledger failure, rollback, unknown commit, and recovery required using the Sprint 16 result/failure contracts. Its observation contains structural booleans only. It retains neither the full request nor candidate and reports zero database, reservation, issuance, ledger, identity, record, and persistence operations.

## Candidate and environment protections

The candidate remains sensitive pre-issuance operational data. It exists only in the generated result, validated request, and handoff invocation. It is excluded from public exports, logs, snapshots, diagnostics output, audit metadata, errors, and retained double observations.

Only test and development server compositions are accepted. Browser and production configurations are rejected. The composition contains no database adapter, Supabase client, secret access, network behavior, deployment registration, or `Deno.serve` entry point.

## Readiness

The handoff, handler, double, and dormant composition are implemented. Database implementation, binding, execution, validation, deployment, and production approval remain false.

Readiness: `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_IMPLEMENTATION`.

Exact next sprint: **Canonical Prospect Identifier Non-Production Persistence Transaction Implementation**.
