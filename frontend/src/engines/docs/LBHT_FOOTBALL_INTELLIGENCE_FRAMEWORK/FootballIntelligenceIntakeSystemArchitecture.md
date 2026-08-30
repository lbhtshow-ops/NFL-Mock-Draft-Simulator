# Football Intelligence Intake System Architecture

| Attribute | Value |
| --- | --- |
| Document name | Football Intelligence Intake System Architecture |
| Acronym | FIIS |
| Version | 1.0 |
| Status | Architecture Specification |
| Platform | LBHT Sports Intelligence Platform |
| Domain | LBHT Football Intelligence Platform |
| Scope | Governed acquisition, authorization, preparation, persistence, and verification of football knowledge entering the Football Intelligence Database. |

## Dependencies and authority

FIIS depends on Football Knowledge Model v1.0, Football Intelligence Database v1.0, Research Repository architecture, Source Registry architecture, FID Persistence Architecture, the approved Prospect Intake governance contracts, and Football Intelligence Engine Architecture v1.0 for downstream separation. Where an implementation is not present in this repository—currently the standalone Source Registry—this specification defines an integration boundary, not substitute ownership.

This document is the governing FIIS architecture. Existing entity and persistence contracts remain authoritative for their own shapes, versions, validation rules, and capabilities. FIIS does not rename or silently reinterpret them.

## 1. Purpose

The Football Intelligence Intake System is the governed entry layer for proposed football knowledge. Its central question is:

> Should this proposed football knowledge enter the canonical platform, and if so, through what authorized and verifiable operation?

FIIS composes existing governance artifacts and the governed persistence boundary. It is not a football evaluation engine and submission is never equivalent to canonical truth.

## 2. Mission

FIIS provides governance, traceability, repeatability, authorization, canonical-identity safety, evidence linkage, source linkage, deterministic planning, controlled persistence, verification, auditability, replayability, extensibility, and strict separation from evaluation. Every accepted operation must be attributable to a current authorization and reproducible inputs; every rejected, deferred, blocked, failed, or partially verified outcome must remain structured and explainable.

## 3. Design philosophy and ownership

FIIS does not own external research, source identities, canonical football knowledge after persistence, evaluation logic, or application presentation. It owns the temporary process records needed to govern intake: intake-process state, requests, validation outcomes, authorization coordination, promotion-workflow coordination, execution declarations, persistence-operation coordination, verification outcomes, audit history, and intake results.

Temporary workflow ownership ends at the boundary of the referenced object. Retaining a research reference does not transfer ownership of the Research record. Retaining a source reference does not transfer source identity or governance. Preparing a canonical contract does not make it canonical. A committed FID record is owned by FID; FIIS retains only its trace and result references.

## 4. Architectural position

```text
External Sources
      ↓
Research Repository
      ↓
Source Registry
      ↓
Football Intelligence Intake System
      ↓
Football Intelligence Database
      ↓
Football Intelligence Engines
      ↓
Applications
```

- FIIS cannot bypass the Research Repository when research ownership is required.
- FIIS cannot bypass the Source Registry for governed source identity.
- FIIS cannot bypass canonical FID contracts or the governed persistence layer.
- FIIS cannot call applications to calculate intelligence.
- Intelligence Engines cannot use FIIS as a substitute for FID reads.
- Absence or unavailability of an upstream boundary is a blocker, never permission to assume its ownership.

## 5. FIIS subsystem hierarchy

| Layer | Responsibility | Prospect Intake V1 mapping |
| --- | --- | --- |
| 1 — Intake Request | Declare the proposed intake and references | Prospect Watchlist and Prospect Identity Intake candidate declarations |
| 2 — Intake Validation | Validate local shape, versions, references, and required steps | Contract validators across watchlist, identity intake, decision, workflow, and execution request |
| 3 — Intake Authorization | Record target- and claim-specific authority | Prospect Promotion Decision |
| 4 — Identity and Reference Resolution Coordination | Coordinate supplied/candidate/canonical references without owning identity truth | Prospect Identity Intake review and conflict declarations |
| 5 — Promotion Planning | Declare proposed targets, actions, and dependencies | Prospect Intake promotion plan plus workflow inputs |
| 6 — Promotion Decision Review | Preserve historical approval, exclusions, deferrals, dissent, and limitations | Prospect Promotion Decision |
| 7 — Dry-Run Workflow Planning | Produce deterministic, non-persisting ordered operations | Prospect Promotion Workflow and Planner |
| 8 — Controlled Execution | Revalidate and execute only approved plans | Existing prospect in-memory executor is a constrained adapter/proof boundary; reusable controlled execution remains future work |
| 9 — Persistence Coordination | Invoke only the governed FID repository/port | FID persistence envelope, repository contract, durable port, adapters |
| 10 — Persistence Verification | Validate receipts and retrieve expected revisions | Durable results, effect receipts, repository reads, verification evidence |
| 11 — Intake Result and Audit | Return a complete structured outcome and history | Existing workflow/execution results and audit records; shared FIIS result contract is future work |

