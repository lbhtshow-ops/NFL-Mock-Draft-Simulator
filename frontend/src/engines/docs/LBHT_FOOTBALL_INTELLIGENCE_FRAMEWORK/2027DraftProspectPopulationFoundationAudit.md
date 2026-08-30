# 2027 Draft Prospect Population Foundation Audit

| Attribute | Value |
| --- | --- |
| Operation | Governed 2027 Draft Prospect Population Foundation and Repository Readiness Audit |
| Audit date | 2026-07-19 |
| Scope | Repository audit and implementation planning only |
| Repository basis | Current working tree, including pre-existing uncommitted files |
| Final status | `NOT_READY_BLOCKERS_IDENTIFIED` |

## 1. Executive decision

The repository is **not ready for a governed 2027 prospect write or promotion**. It does contain enough contract infrastructure for a controlled identity-oriented fixture/dry-run design, and it contains a pre-existing declarative four-prospect Population fixture. That fixture is not a governed cohort: it deliberately references legacy `2026-*` application identities, reports missing eligibility and declaration evidence, creates no canonical record, and performs no persistence or promotion.

The blocking reason is not a lack of schemas. It is unresolved authority and identity at the seams:

1. The worktree contains extensive pre-existing, uncommitted prospect/FIIS/Population/research/persistence work, so ownership and approval state cannot be inferred from source presence.
2. All four targets have a recorded `2026` legacy-identity versus target `2027` cycle conflict.
3. No approved ID issuer/resolver is implemented for new Person, Player, Prospect, profile, relationship, or persistence identifiers; contracts accept caller-supplied non-empty strings and the FIIS architecture explicitly forbids inventing them.
4. A standalone Source Registry is specified as required but is not implemented.
5. FIIS implements request, validation-result, and authorization-result contracts plus prospect-specific planning artifacts, but no reusable orchestration, transformation/routing, shared execution, persistence coordination, verification, or final Intake Result runtime.
6. Supabase artifacts and a dormant adapter/runtime composition exist, but repository evidence says execution is unapproved, deployment is not started or remotely verified, runtime capabilities are not enabled, and connection checks and remote execution are prohibited.
7. Peter Woods already has a source-controlled canonical `FootballEntity` record and governed research packages concerning 2026 facts. That makes a prospective 2027 identity operation a conflict-resolution/reuse decision, not a new-record assumption.

The correct next sprint is **Canonical Prospect Identity Dry-Run Planner**. It must resolve ownership and ID issuance rules and consume approved references without creating any canonical or durable records.

## 2. Repository status

### State before audit

`git status --short --branch`, using a command-scoped safe-directory override, reported branch `main` tracking `origin/fid-persistence-v1.0.1`. The worktree was already materially dirty. Prospect-related tracked modifications included simulator prospect data and registry/resolution, domain profiles and engines, FID constants, Prospect Intake architecture and diagnostics, and Player Evaluation components. Pre-existing untracked work included:

- FIIS Intake Request, Validation Result, and Authorization Result contracts and diagnostics;
- Population workflow, eligibility policy, cohort fixture, and diagnostics;
- canonical record ownership/reference policies and Peter Woods canonical records;
- Research Repository source packages and evidence workflows;
- Supabase durable adapter, runtime composition, deployment, SQL, review, correction, and runbook artifacts;
- Recognition, Production, and Athletic Phase 2 implementations and diagnostics.

This audit did not reset, clean, stash, rewrite, normalize, migrate, or execute any of those files. Because the dirty changes overlap the exact audit scope, their approval/ownership is an explicit stop condition. Findings describe the current working tree and must not be read as approval of those changes.

## 3. Files and systems inspected

The audit searched the repository for population, seed/import, fixtures, identity, duplicate, intake, promotion, research, evidence, persistence, Supabase, and all ten named prospects. Representative authoritative files inspected were:

- Research contracts and persistence: `src/data/researchRepository/contracts/*`, `constants/*`, `persistence/*`, diagnostics, and `supabase/migrations/20260714_create_research_repository_tables.sql`.
- Research workflows: `src/data/footballIntelligence/researchRepository/{sourceIntake,sourcePackages,evidenceCapture,evidenceReview,evidenceLinkage,migrations}/*` and retained `rsp-0001` through `rsp-0003`.
- FIIS: `src/engines/docs/LBHT_FOOTBALL_INTELLIGENCE_FRAMEWORK/FootballIntelligenceIntakeSystemArchitecture.md` and `src/data/footballIntelligence/fid/intake/core/*`.
- FID: entity, Person, Player, Prospect, Team, Organization, Relationship, intake, ownership, records, diagnostics, and public barrels under `src/data/footballIntelligence/fid/`.
- Population: `fid/population/*`, including the first-cohort fixture and eligibility policy.
- Promotion: `ProspectPromotionDecisionContract.js`, `ProspectPromotionWorkflowContract.js`, planner, execution contract, executor, constants, and diagnostics.
- Persistence: legacy/in-memory repository, durable port, envelope/schema/materialization specifications, Supabase adapter/client/runtime boundary, 13-file deployment package, security review, correction, and runbook.
- Development data and consumers: `src/data/draft/prospects*`, Football Intelligence registry/database/profiles, Operations Center components, draft engines, and Player Evaluation position/prospect models.
- Standardized domains: Recognition input/engine/legacy facade, canonical Production input/engine/modeled-output declaration, canonical Athletic input/evidence engine/modeled-output and compatibility policies, and diagnostics.

No web source was consulted.

## 4. Existing population architecture

Current state:

```text
Development fixtures / legacy 2026 IDs
        |                         (application-owned; not canonical FID)
        v
Current mock-draft and compatibility runtime

Research Repository contracts + retained packages
        |
        v
FIIS request / validation / authorization contracts
        |
        v
Prospect intake decision + deterministic dry-run planner
        |
        +--> constrained in-memory executor only
        |
        v
FID canonical contracts + source-controlled record boundary
        |
        v
Persistence specifications + dormant Supabase composition
        |
        X  no approved remote execution/read-back

Canonical domain inputs (future) --> Recognition / Production / Athletic
Simulator integration             X  intentionally absent
```

The repository has no general seed script, CSV prospect loader, canonical batch importer, approved ID generator, fuzzy identity matcher, or live population CLI. NFLVerse sync scripts populate NFL datasets, not governed college-prospect FID records. The existing Population layer is a declarative validation foundation: it validates repository references and reports readiness, with explicit `persistencePerformed`, `promotionPerformed`, and `runtimeIntegrationPerformed` false.

## 5. Canonical identity map

| Object | Contract identifier | Format actually approved | Owner / supply rule | Finding |
| --- | --- | --- | --- | --- |
| Football Entity | `entityId` | Newly issued canonical refs use `<namespace>:<identity-segment>` with lowercase alphanumeric/hyphen segments; legacy unnamespaced non-empty IDs remain compatible | FootballEntity owns canonical identity; caller/approved issuer supplies it | Only object with an explicit canonical-format policy; no issuer/resolver runtime |
| Person | `profileId` plus `entityRef` | Non-empty strings; no prospect-specific deterministic format approved | Person Profile owns profile record; caller supplies references | Contract is representational, not an ID generator |
| Player | `profileId`, `entityRef`, `personProfileRef` | Non-empty strings where required; no deterministic format approved | Player Profile / caller | Must reference resolved Person; do not derive from name |
| Prospect / Prospect Profile | `profileId`, `entityRef`, `personProfileRef`, `playerProfileRef` | Non-empty strings; no deterministic format approved | Prospect Profile / caller | FID models Prospect as a profile specialization, not an independent approved ID service |
| Research Artifact | `evidenceId`; sessions/observations have their own IDs | Non-empty caller-supplied strings; retained packages use local conventions, not a universal generator | Research Repository record owner / caller | Package examples are not authority to invent cohort IDs |
| Evidence | `evidenceId` and reference arrays | Non-empty strings | Research Repository | Evidence retains source/session/observation lineage |
| Source | `sourceId` | Non-empty caller-supplied string | Research Repository for Research Source record; standalone Source Registry is the intended governed identity owner | Source Registry implementation is missing |
| Relationship | `relationshipId`, source/target refs | Non-empty strings | Football Relationship / caller | Endpoint refs require resolved identities or explicit labels; no generator |
| Persistence record | `persistenceId`, `recordId`, explicit `revision`, predecessor for append | Non-empty IDs; revision 1 for create, contiguous explicit revision for append | Persistence owns stored-version identity; canonical contract owns logical record ID | Deterministic/idempotent behavior is specified, but live issuance/read-back is unapproved |

No contract authorizes name-derived IDs. The FIIS architecture states caller-owned IDs remain caller-owned and FIIS must not generate them without an approved ID-owning service. Deterministic planning is required; deterministic **ID generation** is unresolved. This is a blocker.

## 6. Prospect lifecycle map

