# Runtime Evidence Framework Governed Execution Lifecycle

## 1. Purpose and authority

This REF-5 model defines the implementation-independent lifecycle that joins a governed operation to explicit authority, execution, observation, preservation, review, and conclusion. REF-1 through REF-4 remain controlling. Authorization, execution, observation, result, outcome, evidence assessment, review decision, and conclusion are distinct facts and must never be collapsed.

The model applies to read-only diagnostics, mutations, migrations, API operations, commands, functions, jobs, deployments, scheduled actions, rollback operations, reconciliation, and local or hosted runtime activity. It defines governance, not an executable authorization system.

## 2. Canonical principles

- Authority is explicit, operation-specific, target-specific, environment-specific, constraint-bound, and artifact-specific when an artifact exists.
- Authority grants no adjacent authority and cannot be inferred from access, credentials, client controls, or operator capability.
- Prohibitions are explicit; silence is not permission for a high-risk action.
- Authorization does not prove execution; execution does not prove success; success does not prove complete evidence; evidence does not prove authorization.
- Editing an artifact invalidates artifact-bound authority. Executing a selection is a distinct operation from executing the whole artifact.
- Consumed authority is never silently restored. Retry requires authority expressly covering retries or a new authorization.
- Proper consumption and failed, partial, interrupted, or uncertain execution can coexist.
- Historical records are append-only in meaning. A later success or interpretation cannot erase an earlier attempt, evidence, or conclusion.

## 3. Canonical concepts

In the table, relationships identify the principal links; lifecycle and boundary text also states trust implications. Each concept remains technology-neutral.