These are reusable FIIS layers, not required replacement names for existing modules.

## 6. Intake lifecycle

The FIIS 1.0 architectural vocabulary is:

```text
REQUESTED
  → VALIDATING
  → VALIDATED | INVALID
  → AWAITING_AUTHORIZATION
  → AUTHORIZED | PARTIALLY_AUTHORIZED | DEFERRED | BLOCKED | REJECTED
  → PLANNING
  → PLAN_READY | PLAN_INVALID
  → AWAITING_EXECUTION_APPROVAL
  → EXECUTING
  → PERSISTED | EXECUTION_FAILED
  → VERIFYING
  → VERIFIED | VERIFICATION_FAILED | PARTIALLY_VERIFIED
  → COMPLETED | BLOCKED | SUPERSEDED | ARCHIVED
```

This is an umbrella lifecycle only. It does not replace or reinterpret existing vocabularies: Prospect Intake stages/statuses; Watchlist and Identity Intake lifecycle states; Promotion Decision statuses and lifecycle; Promotion Workflow statuses, plan statuses, and lifecycle; Promotion Execution statuses; durable persistence commit/rollback/result states; or Research Repository source/session/persistence statuses. In particular, `APPROVED` or `PARTIALLY_APPROVED` on a Promotion Decision is historical authorization state, not an FIIS lifecycle state. Adapters map states explicitly and preserve the original value and version.

## 7. Intake request boundary

An Intake Request may declare request identity and revision, intake type, target entity type, initiating actor, requested operation, candidate/research/source/evidence references, identity inputs, proposed target contracts, requested effective date, review requirements, notes, and safe extensions. Caller-owned identifiers remain caller-owned; FIIS must not generate them unless a separately approved ID-owning service is explicitly invoked.

An Intake Request cannot invent research or source ownership, declare canonical truth merely by submission, authorize or persist itself, select claims automatically, or evaluate a player.

## 8. Validation boundary

Validation covers contract shape, required input, supported contract and schema versions, supported intake types and operations, reference formats, duplicate declarations, local consistency, explicit date ordering, extension safety, and required governance steps. It returns structured errors and warnings and preserves explicit nulls where the governing contract permits them.

Validation does not decide football truth, authorize promotion, score evidence, infer identity, fetch missing research automatically, or persist anything. A future resolver may fetch only if an approved contract gives it that responsibility.

## 9. Authorization boundary

Authorization is separate from validation. It identifies the authorized target, operation, and claims; excluded and deferred claims; remaining blockers; required human or governed approval; effective period; revision; and supersession state. Authorization must be target-specific and claim-specific wherever the Promotion Decision requires it. An overall status never silently authorizes every target or claim. Before execution, FIIS revalidates that the exact decision revision is current, authorizing, unexpired where applicable, not superseded, and consistent with the plan.

## 10. Identity coordination boundary

| Term | Meaning |
| --- | --- |
| Supplied identity declaration | Caller-provided, unresolved identity input |
| Candidate identity | A proposed subject under review; not canonical |
| Unresolved identity | Insufficient governed basis for canonical linkage |
| Identity conflict | Competing or inconsistent identity evidence requiring resolution |
| Canonical identity | Identity established by the approved identity-owning boundary |
| Canonical record ID | Logical ID carried by the canonical FID contract |
| Persistence ID | Immutable stored-version identifier governed by persistence |
| Revision identity | Contract record ID plus explicit revision and predecessor linkage |

FIIS may coordinate a future approved identity-resolution service, but never owns canonical identity truth. Fuzzy matching cannot silently merge identities; a name alone cannot establish identity; identity creation requires explicit authorization; and generated IDs require an approved ID-owning component.