| Intended step | Current classification | Evidence / limitation |
| --- | --- | --- |
| Research candidate | Implemented as prospect watchlist/intake candidate contracts and fixtures | Candidate is explicitly non-canonical |
| FIIS Intake Request | Implemented contract; diagnostic-only usage | No request orchestrator or real intake execution |
| Validation | Validation Result contract implemented; prospect and Population validators exist | Structural/local validation, not truth resolution |
| Authorization | Authorization Result and Prospect Promotion Decision contracts implemented | Human/governed authority must be supplied; no automatic authorization |
| Transformation | Specified only | No reusable transformation service |
| Routing | Specified only | No reusable router/orchestrator |
| Canonical identity resolution | Missing/blocked | Coordination boundary specified; no issuer/resolver/fuzzy merge allowed |
| Football Entity | Contract and source-controlled ownership implemented | Peter Woods already has a canonical FootballEntity record; other cohort members do not |
| Person record | Contract implemented; fixture diagnostics | No cohort canonical record or approved IDs |
| Player record | Contract implemented; fixture diagnostics | Depends on Person and entity refs |
| Prospect Profile | Contract implemented; fixture diagnostics | Depends on Person and Player; eligibility/declaration facts unresolved |
| Evidence relationships | Contracts/workflows implemented | Peter Woods packages exist; source authority boundary and cohort coverage incomplete |
| Persistence materialization | Specified and adapter foundation implemented | Runtime dormant; deployment/read-back not verified |
| Promotion decision | Implemented contract | Authorization artifact only; no cohort approval |
| Promotion dry-run | Implemented deterministic planner | Does not read/write repositories or authorize execution |
| Promotion execution | In-memory constrained proof only | Production/durable execution is prohibited/not approved |
| Verification/read-back | Specified | No remotely verified runtime path |

Recommended governed flow:

```text
Externally verified source candidate
        v
Research Source + Session + observations + Evidence Artifact
        v
Authorized source/evidence review
        v
FIIS Intake Request
        v
Structural validation + duplicate/reference checks
        v
Human identity resolution / canonical-ID authorization
        v
Deterministic identity dry-run plan
        v
Person -> Player -> Prospect Profile -> Relationships envelopes
        v
Promotion Decision (claim- and target-specific)
        v
Promotion dry-run + atomicity/capability preflight
        v
[future separately approved] non-production atomic persistence
        v
Read-back, revision, receipt, and evidence verification
        v
[future] domain input projections; simulator remains isolated
```

## 7. Minimum viable prospect record

The smallest honest canonical foundation is a linked record set, not one flat prospect object:

1. A canonical FootballEntity with approved `entityId`, entity type/status, canonical name, explicit aliases/external IDs only when evidenced, verification, provenance, and lifecycle.
2. Person Profile with `profileId` and `entityRef`; name/identity facts, references, verification, provenance, lifecycle/status, and versioning. Unknown optional fields remain null/empty rather than inferred.
3. Player Profile with `profileId`, `entityRef`, `personProfileRef`, participation state, evidenced playing identity/position assignments, references, verification, provenance, lifecycle/status, and versioning.
4. Prospect Profile with `profileId`, `entityRef`, `personProfileRef`, `playerProfileRef`, prospect cycle, eligibility and declaration state/basis when supported, references, verification, provenance, lifecycle/status, and versioning.
5. Football Relationships for school/team membership and draft-cycle association only when endpoints and basis are governed.
6. Persistence envelopes only at the later authorized write stage, with logical record ID, persistence ID, revision, predecessor, payload, provenance, verification, audit, and lifecycle.

School, position, class/year, draft cycle, eligibility, declaration, transfer history, active state, completeness, and promotion state must not be collapsed into unverified labels. Contracts support explicit unknown/unverified states. Awards, statistics, measurements/testing, scouting, consensus, context, and injury information are enrichment evidence and are not prerequisites for identity-only representation unless a selected workflow explicitly makes them required.

## 8. Required evidence categories

| Category | Initial identity foundation | Later enrichment |
| --- | --- | --- |
| Identity/name and aliases | Required, verified | Corrections/revisions |
| Person-to-player continuity | Required | Career history |
| Primary position | Required for useful prospect foundation; verify | Secondary/position history |
| Team/school relationship | Recommended after identity; basis required | Transfer history |
| Draft cycle/classification | Required and currently conflicting | Cycle changes by revision |
| Eligibility/declaration | Required before promotion as a 2027 prospect; currently absent | Ongoing status evidence |
| Recognition/awards | Not required | Domain evidence |
| Production statistics | Not required | Domain evidence; objective rows preferred |
| Athletic measurements/testing | Not required | Separate measurement/testing evidence with source and verification |
| Scouting/traits/FIQ/scheme | Not required | Analytical observations/manual analyst input, never facts by default |
| Consensus projections | Not required | Projection-classified multi-source enrichment |
| Context/injury | Not required | Sensitive/conflict-aware evidence and review |

