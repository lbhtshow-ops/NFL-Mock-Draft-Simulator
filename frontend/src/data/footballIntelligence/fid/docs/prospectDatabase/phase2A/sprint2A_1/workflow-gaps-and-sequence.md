# Canonical Workflow, Gap Register, and Sprint Sequence

## One-prospect workflow

| Step | Owner; input → output | Validation/blocker; execution boundary |
| --- | --- | --- |
| 1. Source discovery | Research; source lead → candidate | Manual/network in separately authorized Sprint 2A.2 |
| 2. Research Source | Research Repository contract → source record/package | Authority, URL/ref, access, captured-at; repository-only |
| 3. Evidence extraction | recorded vs analytical observation → Evidence Artifact | Provenance/applicability/conflicts; manual-assisted |
| 4. Intake candidate | Prospect Intake; reviewed evidence → `ProspectIntakeCandidate` | Contract diagnostic; no persistence |
| 5. Identity resolution | Identity owner; claims/aliases/existing refs → Identity Intake/decision | Duplicate, existing entity, conflict; canonical issuance deferred |
| 6. Eligibility | Population policy; cycle facts → sufficiency result | Unknown/pending allowed; promotion blocker if insufficient |
| 7. Program resolution | FID relationship owner; program claims → endpoint/ref plan | Transfer/history and canonical program blocker |
| 8. Objective entry | Domain owners; observations → production/measurement/testing inputs | Never infer; evidence required |
| 9. Scouting declarations | Analyst; analytical observations → scouting/trait declarations | Separate from objective facts |
| 10. Modeled outputs | Engine owner; versioned inputs → declared output | Model/version/confidence/limitations; may be absent |
| 11. Review | Reviewer; records/evidence → review decisions | Conflicts and authority assessed |
| 12. Blocker assessment | Intake/FIIS; all results → blocker refs | Unresolved identity/eligibility/evidence stops promotion |
| 13. Promotion decision | Authorized governor → Promotion Decision/plan | No authorization is created by this audit |
| 14. FID record construction | FID owner → linked Entity/Person/Player/Prospect/relationships | Repository review possible; canonical IDs required for promotion |
| 15. Resolver verification | Application integration → versioned app projection | Future Sprint 2A.4; missing today |
| 16. Application availability | App owner → class-filtered board/pool | No DB required for fixture integration |
| 17. Draft Room fixture | Product/app owner → controlled session fixture | Preserve uncertainty/confidence/evidence refs |
| 18. Draft Results fixture | Results owner → immutable snapshot fixture | Contract required before implementation |

Revision of an existing prospect follows the same evidence/review path, resolves the existing canonical identity, creates an explicit successor revision with predecessor/version references, and never overwrites history. Peter Woods is the concrete test of this rule.

## Gap register

| Classification | Artifact / impact | Scope and sprint |
| --- | --- | --- |
| `MISSING_RESEARCH`, `MISSING_EVIDENCE` | 2027 cohort beyond Peter Woods packages | Blocks factual cohort completion; Research in 2A.2; not Draft Room/Results fixture design |
| `PAUSED_LIVE_PERSISTENCE_DEPENDENCY`, `MISSING_DATABASE_STATE` | Migration 014, ACL/owner state, REF live proof | Blocks canonical issuance/live writes only; Persistence owner after product sprints; not first repository cohort |
| `MISSING_RESOLVER`, `MISSING_APPLICATION_INTEGRATION` | No FID → draft projection/class filter | Blocks real cohort in simulator/Big Board; Application integration in 2A.4; not population itself |
| `DUPLICATE_AUTHORITY` | Legacy draft array, FI registry, FID profile/records | Requires explicit adapter authority; Architecture/App owners in 2A.4; does not block repository intake |
| `GOVERNANCE_DECISION_REQUIRED` | Canonical college-program identity/resolution | Blocks fully canonical program links; FID governance in 2A.3; provisional state allows first cohort |
| `MISSING_IMPLEMENTATION` | Shared FIIS orchestration and durable verification | Blocks automated end-to-end promotion; FIIS owner when a concrete cohort proves need; manual governed repository flow can proceed |
| `MISSING_DIAGNOSTIC` | Cross-layer cohort completeness and resolver preservation | Blocks high-confidence integration sign-off; Diagnostics owner in 2A.3/2A.4 |
| `LEGACY_COMPATIBILITY_DEBT` | Defaults/grades/tiers and name/rank fallbacks | Risks conflating modeled output and identity; App/Intelligence owners in 2A.4; not initial intake blocker |
| `MISSING_DATA` | Full NFL team/program context | Limits fit/CPU breadth; Team intelligence in 2A.5; fixtures support design |
| `MISSING_IMPLEMENTATION` | Immutable Draft Results snapshot/result contract | Blocks reliable historical reopening and Results implementation; Results owner in 2A.7; not design fixture |
| `NOT_CURRENTLY_BLOCKING` | Team Philosophy Profile/Engine | Future architecture initiative; not required for first cohort |

First-cohort blockers: missing selected-source evidence, unresolved duplicate/canonical identity at promotion, and cohort-specific review decisions. Repository intake itself is not blocked by live persistence. Draft Room design has no hard data blocker because fixtures suffice; production integration needs resolver and team snapshots. Draft Results design can proceed, but implementation/reopening is blocked by the snapshot/result authority decision.

## Duplicate/legacy consolidation list

- Keep `ProspectProfileContract` authoritative; treat draft rows and both registries as adapters/legacy views.
- Keep `ProspectIntakeCandidateContract` authoritative; watchlist, identity intake, FIIS requests, and Population workflow are distinct lifecycle records.
- Keep Research Repository evidence/provenance contracts authoritative; do not reproduce them in simulator metadata.
- Select a canonical Team/college Program reference path before replacing abbreviation/display-name joins.
- Make one future FID application resolver own projection and missing-data behavior; retire no files in this sprint.
- Select an existing persistence/revision mechanism as the base for Draft Results snapshots before creating a new result model.

## Recommended sequence

1. **Sprint 2A.2 — Cohort selection and governed source/evidence acquisition.** Select the 16 categories, create reviewed Research Source Packages/evidence, and preserve eligibility uncertainty. No promotion or DB work.
2. **Sprint 2A.3 — Repository intake, identity review, and governed linked records.** Construct candidates, resolve duplicates/programs, run eligibility and promotion dry runs, and create only separately authorized source-controlled records. Add cross-layer diagnostics.
3. **Sprint 2A.4 — FID application resolver and 2027 class projection.** Establish the sole adapter into Big Board/simulator and verify identity, evidence, uncertainty, versions, and missing-data behavior survive.
4. **Sprint 2A.5 — Expand position/program/team-context coverage.** Increase evidence breadth only after the first resolver-backed cohort works.
5. **Sprint 2A.6 — Draft Room data contract and fixture integration.** Bind real resolver projections and versioned team context to the existing V3 workspace.
6. **Sprint 2A.7 — Draft Results snapshot/analysis contract and fixtures.** Define immutability, versions, trades, explanations, and reopening before page implementation.
7. **Separately authorized persistence resumption.** Resume Sprint 17C/REF and Migration 014 only under new authorization when repository product paths require live durability.

The next sprint is 2A.2, not infrastructure expansion and not REF continuation.
