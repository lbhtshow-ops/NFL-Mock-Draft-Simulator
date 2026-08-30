# Runtime Evidence Framework Domain Model

Status: `DOMAIN_MODEL_ESTABLISHED`

Version: `REF-2`

Authority: Runtime Evidence Framework Charter (`REF-1`)

## 1. Purpose and authority

This document defines the canonical conceptual domain model for governed runtime evidence. It extends the REF-1 charter without changing its governance decisions. The model supplies stable meanings, responsibilities, relationships, and lifecycle roles for future runtime-evidence work.

The model is implementation-independent. Object names identify concepts, not records, classes, tables, messages, files, APIs, or serialized structures. Cardinality language expresses governance expectations and does not prescribe a data model.

## 2. Modeling rules

- Every assertion is modeled as a `RuntimeEvidenceClaim` and classified independently.
- Observation is distinct from evidence, and both are distinct from interpretation and conclusion.
- Provenance accompanies evidence and relevant derived objects; it does not make them self-authenticating.
- Boundary crossings are explicit and may remain unauthenticated or unknown.
- Relationships preserve context without silently transferring authority between objects.
- Lifecycle state describes governance disposition, not execution state or storage state.
- Supersession preserves protected history and never rewrites the original concept instance.
- Missing, conflicting, or insufficient support remains explicit.

## 3. Canonical domain objects

### 3.1 RuntimeEvidence

- **Purpose:** Governed support for one or more bounded claims about runtime operations, states, events, or effects.
- **Responsibilities:** Identify supporting observations and artifacts; carry applicable provenance, boundary, source, and trust context; expose limitations and relationships; support claim-specific classification.
- **Non-responsibilities:** It does not guarantee truth, correctness, completeness, authenticity, causality, or operational authority. It is not synonymous with an observation or artifact.
- **Relationships:** Derived from or composed of `RuntimeObservation`; may reference `RuntimeArtifact`, `RuntimeEvidenceProvenance`, `RuntimeEvidenceBoundary`, and `RuntimeTrustDomain`; supports `RuntimeEvidenceClaim`; participates through `RuntimeEvidenceRelationship`.
- **Lifecycle role:** Emerges from captured observations, is authenticated and reviewed as applicable, may be accepted or rejected for particular claims, and can be superseded or archived without deletion of history.

### 3.2 RuntimeExecution

- **Purpose:** The conceptual occurrence or attempted occurrence of a governed runtime operation.
- **Responsibilities:** Bound the operation under examination; associate its identity, sessions, operator/platform context, intended inputs, observed phases, and resulting observations.
- **Non-responsibilities:** It does not prove that intended actions ran, completed, committed, or had the expected effect. It is not an authorization or deployment artifact.
- **Relationships:** Identified by `RuntimeExecutionIdentity`; may contain or use `RuntimeSession`; produces zero or more `RuntimeObservation`; may be investigated by `RuntimeInvestigation`; crosses one or more `RuntimeEvidenceBoundary` instances.
- **Lifecycle role:** Supplies operational context from planned through observed and reviewed evidence states; its real-world execution status remains distinct from REF lifecycle state.

### 3.3 RuntimeExecutionIdentity

- **Purpose:** Distinguish and correlate a particular intended or observed execution from other executions.
- **Responsibilities:** Express available identity components and their issuing trust domains; disclose ambiguity, collision risk, scope, and correlation strength.
- **Non-responsibilities:** It does not prove execution, target, artifact bytes, completion, uniqueness, or authenticity merely because an identifier exists.
- **Relationships:** Identifies `RuntimeExecution`; may correlate `RuntimeSession`, `RuntimeObservation`, `RuntimeArtifact`, and external-platform records; may cross boundaries through explicit bindings.
- **Lifecycle role:** Established or declared during planning/capture, authenticated when possible, and preserved through review, supersession, and archival.

### 3.4 RuntimeSession

