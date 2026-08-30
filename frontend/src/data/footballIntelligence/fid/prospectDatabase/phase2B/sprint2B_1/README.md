# Sprint 2B.1 — application prospect resolver

This repository-first package introduces the application data boundary for prospects. `ApplicationResolverBoundary` returns only immutable `NormalizedProspectView` values wrapped in explicit resolution results. Applications do not receive preparation records, enrichments, canonical profiles, storage identities, source URLs, evidence references, or canonical identifiers.

The active fixture source joins the authoritative 2A.3B preparation record to its 2A.3C additive enrichment by preparation reference. A source-selection policy gives preparation records current priority and declares an inactive future canonical-profile source kind. Activating or adapting that source is intentionally outside this sprint; no canonical mapping, persistence, registry, simulator, or UI work is performed.

Unknown and blocked references are values rather than exceptions. The normalized application reference is the non-canonical intake candidate reference and must not be interpreted as a canonical identifier. Readiness fields report repository fixture/data readiness only and confer no registration, mapping, promotion, or persistence authority.

