# Runtime Evidence Framework Observation Architecture

Status: `OBSERVATION_ARCHITECTURE_ESTABLISHED`

Version: `REF-4`

Authority: REF-1 through REF-3

## 1. Purpose

The Runtime Observation Architecture governs how controlled runtime activity may be observed while keeping the governed operation, observation mechanism, observation record, evidence artifact, claim, review, decision, and conclusion distinct. It specializes established REF concepts without selecting an implementation.

It answers what may be observed, where, by whom or what, in what order, across which boundaries, with what correlation, fidelity, completeness, interference, ambiguity, and sufficiency.

## 2. Architectural principles

1. Observation is a governed act distinct from the operation observed.
2. An observer never silently becomes the operator; participation and authority are explicit.
3. Observation at one layer does not prove activity at another layer.
4. A record preserves what a mechanism exposed; it is not automatically evidence sufficient for a claim.
5. Chronology is not causality, correlation is not identity, and success display is not completion proof.
6. Gaps, failures, interference, ambiguity, and unknowns are first-class results.
7. Observation sufficiency is claim-specific and cannot exceed authenticity, integrity, provenance, custody, boundary, fidelity, completeness, or independence support.
8. Least-evidence and least-disclosure constrain collection even when broader capture might be convenient.

## 3. Required architectural concepts

Each concept below is conceptual, not a code, schema, storage, API, or identifier definition.

