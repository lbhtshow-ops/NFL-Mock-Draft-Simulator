# Canonical Prospect Identifier Generator Adapter Non-Production Design

Sprint 9 specifies—but does not implement—the first non-production adapter for the Sprint 8 generator port. The future adapter owns only candidate production under the approved Sprint 7 strategy. Authorization, orchestration, strategy selection, namespace governance, structural validation, collision detection, reservation, issuance, ledgers, records, persistence, promotion, and simulator registration remain external.

The design `CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_ADAPTER_NON_PRODUCTION_DESIGN` version `1.0.0` describes adapter `CANONICAL_PROSPECT_IDENTIFIER_SECURE_OPAQUE_NON_PRODUCTION_ADAPTER` version `1.0.0`. It binds exactly to port, strategy, convention, and issuer architecture version `1.0.0`; supports Person, Player, Prospect, and Prospect Profile; and is restricted to test and development. Profile handling creates only a future identifier candidate and never a profile record.

The future package is owned under `prospectIntake/generatorAdapters`. Its public design signature is `generateProspectIdentifierCandidate(validatedInvocation, validatedDependencyBag)`. No such function or implementation file exists. Expected domain failures will be returned as generation failures; unexpected programmer errors must be sanitized by a future boundary.

Dependencies enter through an immutable validated dependency bag. Required declarations cover secure entropy, opaque output encoding, strategy metadata, and adapter metadata. Implementations, callbacks, clients, services, persistence adapters, registries, global randomness, clocks, seeds, and raw entropy are prohibited from contracts.

The entropy provider remains separately owned and unimplemented. The invocation supplies only its approved reference. Raw entropy may eventually cross a private adapter/provider runtime boundary, but must never enter invocation, result, assessment, snapshot, audit, telemetry, or log contracts.

Hexadecimal, Base32, and unpadded Base64URL were assessed. The repository contains no authoritative cross-environment encoding policy, so selection is deferred to reviewed entropy and encoding contracts. URL safety, delimiter compatibility, consistent casing, expansion, ambiguity, and information leakage are mandatory review criteria. Entropy and output-length categories are likewise deferred; no numeric security value is invented.

Candidate assembly is conceptually `<NAMESPACE_COMPONENT>:<OPAQUE_COMPONENT_NOT_GENERATED>`. Namespace and layer come only from the validated invocation, the delimiter belongs to the convention, and strategy version remains metadata. Environment, draft cycle, personal facts, football facts, persistence structure, and issuance order cannot be encoded. No example candidate exists.

The adapter performs defensive declaration checks only. Issuer structural validation remains authoritative, and the Sprint 6 collision port remains the sole collision boundary. Generation claims neither uniqueness nor reservation or issuance.

One future adapter invocation handles one attempt. The issuer owns retry orchestration and the idempotency store. A matching prior result prevents adapter invocation; conflicting replay scope blocks. Attempts remain bound to the authorization, namespace, strategy version, and policy reference. Adapter switching requires issuer policy or review.

Cancellation remains declarative: no signal, callback, promise, or asynchronous stub exists. Cancellation before invocation returns a future cancelled failure; cooperation during a dependency call belongs to future provider contracts; post-result cancellation belongs to issuer recovery.

Logging permits only adapter/strategy metadata, layer, namespace, attempt reference, and outcome category. Raw entropy, candidates by default, full invocations, dependency objects, and personal facts are prohibited.

Test architecture uses symbolic scripted capability declarations, not executable entropy or encoder doubles. Property tests will assert opacity, nonsemantic structure, namespace compliance, metadata, and absence of effects. Negative tests cover bindings, prohibited facts, missing dependencies, cancellation, and replay conflict. Expected candidates and statistical randomness tests are prohibited. Integration stops before collision, reservation, issuance, and persistence.

Implementation phases begin with contract approval and separate entropy/encoding governance, followed later by private non-production implementation and validation. Security, privacy, architecture, entropy, encoding, test, conformance, and non-production registration gates must all pass. Production remains disabled and every execution permission is false.

This design extends the Sprint 6 issuer architecture, Sprint 7 generation strategy, and Sprint 8 generator-port documentation without changing them.