## 9. Source architecture

Research Repository implements Research Source, Research Session, Recorded Observation, Analytical Observation, and Evidence Artifact contracts; source intake review; evidence capture/review/linkage; package validation; persistence ports and a Supabase adapter; and retained source packages. It separates source-reported observations from analytical observations and preserves provenance, verification, review, conflicts, limitations, and references.

Approved vocabularies cover source type/category, access/availability, authority/reliability declarations, observation origins, evidence roles/directions/strength/applicability, and verification/review states. The repository can distinguish direct factual observation from analysis. Population adds evidence categories and statuses, but its current `sourceMetadata` declarations are references, not a substitute for governed Research Source records.

The standalone Source Registry required by FIIS is absent. Therefore, source IDs can be represented but their cross-system governed identity/authority cannot yet be resolved by the intended owner.

Do not add `DECLARED / OBSERVED / VERIFIED / CANONICAL / PROVISIONAL` as a new authority enum. Existing contracts already express declaration, observation origin, verification, lifecycle, and canonical ownership in separate dimensions. Collapsing them into one field would conflate evidence maturity with authority and canonical status. A future compatibility mapping may be documented only after Source Registry ownership is approved.

## 10. FIIS readiness

Actual state exceeds the previously known Sprint 4 boundary in architecture breadth, but not in reusable runtime execution:

- Implemented: Intake Request contract; Validation Result contract; Authorization Result contract; rich subrecords for targets, claims, identity, workflow, execution, conditions, restrictions, blockers, and reviews; prospect watchlist, identity intake, candidate, promotion decision, workflow, and execution contracts; diagnostics.
- Implemented as planning/diagnostic: Population validation and Prospect Promotion dry-run planning.
- Constrained proof: Prospect Promotion Executor against the approved in-memory repository only.
- Specified but missing: shared FIIS orchestrator/lifecycle state machine, transformation, routing, identity-resolution service integration, reusable controlled executor, durable persistence coordinator, post-write verifier/read-back orchestration, shared Intake Result/audit runtime.
- Prohibited/dormant: real prospect intake, remote repository invocation, automatic identity generation/merge, evaluation, application integration.

Minimum missing work before a real population request is an approved identity-resolution/issuance boundary and a deterministic dry-run orchestrator that composes Request -> Validation -> Authorization -> target/envelope plan while preserving all references and producing no effects. Live persistence is a later sprint.

## 11. FID readiness

FID can represent FootballEntity, Person Profile, Player Profile, Prospect Profile, Team, Organization, and Football Relationship records with validation, verification, provenance, lifecycle, and versioning. It also has immutable source-controlled record ownership rules and persistence envelope/port specifications.

FID is representationally ready for a minimum prospect record, but operationally blocked: IDs and identity reuse are unresolved; no cohort Person/Player/Prospect Profile canonical records are approved; source authority is incomplete; and current uncommitted work cannot be assumed accepted. Peter Woods' existing canonical entity must be reused, superseded, or rejected through explicit identity review—never duplicated.

## 12. Persistence readiness

Repository constants verify the known package remains `FID-SUPABASE-TEST-DEPLOYMENT-1.0.1`, schema `FID-SUPABASE-SCHEMA-V1`, target `DEDICATED_NON_PRODUCTION_TEST`. The package declares 13 ordered SQL migrations, schema metadata, canonical/auxiliary tables, RLS, privileges, an atomic persistence function, verification, traceability, and rollback/runbook artifacts.

However, the manifest explicitly states `executionApproved: false`, `deploymentStarted: false`, `remoteVerificationPerformed: false`, `runtimeActivationApproved: false`, production prohibited, and manual review required. Runtime policy is `DORMANT_RUNTIME_ONLY` / `STRUCTURAL_ONLY`; enabled and remotely verified capabilities are empty; connection checks, repository calls, RPCs, migrations, and promotion execution are disabled. An adapter and read operations exist structurally, but read-back is not remotely available or verified.

Required acceptance before a first write: resolve deployment ownership; independently confirm the 13 migrations in the dedicated test project; approve credentials/actor and write/read authorization; verify RLS/privileges; establish connection and health evidence; capability-negotiate atomic batch plus idempotency; run a separately authorized non-prospect acceptance payload; confirm read-back and immutable revision behavior; record deployment metadata and receipts. None was performed here.

Safe rollback is transactional rollback for a failed atomic batch. After a committed immutable canonical revision, destructive deletion is not the normal correction mechanism: append an authorized correcting/superseding revision and preserve audit history. The deployment package itself marks destructive rollback prohibited/forward-fix required for material objects.