| Concept | Purpose | Responsibilities | Non-responsibilities | Relationships | Lifecycle role | Trust-boundary implications |
| --- | --- | --- | --- | --- | --- | --- |
| Runtime Observation Architecture | Govern observation of controlled runtime activity | Define separation, layers, modes, ordering, correlation, quality, failure, and sufficiency | Does not observe, execute, authorize, or conclude | Specializes REF architecture and governs all concepts below | Frames planning through acceptance | Makes every material crossing explicit |
| Governed Runtime Operation | Bound the intended or attempted activity being observed | State purpose, authority reference, stages, targets, expected effects, and limits | Does not prove execution, completion, or correctness | Context for execution, subjects, events, and claims | Planned, observed indirectly/directly, reviewed | Crosses operator, runtime, platform, database, and review domains as applicable |
| Observation Subject | Identify the operation, event, state, object, output, error, or boundary condition under observation | Define exact scope, time, granularity, and relevant claims | Is not the observation or conclusion | Observed at points by mechanisms; represented by events/records | Selected in planning and reassessed during review | Subject authority may differ from observer authority |
| Observation Point | Locate the conceptual vantage where information becomes observable | State layer, temporal relation, scope, and access | Does not prescribe instrumentation | Hosts mechanism/channel and exposes subjects/events | Planned, active conceptually, reviewed | Sits within or at a trust boundary |
| Observation Boundary | Represent the observer-to-subject trust transition | Name both sides, binding, authority, exposure, and unknowns | Does not prove the crossing is authenticated | Specializes RuntimeEvidenceBoundary | Assessed from planning through review | Prevents authority transfer between layers |
| Observation Mechanism | Describe how a subject is perceived or captured | Declare operation, access, fidelity potential, intrusiveness, interference, and failure behavior | Does not become evidence, operator, or implementation selection | Acts at point through channel; produces events/records | Planned, observed, assessed, retired | Mechanism identity and authority require binding |
| Observation Channel | Describe the path by which observed information reaches a record or observer | Declare endpoints, transformations, ordering behavior, loss/failure properties, and domains | Does not guarantee delivery, completeness, or integrity | Carries events from mechanism/source to record/artifact | Available, used, failed, reviewed | Every channel crossing can weaken continuity |
| Observation Event | Represent one bounded occurrence exposed by observation | Preserve subject, context, order, content, source, and limitations | Does not prove cause or completeness | Member of sequence; captured in record; correlated to execution | Observed, authenticated, reviewed, superseded/archived | Origin and receiving domains may differ |
| Observation Record | Preserve the declared representation of one or more events | Separate observed content from annotations; retain context, provenance, fidelity, gaps, and ordering | Is not automatically an authentic artifact, verified claim, or conclusion | May become or enter RuntimeArtifact/RuntimeEvidence | Created, authenticated, reviewed, accepted/rejected | Record creation and transfer cross artifact/custody boundaries |
| Observation Sequence | Express intended, observed, confirmed, inferred, concurrent, missing, delayed, duplicate, or contradictory ordering | Preserve order basis, granularity, uncertainty, and gaps | Does not infer causality from chronology | Orders events/stages and supports claims | Built and refined without rewriting history | Cross-source clocks/order authorities require explicit bindings |
| Observation Correlation | Bind observations to governed contexts | Relate events/records to operation, execution, identities, actors, sessions, targets, results, and errors | Does not select identifiers or turn association into causality | Uses evidence relationships and boundaries | Proposed, assessed, accepted/partial/broken/unverifiable | Each cross-domain binding is independent |
| Observation Context | Supply the circumstances needed to interpret an observation | State operation, subject, point, mode, layer, target, session, time/order, conditions, and limitations | Does not fill missing facts by inference | Qualifies events, records, claims, and review | Captured and extended additively | Context from another domain needs provenance |
| Observation Identity | Distinguish an observation from others | State origin, scope, issuer, uniqueness assumptions, derivatives, and ambiguity | Does not choose UUID/hash/name or prove authenticity | Relates event, record, artifact, source, and correlation | Declared, authenticated, preserved | Identity continuity across boundaries must be shown |
| Observation Provenance | Explain where and how an observation arose | Preserve source, mechanism, point, channel, context, transformations, custody, and unknowns | Does not guarantee authenticity or truth | Specializes RuntimeEvidenceProvenance | Accumulates from creation through archival | Records every material domain crossing |
| Observation Completeness | Assess coverage in named dimensions | State required scope, observed scope, gaps, and claim impact per dimension | Is not a blanket complete/incomplete label | Feeds sufficiency and classification | Assessed and revised by successor review | Boundary blind spots remain explicit |
| Observation Fidelity | Assess how closely representation corresponds to the actual subject/event | Classify representation and disclose loss/transformation/granularity | Does not equal authenticity, integrity, or correctness | Qualifies record, derivative, and claim support | Assessed at capture and review | Cross-layer representation can reduce fidelity |
| Observation Intrusiveness | Describe depth of mechanism access or participation | Classify participation and privileges needed | Does not assert actual behavioral change | Qualifies mechanism and security review | Planned and assessed | Deeper access crosses broader security/trust boundaries |
| Observation Interference | Describe actual or plausible observer-caused change | Assess effects on timing, ordering, state, behavior, resources, transactions, failure, output, and security | Does not infer non-interference from intent | Limits events, claims, fidelity, and sufficiency | Monitored conceptually and reviewed | Observer influence creates dependency with subject |
| Observation Gap | Represent missing required observational coverage | Name dimension, interval, cause if known, affected claims, and recoverability | Is not a runtime failure or proof of absence | Limits completeness, sequence, correlation, and sufficiency | Detected, reviewed, unresolved or superseded | Often reveals an unauthenticated boundary |
| Observation Failure | Represent failure of observation itself | State phase, mechanism/channel, scope, evidence retained, and claim impact | Does not prove governed operation failed | May cause gaps and failure records | Observed/reported, reviewed, preserved | Failure source domain must remain distinguishable |
| Observation Ambiguity | Represent multiple plausible identities, orders, targets, meanings, or explanations | Enumerate alternatives, evidence, exclusions, and unresolved scope | Does not choose a preferred explanation without support | Constrains claims, conclusions, and correlation | Opened, reduced, resolved, or preserved unknown | May span several trust domains |
| Observation Replay | Re-present or re-evaluate an existing observation/evidence representation | Preserve source identity, transformation, review context, and historical boundary | Does not re-execute or prove a prior operation | Produces review context or derivative | Reviewed repeatedly with protected history | Replay environment is distinct from original context |
| Observation Derivative | Represent excerpted, normalized, summarized, transformed, annotated, or derived observation material | Link to source, declare method, loss, authority, fidelity, and custody | Is not the original or necessarily equivalent | Specializes derivative artifact/relationship | Created, authenticated, reviewed, superseded/archived | Transformation boundary requires continuity |
| Observation Review | Evaluate observation quality and claim use | Assess identity, correlation, order, fidelity, completeness, interference, provenance, authenticity, integrity, custody, independence, and contradictions | Does not create runtime facts or operational authority | Informs acceptance, classification, decision | Planned, performed, accepted/rejected/superseded | Review-set and reviewer bindings cross Review Boundary |
| Observation Acceptance | Approve an observation for a specific claim and purpose | State claim, sufficiency outcome, conditions, limitations, authority, and review | Does not accept every claim or make evidence canonical automatically | Links review to claim-specific use | Accepted, rejected, superseded, archived | Acceptance authority is bounded to its trust domain |

