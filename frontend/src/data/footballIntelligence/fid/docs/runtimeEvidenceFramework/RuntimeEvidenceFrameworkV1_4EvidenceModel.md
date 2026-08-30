# REF-V1.4 Evidence Package, Custody, and Claim-Assessment Model

## Repository audit and ownership

The canonical REF package remains `src/data/footballIntelligence/fid/runtimeEvidence`. `RuntimeEvidenceContracts.js` owns the seven V1.2 declaration contracts; `contractSupport.js` owns bounded validation, sensitive-field rejection, and freezing; `canonicalIdentity.js` owns V1.3 exact-byte and structured-declaration identity; `runtimeEvidenceConstants.js` owns V1 contract vocabulary; and `evidenceModel.js` additively owns nested V1.4 observation, relationship, custody-continuity, sufficiency, finalization, and review-input behavior. The first four are reused unchanged by V1.4. The barrel is extended only to expose the additive model and fixture.

Canonical FID result, failure, uncertainty, provenance, review, decision, conclusion, blocker, predecessor/successor, verification, lifecycle, and protected-history concepts remain externally owned references. Relevant repository patterns include immutable validation outputs in FID contracts, append-only revision lineage in `SourceControlledCanonicalRecordOwnershipPolicy.md`, persistence envelopes in `DurableFidPersistencePortContract.js`, and claim-specific sufficiency in `ProspectEligibilitySufficiencyResultContract.js`. They are referenced as patterns or identities, not duplicated. Protected REF governance, V1.1-V1.3 documentation/code, Sprint 17C history, deployment, authorization, and migrations are unchanged.

## Package and observation model

`buildRuntimeEvidencePackage` accepts supplied observations and relationships; it collects nothing. It constructs the canonical V1.2 package while placing bounded identity-bearing V1.4 detail under `extensions.refV1_4`. Manifest, plans, authorization, execution/attempt, artifact, target, environment, operator, session, transaction, provenance, integrity, custody, review, conclusion, predecessor, and investigation values remain references and are never invented. Database, platform, session, stage, result, transaction, client, runtime, and operator observation reference arrays are projections of supplied observations.

An observation is a nested REF declaration, not a new top-level contract. It has an identity, subject, layer, point, source, explicit state, source classification, bounded detail, expected declaration, provenance/integrity/authenticity references, fidelity, completeness, bindings, correlation, sequence/order, uncertainty, contradiction, transformation, and extensions. States are `PRESENT`, `ABSENT`, `UNOBSERVABLE`, `INSUFFICIENT`, `CONTRADICTORY`, `UNRESOLVED`, and `NOT_APPLICABLE`. Sources preserve `DECLARED`, `OPERATOR_ATTESTED`, `CLIENT_OBSERVED`, `PLATFORM_ATTESTED`, `RUNTIME_OBSERVED`, `DATABASE_OBSERVED`, `EXTERNALLY_VERIFIED`, `DERIVED`, `INFERRED`, and `UNKNOWN`. No classification is upgraded.

Chronology always preserves supplied array order. Sequence positions must be unique; confirmed/observed ordering cannot regress. Intended, observed, confirmed, inferred, unknown, partial, concurrent, and unordered states remain distinct. Chronology never implies causality.

## Relationships, integrity, lineage, and redaction

Typed relationships support support, contradiction, corroboration, derivation, supersession, reference, order, execution/session/transaction membership, stage result, gap explanation, and redacted derivation. Validation rejects duplicate identities, dangling observation references, prohibited self-reference, missing transaction/order evidence, derivative cycles, supersession cycles, duplicate positions, and invalid chronology. Relationship presence remains a reviewable assertion, not proof.

Package finalization validates the model and invokes V1.3 structured identity. Its integrity declaration records SHA-256, canonical byte length, expected/calculated digest, comparison and verification states, mismatch detail, and the explicit local-only uncertainty. It never authenticates external receipt, execution, target, database state, or success.

Provenance stays reference-first. REF V1.4 models only links among source evidence, observations, execution/package references, derivatives, transformations, redactions, predecessors, successors, supersession, and gaps. Derivative ancestry is acyclic and append-only.

A governed derivative declares source and new identities, transformation type, reason, affected fields/categories, fidelity and completeness impacts, custody implications, and limitations. Removed, masked, normalized, summarized, and transformed derivatives are supported. Source identity reuse and silent/impact-free redaction are invalid. Sensitive source input is rejected before derivative construction.

## Custody, claims, and review readiness

The custody builder uses the V1.2 custody record with additive predecessor/successor, package-content identity, transfer, receipt, integrity, and transformation detail. It never invents transfer, receipt, custodian, verification, authenticity, or continuity. Continuity outcomes are `CONTINUOUS`, `PARTIAL`, `GAPPED`, `CONTRADICTORY`, `UNVERIFIABLE`, and `UNRESOLVED`. Continuity requires linked records, consistent package identity, confirmed receipt, and matched integrity; absence of a declared gap is insufficient by itself.

Claim sufficiency is policy-driven and claim-scoped. The 20 dimensions are identity, artifact, target, environment, authorization reference, execution/session/transaction correlation, ordering, subject, authenticity, integrity, provenance, fidelity, completeness, custody, independence, contradiction, uncertainty, and residual gap. Policies supply relevant observations, mandatory layers/classifications/bindings, fidelity/completeness requirements, custody/independence requirements, permitted gaps, contradiction tolerance, uncertainty tolerance, and stop-on-missing behavior. Outcomes are `SUFFICIENT_FOR_CLAIM`, `PARTIALLY_SUFFICIENT`, `INSUFFICIENT`, `CONTRADICTED`, and `UNRESOLVED`. The same evidence can produce different outcomes under different governed policies.

Derived duplicates, shared dependencies, common-mode dependencies, circular corroboration, partial independence, independent witnesses, and unknown independence remain distinct. Contradictions are retained; resolution requires a supplied resolution reference and never deletes source evidence.

Review preparation returns package and assessment references, unresolved issues, contradictions, custody state, human/governed review areas, and prohibited automatic actions. It creates no decision, conclusion, or authorization.

All builders are deterministic, immutable, current-time-free, random-free, local, and non-persisting. Structural invalidity is an error/validation failure; insufficiency, contradiction, and uncertainty are valid governed outcomes.