- **Purpose:** Bound a runtime interaction context such as a process, connection, transaction, job attempt, or platform activity window.
- **Responsibilities:** Associate observations with available session identity, target, principal, temporal scope, and parent execution.
- **Non-responsibilities:** It does not prove that all activity was captured, that the target was correct, or that a transaction committed. It does not prescribe a session technology.
- **Relationships:** Belongs to or is correlated with `RuntimeExecution`; produces `RuntimeObservation`; crosses runtime, database, operator, or platform boundaries; may be represented by `RuntimeArtifact` evidence.
- **Lifecycle role:** Provides contextual continuity between planned, observed, and authenticated evidence; closed sessions remain referentially available in protected history.

### 3.5 RuntimeObservation

- **Purpose:** Record information directly exposed by a source within a bounded time and scope.
- **Responsibilities:** Preserve observed content, observation time or order, method, source, scope, and known limitations without silent interpretation.
- **Non-responsibilities:** It does not independently prove authenticity, completeness, causality, correctness, or a conclusion. It is not an inference.
- **Relationships:** Produced by `RuntimeObservationSource` within an execution/session context; may be captured in `RuntimeArtifact`; contributes to `RuntimeEvidence`; is cited by claims through explicit relationships.
- **Lifecycle role:** Enters the model at `Observed`; may later be authenticated, reviewed, rejected for a use, superseded by a correction, or archived while the original remains preserved.

### 3.6 RuntimeObservationSource

- **Purpose:** Identify the immediate origin that exposed an observation.
- **Responsibilities:** Declare source identity, type, authority, proximity to the fact, trust domain, scope, and known dependencies.
- **Non-responsibilities:** It does not confer trust merely by being named and does not represent the full chain of provenance.
- **Relationships:** Produces `RuntimeObservation`; belongs to or acts across `RuntimeTrustDomain`; is described within `RuntimeEvidenceProvenance`; may sit on either side of a `RuntimeEvidenceBoundary`.
- **Lifecycle role:** Identified at observation/capture and assessed during authentication and review; changes in source understanding create additive review or supersession history.

### 3.7 RuntimeArtifact

- **Purpose:** A preservable carrier of runtime observations or their authentication context.
- **Responsibilities:** Retain content and declared transformations; reference artifact identity, provenance, integrity context, boundaries, custody, and related observations.
- **Non-responsibilities:** It does not automatically equal evidence, prove its contents are true, or prove origin, execution, target, or completeness.
- **Relationships:** Identified by `RuntimeArtifactIdentity`; contains or represents `RuntimeObservation`; may support `RuntimeEvidenceClaim` through `RuntimeEvidence`; participates in provenance and custody relationships.
- **Lifecycle role:** Captured and preserved, authenticated and reviewed as applicable, then retained, superseded, or archived under separate policy.

### 3.8 RuntimeArtifactIdentity

- **Purpose:** Distinguish a runtime artifact and support integrity and correlation across custody or transformation events.
- **Responsibilities:** Describe available identity assertions, issuers, scope, version/variant relationships, and integrity references.
- **Non-responsibilities:** It does not by itself prove provenance, semantic equivalence, execution, or that two matching identifiers arose independently.
- **Relationships:** Identifies `RuntimeArtifact`; may bind it to `RuntimeExecutionIdentity`, observations, transformations, and predecessor/successor artifacts through `RuntimeEvidenceRelationship`.
- **Lifecycle role:** Declared at capture, authenticated during preservation/review, and retained across correction, supersession, and archival.

### 3.9 RuntimeEvidenceClaim