## 4. Observation modes

Modes may combine; none is preferred by REF-4.

| Mode | Strengths | Limits | Risks | Trust implications and possible gaps |
| --- | --- | --- | --- | --- |
| Direct | Close to subject/event | Still bounded by point and access | Observer effect; narrow scope | Strong proximity, but target, completeness, and custody may remain open |
| Indirect | Can observe inaccessible effects | Depends on intermediaries and interpretation | Confounding causes | Requires every dependency and boundary to be declared |
| Synchronous | Supports local temporal association | May block or alter operation | Timing/interference | Ordering may be strong; causality and completeness remain separate |
| Asynchronous | Reduces direct coupling | Delay, reorder, loss | Stale or duplicated events | Needs delivery/order context; transaction association may remain partial |
| In-band | Shares operation path/context | Observer and operation failures can couple | Common-mode failure; interference | Strong context may come with low independence |
| Out-of-band | Potential independence/corroboration | May lack internal context | Correlation/clock ambiguity | Requires binding across channels and target identity |
| Pre-execution | Establishes intent/baseline | Cannot prove later execution | Plan mistaken for event | Supports baseline only unless linked forward |
| During execution | Captures active stages | May be partial or intrusive | Observer changes timing/behavior | Session/stage bindings needed |
| Post-execution | Captures results/after-state | Misses transient stages and rollback paths | Outcome overinterpretation | Does not prove path, statement completion, or cause |
| Continuous | Broad temporal coverage | Resource/privacy cost; still may drop | Excess capture and hidden gaps | Requires explicit continuity and retention boundaries |
| Point-in-time | Clear bounded snapshot | No path or duration coverage | Snapshot misread as sequence | Supports only observed instant and scope |
| Transaction-local | Can bind observations within transaction semantics | Visibility may be provisional or rolled back | Observer participates in transaction | Must distinguish transaction state, commit, and external visibility |
| Persisted | Supports later custody/review | Persistence may transform or omit | Storage mistaken for truth | Requires provenance, integrity, retention, and retrieval continuity |
| Ephemeral | May reflect immediate state | Weak preservation/reviewability | Loss and operator mediation | Authenticity/custody often incomplete unless captured |
| Operator-mediated | Adds human context | Subject to selection and declaration | Omission, substitution, transcription | Operator and machine evidence remain separate |
| Platform-mediated | Uses platform-visible context | Hidden semantics and internals | Vendor/common-mode dependency | Platform identity/event must bind to local operation |
| Independently witnessed | Can corroborate across failure domains | Independence must be proven | False independence | Common sources, identities, clocks, transports, and transformations must be assessed |

## 5. Strict observation separation

The governed operation performs or attempts domain work. The observation mechanism perceives a subject. The observation record preserves what was exposed. The evidence artifact carries a governed representation. The evidence claim states a proposition. Review evaluates support. Decision records disposition. Conclusion synthesizes bounded claims.

No stage silently inherits the authority of another. The operator and observer roles may be held by the same actor only when explicitly declared; that co-location reduces independence and can increase interference. A record never becomes a conclusion by formatting, and an observation never makes a claim `VERIFIED` without REF authentication and review.

## 6. Correlation model

