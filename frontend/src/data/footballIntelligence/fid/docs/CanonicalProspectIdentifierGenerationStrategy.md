# Canonical Prospect Identifier Generation Strategy

Version 1.0.0 is SPECIFIED_NOT_IMPLEMENTED and owned by the FID Prospect Identity strategy owner. It specifies how a future generation port may produce candidates; it contains no generator, entropy, normalization, registry, candidate validator, or candidate value.

The selected model is a governed namespace plus an opaque, non-semantic stable token, with UI slugs and persistence IDs separate. Semantic identifiers were rejected because names and football facts change and collide. Deterministic hashes were rejected because evidence correction, reconciliation, privacy, and merge behavior would alter or correlate identity. Registry sequences were rejected as the default because they centralize allocation, expose order, and restrict offline/distributed work. Secure opaque generation best matches the existing hybrid convention.

Person, Player, and Prospect receive independently generated opaque tokens. Player requires a governed Person reference; Prospect requires governed Person and Player references. All survive transfers, position, school, season, eligibility, declaration, and draft-cycle changes. Prospect Profile identifiers may be cycle/revision scoped, but profile-record creation remains separately owned. Canonical-record chains and persistence identifiers stay outside the Prospect Identity issuer.

Allowed future inputs are layer, namespace, strategy version, authorization and command references, idempotency, environment, an approved entropy-provider reference, and governed upstream references. Names, aliases, birth dates, schools, teams, positions, draft cycles, rankings, scouting data, UI slugs, simulator IDs, operational IDs as tokens, persistence IDs, and arbitrary serialization are prohibited.

No semantic normalization is needed. UI normalization and unversioned normalization are prohibited. Future entropy must be cryptographically secure; timestamp-only values, process-local counters, and insecure pseudo-random sources are prohibited. No concrete library is selected.

Opaque candidates are not reproducible. Idempotent replay returns the authoritative prior result under the original strategy metadata. Collision regeneration may be bounded only by future policy under the same authorization, namespace, and idempotency scope. The attempt maximum remains policy-controlled and unresolved; unbounded retry and automatic fallback are prohibited.

Strategy version is issuance metadata, not identifier content. Existing identifiers remain valid. Replay uses the original version. Successor strategies require approved binding and never rewrite old identities. Deprecation and migration preserve identifiers and audit relationships without destructive replacement.

Future selection uses layer, strategy ID/version, convention, authorization scope, environment, and lifecycle—not name, school, draft cycle, UI route, simulator state, input order, or caller preference. The next boundary is a dormant Canonical Prospect Identifier Generator Port Foundation. Every runtime and execution capability remains false.