## 13. Promotion readiness

Promotion means authorizing and planning candidate content into canonical FID target contracts; it is not moving a simulator row or declaring submitted content true. The Promotion Decision is the durable, target- and claim-specific authorization artifact. The Workflow Planner creates deterministic ordered operations and validates dependencies, payload declarations, authorization, and persistence preconditions without repository reads/writes.

The executor can stage and restore snapshots only in the in-memory FID repository and explicitly reports no production persistence. Durable/shared execution, current-decision revalidation, capability negotiation, remote atomic execution, receipts, and read-back verification are not wired as an approved runtime. Therefore promotion is executable only as a constrained diagnostic proof, not for this cohort.

## 14. Existing temporary prospect inventory

| Name | Repository occurrences and ownership | Classification / risk |
| --- | --- | --- |
| Arch Manning | `src/data/draft/prospects.js`; draft prospect registry/resolver; Football Intelligence registry (`2026-arch-manning`); database player module; Athletic, Production, Football IQ, Scheme Fit, Traits, Scouting profiles; diagnostics; first-cohort Population fixture | UI/mock-draft and development intelligence fixtures; not canonical FID |
| Caleb Downs | Same application/profile families; NFLVerse generated roster-source name collision; intake diagnostics; first-cohort fixture | Development fixture and generated external-dataset occurrence; not canonical FID |
| Peter Woods | Same legacy fixtures/profiles; legacy research metadata; Population fixture; three retained Research Source Packages; canonical `fid/records/footballEntity/peter-woods/revision-0001.js`; canonical 2026 DraftSelection-related records/diagnostics | **Mixed ownership**: legacy app fixture, governed research, and canonical FID identity exist; highest duplicate/conflict risk |
| Francis Mauigoa | Same application/profile families; NFLVerse generated roster-source occurrence; intake diagnostics; first-cohort fixture | Development fixture/data collision; not canonical FID |
| Jeremiyah Love | Draft/registry/database and Athletic, Production, Football IQ, Scheme, Traits, Scouting profiles; Production diagnostics; NFLVerse generated roster source | Development fixture/data collision; no canonical FID record found |
| Rueben Bain | Same development families under `Rueben Bain Jr.` plus generated NFLVerse `Rueben Bain` | Alias/name-suffix collision; no canonical FID record found |
| Kadyn Proctor | Draft/registry/database and intelligence profiles; generated roster source | Development fixture/data collision; no canonical FID record found |
| Caleb Lomu | Draft/registry/database and intelligence profiles; generated roster source | Development fixture/data collision; no canonical FID record found |
| Dante Moore | No occurrence found in searched source, scripts, or Supabase files | No repository record found |
| Drew Mestemaker | No occurrence found in searched source, scripts, or Supabase files | No repository record found |

The files above remain owned by their existing application, data, research, or FID domains. Similar names do not establish identity across them.

## 15. Duplicate-risk assessment

Risk is **critical for Peter Woods**, **high for the other three cohort members**, and **high for suffix/name collisions such as Rueben Bain**. Existing checks detect duplicate IDs and duplicate target declarations within contracts/plans and durable persistence specifies record/revision, persistence-ID, precondition, conflict, and idempotency checks. Those controls do not provide semantic identity matching.

Required prevention controls:

1. Exact lookup by approved external IDs and canonical entity reference before name comparison.
2. Explicit inventory of legacy simulator ID, candidate ID, canonical entity ID, profile IDs, and source subject refs.
3. Human resolution for name-only/suffix/school-cycle conflicts; fuzzy match may suggest but never merge.
4. One identity decision artifact per candidate, recording reuse/create/defer/reject and its authority.
5. Deterministic plan fingerprint and idempotency key; reject changed inputs under the same key.
6. Atomic dependency order and preconditions for Entity -> Person -> Player -> Prospect -> Relationships.
7. No automatic import or promotion from `src/data/draft`, development registries, generated NFLVerse data, or intelligence profiles.

## 16. First-cohort assessment

The pre-existing cohort diagnostic passes its 36 structural checks but reports four governance gaps for every member: legacy `2026` versus target `2027` conflict, missing governed eligibility evidence, missing declaration evidence, and missing cohort Research Repository records (the diagnostic predates/does not count retained packages as cohort records). Its duplicate-identity array is empty only within its normalized four-entry fixture; that is not repository-wide identity clearance.

- Arch Manning: structurally plannable; blocked on canonical identity, cycle, eligibility, declaration, and governed research.
- Caleb Downs: same, plus generated dataset name collision requiring disambiguation.
- Francis Mauigoa: same, plus generated dataset name collision requiring disambiguation.
- Peter Woods: existing canonical entity and governed 2026 selection evidence create a direct lifecycle/cycle conflict. New identity creation must stop; review existing canonical status first.