- **Purpose:** State one precise proposition whose evidentiary support and trust can be evaluated independently.
- **Responsibilities:** Define scope; reference supporting, contradicting, and limiting observations/evidence; identify relevant provenance, trust domains, and boundary crossings; carry one classification and its rationale.
- **Non-responsibilities:** It does not inherit a blanket classification from an artifact, investigation, reviewer, or neighboring claim. It does not erase uncertainty or authorize action.
- **Relationships:** Supported or contradicted by `RuntimeEvidence` and `RuntimeObservation`; classified by `RuntimeEvidenceClassification`; evaluated in `RuntimeEvidenceReview`; contributes to decisions and conclusions.
- **Lifecycle role:** Proposed during planning or investigation, evaluated after observation, may be authenticated/reviewed, accepted or rejected, then superseded or archived.

### 3.10 RuntimeEvidenceClassification

- **Purpose:** Express the REF-1 governance class for one claim: `CANONICAL`, `VERIFIED`, `OBSERVED`, `DECLARED`, `INFERRED`, or `UNKNOWN`.
- **Responsibilities:** Identify the classified claim, applicable criteria, rationale, reviewing authority, limitations, conflicts, and time/scope of classification.
- **Non-responsibilities:** It does not measure probability, importance, correctness, or artifact-wide trust and does not promote itself through repetition.
- **Relationships:** Classifies exactly one claim in a stated review context; depends on evidence, provenance, trust-domain, and boundary assessments; may be superseded by a later classification without overwriting it.
- **Lifecycle role:** Assigned and reviewed after relevant support is assembled; accepted, rejected, superseded, or archived with protected history.

### 3.11 RuntimeEvidenceProvenance

- **Purpose:** Describe the known origin, production, handling, transformation, and custody history relevant to evidence.
- **Responsibilities:** Preserve producer/source, method, target, time/order, transformations, custody, and uncertainty to the degree available.
- **Non-responsibilities:** It does not guarantee authenticity, integrity, completeness, or correctness and must not fabricate unavailable lineage.
- **Relationships:** Describes observations, artifacts, evidence, reviews, and derived conclusions where relevant; connects sources, trust domains, boundary crossings, and relationships.
- **Lifecycle role:** Begins at capture, accumulates additively through authentication, transfer, transformation, review, and archival, and preserves corrections.

### 3.12 RuntimeEvidenceBoundary

- **Purpose:** Represent a trust transition where a claim crosses systems, identities, authorities, targets, sessions, or custody.
- **Responsibilities:** Name both sides, crossing subject, intended binding, authentication state, evidence supporting the binding, and unresolved limitations.
- **Non-responsibilities:** It does not assert that the crossing is valid or select a technical authentication mechanism.
- **Relationships:** Connects `RuntimeTrustDomain` instances and contextual objects; is traversed by observations, artifacts, evidence, claims, or review inputs; informs classification.
- **Lifecycle role:** Identified during planning or investigation, assessed during authentication/review, and retained as accepted, rejected, unresolved, superseded, or archived history.

### 3.13 RuntimeEvidenceReview

- **Purpose:** Apply declared governance criteria to a bounded evidence set and its claims.
- **Responsibilities:** Identify reviewer authority and independence; state scope and method; assess provenance, boundaries, conflicts, limitations, and classifications; preserve dissent and review dependencies.
- **Non-responsibilities:** It does not create new runtime facts, operational authority, or independence that the evidence paths lack.
- **Relationships:** Evaluates claims, classifications, evidence, provenance, and boundaries; produces or informs `RuntimeEvidenceDecision`; occurs within the Review trust domain.
- **Lifecycle role:** Planned, performed, accepted or rejected as a review record, and later superseded or archived without deleting prior decisions.

### 3.14 RuntimeEvidenceDecision

- **Purpose:** Record a governed disposition about a claim, evidence use, investigation stage, or conclusion readiness.
- **Responsibilities:** State the question, chosen disposition, deciding authority, supporting reviews, conditions, limitations, and unresolved blockers.
- **Non-responsibilities:** It does not authorize runtime operations unless a separate governance authority explicitly does so. It does not turn a decision into an observation.
- **Relationships:** Informed by `RuntimeEvidenceReview`; addresses claims or investigation progression; contributes to `RuntimeEvidenceConclusion`; may relate to other decisions through explicit dependency or supersession.
- **Lifecycle role:** Proposed, reviewed, accepted or rejected, then superseded or archived while its historical effect remains visible.