## 11. Research and source boundary

The Research Repository owns Research Source, Research Session, Recorded Observation, Analytical Observation, and Evidence Artifact records and their history. The Source Registry owns governed source identity, metadata, classification, and source governance. FIIS may retain references and validation outcomes only.

FIIS cannot rewrite research or source history, absorb full Research records as FIIS-owned data, reinterpret observations without an approved analytical layer, calculate source quality without an approved source-intelligence owner, or delete Research records after promotion. Promotion never erases the research trail. The repository audit found `ResearchSourceContract` inside Research Repository but no standalone Source Registry implementation; FIIS therefore treats governed Source Registry resolution as an explicit upstream prerequisite and gap, not as Research Repository or FIIS ownership.

## 12. Evidence boundary

- A source reference identifies a governed source through the Source Registry.
- A research record is repository-owned work and history.
- An observation is a recorded or analytical research object, with its own contract.
- An evidence artifact is a repository-owned evidentiary object.
- A claim is a reviewable proposition tied to evidence and target scope.
- A proposed canonical field is a candidate FID contract value, not canonical truth.
- A canonical FID fact is a validated and persisted field owned by FID.
- Engine-derived intelligence is an interpretation produced downstream and is not a canonical fact merely because it was calculated.

FIIS governs the declared relationships and authorization among these objects. It never calculates player ability from them.

## 13. Promotion governance

The existing promotion plan declares proposed targets and actions. The Promotion Decision is the durable historical authorization artifact and remains authoritative for target- and claim-specific decisions. The Promotion Workflow is a non-owning planning artifact. Its dry-run planner validates references, authorization, claims, dependencies, payload declarations, and persistence preconditions to create ordered operations.

The dry-run plan remains non-persisted, deterministic, non-executing, and non-evaluative. It neither reads nor writes a repository and cannot itself authorize execution. FIIS composes these contracts; it does not duplicate or redesign them.

## 14. Controlled execution boundary

A future reusable Controlled Intake Executor may receive an approved current Promotion Decision and valid dry-run plan; revalidate authorization and execution preconditions; dispatch contract-specific validation; prepare atomic persistence operations; invoke the governed FID persistence interface; collect effect receipts; and return structured execution results.

It must never generate football facts, choose claims, change authorization, evaluate players, bypass persistence contracts or security, or silently recover by writing partial alternate records. The existing `ProspectPromotionExecutor` is narrower: it accepts only the approved in-memory FID repository, snapshots and stages operations, and reports `productionPersistencePerformed: false`. It is mapped as Prospect Intake V1 constrained execution, not declared to be the future shared production executor. Sprint 1 implements neither executor nor integration.

## 15. Persistence boundary

FIIS uses actual FID persistence terminology:

- `FidPersistenceRepositoryContract` owns repository shape and capabilities such as `validateEnvelope`, `prepareWrite`, `createVersion`, version reads/queries, existence checks, and health checks.
- `FidPersistenceEnvelope` carries the canonical contract, contract/schema versions, `persistenceId`, `recordId`, explicit `revision`, predecessor references, payload, provenance, verification, audit, lifecycle, and related safe metadata as defined by its existing contract.
- Canonical contracts own payload validation and logical record identity; persistence owns immutable stored versions and persistence identity.
- `CREATE_RECORD` requires revision 1. `APPEND_REVISION` requires an explicit predecessor and contiguous revision under the durable port.
- The durable port declares preconditions, conflict reporting, `EXECUTE_ATOMIC_BATCH`, `IDEMPOTENT_REQUESTS`, effect receipts, and repository capability negotiation.
- Batch requests use `batchId`, ordered operations, and `requestedAtomicity`; results report requested/supported/achieved atomicity, commit state, rollback state, operation results, and indeterminate outcomes.
- Audit and effect-receipt records are operational trace records, not canonical football facts.
- Verification is a distinct post-persistence responsibility.
- Rollback or compensation behavior must be declared by the executing adapter/result; FIIS never assumes it.

FIIS invents no tables, SQL, RPCs, envelope fields, or repository methods.

## 16. Atomicity and transaction boundary

