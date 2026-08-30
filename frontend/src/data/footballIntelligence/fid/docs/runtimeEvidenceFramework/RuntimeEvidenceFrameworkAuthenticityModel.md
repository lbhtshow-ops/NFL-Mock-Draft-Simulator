# Runtime Evidence Framework Authenticity Model

Status: `AUTHENTICITY_MODEL_ESTABLISHED`

Version: `REF-3`

Authority: Runtime Evidence Framework Charter (`REF-1`) and Domain Model (`REF-2`)

## Purpose and scope

This model governs how runtime evidence earns and retains authenticity from original production through final review. It specializes REF-1 authentication and preservation principles using REF-2 concepts without changing their definitions.

Authenticity answers: **Can we prove this evidence is the same evidence that was originally produced?** The answer is claim- and scope-specific. It may be established, partially established, unestablished, or no longer establishable. No label, location, trusted actor, or technical identifier makes evidence authentic by itself.

## 1. Authenticity Principles

1. Authenticity binds present evidence to its identified original production event or state.
2. Authenticity is a supported claim, not an intrinsic property presumed from possession.
3. The original producer, production context, evidence identity, custody path, and material transformations must be known to the degree required by the claim.
4. Every material gap, ambiguity, dependency, or unverifiable crossing constrains the authenticity claim.
5. Authenticity of a carrier does not automatically authenticate every interpretation of its contents.
6. Authentication is repeatable in method and reviewable in reasoning; reproducibility does not guarantee the result is correct.
7. Evidence never gains authenticity through repetition, familiarity, filename, storage location, reviewer seniority, or operational success.
8. Failed authentication preserves the evidence and failure record; it does not license reconstruction of missing facts.

### Distinct meanings

| Concept | Governing question | What it does not establish |
| --- | --- | --- |
| Authenticity | Is this the same evidence originally produced, with a supportable origin binding? | That the content is true, correct, complete, or useful |
| Integrity | Has the protected evidence remained unchanged except for declared transformations? | Original identity, truth, correctness, or completeness |
| Provenance | Where did the evidence come from and how did it reach its present state? | That each provenance statement is authentic or complete |
| Correctness | Does the evidence or interpretation conform to the applicable rule or expected result? | Authenticity or truth about the underlying world |
| Truth | Does a proposition correspond to the relevant reality? | That the evidence proving it is authentic, complete, or correctly interpreted |
| Completeness | Does the evidence cover the defined required scope? | Authenticity, correctness, or absence of unobserved events outside that scope |
| Trustworthiness | Is reliance justified for a stated purpose after assessing authenticity, integrity, provenance, scope, sources, boundaries, review, and limitations? | Universal reliability or certainty |

These properties may diverge. Authentic evidence may faithfully preserve an incorrect declaration. Unauthentic evidence may accidentally contain a true statement. Complete capture of the wrong target is not trustworthy for the intended target.

## 2. Integrity Principles

Integrity answers: **Has the evidence remained unchanged?** Integrity compares a protected state with a later state across a defined interval and custody path.

- The protected baseline, comparison scope, allowed transformations, and assessment method must be explicit.
- Integrity applies to content and any authenticity-critical context whose alteration could change meaning, including ordering, association, scope, or identity assertions.
- A declared transformation creates a derivative with its own identity and relationship to the preserved source; it does not silently replace the source.
- Integrity evidence must itself have governed identity, provenance, and custody.
- A successful integrity assessment proves only consistency within its method and scope.
- Missing baseline, uncontrolled transformation, or custody gap makes integrity unresolved for the affected interval.
- Immutability claims require evidence; policy statements or read-only intent alone do not prove immutability.

## 3. Provenance Principles

Provenance answers: **Where did the evidence come from?** It describes known origin, producer, method, target, time or order, transformations, custody, and relationships.

- Provenance is factual only where supported; declared and inferred lineage remain labeled.
- Immediate source and ultimate origin are distinct.
- Producer identity and producer authority are distinct.
- Production context includes the bounded execution, session, observation source, trust domains, and boundary crossings relevant to interpretation.
- Provenance accumulates additively. Transfers, reviews, transformations, corrections, and archival events extend history rather than replacing it.
- Missing provenance is recorded as unknown, not reconstructed from conventions.
- Provenance may be authentic, partially authenticated, contradicted, or unverifiable independently of the evidence content.