No school, position, class, eligibility, or 2027 status from legacy fixtures is approved by this audit.

## 17. Recommended population stages

1. **Baseline freeze:** identify which pre-existing uncommitted architecture is approved; record exact commit/revision basis.
2. **Identity conflict docket:** reference-only candidate declarations; search exact canonical/external IDs; resolve Peter Woods and legacy `2026` mappings. No new IDs.
3. **Source Registry decision:** approve an owner or an explicit interim adapter; do not duplicate Research Source ownership.
4. **Research package preparation:** after separately authorized external research, create Research Source/Session/observations/evidence and review them. One source artifact per package where practical.
5. **Identity dry-run:** deterministically propose reuse/create/defer targets and required IDs, with no canonical payload creation where issuance is unresolved.
6. **Foundation fixture validation:** only after identity approval, build contract fixtures for Entity/Person/Player/Prospect and validate references.
7. **Relationship fixtures:** add school/team/draft-cycle relationships only with canonical endpoints and evidence basis.
8. **Promotion authorization and dry-run:** target- and claim-specific decision, ordered operations, atomicity/idempotency preflight.
9. **Non-production persistence acceptance:** a separately approved operation after deployment/readiness evidence; repeated single-prospect atomic batches.
10. **Read-back verification:** validate IDs, revisions, predecessors, receipts, evidence refs, and zero unexpected records.
11. **Domain enrichment:** Recognition, Production, and Athletic evidence independently; no requirement that all domains run.
12. **Simulator mapping:** separate future adapter sprint after canonical acceptance; never replace fixtures implicitly.

## 18. Recommended batch strategy

Use a **four-candidate read-only batch planner for cross-candidate duplicate/conflict visibility**, followed—only in a later authorized operation—by **repeated single-prospect atomic batches**. Do not persist all four in one transaction and do not write directly from fixtures.

This combines cohort-wide duplicate detection with small rollback and failure scope. Each prospect plan must be deterministic and independently rerunnable. A failure blocks only that prospect; dependency failures block its downstream records; changed evidence or authorization creates a new plan/revision. Peter Woods should be planned first as an identity-reuse/conflict case, not written first.

## 19. Validation strategy

Gate progression on: contract/schema versions; exact-reference integrity; source/evidence existence and verification; identity decision; duplicate canonical and persistence IDs; target/claim authorization; lifecycle eligibility; revision/predecessor continuity; relationship endpoint existence; requested/supported atomicity; idempotency/preconditions; post-write receipt count; read-back equality; and explicit zero side-effect flags during dry-run.

Diagnostics are evidence of structural conformance only. They do not establish prospect truth, deployment, credentials, authorization, remote readiness, or production approval.

## 20. Rollback strategy

Before persistence, rollback is simply rejection of the immutable dry-run plan; no state changes. For a future test write, require `TRANSACTIONAL`/atomic batch support and verify a failed operation returns `NOT_COMMITTED`/`ROLLED_BACK` with no partial effects. An indeterminate result stops all retry until operator reconciliation and read-back. After commit, use append-only correction/supersession under the owning contract; never mutate or delete historical source-controlled or durable revisions. Preserve Research Repository history regardless of promotion outcome.

## 21. External research plan

| Information | Expected source | Storage / FIIS | Verification and timing |
| --- | --- | --- | --- |
| Stable identity facts | Official school/player biography and authoritative roster; stable provider IDs | Research Source + recorded observations + evidence; FIIS refs/classification supported | Verify; two sources recommended when identity ambiguity exists; initial |
| Current roster/team | Official team roster/transaction notice | Relationship basis and observations supported | Verify current date; preferably corroborate; initial relationship stage |
| Historical statistics | Official stats or authoritative structured statistics provider | Recorded observations/evidence; Production projection later | Verify scope/season; multiple sources for conflicts; enrichment |
| Athletic measurements | Official roster/combine/pro-day measurement publication | Evidence and Athletic input support | Verify units/date/context; multiple sources for conflicts; enrichment |
| Testing results | Official combine/pro-day/event result | Evidence and Athletic testing support | Strong verification required; initial population not required |
| Awards | Awarding organization/official release | Recognition evidence supported | Verify award, issuer, season; one primary source normally sufficient; enrichment |
| Eligibility/declaration | Governing rules plus official player/school/league declaration | Prospect eligibility/declaration and evidence supported | Required and preferably multi-source because it gates 2027 status; before promotion |
| Injuries | Official availability/reporting and reputable reporting subject to policy | Research evidence/context can hold references; sensitive handling not fully standardized | Multi-source/review; later enrichment |
| Scouting observations | Named analyst film review | Analytical Observation/manual attribution; not factual canonical identity | Reviewer and provenance required; later enrichment |
| Consensus projections | Multiple named public boards/projections | Projection-classified research artifacts; no canonical consensus engine | Multiple sources mandatory; later enrichment |
| Manual analyst input | Authorized internal analyst | Analytical Observation with reviewer/provenance | Explicit manual classification and review; later enrichment |