A prospect promotion can depend on Football Entity → Person Profile → Player Profile → Prospect Profile, followed by Relationships whose endpoints must exist. The operation declares dependency order and requested atomicity before execution.

Current capabilities are distinct:

- The legacy repository contract creates immutable versions one at a time.
- The prospect executor approximates all-or-nothing behavior only inside one in-memory process by staging and snapshot restoration; it explicitly makes no production transaction claim.
- The durable port defines `NONE`, `SINGLE_OPERATION`, `BATCH_ATOMIC`, and `TRANSACTIONAL`, and an `executeAtomicBatch` operation when the repository declares support.
- The Supabase persistence package contains an atomic-persistence function and batch/receipt/audit specifications. This documentation sprint did not execute or independently runtime-certify deployment state.

Future controlled execution must request the atomicity required by the adapter, reject unsupported atomicity before execution, preserve dependency order, return structured failures, and declare retry/compensation behavior. All-or-nothing is required when partial canonical state would violate contract or relationship invariants. Declared partial success is allowed only when authorization, adapter policy, dependency independence, and result semantics explicitly permit it; otherwise `PARTIALLY_COMMITTED` is a failure condition requiring operator review, not success.

## 17. Idempotency

- Deterministic planning means identical versioned planning inputs produce equivalent ordered plans.
- Request idempotency identifies repeat submission of the same request revision.
- Operation idempotency identifies repeat execution of the same logical operation.
- Persistence idempotency is a repository capability that correlates an idempotency key/request and returns the governed prior result or a conflict without duplicating effects.
- Retry safety is the declared ability to retry after a known failure or indeterminate outcome.
- Duplicate detection finds conflicting persistence IDs, record/revision pairs, target proposals, or operation IDs; it is not by itself idempotency.

A deterministic dry run is never proof of cross-process persistence idempotency. FIIS must use the durable repository's `IDEMPOTENT_REQUESTS` declaration and idempotency result/conflict semantics when available; otherwise it declares retry unsafe or requires operator reconciliation.

## 18. Verification

Verification begins only after a persistence result. It may validate receipt count and shape; expected target count; target contracts; logical record IDs; persistence IDs; revisions and predecessor links; batch membership; audit references; retrieval confirmation; canonical-contract validation; and unresolved blockers. It records `VERIFIED`, `PARTIALLY_VERIFIED`, or `VERIFICATION_FAILED` independently of commit state. Successful persistence never equals successful verification. Verification never recalculates football evaluation.

## 19. Intake Result

A future Intake Result communicates request, workflow, authorization, and execution-plan references; execution result; persistence receipts; verification status; completed, skipped, and blocked targets; warnings and errors; unresolved preconditions; audit references; and explicit runtime flags including repository-read, repository-write, and canonical-record-created flags. The result is a report, not new authority and not canonical football knowledge. Sprint 1 creates no runtime contract.

## 20. Error model

FIIS errors are structured, versioned, attributable to a lifecycle stage and target/claim/operation when applicable, and auditable. Categories include invalid request; invalid contract; unsupported intake type or operation; missing research, source, or evidence reference; identity conflict or unresolved identity; missing, expired, or superseded authorization; unauthorized claim or target; invalid workflow; dependency failure; contract validation failure; persistence precondition or persistence failure; partial execution; verification failure; idempotency conflict; security rejection; and internal invariant failure.

Adapters preserve the underlying vocabularies, including Prospect Workflow error codes, Prospect Execution error categories/codes, FID persistence error codes, and durable conflict/error/result states. FIIS normalization adds context without discarding the original code or pretending distinct failures are equivalent.

## 21. Audit model

FIIS audit history can record request created; validation started/completed; authorization requested/completed; plan created/rejected; execution approval granted; execution started; persistence operation requested; persistence receipt received; execution failed; verification started/completed; and intake completed/blocked/superseded/archived.

Existing vocabulary is reused where applicable: Promotion Decision history events; Promotion Workflow audit events (`WORKFLOW_CREATED`, validation, target/claim authorization, dependency ordering, planning, dry-run, reopen/supersede/archive); Prospect Execution audit events (request, validation, dry-run acceptance, record/precondition checks, staging, commit, failure, discard, rollback); and durable persistence audit/effect receipts. Audit history never invents actor identity or timestamps. Missing actor/time remains explicit null or a validation blocker according to the governing contract.

## 22. Replayability and reproducibility

