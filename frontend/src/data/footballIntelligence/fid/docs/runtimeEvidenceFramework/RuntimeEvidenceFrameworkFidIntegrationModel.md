# Runtime Evidence Framework FID Integration Model

## 1. Placement and ownership

Football Intelligence Data governance owns the Runtime Evidence Framework governance model. Its canonical placement remains the existing `fid/docs/runtimeEvidenceFramework` documentation boundary. REF is cross-cutting evidence governance consumed by persistence, deployment, migration, authorization, investigation, review, and operational domains. It does not own their business operations, and the repository audit does not justify a new package, service, schema, or runtime component.

REF governs runtime-evidence requirements, observation semantics, authentication, integrity, provenance, custody, correlation, sufficiency, uncertainty, review inputs, and protected evidence history. The operation-owning domain supplies the governed context and retains authority over purpose, intended state, execution, safety, and operational decisions.

## 2. Integration principles

- REF governs runtime evidence; it does not own the business operation or silently become its executor.
- Existing authorization, persistence, deployment, migration, provenance, and review governance remain authoritative.
- Evidence may inform a decision but never automatically becomes the decision.
- REF does not replace logging, monitoring, tracing, auditing, telemetry, or general observability.
- Integration reuses canonical identities and lifecycles by reference and prohibits parallel identifiers, authorization models, provenance vocabularies, and histories.
- Evidence requirements are operation-specific and claim-specific.
- Implementation begins with the smallest reusable capability justified by a demonstrated gap.
- Sprint 17C is the first target use case, not the framework definition; future capability remains platform-independent.

## 3. Canonical domain integration map

Dependency direction is operation domain -> governed context -> REF evidence assessment -> established review/decision governance. REF never becomes upstream authority for the operation.

| Domain | Authority and retained ownership | Input to REF | Output from REF | Prohibited transfer, history, and boundary |
| --- | --- | --- | --- | --- |
| Football Intelligence Platform Governance | Platform-wide policy and delegation | Applicable policy and decision authority | Governed evidence assessment | REF cannot become platform executive authority; preserve decisions and lineage across organizational boundaries. |
| FID Governance | Owns REF governance, FID policy, canonical placement | FID operation context and authoritative contracts | Cross-cutting evidence governance | No competing FID model; protect REF versions and conclusions at repository/runtime boundary. |
| Persistence Governance | Intended database state, invariants, persistence policy and safety | Artifact, expected state, transaction and mutation rules | Evidence of observed execution and persistence claims | REF cannot define database semantics; preserve attempts and state evidence across runtime/database boundaries. |
| Deployment Governance | Deployment plan, target, environment, stops, expected result | Governed manifest context | Correlation, completeness, fidelity, uncertainty | REF cannot deploy or declare success alone; preserve deployment and evidence records separately. |
| Migration Governance | Schema intent, compatibility, ordering, migration state | Migration identity, prerequisites, allowed changes | Claim-specific execution evidence | REF cannot author, order, or mark a migration applied; repository and database states remain distinct. |
| Authorization Governance | Authority, scope, constraints, exclusions, lifecycle, successors | Authorization reference and declared state | Evidence relevant to activation and consumption | REF cannot invent, reopen, reuse, revoke, or extend authority; immutable authorization history. |
| Investigation Governance | Question, classification, root-cause decision, status | Claims, evidence inventory, known gaps | Authenticated evidence, sufficiency and contradiction assessments | REF cannot exceed or automatically decide the investigation; preserve questions, evidence, and revisions. |
| Review Governance | Reviewer roles, competence, independence, decisions | Evidence package and claim set | Evidence-focused review findings | REF cannot presume independence or overwrite source evidence; additive review history. |
| Provenance Governance | Canonical provenance meaning and source lineage | Existing source, derivation, and custody references | REF-specific provenance application | No second vocabulary; transformations and handoffs remain traceable across trust domains. |
| Runtime Evidence Framework | Evidence architecture and assessment | Governed context from owning domains | Protected correlated evidence and bounded claims | Does not own execution, business intent, authorization, or final operational decision. |
| Application or Operational Domains | Business semantics and runtime behavior | Operation proposal, expected behavior, application context | Evidence relevant to stated operational claims | REF cannot redefine behavior or business outcome; application/runtime boundary remains explicit. |
| External Platform Boundary | Platform transport, scheduling, client behavior | Platform attestations and observable events | Boundary-qualified evidence and gaps | Platform signals cannot prove database facts; preserve limitations and external custody. |
| Operator Boundary | Operator action and attestations | Identity declaration, initiation, confirmations | Operator-layer evidence and uncertainty | Operator cannot prove server events or create authority through access. |
| Repository Boundary | Canonical artifacts, versions, declared plans | Artifact and governance identities | Repository-to-runtime correlation assessment | Stored content does not prove submitted or executed content. |
| Runtime Boundary | Runtime receipt, stages, errors, termination | Submission and execution context | Runtime-layer observations | Runtime claims cannot silently prove database persistence. |
| Database Boundary | Sessions, transactions, statements, catalog/state | Target/session/transaction observations | Database-layer evidence | Database evidence does not prove client intent or authorization without correlation. |

