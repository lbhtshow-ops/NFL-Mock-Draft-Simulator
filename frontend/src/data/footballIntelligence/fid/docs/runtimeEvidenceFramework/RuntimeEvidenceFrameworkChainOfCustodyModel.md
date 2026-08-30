# Runtime Evidence Framework Chain of Custody Model

Status: `CHAIN_OF_CUSTODY_MODEL_ESTABLISHED`

Version: `REF-3`

## 1. Purpose

This model defines conceptual ownership, control, transfer, and continuity of runtime evidence from creation through archival. “Ownership” means accountable custody for evidence handling; it does not transfer authorship, truth authority, legal ownership, or operational authorization.

## 2. Custody principles

- Custody begins when evidence is originally produced or first brought under governed control.
- Custody history is ordered, additive, attributable, and inseparable from the evidence identity it describes.
- Possession, control, authority, and authorship are distinct and may belong to different actors or systems.
- Transfers cross explicit trust boundaries and require predecessor-to-successor continuity.
- A copy or transformation creates a related custody branch; it does not move or redefine the original unless explicitly governed.
- Gaps, overlaps, disputes, and unknown custodians remain visible.
- Acceptance changes permitted use, not the historical custody record.
- Archival preserves continuity and does not imply deletion or authenticity.

## 3. Conceptual custody lifecycle

| Stage | Custody meaning | Required conceptual account | Does not prove |
| --- | --- | --- | --- |
| Creation | Evidence is originally produced or first fixed as an observable object | Producer/source, production context, initial identity, scope, time/order, and limitations | Truth, correctness, completeness, or authorized execution |
| Observation | A source-scoped fact is perceived or exposed and associated with evidence | Observer/source, method, execution/session/target context, and observation boundary | Complete capture or authentic origin |
| Authentication | Identity, origin, integrity, bindings, and prior custody are assessed | Method, assessing authority, exact evidence state, results, failures, and unknowns | Correctness or universal trustworthiness |
| Transfer | Control or possession passes between actors, systems, domains, or locations | Sender, recipient, authority, predecessor state, successor state, boundary, order, and exceptions | Continuous integrity unless assessed |
| Review | A bounded evidence set enters an identified review process | Evidence-set identity, reviewer, criteria, method, access/change history, and disposition | New runtime facts or repaired custody |
| Acceptance | Evidence is approved for a stated claim or use | Accepting authority, scope, classification, conditions, dependencies, and unresolved limitations | Acceptance for other uses or operational authority |
| Archival | Evidence leaves ordinary active use while preservation continues | Archival authority, identity, continuity from active custody, restrictions, dependencies, and retrieval context | Validity, invalidity, disposal, or permanent retention |

Stages may repeat or branch. For example, a transfer may be followed by re-authentication, a review may generate an annotated derivative, and archival retrieval creates a new custody event. The model does not require a single linear holder.

## 4. Custody event model

A custody event conceptually states:

- which `RuntimeEvidence`, `RuntimeObservation`, or `RuntimeArtifact` identity is affected;
- the event stage and bounded action;
- the actor or system assuming, retaining, or relinquishing control;
- the actor's asserted authority and trust domain;
- predecessor and successor custody context;
- time or defensible order and relevant execution/session context;
- boundary crossings and binding evidence;
- the evidence state before and after the event;
- declared copies, transformations, redactions, annotations, or composites;
- integrity/authenticity assessment and method scope;
- exceptions, disputes, gaps, restrictions, and reviewer notes.

These are conceptual requirements, not fields or a serialization contract.

## 5. Custodian responsibilities

A custodian preserves evidence identity and protected state, prevents or declares mutation, records transfers and access relevant to continuity, maintains contextual associations, applies applicable confidentiality and access restrictions, and exposes uncertainty or incidents promptly.

A custodian does not decide truth by possession, rewrite provenance, classify all claims in an artifact, conceal a gap, infer missing predecessor state, or grant execution and disposal authority.

## 6. Transfer and boundary rules

Every material transfer identifies the relinquishing and receiving custody contexts and the evidence state on both sides. Repository, Runtime, Database, Operator, Platform, Runtime Artifact, and Review boundaries are assessed independently where applicable.

A transfer is continuous only to the extent the predecessor identity can be bound to the successor identity and unauthorized substitution, mutation, or context loss is sufficiently addressed for the claim. Acknowledgment of receipt proves receipt only within its authenticated scope. Automated transfer is still a custody transfer even without a human custodian.

## 7. Copies, branches, and transformations

Exact-copy, excerpt, redaction, normalization, conversion, annotation, and composite branches each receive a conceptually distinct identity and custody path. Their relationship to the source states method class, scope, loss, reversibility, authority, and authentication status.

The original custody line remains preserved. A derivative's strong custody does not retroactively repair weak custody of its source. Conversely, a derivative incident need not invalidate a separately preserved original.

## 8. Custody gaps and exceptions

A custody gap exists when accountable control, evidence state, transfer, ordering, or predecessor/successor binding is unknown for a material interval. An exception exists when governed handling deviates from the required custody path.

Gaps and exceptions trigger preservation of the affected evidence, incident description, affected interval and claims, plausible alternatives, containment actions if separately authorized, review disposition, and required future evidence category. They are never silently closed. Later evidence may support a successor assessment but does not erase the historical gap.

## 9. Review and acceptance custody

Review begins with a fixed or otherwise governed evidence-set identity. Review access, exclusions, additions, derivatives, criteria changes, and decisions remain linked to that set. If the set changes materially, the relationship to the prior set is declared and the review scope is reassessed.

Acceptance is claim- and purpose-specific. It records the accepting authority, exact evidence and review state, classification, limitations, and dependencies. Rejection preserves the same custody protections. Neither acceptance nor rejection ends custody.

## 10. Archival, retrieval, supersession, and retirement

Archival transfers evidence into a governed preservation context and records continuity from active custody. Retrieval creates a custody event and must bind the retrieved object to the archived identity.

Superseded evidence remains in custody with its successor relationship and historical authority. Retirement changes active-use disposition under separate policy but does not permit silent destruction. Destruction or disposal, if ever authorized elsewhere, requires a distinct governed disposition and preservation of the permissible history of what was affected, why, and by whom.

## 11. Continuity assessment

Continuity review evaluates, for each material custody interval:

1. evidence identity on entry and exit;
2. accountable control and authority;
3. protected state and declared transformations;
4. integrity and authenticity evidence;
5. boundary crossings and bindings;
6. gaps, overlaps, incidents, and dependencies;
7. effect on each claim and classification.

The result is bounded: continuous, partially continuous, broken, or unknown for a stated identity, interval, and claim. Independent corroboration can support the underlying claim but is recorded as a separate path.

## 12. Technology extensibility

Future SQL, API, deployment-pipeline, CLI, cloud-platform, background-worker, production-release, and other runtime profiles may name their custodians, transfer events, automated agents, boundary bindings, and archival requirements. They may not remove accountability, merge derivatives into originals, infer continuity from platform convenience, or conceal gaps.

## 13. Model boundary

This model selects no custody ledger, manifest, database, storage service, identifier, hash, signature, timestamp authority, access-control mechanism, archival medium, retention period, or transfer protocol. It creates no executable custody workflow.