Reproducing validation requires the exact request revision, contract/schema versions, validation policy version, and safe extensions. Authorization review also requires referenced research/source/evidence revisions, identity declarations, reviewer/actor reference, decision revision, and effective/supersession state. Dry-run planning requires the exact workflow, Promotion Decision, target proposals, claims, dependencies, and planner version. Execution preparation requires the plan, executor/adapter version, canonical payloads, envelopes, approval, and repository capability/health snapshot. A persistence request requires the exact ordered operation envelopes, batch/request/idempotency identifiers, requested atomicity, actor, and audit context. Verification requires receipts, expected outcomes, repository identity, and the read snapshot/revisions used.

Perfect replay is limited by mutable external pages, source governance changes, authorization expiry, repository state, credentials/policies, and time. Immutable snapshots where lawful, versioned Research records, Source Registry revisions, canonical revisions, content hashes, durable receipts, and explicit references make those dependencies observable. FIIS must never fabricate a snapshot when only a live reference exists.

## 23. Versioning

FIIS Architecture, Intake Request Contract, Intake Validation, Intake Authorization, each entity-specific adapter, Promotion Workflow, Controlled Executor, Persistence integration, and Intake Result Contract version independently. Compatibility mappings are explicit. A Prospect Intake change does not force an unrelated Coach Intake version change. An FIIS change does not automatically change Football Intelligence Engine versions, and a persistence adapter change does not rewrite historical authorization artifacts.

## 24. Diagnostics

Permanent diagnostics must cover ownership boundaries; contract compliance; non-mutation; explicit-null preservation; no generated caller-owned identity; authorization isolation; claim authorization; deterministic planning; dependency behavior; persistence separation; evaluation, engine, and simulator exclusion; research and source separation; identity safety; audit behavior; error normalization; version compatibility; replayability; idempotency declarations; and extension safety. Diagnostics are permanent engineering assets and must include positive, negative, adversarial, and cross-version cases. This sprint changes none of them.

## 25. Entity-specific intake adapters

```text
FIIS Core
├── Prospect Intake Adapter (first implementation)
├── Player Intake Adapter (future)
├── Coach Intake Adapter (future)
├── Executive Intake Adapter (future)
├── Scout Intake Adapter (future)
├── Team Intake Adapter (future)
├── Organization Intake Adapter (future)
└── Future Sport Intake Adapters
```

The shared core owns governance mechanics, lifecycle mapping, authorization isolation, execution/persistence coordination, verification, result normalization, and audit correlation. An entity adapter owns only type-specific request declarations, target mappings, dependency declarations, and canonical contract validation dispatch. No adapter owns evaluation logic. Sprint 1 implements no adapter.

## 26. Prospect Intake V1 mapping

All paths below are relative to `frontend/`.