## 4. Chain of Custody

Chain of custody is the ordered, protected account of who or what possessed, controlled, transferred, transformed, reviewed, accepted, or archived evidence from creation onward. It preserves evidence continuity across trust boundaries.

Custody records conceptually identify the evidence identity, custody actor or system, authority, custody interval or order, action, source and destination, declared transformation, integrity/authentication assessment, relevant boundary, and unresolved exception. No particular record format is selected.

The canonical conceptual custody lifecycle is defined in `RuntimeEvidenceFrameworkChainOfCustodyModel.md`.

## 5. Trust Continuity

Trust continuity exists when every material interval and boundary between original production and current reliance has sufficient, mutually consistent evidence identity, integrity, provenance, custody, and review support for the stated claim.

Continuity is not the absence of physical movement. It may survive governed transfers and declared transformations. It is broken or unresolved when a material interval cannot bind predecessor to successor, when control is unknown, when evidence may have been substituted or contaminated, or when a transformation cannot be evaluated.

One broken path does not necessarily invalidate all claims. Reviewers determine which content, interval, boundary, and claims are affected and lower them to the narrowest defensible classification. Independent corroboration may support a claim but does not repair the broken custody path of the original evidence.

## 6. Evidence Identity

Evidence identity is the conceptual basis for distinguishing one evidence object from another and recognizing continuity of the same protected evidence through custody.

Identity may draw on origin context, producer, production event, bounded content, order, relationships, and version or derivative history. An identity assertion must state its issuer, scope, uniqueness assumptions, ambiguity, and authentication status.

REF-3 selects no UUID, hash, database identifier, filename, path, timestamp scheme, signature, or naming convention. Such mechanisms may later support identity, but none alone is conceptual identity or proof of authenticity.

Originals, exact copies, excerpts, normalized representations, redactions, annotations, and transformed derivatives are conceptually distinct identities linked by declared relationships. Semantic similarity does not establish sameness.

## 7. Evidence Binding

Evidence binding is a supported relationship connecting evidence identity to the context necessary for a bounded claim. Relevant bindings may include:

- evidence to its original observation and source;
- observation to execution, execution identity, session, target, and time/order;
- artifact to the observations it carries;
- repository material to submitted or runtime-used material;
- operator identity and authority to a custody or production action;
- predecessor evidence to a copy, transfer, or derivative;
- evidence set and criteria to a review, decision, or conclusion.

Each binding names both sides, asserting authority, evidence basis, trust domains, boundary crossings, scope, limitations, and assessment status. One valid binding does not imply another. Correlation is not identity; custody is not authorization; integrity is not origin.

## 8. Evidence Mutation Rules

- Protected originals are never modified in place for correction, enrichment, redaction, normalization, annotation, or convenience.
- Any material change produces a conceptually new derivative identity and an explicit transformation relationship.
- The original, transformation purpose, responsible authority, method class, affected scope, order, reversibility, and information loss are preserved to the degree available.
- Lossy transformations cannot be presented as exact copies.
- Redaction preserves a protected source or explicitly records why preservation is prohibited; the redacted derivative cannot prove redacted content.
- Annotation and interpretation remain separable from observed content.
- Combining sources produces a composite with declared component relationships and dependency; it is not a new original observation.
- Undeclared mutation, substitution, contamination, or context loss triggers an authenticity exception and constrains affected claims.

## 9. Evidence Preservation

Preservation maintains the original or closest available original, evidence identity, integrity context, provenance, custody history, boundary assessments, relationships, classifications, reviews, conflicts, and limitations for the governed retention period.

Preservation must protect meaning as well as bytes: association, ordering, scope, source context, and derivative relationships can be authenticity-critical. Access, confidentiality, privacy, secret handling, and legal constraints apply without concealing evidentiary gaps caused by restriction or redaction. Ordinary log retention or repository history is not automatically an evidence-preservation regime.

Preservation policy is distinct from implementation. REF-3 selects no repository, storage medium, retention duration, backup process, encryption, access-control system, or disaster-recovery mechanism.

