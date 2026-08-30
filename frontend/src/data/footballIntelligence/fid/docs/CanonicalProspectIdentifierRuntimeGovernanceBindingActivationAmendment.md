# Canonical Prospect Identifier Runtime Governance Binding Activation Amendment

## Purpose

Sprint 17A.1 resolves the three authoritative-source blockers that prevented the trusted runtime from constructing Sprint 16's persistence transaction request. It activates additive contracts for a generation-result reference, issuer attempt context, authorization runtime result, and cross-contract runtime governance binding. It does not create or resume the persistence transaction port.

## Repository audit and versioning

Sprint 5 already owns authorization decisions through a required `decisionId`; this becomes the authorization runtime reference after a successful verifier validates the decision and its scope. Sprint 6 already owns `attemptNumber` and `maximumAttemptsPolicyReference` in the generation invocation. The successor exposes the latter as the runtime-facing `attemptPolicyRef` without transferring ownership. Sprint 15A's generation result 1.1.0 has no result reference and remains immutable. Sprint 15B's handler, composition, test doubles, server exports, and three-field transaction handoff remain unchanged.

The additive successors are:

- `PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT@1.2.0`
- `PROSPECT_IDENTIFIER_GENERATION_INVOCATION@1.2.0`
- `CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT@1.2.0`
- `PROSPECT_IDENTIFIER_ISSUER_ATTEMPT_CONTEXT@1.1.0`
- `PROSPECT_IDENTIFIER_AUTHORIZATION_RUNTIME_RESULT@1.1.0`
- `PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING@1.1.0`

The amendment is `CANONICAL_PROSPECT_IDENTIFIER_RUNTIME_GOVERNANCE_BINDING_ACTIVATION_AMENDMENT@1.0.0`.

## Generation-result reference

The FID prospect identity issuer assigns `generationResultRef` as part of its governed generation operation before invocation. The 1.2.0 invocation carries it and the adapter preserves it in the exact successful result. It is operation-scoped and stable for matching replay. It is never derived from the candidate, entropy, encoded material, a timestamp, or randomness; the adapter and client cannot synthesize it.

## Issuer attempt context

The issuer supplies an immutable context containing `attemptContextRef`, positive `attemptNumber`, `attemptPolicyRef`, and the governed maximum-attempt value when available. Runtime, provider, adapter, and future transaction code cannot increment or replace these fields. This activates the existing Sprint 6 `maximumAttemptsPolicyReference` ownership rather than creating a competing retry policy.

## Authorization result

The authorization verifier successor returns a minimal, audit-safe representation of an approved Sprint 5 decision: authorization decision reference, actor, request, operation, environment, layer, namespace, strategy, convention, attempt-context reference, active status, and revocation status. Authentication still supplies only actor identity. Authorization independently validates that identity and the complete scope. JWTs, claims payloads, tokens, credentials, and the full authorization decision are excluded.

## Runtime governance binding

The binding validates equality across authentication, authorization, invocation, and result for actor, authorization, request, operation, environment, layer, namespace, strategy, convention, attempt context, invocation, generation result, generator port, adapter, provider, attempt number, attempt policy, output-size policy, and encoding policy. Missing or conflicting values are rejected; they are not normalized or repaired.

The permanent 20-field source map records one owner, producer, validation owner, sensitivity classification, mutability, database verifiability, and failure behavior for each future transaction input. Candidate data remains sensitive pre-issuance operational data and is excluded from logs, snapshots, audit references, diagnostics output, and documentation.

## Additive runtime path

The server-only 1.2.0 module constructs a generation invocation from an issuer context plus a governed authorization result, binds an adapter-produced candidate to the successor result, and validates the pre-transaction governance binding. The composition accepts only test or development server environments and requires injected authentication, authorization, and issuer-context providers. It contains no transaction port, database adapter, Supabase client, endpoint, secret access, or persistence behavior.

Historical Sprint 15B behavior and default composition are unchanged. Matching completed replay must continue to stop before secure-source access, generation, governance binding, or transaction handoff. Conflicting replay stops before generation.

## Readiness and limitations

This amendment is implemented but not runtime-bound, registered, deployed, or production-approved. It creates no persistence transaction port, SQL, migration, RPC, database adapter, or live operation. Sprint 17A may now implement its successor handler and transaction-port handoff using these governed sources without inference.

Readiness: `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_PERSISTENCE_TRANSACTION_PORT_HANDOFF_AMENDMENT`.

Exact next sprint: **Resume Canonical Prospect Identifier Persistence Transaction Port Handoff Amendment**.