| Component and current path | Current role / FIIS layer | Owned data | Prohibited ownership | Dependencies | Disposition |
| --- | --- | --- | --- | --- | --- |
| `src/data/footballIntelligence/fid/prospectIntake/ProspectIntakeArchitectureSpecification.js` | Candidate governance architecture; Layers 1–5 | Candidate workflow declarations, references, reviews, blockers, readiness, promotion plan | Research/source/canonical identity, evaluation, persistence | Research refs, FID target types | Unchanged; future additive adapter mapping |
| `.../prospectWatchlistConstants.js` | Watchlist vocabulary; Layer 1 | Watchlist enums/versions | Canonical prospect truth | Watchlist contract | Unchanged |
| `.../ProspectWatchlistContract.js` | Candidate/watchlist intake declaration; Layer 1 | Watchlist record and unresolved references | Canonical identity, automatic promotion | Constants, research/source refs | Unchanged; future request adapter |
| `.../ProspectIdentityIntakeContract.js` | Identity review declaration; Layers 2 and 4 | Supplied claims, conflicts, match reviews, lifecycle | Canonical identity creation/merge | Watchlist lifecycle vocabulary, evidence/source refs | Unchanged; future identity-coordination adapter |
| `.../prospectPromotionDecisionConstants.js` | Authorization vocabulary; Layers 3 and 6 | Decision/target/claim/review/history vocabularies | Execution or canonical truth | Decision contract | Unchanged |
| `.../ProspectPromotionDecisionContract.js` | Historical authorization artifact; Layers 3 and 6 | Decision revision, target/claim outcomes, reviews, dissent, limitations, history | Persistence, evaluation, blanket authorization | Candidate/research/source/evidence refs | Unchanged; authoritative authorization adapter |
| `.../prospectPromotionWorkflowConstants.js` | Planning vocabulary; Layers 5 and 7 | Workflow, dependency, validation, error/audit vocabularies | Repository effects or evaluation | Decision and FID contract names | Unchanged |
| `.../ProspectPromotionWorkflowContract.js` | Non-owning workflow/dry-run contracts; Layer 7 | Proposed operations, dependency and plan declarations | Canonical records, writes, new authority | Promotion Decision, envelopes by declaration | Unchanged |
| `.../ProspectPromotionWorkflowPlanner.js` | Deterministic dry-run planner; Layer 7 | Derived ordered plan and structured planning outcome | Repository reads/writes, evaluation, authorization changes | Workflow, decision, workflow constants | Unchanged; composed by future adapter |
| `.../prospectPromotionExecutorConstants.js` | Constrained execution vocabulary; Layers 8–11 | Execution/result/error/audit enums | Production persistence authority or evaluation | Execution contract/executor | Unchanged |
| `.../ProspectPromotionExecutionContract.js` | In-memory execution request/result declarations; Layers 8–11 | Execution declarations, operation/effect/validation/error/audit results | Production claims, callbacks, SQL, evaluation | Workflow, decision, FID envelopes | Unchanged; future additive result mapping |
| `.../ProspectPromotionExecutor.js` | Approved in-memory-only executor; Layers 8–10 | Temporary staging and structured in-memory execution result | Production persistence, fact generation, evaluation | Current decision/workflow/dry run, canonical validators, In-Memory FID Repository | Unchanged; not the shared future executor |
| `.../index.js` | Prospect Intake barrel | Existing public exports | FIIS ownership expansion | All modules above | Unchanged; no export added |

The associated permanent diagnostics are `src/data/footballIntelligence/fid/diagnostics/runProspectIntakeArchitectureDiagnostics.js`, `runProspectWatchlistIdentityIntakeDiagnostics.js`, `runProspectPromotionDecisionContractDiagnostics.js`, `runProspectPromotionWorkflowDiagnostics.js`, and `runProspectPromotionExecutorDiagnostics.js`. `runFidPersonPlayerProspectFoundationDiagnostics.js` and `runProspectProfileContractDiagnostics.js` validate adjacent FID foundations rather than Prospect Intake itself. All remain unchanged.

The current governance-chain mapping is Watchlist → Identity Intake → referenced Research/Evidence → candidate Promotion Plan → Promotion Decision → Promotion Workflow dry run → constrained in-memory execution today / future controlled execution → governed persistence → independent verification. FIIS composes rather than replaces it.

## 27. Football Intelligence Engine separation

| Layer | Owns | Must not own |
| --- | --- | --- |
| FIIS | Knowledge-entry governance, intake validation, authorization/reference coordination, persistence coordination, verification | Player evaluation, canonical facts after persistence |
| FID | Canonical football knowledge, immutable revisions, provenance | Recommendations or football evaluation |
| FIE | FID evidence resolution, trait scoring, position interpretation, player evaluation, higher-level intelligence | Football facts or intake authorization |
| Applications | Requests, interaction, and presentation | Evaluation logic or canonical persistence |

FIIS creates no player evaluation. Engines read governed FID knowledge only after intake and do not populate FID as a side effect of interpretation.

## 28. Application separation

The Mock Draft Simulator cannot write FID tables directly, promote prospects, authorize intake, create canonical facts, calculate player grades in UI components, or bypass Draft Intelligence, Player Evaluation, or FID. Account Hub, Draft Room, Draft Results, website integrations, and future applications are presentation and interaction layers. UI state and simulator behavior are never FIIS-owned.

## 29. Security principles

FIIS requires least privilege; an explicit trusted service boundary; no direct table access from application clients; no client-owned persistence credentials; no arbitrary contract selection or SQL; no executable callbacks in contracts; no untrusted extension execution; auditable actor identity; request, operation, correlation, and causation references; secrets excluded from records; and structured security failures. Persistence is invoked only through approved repository/port and adapter capabilities. The deployed model's RLS, trusted-backend write boundary, controlled RPC, credential references, and sanitized runtime composition remain authoritative; FIIS invents no grants.

