# Canonical Prospect Identifier Entropy Provider Non-Production Design

Sprint 11 designs, without implementing, the future provider for `CANONICAL_PROSPECT_IDENTIFIER_ENTROPY_PROVIDER_PORT` version `1.0.0`. The provider owner remains `FID_PROSPECT_IDENTITY_ENTROPY_PROVIDER_OWNER`; its only future responsibility is one identity-blind entropy request for one adapter attempt, returning a governed result or failure.

The repository is a Vite browser application with Node maintenance scripts and an `/api` proxy to an external backend. It contains no governed serverless, API-route, or secure-source runtime for canonical identity issuance. Browser-side generation is rejected because it crosses the client trust boundary and complicates issuer-controlled replay and issuance. The selected architectural direction is a trusted server-side runtime boundary. The concrete host and platform API remain review-required because that backend is outside this workspace. No Node or browser crypto API is selected.

The design `CANONICAL_PROSPECT_IDENTIFIER_ENTROPY_PROVIDER_NON_PRODUCTION_DESIGN` version `1.0.0` preserves the Sprint 7–10 version bindings. Its future package is `prospectIntake/entropyProviders`, with a private platform-source boundary and composition owned by a future trusted-server issuer root. No implementation file or runtime stub exists.

The future interface is `provideSecureEntropy(validatedEntropyRequest, validatedDependencyBag)`. It uses an immutable validated dependency bag containing one core platform secure-source declaration plus audit-safe provider metadata. Hidden globals, fallback randomness, clocks, clients, databases, persistence, registries, services, callbacks, and implementations are prohibited.

The platform-source capability is conceptually `requestPlatformSecureBytes(governedByteLength)`. It must use an approved platform-backed cryptographic source, return the exact governed length or failure, reject partial output, hide source internals, and never encode, assemble candidates, retry, or persist. The provider validates declarations, requests the source once, verifies size, and constructs a result; all steps remain non-executable.

Health remains honestly separated: designed is not implemented, implemented is not healthy, healthy is not registered, and registered is not runtime-bound. No health check is executed. Cancellation is declarative before, during, and after the source boundary, with post-result recovery owned by the adapter and issuer. The issuer owns retries; the provider cannot increment attempts, change policy, or silently switch itself.

Output size remains `OUTPUT_SIZE_REVIEW_REQUIRED`. The review covers all four identity layers, Profile revisions, multi-sport platform growth, namespace partitioning, non-production/production parity, and birthday-bound collision analysis. No population authority or approved risk threshold exists in the repository, so entropy byte length and encoded length remain null. The required authorities are security architecture and platform-scale ownership.

Encoding remains `ENCODING_REVIEW_REQUIRED`. Hex, Base32, and unpadded Base64URL were reassessed, but persistence serialization and diagnostic hashes are not identifier policy. Encoding belongs to the generator adapter’s separately governed encoding capability, never the entropy provider. Cross-runtime identifier-encoding policy ownership must approve the family, alphabet, case, padding, and validation rules.

Future entropy is ephemeral runtime material. It cannot be persisted, logged, snapshotted, cached, retained in module state, or converted to text by the provider. References should be released promptly. The design makes no unsupported JavaScript zeroization guarantee.

Security prohibits hidden sources, `Math.random`, timestamps, counters, deterministic development fallback, raw entropy logging, caching, and production activation. Requests remain identity-blind and contain no record or persistence state. Logs contain audit-safe metadata only and exclude full requests, dependencies, raw errors, and stack traces.

A deterministic provider may exist only in an isolated test harness, classified non-secure, without scripted bytes in snapshots or canonical candidate fixtures. Contract tests cover validation, exact length or failure, normalization, metadata safety, and absence of effects. Negative tests cover insecure sources, runtime and policy mismatch, cancellation, partial output, and size mismatch. Integration ends before encoding, candidate assembly, collision, reservation, issuance, or persistence.

Implementation cannot begin until trusted runtime hosting, output size, encoding ownership, platform source, security, privacy, architecture, tests, conformance, and inactive registration gates are approved. Production and every execution permission remain false.