This is a future research specification only. No facts were researched or accepted here.

## 22. Intelligence-domain readiness

**Prospect population and Intelligence execution are separate operations.** A canonical identity foundation does not need to execute any engine.

| Domain | Acceptable real input now | Output behavior and limits |
| --- | --- | --- |
| Recognition | Player context plus evidence-state, recognition records (award/type/season), completeness, limitations, and optional source/evidence/verification/provenance metadata | Canonical Phase 2 reports factual records/count/seasons; score is `null`; confidence reflects evidence/completeness metadata, not prestige/count. Unknown evidence returns unavailable, null recognitions, confidence 0. Legacy compatibility scorer remains transitional and must not become canonical prospect population output. |
| Production | Player context plus objective statistics/evidence projected through canonical input | Canonical Phase 2 reports evidence and keeps score `null`; modeled outputs are explicitly non-canonical. Missing evidence is unavailable, not zero. Existing development profiles expose fixed compatibility scores to legacy consumers; population must not copy or legitimize them. |
| Athletic | Player context plus projection fields, measurements and testing with source/evidence/verification/completeness | Canonical Phase 2 evidence reporting is supported; analytical score remains unapproved/`null`, confidence describes evidence. Missing fields remain unknown/unavailable. Existing scores/fallbacks are compatibility-only and include critical Draft Board/Decision risks. |
| Football IQ | Development profile/engine only | Not standardized for governed prospect facts; do not populate or execute in foundation. |
| Scheme Fit | Development profile/engine only | Not standardized; analytical and context-dependent; later work only. |
| Traits | Development scouting/trait profiles and engines | Not standardized as governed population truth; manual/analytical evidence later. |
| Position models / Player Evaluation | Position contracts and evaluation diagnostics exist | Consumers of governed inputs in a later operation; must not gate identity population or run automatically. |

## 23. Simulator isolation plan

Keep `src/data/draft/**`, `src/data/footballIntelligence/registry/**`, database player modules, domain profile fixtures, Draft Board/Decision, and UI selectors as application/development-owned data. Canonical records live only under the approved FID record boundary or durable repository. Introduce no import from canonical records into simulator barrels during population. A future adapter must require explicit mapping records (`legacyProspectId` -> canonical refs), lifecycle eligibility, version pinning, and consumer acceptance; absence of a mapping retains existing simulator behavior.

Use existing states such as candidate/draft, unverified/pending review, active/superseded/archived, and explicit fixture/reference-only markers. Do not add a new lifecycle state merely to label legacy data. The existing Population fixture's `LEGACY_PROSPECT_REFERENCE_SET`, `REFERENCE_ONLY`, and `canonicalRecordCreated: false` are adequate planning labels, but are not canonical states.

## 24. Blockers

1. Approval/ownership of extensive pre-existing uncommitted prospect architecture is unknown.
2. Canonical ID issuance and deterministic ID policy are unresolved beyond FootballEntity format validation.
3. Peter Woods already has a canonical FID identity and governed 2026 selection evidence; 2027 treatment is unresolved.
4. All cohort legacy IDs/classes conflict with the target 2027 cycle.
5. Governed eligibility and declaration evidence is absent for all four in the cohort fixture.
6. Standalone Source Registry implementation is absent.
7. FIIS lacks reusable orchestration, identity resolution, durable controlled execution, verification, and final result runtime.
8. Supabase deployment/execution/read-back are unapproved and remotely unverified.
9. No approved semantic duplicate resolution exists.
10. Simulator/development fixtures and canonical truth lack an approved mapping boundary.

## 25. Unknowns

- Which uncommitted files are approved architecture versus work in progress.
- The approved issuer and namespace for Person, Player, Prospect Profile, Relationship, Research, and persistence IDs.
- Whether Peter Woods' canonical record represents the intended real-world lifecycle or a governed test record requiring a later correction.
- Current non-production database deployment state outside repository declarations.
- Authorized actors/reviewers, credential references, Source Registry owner, and acceptance operator.
- Whether a 2027 prospect may be represented with unknown declaration/eligibility or must remain only a candidate; current eligibility policy blocks promotion.
- Required retention/sensitivity policy for injury and manual scouting information.

