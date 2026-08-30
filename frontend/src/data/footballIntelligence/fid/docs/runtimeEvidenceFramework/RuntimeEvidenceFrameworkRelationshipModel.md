# Runtime Evidence Framework Relationship Model

Status: `RELATIONSHIP_MODEL_ESTABLISHED`

Version: `REF-2`

## 1. Purpose

This document defines how REF domain concepts relate without prescribing representation, storage, cardinality syntax, APIs, or execution behavior. The domain object meanings remain governed by `RuntimeEvidenceFrameworkDomainModel.md`; REF-1 remains the governance authority.

## 2. Primary evidence reasoning chain

```text
RuntimeInvestigation
  organizes RuntimeInvestigationStage
  examines RuntimeExecution
    identified-by RuntimeExecutionIdentity
    contextualized-by RuntimeSession
    produces RuntimeObservation
      produced-by RuntimeObservationSource
      captured-in RuntimeArtifact
        identified-by RuntimeArtifactIdentity
      contributes-to RuntimeEvidence
        supports-or-contradicts RuntimeEvidenceClaim
          classified-by RuntimeEvidenceClassification
          evaluated-by RuntimeEvidenceReview
            informs RuntimeEvidenceDecision
              contributes-to RuntimeEvidenceConclusion
```

This chain is not a mandatory linear workflow. An investigation can examine multiple executions, observations can precede an investigation, reviews can reject evidence, and conclusions can remain unknown. Every connection is explicit through `RuntimeEvidenceRelationship` or the concept's defined contextual association.

## 3. Relationship semantics

| Relationship | Meaning | Must not imply |
| --- | --- | --- |
| `organizes` / `belongs-to` | Places an object within an investigation, stage, execution, or session context | Ownership of truth or exhaustive containment |
| `identified-by` | Associates an object with an identity assertion | Authentication, uniqueness, execution, or correctness |
| `produced-by` | Names the immediate source of an observation or artifact | Independence, completeness, or ultimate origin |
| `captured-in` | Associates observed content with a preservable artifact | Semantic completeness or artifact authenticity |
| `derived-from` | Declares a transformation or reasoning dependency | Equivalence to the source or direct observation |
| `supports` | Provides relevant evidence for a claim | That the claim is true or canonical |
| `contradicts` | Provides relevant evidence against a claim | Automatic rejection or proof of the opposite |
| `limits` | Constrains scope, classification, or permissible use | Invalidity of all other claims |
| `classified-by` | Associates one claim with one classification in a review context | Artifact-wide or permanent classification |
| `evaluated-by` / `reviews` | Associates review scope and method with its evidence or claims | Creation of runtime facts |
| `informs` / `decides` | Connects review to a governed decision | Runtime or deployment authorization |
| `contributes-to` / `concludes` | Connects decisions and claims to a bounded conclusion | Certainty beyond underlying evidence |
| `correlates-with` | Records an asserted association across objects or domains | Identity, causality, or independence without further support |
| `crosses` | Associates an object or claim with a trust boundary | Successful authentication of the crossing |
| `transforms` | Relates an original to a declared derivative | Lossless or reversible transformation unless established |
| `depends-on` | Records logical, evidentiary, or procedural dependency | Causality or endorsement |
| `supersedes` | Names the successor governing future use | Deletion, falsity, or erasure of predecessor history |

## 4. Investigation relationships

A `RuntimeInvestigation` organizes one or more conceptual stages and may examine zero or more executions while planning. Each `RuntimeInvestigationStage` declares the evidence, claims, reviews, and decisions relevant to its bounded objective. Stage progression requires an explicit decision; mere availability of an observation does not advance the investigation.

An investigation may branch into competing hypotheses. Evidence can support one claim, contradict another, and limit a third. Conclusions cite the specific claims and decisions they synthesize. Reopening or revising an investigation links successor stages, decisions, or conclusions through `supersedes` and preserves all earlier records.

## 5. Execution and observation relationships

A `RuntimeExecutionIdentity` can be declared before an execution, observed during it, or correlated afterward. Those origins remain distinguishable. A `RuntimeExecution` may involve multiple `RuntimeSession` concepts, and a session may expose multiple observations from different sources. A correlation between sessions does not prove they belong to one execution unless the relevant boundary binding is authenticated.

`RuntimeObservationSource` identifies the immediate exposing source. `RuntimeEvidenceProvenance` preserves the broader lineage, including transformations and custody. A `RuntimeObservation` can exist without a durable artifact, although its preservability and later authentication may then be limited. A `RuntimeArtifact` may contain several observations or contextual material, but each claim cites the particular support it uses.

## 6. Evidence and claim relationships

`RuntimeEvidence` is the governed support assembled from observations, artifacts, provenance, sources, boundaries, and trust context. It relates to a claim as supporting, contradicting, or limiting evidence. The relationship states scope and dependency so that evidence is not silently reused outside its authenticated purpose.

Each claim references:

- its direct and indirect observations;
- applicable provenance paths;
- source, subject, operator, artifact, and reviewer trust domains;
- every material repository, runtime, database, operator, platform, or review boundary;
- supporting, contradicting, limiting, dependent, and superseding relationships;
- one claim-specific classification for each review context.

No relationship causes automatic classification promotion. Classification follows REF-1 criteria and review.

## 7. Review, decision, and conclusion relationships

A review evaluates a declared evidence set and named claims using a stated method. The review records dependencies and reviewer trust-boundary information. It can recommend or inform a decision but cannot manufacture a missing observation.

A decision disposes a bounded governance question, such as whether a claim is accepted for a stated use or whether an investigation stage can close. A conclusion synthesizes decisions and classified claims, separating observation, declaration, inference, and unknowns. Neither a decision nor conclusion authorizes runtime action unless a separate authority explicitly does so.

## 8. Boundary-crossing paths

Typical evidence paths cross multiple independently assessed boundaries:

```text
Repository artifact
  --Repository Boundary--> submitted material
  --Operator Boundary--> operator-mediated action
  --Runtime Boundary--> process/session observation
  --Database Boundary--> database state or transaction observation
  --Platform Boundary--> external platform record
  --Review Boundary--> reviewed claim and disposition
```

Not every path uses every boundary and ordering can differ. At each crossing, `RuntimeEvidenceBoundary` identifies the two sides, crossing subject, proposed binding, supporting evidence, assessment state, and unresolved limitations. Later corroboration adds relationships; it does not retroactively conceal that a prior crossing was unknown.

## 9. Extensible execution profiles

SQL, REST, CLI, background-job, deployment, production-release, migration, and platform-diagnostic profiles can specialize:

- execution and session context;
- observation-source kinds;
- artifact kinds;
- relevant trust domains and boundary paths;
- required relationships and authentication criteria;
- investigation-stage entry and exit criteria.

Profiles cannot redefine the core relationships, silently transfer authority, merge observation with interpretation, or turn correlation into identity or causality.

## 10. Relationship-model boundary

This model describes concepts only. It defines no graph technology, identifier syntax, foreign key, object reference, schema, serialization, API, collector, runtime workflow, or executable diagnostic.