The ownership chain is acyclic: platform governance delegates to FID and operation governance; operation governance supplies context; REF produces evidence assessments; established review and decision authorities consume them.

## 4. Persistence, deployment, migration, and authorization

For persistence deployment, function deployment, ACL changes, schema or data migration, RPC deployment, transaction-local diagnostics, reconciliation, rollback-required, commit-authorized, and uncertain operations, persistence governance retains intended state, invariants, policy, ordering, compatibility, and database-specific safety. REF governs only the evidence chain demonstrating what was observed.

Deployment or migration governance supplies artifact, target, environment, preconditions, allowed and prohibited mutations, transaction requirements, expected results, stops, and successor restrictions. REF returns authenticated execution evidence plus completeness, fidelity, correlation, uncertainty, contradiction, and claim-specific sufficiency assessments. A result cannot by itself establish an applied migration; authorization cannot by itself establish verified execution evidence.

Authorization stays separately governed. REF references authorization identity and scope, records evidence relevant to activation and consumption, and preserves execution uncertainty without changing authorization history. Consumed authority remains consumed; successors are new governed decisions; operator and platform retry controls create no authority. Existing FID declarations demonstrate adequate conceptual inputs for V1, but a future design audit may identify a narrow additive evidence-reference extension. REF-6 creates none.

## 5. Investigation integration

The canonical investigation lifecycle is:

1. Investigation initiated.
2. Question or claim defined.
3. Existing evidence inventoried.
4. Repository evidence boundary assessed.
5. Runtime evidence requirement established.
6. Governed operation proposed by the owning domain.
7. Authorization reviewed by established governance.
8. Execution observed without merging executor and observer roles.
9. Evidence authenticated and preserved.
10. Claim-specific sufficiency assessed.
11. Contradictions reviewed.
12. Root-cause decision made by the investigation authority.
13. Conclusion recorded with limitations.
14. Successor action considered separately.
15. Investigation closed, paused, or reopened with additive history.

Classification distinguishes evidence gap, implementation defect, runtime anomaly, platform anomaly, operator uncertainty, target uncertainty, unresolved contradiction, insufficient correlation, insufficient fidelity, and insufficient completeness. No conclusion exceeds its supporting evidence classification.

## 6. Provenance and review integration

REF specializes the existing FID and REF provenance concepts rather than creating another vocabulary. Repository source, identity, derivation, transformation, custodian, transfer, and review lineage remain authoritative. Implementation, authorization, runtime-evidence, database/persistence, investigation-decision, and independent reviewers have distinct scopes. Independence is declared and assessed. Reviews and later conclusions are appended to protected history and never overwrite evidence.

## 7. Contract and artifact disposition

| Candidate | Classification | Rationale |
| --- | --- | --- |
| Existing FID execution, deployment, migration, and authorization declarations | Reuse existing canonical artifact | They own operation semantics and authority. |
| Existing REF evidence, identity, provenance, custody, review, and lifecycle models | Extend existing canonical artifact conceptually | V1 may need additive specializations without changing parent meaning. |
| Governed operation manifest and correlated execution evidence artifact | Create new REF-specific artifact in a future design | No existing artifact spans the demonstrated cross-boundary gap. |
| Adapter around an existing execution mechanism | Defer pending implementation audit | Repository evidence does not yet select a mechanism or technology. |
| Append-only protected evidence record | Create new REF-specific artifact in a future design, reusing protected-history governance | Needed conceptually; storage is undecided. |
| Separate REF code module or placement inside an existing module | Defer pending implementation audit | Documentation placement is established; implementation placement is not. |
| Duplicate execution identity, authorization lifecycle, provenance vocabulary, or protected history | Prohibited duplicate | Would create competing authority and ambiguity. |

REF remains documentation-governed until a dedicated implementation-design audit selects additive contracts and placement.

## 8. Boundary

This integration model creates no contracts, adapters, services, execution, observation, persistence, authorization, or implementation.