## 26. Stop conditions

Stop population if any canonical ID is guessed; an identity is name-only; a candidate collides with an existing canonical/external ID; cycle, eligibility, declaration, or lifecycle conflicts remain; source/evidence references cannot be resolved; Source Registry authority is unavailable; authorization is missing/expired/superseded; requested atomicity/idempotency/read-back is unsupported; deployment metadata or permissions are unverified; an outcome is partial/indeterminate; or current uncommitted ownership remains ambiguous.

Those stop conditions are active now. This audit therefore assigns `NOT_READY_BLOCKERS_IDENTIFIED`.

## 27. Recommended first implementation sprint

### Canonical Prospect Identity Dry-Run Planner

Narrow scope:

- approve the working-tree baseline and identity authority;
- consume candidate, repository lookup results, existing canonical refs, legacy refs, and explicit authorization;
- produce `REUSE / PROPOSE_CREATE / DEFER / REJECT` identity decisions without generating IDs unless an approved issuer is supplied;
- detect exact ID, normalized-name, alias/suffix, external-ID, and cycle conflicts across the four candidates;
- explicitly force Peter Woods into canonical-reuse/conflict review;
- output deterministic, immutable, reference-only plans and validation reports;
- compose the existing FIIS request/validation/authorization contracts and feed the existing promotion planner only after identity authorization;
- assert zero research ingestion, canonical record creation, persistence, promotion execution, domain execution, simulator integration, network, and database effects.

Acceptance requires fixtures with synthetic subjects plus reference-only cohort inputs, deterministic rerun equality, cross-candidate duplicate checks, no auto-merge, no new public runtime registration, all existing diagnostics passing, and documented unresolved-ID behavior. Do not implement this sprint as part of this audit.

## 28. Exact files that should remain untouched

The next sprint must not modify or replace:

- `src/data/draft/prospects.js` and `src/data/draft/prospects/**`;
- `src/data/footballIntelligence/registry/**`;
- `src/data/footballIntelligence/database/players/**`;
- `src/data/footballIntelligence/{athletics,production,footballIQ,schemes,schemeFit,scouting,intelligence}/**`;
- retained Research Source Packages under `src/data/footballIntelligence/researchRepository/sourcePackages/retained/**`;
- canonical instances under `src/data/footballIntelligence/fid/records/**`;
- all Supabase SQL and migrations under `src/data/footballIntelligence/fid/persistence/deployment/sql/**` and `supabase/migrations/**`;
- `src/engines/playerEvaluation/**`, `src/engines/production/**`, `src/engines/athletics/**`;
- `src/engines/DraftBoardEngine.js`, `src/engines/DraftDecisionEngine.js`, `src/engines/PlayerEvaluationEngine.js`, `src/engines/FootballIQEngine.js`, `src/engines/SchemeFitEngine.js`, and `src/engines/PlayerTraitEngine.js`;
- all draft pages, hooks, and components under `src/pages/Draft*`, `src/hooks/draft/**`, and `src/components/draft/**`.

The dry-run sprint should add isolated identity-planning contracts/diagnostics only after baseline approval; it must not retrofit existing fixtures.

## Validation record

Permitted, non-mutating diagnostics completed before report creation:

| Diagnostic | Result |
| --- | --- |
| Research Repository foundation | 60/60 passed |
| First prospect cohort Population | 36/36 passed structurally; four governance-gap categories reported |
| Prospect Intake end-to-end validation | 18/18 passed; state `GOVERNED_VALIDATION_COMPLETE_PROMOTION_BLOCKED`; eligibility, declaration, and entry pathway unresolved; no persistence |
| Multi-prospect intake validation | 8/8 passed structurally |
| Promotion workflow/executor/runtime aggregate command | Timed out before these chained suites returned; no write path was invoked and no pass is claimed |

Structural passes do not override the blockers above. Final validation after document creation must include `git diff --check` and confirmation that the audit introduced only this Markdown file relative to the recorded pre-audit worktree.

## Completion assertions

- No prospect data was populated.
- No canonical prospect, Person, Player, Prospect Profile, Relationship, Source, Evidence, or persistence record was created by this audit.
- No database connection, SQL execution, migration, Supabase write, read-back, or deployment occurred.
- No FIIS intake or promotion was executed.
- No Recognition, Production, Athletic, Football IQ, Scheme Fit, Traits, position model, Player Evaluation, Draft Board, Draft Decision, or simulator behavior changed.
- Existing dirty-worktree files were preserved.
- The audit adds documentation only.