Correlation may bind observations to a governed operation, `RuntimeExecution`, `RuntimeExecutionIdentity`, artifact identity, operator action, runtime session, database session, transaction, statement/stage, target environment, result, error, or uncertain outcome.

| State | Meaning |
| --- | --- |
| Complete | Every material required binding for the stated claim is authenticated, mutually consistent, scoped, and continuous |
| Partial | Some required bindings are supported and the unsupported subset is explicit |
| Ambiguous | Two or more plausible bindings remain |
| Broken | An expected predecessor/successor or context binding is contradicted or unavailable across a material interval |
| Unverifiable | Available evidence cannot test the asserted binding |

Correlation names both sides, authority/issuer, evidence basis, scope, order, trust domains, boundaries, independence, contradictions, and limitations. No identifier technology is selected.

## 7. Ordering and causality

REF distinguishes intended order (planned), observed order (reported by a source), confirmed order (supported across the relevant boundary and ordering authority), inferred order (reasoned), concurrency (no defensible strict order), and missing, delayed, duplicate, or contradictory events.

To claim **A preceded B**, evidence must identify A and B, bind them to the relevant context, use a governed common ordering basis or authenticated ordering bridge, address delay/duplication/concurrency, and disclose scope. To claim **A caused B**, precedence is necessary but insufficient: the claim also needs a governed causal model, mechanism or intervention evidence, alternative-explanation assessment, relevant boundary completeness, and review. To claim **A and B belong to the same execution**, both require sufficient identity and correlation to the same execution context with no unresolved competing binding.

Chronology alone never proves causality.

## 8. Fidelity model

Fidelity describes representational closeness, independent of authenticity and integrity.

| Class | Meaning |
| --- | --- |
| Exact | Represents the defined subject within stated granularity without known representational difference |
| Lossless | Transformation preserves all information required to reconstruct the defined source representation |
| Normalized | Representation is standardized with declared semantic-preserving changes and possible format loss |
| Summarized | Selected meaning or aggregates are retained while detail is omitted |
| Partial | Only a stated subset of subject/scope is represented |
| Truncated | Representation ends or is cut before the defined content completes |
| Transformed | Content or structure changed through a declared process |
| Derived | Produced by reasoning or computation from observations rather than direct representation |
| Approximate | Represents the subject within declared tolerance or estimation |
| Unresolved | Available evidence cannot establish fidelity class |

Fidelity is scope-specific. An authentic screenshot may exactly represent visible pixels while only partially representing the runtime execution.

## 9. Completeness model

Completeness is assessed per claim across subject, temporal, sequence, boundary, output, error, identity, target, provenance, and custody dimensions. Each dimension states required scope, observed scope, omissions, whether absence is observable, and claim impact. One dimension can be complete while another is unknown. Blanket “complete evidence” is prohibited unless every claim-relevant dimension and its criteria are named.

## 10. Intrusiveness and interference

Intrusiveness describes participation/access depth; interference describes demonstrated or plausible change to the subject. Both use these conceptual classifications:

| Class | Intrusiveness meaning | Interference meaning |
| --- | --- | --- |
| Non-participating | No participation in operation path is established | Evidence supports no material effect within assessed scope |
| Passive | Reads/exposes state without intended mutation | May still change timing/resources; effects assessed as bounded |
| Participating | Shares control flow, session, transaction, or resources | Dependency/effect is possible and must be assessed |
| Mutating | Intentionally or necessarily changes state/configuration/flow | Material change is part of observation behavior |
| Unknown | Participation depth cannot be established | Non-interference cannot be established |

An observation mechanism cannot be called non-interfering from design intent alone. Assessment covers timing, ordering, state, behavior, resources, transaction semantics, failure behavior, outputs, and security posture.

## 11. Failure and gap model

Observation failures are distinct from runtime-operation failures. Required failure/gap categories include: observation did not start; started late; ended early; channel failed; result truncated; identity ambiguous; correlation incomplete; target, session, or transaction identity unverified; event order incomplete; observer interfered; artifact lost; artifact authenticity failed; artifact integrity failed; observations contradict; and observations cannot distinguish multiple runtime explanations.