### 3.15 RuntimeEvidenceConclusion

- **Purpose:** State the bounded outcome of an investigation or evidence review, including unresolved uncertainty.
- **Responsibilities:** Separate observed facts, declarations, inferences, and unknowns; cite decisions and claims; state scope, limitations, alternatives, and stopping conditions.
- **Non-responsibilities:** It does not exceed underlying classifications, guarantee root cause or correctness, or authorize collection/remediation/execution.
- **Relationships:** Synthesizes `RuntimeEvidenceDecision` and independently classified claims within a `RuntimeInvestigation`; may be superseded by later evidence.
- **Lifecycle role:** Drafted, reviewed, accepted or rejected, and eventually superseded or archived with protected investigation history.

### 3.16 RuntimeInvestigation

- **Purpose:** Govern a bounded inquiry into runtime operations, state, events, effects, or evidence conflicts.
- **Responsibilities:** Define questions, scope, stages, hypotheses, evidence inventory, dependencies, stopping conditions, decisions, conclusions, and history.
- **Non-responsibilities:** It does not itself execute operations, collect evidence, authorize access, or guarantee resolution.
- **Relationships:** Organizes executions, sessions, observations, evidence, claims, reviews, decisions, conclusions, stages, boundaries, and relationships.
- **Lifecycle role:** Planned, progresses through governed stages, and reaches an accepted, rejected, superseded, or archived disposition; reopening creates explicit continuity.

### 3.17 RuntimeInvestigationStage

- **Purpose:** Represent a bounded phase of investigation work and its entry/exit governance criteria.
- **Responsibilities:** State objective, inputs, permitted reasoning, required reviews, outputs, blockers, and stage disposition.
- **Non-responsibilities:** It does not imply chronological completeness, execution authorization, or automatic advancement.
- **Relationships:** Belongs to `RuntimeInvestigation`; organizes relevant claims, evidence, reviews, decisions, and conclusions; may depend on or supersede another stage.
- **Lifecycle role:** Planned, active in an observational/governance sense, reviewed, accepted or rejected, and superseded or archived.

### 3.18 RuntimeTrustDomain

- **Purpose:** Identify a scope of authority and limitation in the REF trust model.
- **Responsibilities:** Name what the domain can and cannot prove, relevant identities/authorities, and interfaces with other domains.
- **Non-responsibilities:** It does not confer universal trust or erase a crossing requirement. It is not a deployment environment classification.
- **Relationships:** Includes the REF-1 Repository, Runtime, Database, External Platform, Operator, Runtime Artifact, and Review Process domains; connected through `RuntimeEvidenceBoundary`; referenced by sources, provenance, claims, reviews, and classifications.
- **Lifecycle role:** Supplies stable governance context throughout all evidence lifecycle states; amendments are versioned governance changes, not object-state transitions.

### 3.19 RuntimeEvidenceRelationship

- **Purpose:** Express a typed, directed, provenance-aware association between two domain-object instances.
- **Responsibilities:** Identify source and target concepts, relationship meaning, asserting authority, evidence basis, scope, direction, time, confidence limitations, and supersession where applicable.
- **Non-responsibilities:** It does not imply causality, equivalence, containment, independence, or trust unless its type and support explicitly establish that meaning.
- **Relationships:** May connect any appropriate domain objects using governed semantics such as supports, contradicts, derived-from, captured-in, produced-by, belongs-to, correlates-with, crosses, reviews, decides, concludes, depends-on, transforms, or supersedes.
- **Lifecycle role:** Declared, authenticated/reviewed as applicable, accepted or rejected for a use, and superseded or archived with history.

## 4. Claim model

