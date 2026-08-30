# Domain, Data-Flow, and Application Audit

## Identity

Canonical identity contracts, authority policy, intake claims/conflicts/matches, dry-run planning, entropy/generator ports, issuance requests/authorizations, reservations/ledger/idempotency concepts, runtime host/governance, and the Migration 014 RPC are present under `fid/prospectIntake/*`, `fid/contracts/FootballEntityReferencePolicy.js`, and deployment SQL/reviews.

Fully implemented locally: validation contracts, authority decisions, deterministic non-effecting plans, issuer/runtime compositions with fake providers, and source-controlled record reference rules. Declaration/design only: several generator/entropy adapter designs. Live-dependent: authoritative collision/reservation/issuance/persistence and deployed RPC proof.

Stable application IDs exist in `footballIntelligence/registry/prospectIds.js`, but values such as `2026-arch-manning` are compatibility identifiers, not newly issued canonical FID IDs. Current 2027 work may retain them only as governed legacy/external candidate references. A separate canonical ID is required before promotion, but not before research, evidence, candidate, or provisional eligibility work. Peter Woods already has `prospect:peter-woods` in `fid/records/footballEntity/peter-woods/revision-0001.js`; duplication is prohibited. Alias handling and duplicate concerns are modeled; transfers belong in relationships/timeline and must not change person identity. Predecessor/successor behavior exists through intake lifecycle and persistence revision references.

Safe interim strategy: build non-canonical candidate and research IDs under existing caller-owned contract rules, preserve the legacy `2026-*` IDs as aliases/candidate refs, resolve/reuse any existing canonical entity, and stop before canonical issuance or promotion.

## Prospect Intake and FIIS

Authoritative candidate type: `fid/prospectIntake/ProspectIntakeCandidateContract.js` (`ProspectIntakeCandidate`); `ProspectIntakeArchitectureSpecification.js` governs its boundary. FIIS request/validation/authorization contracts live in `fid/intake/core/*`. Watchlist and identity intake records are upstream representations, not competing candidate contracts.

| Stage | Input → output | State/blocker and persistence |
| --- | --- | --- |
| Potential prospect | watchlist/source lead → watchlist record | Non-canonical; source gaps allowed; repository-only |
| Intake candidate | reviewed lead/evidence refs → `ProspectIntakeCandidate` | Validation errors, duplicate/identity, eligibility and evidence blockers; repository-only |
| Validation | FIIS Intake Request → Validation Result | Structural/reference/claim status; implemented contracts, no shared orchestrator |
| Evidence review | Research source/observations/artifact → review decision/link | Conflict, authority, applicability, provenance; repository-only workflows exist |
| Eligibility/declaration | evidence + cycle → policy result/Profile states | `UNKNOWN`, `PENDING`, `DISPUTED`, `EXPECTED`, `RETURNING`, etc. are valid; no persistence required |
| Promotion decision | validated candidate + authority → Promotion Decision/plan | Claim- and target-specific blockers; deterministic dry run exists |
| FID record | approved identities/refs → FootballEntity + Person + Player + Prospect Profile + relationships | Canonical IDs required; source-controlled construction can be reviewed, live write deferred |
| Application availability | FID record → future resolver projection | Missing today; requires explicit resolver integration |

FIIS can represent new prospects, transfers, uncertain eligibility, conflicting sources, unresolved declaration, objective-only data, and modeled data with incomplete provenance. It must block or limit promotion where identity, evidence, or provenance is insufficient. It is not yet a reusable end-to-end runtime: transformation/routing orchestration, identity service integration, durable coordination, and post-write verification remain incomplete.

## Research Repository

The repository models Research Source, Research Session, Recorded Observation, Analytical Observation, Evidence Artifact, source intake, evidence capture/review/linkage, migrations, persistence ports, in-memory diagnostics, and a Supabase adapter. Governed shapes include URLs/references, source type/category, captured timestamps, authority/reliability declarations, observation origin, conflicts, limitations, provenance, verification, and review.

It is ready for repository-first 2027 evidence. Supabase tables are declared by `supabase/migrations/20260714_create_research_repository_tables.sql`; deployment is unproved. Retained packages `rsp-0001`–`rsp-0003` cover Peter Woods production statistics, Clemson biography, and official 2026 selection; no equivalent governed coverage exists for the other cohort names. Objective recorded observations and analytical/modeled observations are separated. Legacy prospect arrays have no governed evidence/provenance beyond sparse metadata. External source acquisition belongs in Sprint 2A.2 and was not performed here.

## Authoritative prospect model

The authoritative representational prospect model is `fid/contracts/ProspectProfileContract.js`, version `PROSPECT-PROFILE-CONTRACT-1.0.0`, schema `PROSPECT-PROFILE-SCHEMA-1.0.0`. It is not a single flat scouting row: identity and bio continuity belong to FootballEntity, PersonProfile, and PlayerProfile; school/transfer context belongs to relationships; measurements, production, athletic testing, scouting, traits, and modeled outputs are referenced domain records.

The Prospect Profile owns cycle, eligibility, declaration, entry pathway, event/timeline history, broad evidence/reference arrays, verification/confidence, provenance, lifecycle/status, versioning, notes, and extensions. It deliberately avoids embedding unsupported evaluations as facts.

Competing representations are compatibility or transitional:

- `src/data/draft/prospects.js`: 10 legacy 2026 simulator rows, six positions, score/tier/projection fields; active application source, sparse provenance.
- `src/data/draft/prospects/prospectRegistry.js`: normalized simulator compatibility view; synthetic defaults and `legacy_normalized` status.
- `src/data/footballIntelligence/registry/prospects.js`: 10-record identity/rank alias registry, all labeled draftClass 2026.
- `src/data/footballIntelligence/database/players/*` and domain profile maps: engine/development records, not FID canonical profiles.
- `fid/population/fixtures/firstProspectCohortFixtures.js`: four-person 2027-target validation fixture, not promoted/canonical data.

## Current cohorts and declaration truth

The active simulator cohort is 10 records: Arch Manning, Caleb Downs, Peter Woods, Francis Mauigoa, LaNorris Sellers, Kadyn Proctor, T.J. Parker, Rueben Bain Jr., Jeremiyah Love, and Caleb Lomu. Both registries label the cohort 2026. The four-person Population/identity dry-run cohort targets Arch Manning, Francis Mauigoa, Peter Woods, and Caleb Downs for readiness testing while preserving a 2026-versus-2027 conflict. It creates zero canonical identifiers, reservations, issuances, promotions, or persistence writes.

Peter Woods has governed research and a canonical FootballEntity tied to a verified 2026 selection, so he must not be reclassified or duplicated. The other three have legacy application entries and fixture declarations only. None is a confirmed 2027 prospect in repository truth.

Eligibility authority is the Prospect Profile constants/contract plus `fid/population/eligibility/*`. Declaration states include `NOT_DECLARED`, `EXPECTED`, `DECLARED`, `WITHDRAWN`, `RETURNING`, `NOT_APPLICABLE`, and `UNKNOWN`; eligibility includes `ELIGIBLE`, `NOT_ELIGIBLE`, `PENDING`, `DISPUTED`, `NOT_APPLICABLE`, and `UNKNOWN`. Transfer and return-to-school uncertainty should be recorded through relationships/timeline plus these states. Projection is not confirmation.

## Programs and NFL teams

College programs presently appear mainly as display strings and school-logo keys (`src/data/schools/schoolLogos.js`) plus generic Organization/Team/Relationship contracts. No complete canonical college-program registry or resolver was found. Display-name joins would be unsafe for transfer/history; initial cohort work may use unresolved program references but canonical promotion needs program identity resolution.

NFL team data is fragmented. `footballIntelligence/nfl/teams/nflTeamRecords.js` has one production-shaped record (ARI); `components/draftV3/WarRoom/WarRoomData.js` contains a 32-team UI profile map with needs/schemes; legacy team identity/context files primarily cover Baltimore; the simulator draft order uses abbreviations. Canonical FID Team/FootballEntity contracts exist, and Kansas City has a source-controlled entity record. Abbreviation is the practical compatibility key, not proof of canonical identity. Team philosophy is representational UI data, not a governed engine.

## Intelligence engines

| Domain | Current implementation and readiness |
| --- | --- |
| Traits / Football IQ | Profile maps, defaults, engines, and diagnostics; mostly declared/manual legacy inputs; incomplete provenance |
| Production | Canonical input/evidence and modeled-output declaration exist alongside legacy profiles/engine; objective/model distinction exists; coverage sparse |
| Athletic Testing | Canonical evidence and modeled-output declaration plus compatibility profiles; no broad verified cohort |
| Scouting | Trait/scouting profiles and components; analyst declarations, not objective facts |
| Scheme Fit / Team Context | Engines/defaults and sparse team contexts; team coverage is not governed/complete |
| Draft / Positional / Board intelligence | `DraftDecisionEngine`, `DraftBoardEngine`, Player Evaluation position models; application-shaped, limited calibration and position coverage |
| Trade intelligence | Trade calculations/UI exist in Draft pages; not a unified FID intelligence contract |
| Confidence / Executive Summary / Explainability | Confidence/evidence transition and recommendation/explanation outputs exist in pieces; end-to-end evidence preservation is incomplete |

No calculation should be inferred beyond these implementations. Legacy grades and tiers are declared modeled output, not canonically derived truth.

## Resolver and simulator trace

Representative trace: `src/data/draft/prospects.js` → `prospectRegistry.js` → `useDraftEngine.js:getAllProspects` → `resolveProspect.js` → `buildProspectIntelligence` and `buildTeamDraftBoard` → `DraftBoard/ProspectTable`, `ProspectIntelligenceCenter`, CPU choice → `completeDraftPick` → in-memory `draftHistory` → `DraftTracker`.

Transformations normalize flat fields into `bio`, `rankings`, `evaluation`, metadata, and compatibility aliases, then flatten display fields again. FID evidence refs, verification, eligibility/declaration, lifecycle, profile versions, and provenance are absent or discarded. CPU ranks via board engine with rank fallback. Draft V3 has ten hard-coded picks and one user team; draft state is React memory. No saved-draft/result persistence or immutable snapshot contract was found in this path.

The Big Board equivalent and Prospect Intelligence Center consume the draft compatibility resolver. War Room uses its separate UI team map. The minimum later integration is an FID-to-application projection/resolver that preserves canonical/profile/version refs and uncertainty, followed by draft-class filtering and engine inputs; legacy fields should remain adapter output only.