Each record states observation phase, affected subjects/dimensions, retained evidence, failure origin, boundary, recoverability, authenticity/custody state, and claim impact. It may force `OBSERVED`, `DECLARED`, `INFERRED`, or `UNKNOWN` classification; block `VERIFIED`/`CANONICAL`; yield partial sufficiency, insufficiency, contradiction, or unresolved status; and prohibit conclusions exceeding residual support. It never proves the operation failed unless separately supported.

## 12. Multi-observer model

Multiple sources may corroborate the same proposition, complement different dimensions, overlap, conflict, or remain unrelated. Independence is claim- and failure-mode-specific.

- **Common-mode dependency:** observers share a producer, target interface, identity issuer, clock, transport, platform, transformation, operator, storage, or review path capable of the same error.
- **Independent witness:** relevant failure paths are sufficiently separate and the witness has authenticated identity, scope, provenance, and correlation.
- **Derived duplicate:** one observation is copied, transformed, or computed from another and is not independent.
- **Circular corroboration:** sources support one another without an independently grounded observation.
- **Unresolved contradiction:** materially incompatible observations remain after scope, identity, order, fidelity, and dependency assessment.

Artifact count never substitutes for independence analysis. Conflicts are preserved and constrain claims.

## 13. Replay and reproduction

Observation replay re-presents or re-evaluates an existing evidence representation without rerunning the operation. Operation replay executes the governed operation again and creates a new execution identity, sessions, observations, evidence, custody, and claims.

Operation replay cannot prove what occurred in a prior execution. A reproduction may test a hypothesis, mechanism, or expected behavior and support future comparative or general claims when similarity assumptions and differences are explicit. It never rewrites historical observations or conclusions; successor conclusions cite both histories.

## 14. Security and privacy boundaries

Observation follows least-evidence, least-disclosure, purpose limitation, access minimization, bounded retention, and reviewable redaction. Credentials, tokens, connection strings, raw role graphs, sensitive database metadata, protected application data, personal information, proprietary runtime configuration, unrestricted logs, and security-sensitive implementation detail are captured only when separately authorized and necessary for a named claim.

Evidence sufficiency never justifies unrestricted capture. Redaction and restriction create declared derivatives and completeness limitations. REF-4 selects no security, storage, redaction, or access mechanism.

## 15. Platform independence

The architecture supports SQL/database execution, CLI commands, REST/GraphQL operations, background jobs, deployment pipelines, cloud functions, application processes, scheduled operations, migration execution, RPC operations, production releases, hosted platforms, and local runtime environments. Technology profiles may specialize layers and boundary criteria but cannot collapse architecture concepts or weaken REF governance.

## 16. Relationship to REF-1 through REF-3

- **REF-1:** REF-4 applies its governance, seven trust domains, evidence hierarchy, uncertainty, and repository/runtime separation to observation.
- **REF-2:** REF-4 specializes `RuntimeObservation`, `RuntimeObservationSource`, `RuntimeEvidence`, `RuntimeEvidenceClaim`, `RuntimeEvidenceBoundary`, `RuntimeEvidenceRelationship`, and `RuntimeInvestigation`; parent meanings remain controlling.
- **REF-3:** observation identity/provenance, records/artifacts, transfer, review, derivatives, and replay preserve authenticity, integrity, chain of custody, continuity, preservation, and review integrity.

## 17. Sprint 17C applicability analysis

Without changing its conclusion, REF-4 can represent the unresolved ACL evidence boundary as a cross-layer problem: operator/client evidence exists, while the bindings among submitted artifact identity, external platform context, database session, transaction, individual statement completion, immediate catalog/state observation, and returned result remain the material subjects of correlation and completeness review.

The stored capture may support what was displayed at its observation layer while remaining incomplete for server execution history. REF-4 does not determine root cause, design a diagnostic, authorize observation, recommend remediation, or alter any protected Sprint 17C claim.

## 18. Architecture boundary

REF-4 creates no collector, observer, proxy, extension, migration, deployment tooling, script, authorization, diagnostic, telemetry, code, storage, serialization, identifier, vendor selection, or runtime action.