Each `RuntimeEvidenceClaim` is the smallest independently classifiable proposition. A claim must conceptually identify:

- the proposition, subject, scope, time, and relevant target;
- supporting and contradicting observations or evidence;
- the provenance applicable to each supporting path;
- the trust domains in which the source, subject, reviewer, and asserted authority operate;
- each material boundary crossing and the state of its binding;
- exactly one REF evidence classification in a given review context;
- classification rationale, assumptions, conflicts, limitations, and unknowns;
- reviews, decisions, conclusions, and successor claims that depend on it.

Claims sharing one artifact remain separately classifiable. For example, an artifact may support an `OBSERVED` claim that certain text was captured while leaving the claimed target identity `UNKNOWN` and an operator's explanation `DECLARED`. A later authenticated binding may support a new `VERIFIED` classification record without rewriting the prior classifications.

## 5. Boundary model

| Boundary | Conceptual crossing | Required governance question |
| --- | --- | --- |
| Repository Boundary | Governed repository intent or artifact identity to submitted or runtime-used material | What binds the repository revision and bytes to the material presented to the runtime? |
| Runtime Boundary | Runtime principal, process, session, or host to its target and observations | What binds the observed process/session and operation to the intended runtime context? |
| Database Boundary | Client/runtime session to database instance, role, transaction, and state observation | What binds the caller, target database, transaction scope, and returned state? |
| Operator Boundary | Human identity, authority, intent, and action to runtime or repository events | What proves who acted, under what authority, and which machine-observed event corresponds? |
| Platform Boundary | External platform account/project/event to local execution, target, or artifact | What binds platform identity and event semantics to the locally governed operation? |
| Review Boundary | Evidence set and criteria to reviewer identity, independence, method, and disposition | What binds the review decision to the exact evidence set and declared method? |

Evidence may cross several boundaries in sequence. Each crossing is represented independently; authentication of one crossing does not authenticate another. Unresolved crossings remain visible and constrain the affected claim's classification.

## 6. Conceptual lifecycle model

The following governance states are available to relevant evidence-domain objects. They do not prescribe storage fields or require every object to traverse every state.

| State | Meaning |
| --- | --- |
| `Planned` | The governed question, intended object, or required evidence has been identified, but no observation is implied. |
| `Observed` | Source-scoped content has been directly observed or captured; authentication may remain incomplete. |
| `Authenticated` | Relevant identity, integrity, scope, provenance, and boundary bindings have been assessed under an approved method. |
| `Reviewed` | An identified review process has applied declared criteria and recorded its assessment. |
| `Accepted` | The object or disposition is approved for a stated, bounded governance use. |
| `Rejected` | The object or disposition is not approved for the stated use; it remains protected history. |
| `Superseded` | A linked successor governs future use while the prior object and its historical status remain preserved. |
| `Archived` | The object is no longer active for ordinary workflow but remains governed under retention and access policy. |

States are contextual. Evidence may be accepted for proving capture while rejected for proving target identity. Authentication and review can fail or remain incomplete without destroying the underlying observation. No lifecycle transition grants operational authority.

## 7. Extensibility

The model accommodates future SQL execution, REST APIs, CLI execution, background jobs, runtime deployments, production releases, migration execution, and platform diagnostics by treating each as a kind of `RuntimeExecution` with technology-specific sessions, sources, artifacts, observations, and boundary crossings.

Future domain profiles may narrow required concepts, relationships, authentication criteria, and lifecycle gates. They may not redefine the canonical objects, collapse observation into conclusion, classify artifacts wholesale, erase boundary uncertainty, or weaken REF-1 governance. Adding a new execution kind or trust-domain specialization does not require redesign of the conceptual model.

## 8. Model boundary

REF-2 selects no persistence schema, serialization, API, SQL, JSON, TypeScript, JavaScript, runtime framework, vendor, collector, diagnostic executor, deployment artifact, authorization mechanism, or code generator. It creates no executable implementation.
