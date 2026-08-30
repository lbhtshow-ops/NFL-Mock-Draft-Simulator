# Population Readiness and Application Requirements

## Population-readiness matrix

| Domain | Status | Basis |
| --- | --- | --- |
| Prospect identity | `READY_WITH_PROVISIONAL_OR_UNRESOLVED_STATE` | Candidate/dry-run contracts exist; canonical issuance/live ledger deferred |
| Bio | `READY_FOR_REPOSITORY_POPULATION` | FootballEntity/Person/Player contracts |
| Program | `READY_WITH_PROVISIONAL_OR_UNRESOLVED_STATE` | Relationship contracts exist; canonical college registry/resolver incomplete |
| Eligibility | `READY_WITH_PROVISIONAL_OR_UNRESOLVED_STATE` | Explicit unknown/pending/disputed policy |
| Position | `READY_FOR_REPOSITORY_POPULATION` | Player/domain inputs; evidence still required |
| Measurements | `READY_WITH_EXISTING_FIXTURE_BOUNDARY` | Canonical evidence shape exists; data missing |
| Production | `REQUIRES_RESEARCH_ACQUISITION` | Objective contract exists; cohort evidence sparse |
| Athletic testing | `READY_WITH_PROVISIONAL_OR_UNRESOLVED_STATE` | Missing tests may remain unavailable; modeled output separate |
| Traits / scouting / strengths-concerns | `REQUIRES_RESEARCH_ACQUISITION` | Contracts/profiles exist; governed observations needed |
| Scheme / role | `READY_WITH_PROVISIONAL_OR_UNRESOLVED_STATE` | Modeling exists; team/program context incomplete |
| Evidence / provenance / review / blockers | `READY_FOR_REPOSITORY_POPULATION` | Research and Intake workflows are implemented repository-side |
| Confidence | `READY_WITH_EXISTING_FIXTURE_BOUNDARY` | Output concepts exist; calibration/coverage incomplete |
| Modeled outputs | `READY_WITH_PROVISIONAL_OR_UNRESOLVED_STATE` | Must be declared/versioned and may be absent |
| Simulator availability | `REQUIRES_RESOLVER_INTEGRATION` | Simulator reads legacy 2026 array |
| Big Board availability | `REQUIRES_RESOLVER_INTEGRATION` | Board reads simulator projection |
| Draft Room availability | `READY_WITH_EXISTING_FIXTURE_BOUNDARY` | Existing V3 UI can use controlled fixtures |
| Draft Results snapshot support | `REQUIRES_CONTRACT_CORRECTION` | No durable immutable result/snapshot contract found |
| Live canonical issuance/persistence | `BLOCKED_BY_PAUSED_SPRINT_17C` | Migration 014/ACL/live proof deferred |

## Draft Room data requirements

| Element | Required data | Current source / status |
| --- | --- | --- |
| Current pick, clock, selection controls | session, order, owner, time, status | `useDraftEngine`, `useDraftSpeed`; in-memory fixture-ready |
| Available/positional/Big Board | canonical prospect/profile/version, class, position, ranks, availability | legacy registry; FID resolver missing |
| Prospect detail | bio, program, eligibility/declaration, objective data, modeled outputs | compatibility projection today; governed projection missing |
| Team context / needs / scheme | canonical team/version, roster/needs/scheme snapshot | 32-team `WarRoomData` representational map; fragmented authority |
| Recommendations / CPU | board score, fit, need, positional value, confidence, model versions | board/decision engines exist; calibration/evidence incomplete |
| Evidence / explainability | evidence refs, source/review status, limitations, reason components | FID/Research shapes exist; UI path discards them |
| Queue and “Your Draft Class” | prospect/version snapshot, selection owner/order | in-memory state supports UI fixture; no durable snapshot |
| Trade offers/intelligence | offer assets, values, acceptance/reason, event history | legacy Draft trade logic; V3 contract/integration incomplete |
| Mobile presentation | same data with compact projection | design-only; fixtures sufficient |

Draft Room visual design can proceed with fixtures now. Real 2027 data requires the resolver, but no database execution is required for initial UI/data-contract work.

## Draft Results data requirements

The immutable draft-time snapshot must contain: result/session ID and versions; settings/order; each selection’s overall/round/pick, team canonical ref and team-context version/snapshot, user/CPU actor, prospect canonical ref plus Prospect/Person/Player profile versions and display snapshot, board version/rank/value at selection, preserved intelligence outputs and model/calibration versions, confidence/limitations, explanation components, and referenced evidence/review IDs. Every trade event must retain sequence, participants, assets before/after, value model/version, decision, and affected order.

Board value, reach/steal distance, positional allocation, need fulfillment, and aggregate team summaries may be calculated after the draft only when their required immutable inputs and algorithm versions are stored. Pick identity/order, selection actor, prospect/team/version snapshots, trades, and the outputs actually shown or used to decide a pick must not be recomputed from mutable current data.

Current `draftHistory` stores pick coordinates, team abbreviation, an enriched prospect object, draft mode, selected scores/explanation, and timestamp in React memory. It lacks a result ID, schema/version, board snapshot/version, team-context snapshot, model versions, evidence refs, immutable trade events, persistence, reopening, and share/export. Historical reopening is therefore unreliable after transfers, rankings, needs, or models change.

Use scores, meters, confidence, rankings, value, and explanations; do not introduce letter grades or stars. Draft Results design can begin with immutable fixtures, but a canonical snapshot/result contract must be selected or corrected before implementation.

## First cohort recommendation

Use a 16-record test cohort selected in Sprint 2A.2 from repository evidence, not rankings:

| Category | Count | Purpose / completeness |
| --- | ---: | --- |
| Identity/evidence-complete baseline | 4 | Multiple positions/programs; verified identity, position, program, cycle evidence |
| Eligibility/declaration provisional | 4 | Exercise `UNKNOWN`, `PENDING`, `EXPECTED`, or return-to-school states; blockers mandatory |
| Transfer/program-history | 3 | Stable person identity plus evidenced relationship timeline |
| Objective-rich/model-sparse | 3 | Production/measurements present; modeled outputs explicitly absent |
| Conflict/limited-evidence | 2 | Conflicting sources or incomplete provenance; cannot promote without review |

All require source/session/evidence refs, capture timestamps, review state, provenance, diagnostics, and zero silent defaults. Provisional eligibility and missing modeled scores are permitted. Actual player names are not selected here. The existing four-person fixture is useful for regression tests but is not the cohort because all four carry a 2026/2027 conflict and Peter Woods is already a verified 2026 selection.