## 30. Extension safety

Extensions are descriptive data only and must be recursively inspected. They reject executable functions and dangerous nested content, including database/Supabase/HTTP clients, SQL, API credentials, filesystem or repository/persistence callbacks, rollback/retry callbacks, identity resolvers, fuzzy matchers, graph traversals, evaluation engines, scores, grades, rankings, projections, recommendations, team/scheme fit, and simulator readiness. Unknown executable or capability-bearing values fail closed. Harmless serializable metadata remains preservable, including explicit null where the owning contract permits it.

## 31. Governing principles

1. FIIS never owns external research.
2. FIIS never owns source identity.
3. FIIS never creates football intelligence evaluations.
4. FIIS never bypasses canonical FID contracts.
5. FIIS never bypasses the governed persistence layer.
6. Validation does not equal authorization.
7. Authorization does not equal execution.
8. Execution does not equal verification.
9. Overall approval does not authorize every target or claim.
10. Canonical identity must be explicit and governed.
11. Research history survives promotion.
12. Every persisted result must be traceable to authorization and evidence references.
13. Every operation must be auditable.
14. Every intake must be reproducible to the extent allowed by versioned external state.
15. FIIS remains modular and entity-extensible.
16. Prospect Intake is the first implementation, not the whole system.
17. Football Intelligence Engines consume FID knowledge only after governed intake.
18. Applications never calculate or persist canonical football intelligence directly.

## 32. Governing statement

The LBHT Sports Intelligence Platform adopts the Football Intelligence Intake System, Version 1.0, as the official governance and coordination methodology for introducing proposed football knowledge into the Football Intelligence Database. No proposal becomes canonical through submission, validation, evaluation, or application behavior. Canonical entry requires explicit identity and reference governance, target- and claim-specific authorization, a valid deterministic plan, approved controlled execution through canonical contracts and the governed persistence boundary, structured receipts, and independent verification. Existing Prospect Intake governance remains the first conforming implementation and retains its contract authority.

## Architecture Decision Record — Adopt FIIS

### Context

The platform already has mature Prospect Intake governance, a constrained in-memory prospect executor, and FID persistence components, but lacks an explicit reusable umbrella architecture for entity-extensible intake.

### Decision

Adopt FIIS as the reusable governance and coordination architecture over existing intake modules. FIIS composes requests, validation, authorization, identity/reference coordination, planning, controlled execution, governed persistence, verification, results, and audit without transferring ownership among Research Repository, Source Registry, FID, engines, or applications.

### Consequences

Positive consequences are a reusable intake framework, clearer ownership boundaries, a consistent umbrella lifecycle, safer persistence, easier future entity expansion, stronger auditability, and elimination of application-owned canonical writes.

Tradeoffs are an additional orchestration layer, more independently versioned contracts, stricter workflow, greater implementation complexity, and later commencement of real prospect loading.

### Rejected alternatives

- Applications write directly to FID: violates security, authorization, and ownership boundaries.
- One monolithic intake function: obscures authority, versions, failures, and replay inputs.
- Prospect Intake remains one-off: prevents safe reuse and consistent governance.
- Intelligence Engines populate FID: collapses facts into interpretations.
- Research Repository doubles as canonical database: destroys research/canonical ownership separation.
- Automatic promotion based only on research availability: availability is neither validation nor authorization.

## Repository audit record

Audit date: 2026-07-18. Repository root: `C:/Users/zeyga/NFL-Mock-Draft-Simulator-main/NFL-Mock-Draft-Simulator-main`. Selected established documentation directory: `frontend/src/engines/docs/LBHT_FOOTBALL_INTELLIGENCE_FRAMEWORK/`. Existing architecture documents in that directory are the numbered framework series `01 - Vision and Core Principles.md` through `11 - Glossary.md` and `CHANGELOG.md`. Runtime architecture specifications also exist beside their owning modules as JavaScript contracts; Sprint 1 does not alter them.

### Authoritative implementations inspected