| Concept | Purpose and responsibilities | Non-responsibilities | Relationships | Lifecycle role and trust-boundary implications |
| --- | --- | --- | --- | --- |
| Governed Operation Proposal | States the intended action, reason, owner, risk, and desired result. | Does not grant authority or prove feasibility. | Origin of scope and plan. | Begins PROPOSED; assertions cross into review as untrusted claims. |
| Governed Operation Scope | Bounds what is and is not proposed. | Does not approve or execute. | Constrains plan and authorization. | Produces SCOPED; ambiguity blocks advancement. |
| Execution Plan | Orders stages, actors, checks, stops, observations, and preservation. | Is not the executable artifact or authority. | References scope, artifact, target, stage profile. | Reviewed before authorization; assumptions require verification at their owning boundary. |
| Execution Artifact | Immutable representation intended for execution, when one exists. | Does not prove submission or execution. | Has artifact identity; covered by plan and authority. | Verified before activation and submission. |
| Execution Artifact Identity | Distinguishes exact content, version, and intended representation. | Does not authenticate runtime use by itself. | Binds artifact, authority, execution, evidence. | Mismatch stops execution; identity claims must cross boundaries with provenance. |
| Execution Target | Declares the exact governed destination. | Does not prove the runtime reached it. | Bound by scope, preconditions, identity, observations. | Verified before execution and correlated afterward. |
| Execution Environment | Declares the operational context, including branch or deployment context. | Does not imply an adjacent environment. | Qualifies target and authorization. | Environment mismatch invalidates execution authority. |
| Execution Preconditions | Required facts that must hold before governed progress. | Do not guarantee outcome. | Gate activation or execution beginning. | Failed or unresolved required checks block; attestations retain their source class. |
| Execution Authorization | Records an authority's explicit governed permission. | Does not execute, observe, or prove success. | Covers scope, constraints, exclusions, target, artifact, plan. | Moves reviewed work to AUTHORIZED; validity must be checked at use. |
| Authorization Authority | Accountable person or body empowered to grant authority. | Is not necessarily operator, reviewer, or decision authority. | Issues, refuses, revokes authorization. | Its identity and competence are trust claims requiring provenance. |
| Authorization Scope | Enumerates the exact permission dimensions. | Does not include omitted adjacent acts. | Specializes operation scope. | Determines validity at activation and use. |
| Authorization Constraint | States positive limits and required conditions. | Does not silently waive exclusions. | Bounds authorization and attempts. | Violation stops execution and may invalidate authority. |
| Authorization Exclusion | States prohibited, unaddressed, conditional, or separately authorized actions. | Does not become permission through silence. | Complements scope and constraints. | Governs all stages, including retries and successors. |
| Authorization Lifecycle | Tracks proposed, issued, active, consumed, expired, revoked, rejected, or invalid authority. | Does not represent execution outcome. | Contains consumption and successor links. | Evolves independently of operation outcome. |
| Authorization Consumption | Records the governed point after which authority cannot be reused. | Does not prove that any intended effect occurred. | Links authorization to attempt and execution beginning. | Boundary rule is operation-class-specific and conservative under uncertainty. |
| Execution Attempt | Records each initiation effort, including pre-submission failures. | Is not automatically runtime execution. | Uses or seeks authority; may create execution. | Preserves every attempt and its consumption assessment. |
| Runtime Execution | Represents the governed activity that may have run. | Does not itself establish artifact, target, or success. | Specializes REF-2 RuntimeExecution and links events/results. | Exists only to the degree supported; uncertainty is explicit. |
| Execution Identity | Correlates the governed execution across actors and layers. | Is not a chosen identifier technology. | Specializes RuntimeExecutionIdentity. | Complete, partial, ambiguous, broken, or unverifiable across boundaries. |
| Execution Session | Groups temporally and operationally related execution activity. | Does not prove one server or transaction session. | Relates client, platform, runtime, database sessions. | Session equivalence needs evidence at each boundary. |
| Execution Boundary | Marks authority, client, platform, runtime, database, transaction, and observer crossings. | Does not assert continuity across a gap. | Hosts events and correlation claims. | Each crossing can lose identity, ordering, fidelity, or completeness. |
| Execution Stage | Reusable phase in an operation-specific stage profile. | Does not require every operation to use every phase. | Contains events and observations. | Stage completion must be observed or remain uncertain. |
| Execution Event | Records something claimed to occur at a stage. | Does not prove causality or adjacent-layer events alone. | Ordered and correlated with execution and evidence. | Source, time semantics, and trust domain remain visible. |
| Execution Result | Preserves raw and layer-visible outputs and errors. | Is not automatically the operation outcome. | Produced by events; assessed with evidence. | Truncation or transformation must be declared. |
| Execution Outcome | Classifies what the governed operation did. | Does not determine authorization status or evidence sufficiency. | Derived cautiously from results and observations. | May remain uncertain, inconsistent, unobserved, or unattributable. |
| Execution Failure | Represents a failure before or during execution. | Does not prove absence of persistent effects. | A kind of outcome evidence. | Location and persistence implications require boundary evidence. |
| Execution Uncertainty | Preserves unresolved execution facts. | Is not failure and cannot be erased for convenience. | Qualifies consumption, outcome, retry, review. | Blocks unsafe conclusions and successor actions until governed disposition. |
| Execution Interruption | Represents abort, cancellation, timeout, disconnect, or platform interruption. | Does not establish where execution stopped. | Produces events, uncertainty, and termination. | Client loss cannot prove server cessation. |
| Execution Completion | Establishes supported completion of the authorized stage profile. | Does not prove success, commit, or complete evidence. | Precedes termination assessment. | Requires appropriate layer evidence. |
| Execution Termination | Records how execution ended or was last observed. | Does not resolve unknown outcome. | Ends runtime phase and triggers preservation. | Termination may be normal, failed, interrupted, or uncertain. |
| Execution Review | Tests authority, identity, custody, evidence, outcome, and uncertainty. | Does not rewrite historical facts. | Specializes RuntimeEvidenceReview. | Reviewer identity and independence are declared, never assumed. |
| Execution Decision | Records the governed response to review. | Does not itself authorize a successor unless expressly issued. | Specializes RuntimeEvidenceDecision. | May close, defer, reconcile, remediate, or seek authority. |
| Execution Conclusion | States the supportable final interpretation and limits. | Does not exceed evidence or erase prior conclusions. | Specializes RuntimeEvidenceConclusion. | May be superseded with preserved lineage. |
| Execution History | Orders proposals, authorities, attempts, evidence, reviews, and successors. | Does not collapse repeated attempts. | Contains protected records. | Cross-boundary continuity and gaps remain visible. |
| Protected Execution Record | Preserves an immutable historical fact and provenance. | Does not imply authenticity beyond its support. | Covers authority, attempt, artifact, target, result, uncertainty, review. | Protected from overwrite, silent correction, or reuse. |
| Successor Authorization | Grants a distinct, bounded later action with historical references. | Does not reopen or repair consumed authority. | Links to predecessor record and unresolved questions. | Must preserve predecessor identity, outcome, evidence, and restrictions. |

