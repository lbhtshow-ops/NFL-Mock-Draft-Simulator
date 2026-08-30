# Canonical Prospect Identifier Entropy Provider Contract

Sprint 10 defines the immutable capability and policy boundary through which a future non-production generator adapter may request cryptographically secure opaque entropy. It does not implement, register, bind, or invoke a provider and contains no entropy material.

`CANONICAL_PROSPECT_IDENTIFIER_ENTROPY_PROVIDER_PORT` version `1.0.0` is owned by `FID_PROSPECT_IDENTITY_ENTROPY_PROVIDER_OWNER`, separate from adapter, port, issuer, strategy, collision, reservation, ledger, persistence, and simulator ownership. Its only future responsibility is accepting an identity-blind entropy request and returning an entropy result or failure. Encoding, candidate assembly, validation, retries, replay, collision handling, reservation, issuance, records, and persistence remain external.

Requests bind operation, invocation, adapter, provider, environment, entropy classification, output-size policy, attempt, cancellation state, security policy, and audit references. Names, aliases, biographical or football facts, namespaces, candidate content, entropy, seeds, bytes, clocks, callbacks, clients, and implementations are rejected.

Sprint 10 result declarations always keep entropy, encoded material, and candidate fields null. A successful runtime result cannot be constructed. Results claim neither uniqueness, issuance, nor persistence. Failures classify retry and review properties but never trigger retries or expose raw provider errors.

The canonical provider descriptor remains `DECLARED_NOT_IMPLEMENTED`, unregistered, unbound, unavailable, and unapproved for production. Its registration declaration is inactive and is not a registry. Health support is declared but cannot claim runtime availability.

The security policy requires a cryptographically secure, platform- or operating-system-backed, non-predictable, nonsemantic source independent of prospect data, clocks, and process-local sequences. It must operate in an approved environment and report failure. `Math.random`, timestamp-only sources, counters, predictable sequences, prospect-derived values, deterministic runtime fallback, entropy reuse, and raw entropy logging are prohibited. No package or API is selected.

`CRYPTOGRAPHICALLY_SECURE_OPAQUE_ENTROPY` is required for first generation. A future deterministic provider is permitted only as an isolated test-harness declaration; it cannot be registered for development or production, silently substituted, or appear in canonical result fixtures.

Output size remains `OUTPUT_SIZE_REVIEW_REQUIRED`. Standard and high-scale categories were assessed against four identity layers, multi-sport growth, namespace partitioning, birthday collision risk, bounded retries, storage, URLs, encoding expansion, and parity. The repository supplies neither an authoritative scale model nor security threshold, so no byte count is invented. Entropy byte length, encoded component length, and complete namespaced candidate length remain distinct. Retries are recovery, not primary collision safety.

Hexadecimal, Base32, and unpadded Base64URL were assessed. Existing hexadecimal use is diagnostic hashing, persistence Base64 is unrelated serialization, and there is no canonical identifier encoding policy. Encoding therefore remains `ENCODING_REVIEW_REQUIRED`; no family, padding, alphabet, case rule, encoder, or example is selected.

Each adapter attempt maps to at most one entropy request. The issuer owns retries and idempotent replay. Matching replay prevents adapter and provider invocation. Provider switching is never silent. Cancellation is declarative; no runtime signal exists, and post-result handling belongs to adapter/issuer recovery.

Audit and logging may retain request reference, provider identity/version, policy references, classification, and outcome category. Entropy, full requests, candidates, dependency objects, and personal facts are prohibited.

Future implementation review must compare browser and Node platform-backed secure-source options without approving either prematurely. Test-provider architecture uses no test entropy values or expected identifiers. Activation requires output-size, encoding, security, privacy, source-API, health, conformance, and inactive-registration review.

All execution permissions remain false. This contract extends Sprint 7 strategy, Sprint 8 generator-port, and Sprint 9 adapter-design documentation without modifying them.