- Research contracts: `frontend/src/data/researchRepository/contracts/ResearchSourceContract.js`, `ResearchSessionContract.js`, `RecordedObservationContract.js`, `AnalyticalObservationContract.js`, and `EvidenceArtifactContract.js`; constants are in the sibling `constants/` directory, persistence under `persistence/`, diagnostics under `diagnostics/`, and barrel at `src/data/researchRepository/index.js`.
- Source governance: no standalone Source Registry/source-governance module was found. `ResearchSourceContract.js` owns repository-side Research Source records but is not reclassified as the platform Source Registry.
- FID canonical contracts: `frontend/src/data/footballIntelligence/fid/contracts/FootballEntityContract.js`, `PersonProfileContract.js`, `PlayerProfileContract.js`, `ProspectProfileContract.js`, and `FootballRelationshipContract.js`, with constants and permanent diagnostics in sibling directories.
- Prospect Intake: every production module is listed in Section 26; its barrel is `prospectIntake/index.js`, and the aggregate FID barrel is `fid/index.js`.
- Persistence architecture and legacy repository: `fid/persistence/FidPersistenceArchitectureSpecification.js`, `FidPersistenceRepositoryContract.js`, and `InMemoryFidPersistenceRepository.js`.
- Durable persistence and Supabase: `DurableFidPersistencePortContract.js`, `DurableFidRepositoryCapabilityContract.js`, `DurableFidPersistenceConformance.js`, `FidCanonicalPersistenceMapper.js`, `SupabaseFidDurableRepositoryAdapter.js`, associated adapter/schema/security/execution/materialization specifications, runtime composition modules, deployment/runbook/review packages, and `persistence/deployment/sql/001...013`. Persistence diagnostics are in `fid/diagnostics/runFidPersistenceArchitectureDiagnostics.js`, `runInMemoryFidPersistenceRepositoryDiagnostics.js`, `runDurableFidPersistencePortDiagnostics.js`, mapper, Supabase, security, deployment, and runtime diagnostic files.

### Overlapping vocabulary audit

Existing lifecycle vocabularies include Prospect Intake stages/statuses/lifecycle, Watchlist/Identity Intake lifecycle, Promotion Decision statuses/lifecycle, Workflow statuses/plan/lifecycle, Execution statuses, durable readiness/commit/rollback/result states, and Research Source/Session/Persistence states. Existing errors include contract validation codes, Workflow error codes, Execution error categories/codes, FID persistence error codes, and durable conflict/error categories. Existing audit vocabulary includes Promotion Decision history events, Workflow audit events, Execution audit events, persistence audit events, and effect receipts.

Persistence uses `FidPersistenceEnvelope`; immutable `persistenceId`, logical `recordId`, explicit `revision`, and predecessor references; canonical payload and validation; request/operation/batch identifiers; requested/supported/achieved atomicity; commit and rollback states; effect receipts; audit events; repository capabilities; and structured results. Idempotency is a distinct durable capability and Supabase operational schema concern, not deterministic planning. Batch/transaction terminology is `executeAtomicBatch`, `batchId`, ordered operations, `requestedAtomicity`, `BATCH_ATOMIC`, `TRANSACTIONAL`, operation results, commit/rollback states, and indeterminate/partial outcomes.

### Conflict and duplication finding

No material architectural conflict and no duplicate FIIS subsystem were found. The current prospect executor's existence does not conflict with the future controlled-execution boundary because it is explicitly limited to an in-memory single-process repository and denies production-persistence claims. The missing standalone Source Registry is an integration gap that must block governed source resolution until supplied; it does not justify competing ownership. The FIIS lifecycle vocabulary overlaps existing words but remains explicitly namespaced and mapped, never substituted for Promotion Decision state.

## Boundary audit

FIIS is not assigned ownership over Research Repository records; source identities; evidence truth; canonical football facts after persistence; player grades; trait scores; projections; rankings; team fit; scheme fit; draft or trade recommendations; simulator behavior; or UI state.

This architecture does not allow direct application table writes; automatic identity merges; automatic claim selection; automatic promotion; ungoverned contract creation; bypassing Promotion Decision; bypassing workflow validation; bypassing persistence security; or treating successful persistence as successful verification.

## Sprint 1 implementation declaration

This sprint creates this architecture document only. It creates no FIIS runtime, orchestrator, adapter, executor, contract, constants, factory, export, API, UI, job, SQL, migration, database call, Research record, FID record, real prospect, evaluation output, Draft V3 integration, or simulator integration. No repository operation is invoked by new code because no new runtime code exists.
