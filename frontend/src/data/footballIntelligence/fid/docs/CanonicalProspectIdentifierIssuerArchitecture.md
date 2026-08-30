# Canonical Prospect Identifier Issuer Architecture

Version 1.0.0 is DESIGNED_NOT_IMPLEMENTED. The issuer domain will eventually consume an executable command and return a governed issuance result. It does not own authorization, entity-record creation, persistence, promotion, simulator registration, or UI slugs.

The command binds approved authorization, exact layers, convention and policy versions, caller operational IDs, idempotency, environment, and future strategy references. Preflight is deterministic and invokes no ports. Plans describe future steps with execution permission false.

Nine future ports are specified but unimplemented: generation, namespace registry, collision detection, reservation, authoritative issuance ledger, operational audit, transaction, recovery, and clock. Audit is not the authoritative ledger. The clock only supplies future reservation expiry and is never invoked here.

New stable identity uses ordered Person → Player → Prospect transactional planning; Prospect Profile identifier planning is separate, and profile-record creation belongs to the Profile domain. Partial stable-identity issuance is prohibited. Compensation releases reservations and recovers ledger state without deleting identity history. Reservation is mandatory before new issuance and unused for reuse.

Reuse validates the governed reference and namespace, then returns a reuse result. It never generates, reserves, or writes a new issuance entry. New issuance plans generation, validation, collision checking, reservation, and ledger steps only as dormant future work.

Idempotency binds a caller reference to authorization, scope, layers, convention, strategy, and environment. Names never establish replay. Deterministic collisions cannot silently mutate; opaque retry is bounded and policy-controlled, with no namespace, name, slug, or persistence-ID fallback.

The authoritative ledger, reservation reference, and idempotency reference govern recovery from lost responses, failed reservations, failed ledger writes, crashes, and revocation. No retries, recovery, reservation, ledger writes, generation, or persistence occur in this architecture sprint.

Activation requires separately implemented and reviewed ports, an approved generation strategy contract, runtime composition, transaction and recovery verification, security review, and production approval. Every current capability and execution permission remains false.