## 4. Lifecycle and terminal branches

The canonical path is:

`PROPOSED -> SCOPED -> REVIEWED -> AUTHORIZED -> ACTIVE_UNCONSUMED -> EXECUTION_BEGINNING -> CONSUMED -> EXECUTING -> OBSERVATION_CAPTURE -> TERMINATED -> EVIDENCE_REVIEW -> CONCLUSION`

The states are not evidence that the next state occurred. Rejection may terminate before authorization. Issued authority may expire or be revoked while unconsumed. Failed preconditions produce BLOCKED without runtime execution and are assessed against the selected consumption rule. After execution begins, termination may record success, runtime failure, partial execution, rollback, commit, timeout, disconnect, uncertain outcome, missing observation, contradictory evidence, operator abort, or platform interruption. All such post-beginning branches preserve consumed status when the governing rule consumes at execution beginning.

## 5. Stage profiles and preconditions

Reusable stages are preparation, precondition verification, artifact verification, target verification, authorization activation, submission, acceptance, execution start, statement or stage progression, observation capture, result production, commit or rollback where applicable, termination, client receipt, evidence preservation, review, decision, and conclusion. A plan selects only applicable stages and states their required ordering and evidence.

Preconditions include repository identity; artifact identity and integrity; target and environment identity; operator readiness; role or permission context; current runtime or database state; migration and dependency state; observation and custody readiness; authorization validity and history; and absence of prohibited concurrency. Each is classified as repository-verifiable, runtime-verifiable, database-verifiable, operator-attested, platform-attested, externally verified, or unresolved. A required failure or unresolved condition blocks execution. Operator attestation is never relabeled as database observation.

## 6. Identity and correlation

Correlation binds authorization, plan, artifact, operator action, client session, platform request, server and database sessions, transaction, statements or stages, observations, results, errors, termination, evidence artifacts, review, and conclusion. No identifier technology is prescribed.

- Complete correlation supports every claim-relevant link with sufficient authentic, ordered evidence.
- Partial correlation supports some links and explicitly bounds the gap.
- Ambiguous correlation permits multiple plausible executions or targets.
- Broken correlation contains a contradicted or discontinuous required link.
- Unverifiable correlation lacks evidence needed to assess a required link.

A result is not attributable to an authorization without sufficient correlation. Shared labels, adjacency, a client success response, or operator recollection alone do not establish cross-layer identity.

## 7. Roles and stop conditions

The authorizing authority grants or refuses bounded authority; the operator follows the plan and stops; an automated executor performs only encoded scope and preserves its inputs and outputs; the client submits and presents client-layer facts; the external platform transports or schedules while declaring its own semantics; runtime and database components own their respective events and state; an observer captures without exceeding its observation authority; the reviewer assesses evidence and declares independence; and the decision authority determines disposition. Automation is not inherently more trustworthy, and operators cannot prove server events solely through action.

Mandatory stops include authorization, artifact, target, environment, role, or transaction-boundary mismatch; failed precondition; unexpected warning, row count, mutation, result, truncation, or missing result; incomplete or contradictory evidence; partial execution; timeout, disconnect, or uncertainty; and any client or platform retry prompt. The observed state is preserved before any successor decision. Stop authority grants no cleanup, retry, repair, remediation, or post-verification authority.

## 8. Relationship to REF-1 through REF-4

REF-5 applies REF-1 governance, trust domains, evidence hierarchy, protected history, uncertainty, and repository/runtime separation. It specializes REF-2 RuntimeExecution, RuntimeExecutionIdentity, RuntimeSession, RuntimeArtifact, RuntimeEvidence, RuntimeEvidenceClaim, RuntimeEvidenceReview, RuntimeEvidenceDecision, RuntimeEvidenceConclusion, and RuntimeInvestigation without redefining them. It requires REF-3 authenticity, integrity, provenance, custody, preservation, supersession, and retirement controls for lifecycle records. It uses REF-4 observation points and layers, correlation, ordering, fidelity, completeness, interference, and sufficiency to support execution claims.

## 9. Model boundary

This document creates no authorization, executable logic, collector, observer, schema, API, persistence mechanism, deployment tool, telemetry, or runtime operation.
