# Canonical Prospect Identifier Generator Port Foundation

This Sprint 8 contract specifies the declaration-only interoperability boundary between the future issuer and a future generator adapter. It does not implement, register, bind, or invoke a generator.

The immutable `CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT` version `1.0.0` is owned by `FID_PROSPECT_IDENTITY_GENERATOR_PORT_OWNER`. Its sole future responsibility is to accept a valid generation invocation and return a generation result or failure. Authorization, strategy selection, namespace governance, structural validation orchestration, collision detection, reservation, issuance, canonical records, persistence, promotion, and simulator registration remain outside the port. The issuer owns orchestration; a future adapter owns candidate production.

The invocation binds authorization, command, plan step, layer, namespace, strategy, convention, issuer architecture, environment, request/operation/batch metadata, idempotency scope, attempt declaration, policy reference, entropy-provider reference, inactive adapter-registration reference, validation profile, and audit references. Candidate values, raw entropy, identity or football facts, payloads, callbacks, clients, service objects, and implementations are rejected.

The adapter descriptor is lifecycle-governed from `DECLARED_NOT_IMPLEMENTED` through future validation and approval states. Sprint 8 permits only the unimplemented state with `implementation: null`, no runtime binding, and no production approval. The registration declaration remains `REGISTRATION_NOT_ACTIVE`; it is not a registry.

Generation results are generation-only. `CANDIDATE_GENERATED` must never imply uniqueness, reservation, issuance, identity creation, record creation, or persistence. Sprint 8 cannot construct a successful runtime result and keeps the candidate field null. Failures classify retry, review, cancellation, replay, replacement, authorization, strategy, recovery, and production-blocking properties but trigger no retry.

Supported layers are Person, Player, Prospect, and Prospect Profile, with namespaces `person`, `player`, `prospect`, and `prospect-profile`. Exact bindings target the Sprint 7 `CANONICAL_PROSPECT_IDENTIFIER_GENERATION_STRATEGY` `1.0.0`, the canonical convention `1.0.0`, and Sprint 6 issuer architecture `1.0.0`. Supported conceptual modes are secure opaque first generation and idempotent result replay. Replay returns the prior governed result under an exact scope; it is not deterministic candidate derivation.

Secure entropy remains a separate, unimplemented capability. Only an approved provider reference may cross the invocation boundary. Raw entropy, `Math.random`, timestamps, process-local counters, deterministic production fallback, packages, and provider selection are prohibited.

The adapter reports candidate and strategy metadata. Structural format and namespace validation are owned by the issuer boundary; collision detection remains the separate Sprint 6 port. Neither structural validation nor generation establishes uniqueness.

Attempts remain bound to the same authorization, command, idempotency reference, namespace, environment, and approved strategy version. Limits remain policy-controlled and unresolved; no loop exists. Adapter switching requires explicit policy or review. Cancellation is declarative only: no signal, callback, promise, or asynchronous implementation is embedded. Post-generation cancellation remains a future recovery concern.

Test vectors assert synthetic output properties only: opacity, nonsemantic content, namespace/format compliance, metadata presence, separation from operational and persistence IDs, and absence of mutable facts. They contain no expected candidate, randomness statistics, real prospect input, or execution.

All execution permissions are false. Activation requires a separately reviewed non-production adapter design, entropy-provider contract and binding, structural validation binding, idempotency storage, inactive-to-active registration governance, security/privacy approval, diagnostics, and runtime composition outside this sprint.

This document extends, without duplicating or modifying, `CanonicalProspectIdentifierIssuerArchitecture.md` and `CanonicalProspectIdentifierGenerationStrategy.md`.