## 10. Evidence Review Integrity

Review integrity requires a demonstrable binding between the exact evidence set, claim set, criteria, method, reviewer identity and authority, review context, decision, and conclusion.

- Evidence must not change silently during review.
- Additions, exclusions, transformations, and conflicts are recorded.
- Reviewer independence and dependencies are declared rather than assumed.
- Review work preserves observation, interpretation, dissent, uncertainty, and decision separately.
- A review cannot authenticate a fact beyond its method, evidence, or authority.
- Re-review cites the prior review and identifies changed evidence, criteria, scope, or reasoning.
- Approval does not cure broken provenance, continuity, identity ambiguity, or contamination.

## 11. Evidence Supersession

Supersession names a successor for future governed use while preserving predecessor identity, content, status, reviews, and historical effect.

A successor states why it supersedes, what scope changes, which evidence or understanding changed, and which claims or classifications are affected. Supersession does not imply that the predecessor was false or inauthentic. A corrected derivative does not become the original. Chains of supersession remain navigable in both directions and must not form ambiguous authority for the same scope.

## 12. Evidence Retirement

Retirement removes evidence from active ordinary use under separately approved retention, legal, security, privacy, and operational policy. Retirement is not destruction, rejection, supersession, or proof of invalidity.

The retirement disposition preserves identity, reason, authority, scope, date/order, unresolved dependencies, successor or archive location where permitted, and the effect on active claims and investigations. Evidence required by protected history, active review, legal hold, security inquiry, or unresolved dependency cannot be treated as freely disposable. REF-3 grants no disposal authority and selects no retirement mechanism.

## 13. Authenticity Failure Modes

| Failure | Authenticity consequence |
| --- | --- |
| Broken chain of custody | Sameness cannot be established across the affected interval |
| Missing provenance | Origin or handling path is unknown for affected claims |
| Unverifiable origin | Evidence cannot be bound to the asserted production source |
| Identity ambiguity | Multiple evidence objects or production events plausibly match |
| Evidence contamination | Original observation and later material cannot be reliably separated |
| Evidence substitution | A different object may have replaced the asserted evidence |
| Undeclared mutation | Present content cannot be proven equivalent to the protected state |
| Context stripping | Content survives but authenticity-critical source, order, scope, or target association is lost |
| Unbound derivative | A copy, excerpt, redaction, or transformation cannot be reliably linked to its source |
| Custody actor ambiguity | Possession, control, authority, or transfer responsibility is unresolved |
| Review-set drift | The decision cannot be bound to the evidence set purportedly reviewed |
| Circular attestation | Authenticity claims depend only on each other without an independently grounded origin |

Authenticity failures are evidence-governance failures, not proof that the associated runtime operation failed. A runtime failure can produce authentic evidence, and a successful runtime operation can leave unauthentic evidence.

## 14. Trust Failure Modes

Trust can fail even when authenticity is established. Failure modes include authentic but false source statements; authentic but incomplete capture; correct content bound to the wrong target; compromised or unauthorized producer; dependent evidence presented as independent; review conflict or undisclosed dependency; classification beyond scope; unsupported causality; concealed uncertainty; and a valid original used after a material supersession.

Trust disposition is purpose-specific. Reviewers identify the failed trust component, affected claims, boundaries, and permissible residual use. They do not collapse all failures into “inauthentic” or infer runtime failure without evidence.

## 15. Future Extension Points

Future governed profiles may define technology-specific identity evidence, integrity assessments, authentication methods, custody-event requirements, transfer controls, preservation classes, review-set manifests, retention schedules, and exception handling for SQL execution, API execution, deployment pipelines, CLI execution, cloud platforms, background workers, production releases, and future runtime technologies.

Extensions must retain conceptual separation among authenticity, integrity, provenance, correctness, truth, completeness, and trustworthiness. They must preserve originals and derivatives, expose custody gaps, authenticate boundary crossings independently, and avoid treating any UUID, hash, filename, database key, signature, vendor record, or platform status as universal proof.

## Model boundary

REF-3 creates no collector, runtime tool, execution script, authorization, migration, deployment artifact, persistence model, serialization, identifier mechanism, integrity mechanism, database connection, or runtime action.
