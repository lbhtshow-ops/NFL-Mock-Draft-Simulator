# Analytical Output Governance Policy

| Field | Value |
|---|---|
| Policy identifier | AOGP |
| Policy version | 1.0.0 |
| Status | Architecture Policy |
| Effective phase | Phase 2 |
| Adopted | 2026-07-19 |
| Scope | LBHT Football Intelligence Platform |

## 1. Purpose

The Analytical Output Governance Policy defines what a platform analytical output represents, how it was produced, who owns it, what supports it, and what downstream consumers may infer from it.

Analytical outputs require governance separate from evidence, facts, source records, input projections, persistence, and application behavior. Evidence documents what is known or supplied. Analysis interprets governed inputs. Persistence records an artifact but does not establish analytical authority. An application displays or uses intelligence but does not create football intelligence merely by transforming its presentation.

Analytical outputs are first-class governed artifacts, not disposable numbers. A score without ownership and derivation context is incomplete even when it is structurally valid and bounded.

## 2. Scope

This policy governs analytical conclusions produced, declared, transported, or consumed by the platform, including:

- domain and component scores;
- grades, tiers, rankings, and risk assessments;
- fit assessments and projections;
- confidence assessments and evidence levels;
- recommendations and Decision Support outputs;
- summaries containing analytical conclusions; and
- model-generated strengths, concerns, assumptions, or limitations.

Raw evidence, Research Sources, Recorded Observations, Evidence Artifacts, FID canonical facts, FIIS authorization, persistence mechanics, UI rendering, and application-specific display behavior are outside the policy's direct ownership. They remain governed by their respective layers. This policy controls the analytical artifacts that consume or refer to them.

Neighboring layers interact as follows:

```text
Research and sources -> governed evidence
FIIS -> authorization for information entering FID
FID -> canonical football knowledge
Input projection -> governed engine input
Intelligence engine -> analytical output
Position model -> evaluation output
Decision Support -> governed decision output
Application -> consumption and display
```

No downstream layer retroactively changes the authority of an upstream artifact.

## 3. Governing principles

1. Evidence and analysis are separate assets.
2. Analytical outputs may never replace or overwrite evidence.
3. Every analytical output must have an identifiable owner or an explicit unknown owner.
4. Every analytical output must have a derivation classification.
5. Unknown derivation must remain explicitly unknown.
6. Compatibility does not create canonical authority.
7. A canonical engine may report an external or legacy declaration without claiming to have derived it.
8. Confidence is separate from analytical magnitude.
9. Structural validity is separate from analytical support and validity.
10. Calibration is separate from derivation.
11. Reproducibility must never be implied when it is unavailable.
12. Downstream consumers must respect governance metadata and intended use.
13. Transitional outputs require explicit capability-based removal conditions.
14. Application convenience must not weaken provenance or ownership.
15. Canonical analytical conclusions require governed inputs and documented logic.

## 4. Analytical-output definition

An analytical output is a conclusion, assessment, synthesis, estimate, classification, or recommendation that goes beyond merely retaining supplied evidence or a canonical fact.

| Concept | Meaning under this policy |
|---|---|
| Fact | A governed statement about football reality; FID may own it as canonical knowledge. |
| Evidence | Material supporting a fact or analysis; it remains independently traceable. |
| Observation | A recorded or analytical Research Repository object with its own provenance and review state. |
| Inference | A conclusion drawn from identified inputs; it is an analytical output when used as intelligence. |
| Projection | A forward-looking analytical output, distinct from current quality and current facts. |
| Manual input | Caller-supplied data; it becomes an analytical output only when it represents an assessment or conclusion. |
| Source metadata | Information about a source, not an analytical conclusion. |
| Context | Governed situational information used to interpret evidence. |
| Declarative input | Explicit caller-supplied information whose ownership must be preserved. |
| Decision Support recommendation | A downstream analytical output that consumes governed intelligence under stricter use rules. |

A human grade, external-model estimate, or caller-supplied projection is both a declaration and an analytical output. Its manual or external origin does not make it a fact.

## 5. Ownership model

Ownership states who is accountable for the analytical logic or declaration. Origin identifies where the output came from. A carrier is not necessarily an owner.

| Owner category | Meaning and permitted claim | Required support | Canonical eligibility | Consumer treatment |
|---|---|---|---|---|
| `CANONICAL_ENGINE` | A platform engine owns documented derivation from governed inputs. | Input references, model identity and version, derivation documentation, limitations, diagnostics. | Yes, after governance approval. | May be used according to authorized use and confidence. |
| `GOVERNED_EXTERNAL_MODEL` | An identified external model owns the analysis; the platform governs its declaration and provenance. | External owner, model/version when available, source and input references, declared limitations. | Not as internally derived output; may be approved external intelligence. | Preserve external ownership and permitted use. |
| `HUMAN_ANALYST` | An identified analyst owns a manual analytical conclusion. | Analyst identity or governed reference, review state, evidence references, rationale, limitations. | May be approved analyst intelligence; never model-derived. | Treat as a declaration unless a separate documented derivation exists. |
| `LEGACY_SYSTEM` | A named legacy dataset or system owns or supplied the output. | Legacy reference, preserved value, known metadata, limitations, removal condition. | No while derivation or authority remains unresolved. | Transitional use only when explicitly authorized. |
| `COMPATIBILITY_LAYER` | The layer owns only a compatibility transformation it actually performs. Transport alone is not analytical ownership. | Transformation description and version, source output reference, snapshots. | No authority upgrade. | Inspect the transported output's original owner. |
| `UNKNOWN_OWNER` | The repository cannot identify an accountable analytical owner. | Explicit unknown state and limitations. | No. | Display or audit only unless an approved transitional exception says otherwise. |

A compatibility facade that copies a scalar remains a carrier. It must retain the scalar's original owner rather than relabeling itself as the analytical owner.

## 6. Derivation classification

The minimal derivation taxonomy is:

| Status | Definition |
|---|---|
| `DERIVED` | Produced by documented logic from identified inputs. |
| `DECLARED` | Supplied as an analytical conclusion and not recalculated by the receiving component. |
| `UNKNOWN` | The repository cannot establish how the output was produced. |

`DERIVED` does not mean calibrated, correct, verified, canonical, or reproducible. `DECLARED` does not mean unsupported; a human or external model may supply strong provenance. `UNKNOWN` must not be converted into `DECLARED` merely because a value is present.

Legacy status belongs in origin and lifecycle/governance, not in derivation. The preferred representation is orthogonal:

```text
origin: LEGACY_SYSTEM
owner: LEGACY_SYSTEM
derivationStatus: UNKNOWN
governanceStatus: TRANSITIONAL
calibrationStatus: NOT_DOCUMENTED
canonicalDerivation: false
```

This permits one dimension to change through an approved migration without rewriting unrelated history.

## 7. Governance status

Governance status describes the platform's authorization and authority judgment, independently of lifecycle.

| Status | Meaning | Permitted use |
|---|---|---|
| `CANONICAL` | Approved platform analytical authority for its declared domain, scope, and version. | Authorized scoring and Decision Support, subject to confidence and limitations. |
| `APPROVED` | Reviewed and approved for specified use, but not designated canonical platform authority. | Only the recorded permitted uses. |
| `PROVISIONAL` | Structurally and analytically reviewable, with unresolved validation, policy, or evidence limitations. | Display, testing, or supporting context; not Decision Support unless explicitly authorized. |
| `TRANSITIONAL` | Temporarily retained for compatibility or migration with a removal condition. | Only documented compatibility uses. |
| `REJECTED` | Reviewed and not authorized for analytical use. | Audit history only. |
| `UNKNOWN` | Governance status cannot be established. | Blocked except non-analytical inspection. |

Canonical results may report an `APPROVED`, `PROVISIONAL`, or `TRANSITIONAL` declaration as supplemental content, but the declaration retains its own status. Reporting does not promote it.

## 8. Calibration status

Calibration is an independent dimension:

| Status | Meaning |
|---|---|
| `CALIBRATED` | Performance has been evaluated against a documented target and calibration procedure. |
| `PARTIALLY_CALIBRATED` | Calibration covers only identified populations, scopes, or output components. |
| `NOT_CALIBRATED` | The output is known not to have completed calibration. |
| `NOT_DOCUMENTED` | Calibration may or may not have occurred, but the repository has no adequate record. |
| `NOT_APPLICABLE` | Calibration has no coherent role for the output type. |
| `UNKNOWN` | The applicable status cannot be determined. |

A documented formula may be uncalibrated. Calibration does not prove derivation ownership or canonical authority. Claimed external calibration must remain a declaration unless supported by governed provenance.

## 9. Reproducibility status

Reproducibility is separate because a documented idea may still lack the exact inputs, model version, weights, or executable logic needed to reproduce an instance.

| Status | Meaning |
|---|---|
| `REPRODUCIBLE` | Identified inputs, logic, versions, and execution conditions can reproduce the output. |
| `PARTIALLY_REPRODUCIBLE` | Only identified components or an acceptable bounded approximation can be reproduced. |
| `NON_REPRODUCIBLE` | The output is known not to be reproducible. |
| `NOT_DOCUMENTED` | Reproducibility records are absent. |
| `UNKNOWN` | Available information cannot determine reproducibility. |

Reproducibility depends on input references, source availability where required, formula ownership, model and weight versions, and retained execution semantics. It does not establish calibration or correctness.

## 10. Authority and verification relationship

Repository concepts such as `DECLARED`, `OBSERVED`, `VERIFIED`, `CANONICAL`, and `PROVISIONAL` appear in FID, FIIS, and Research Repository contexts. AOGP references those states but does not adopt them as one shared analytical authority enum.

- Evidence authority describes support for evidence or an observation.
- Verification records review of a specific artifact or claim.
- Analytical owner identifies accountability for analysis.
- Derivation describes how the analytical output was produced.
- Governance describes permitted analytical authority.
- Calibration describes empirical alignment.
- Confidence describes support for the particular output.

A verified Evidence Artifact does not make every analysis derived from it verified or canonical. A canonical FID fact does not make a model using it calibrated. An approved analytical output does not promote its evidence into FID.

Interoperability rule: analytical metadata may reference evidence authority and verification records, but it must preserve their original vocabulary and owning contract rather than translating them into analytical governance status.

## 11. Required metadata

The policy defines a conceptual metadata model, not a runtime contract.

### Mandatory when an analytical output is governed

- output identity or a stable containing-result reference;
- output type and domain;
- owner and origin;
- derivation status;
- governance status;
- calibration status;
- reproducibility status;
- canonical-derivation declaration;
- contract or representation version;
- confidence and whether confidence is known;
- limitations; and
- lifecycle state or equivalent retention state.

### Conditionally required

- model name and model version for model-derived outputs;
- weight version when configurable weights affect the output;
- calibration version for calibrated claims;
- input references for derived outputs;
- evidence and source references when evidence supports the output;
- analyst or external-model identity for declarations;
- provenance and verification references for approved or canonical use;
- creation and update timestamps when instances are retained;
- removal condition for transitional or deprecated outputs;
- `supersedes` and `supersededBy` for replacement; and
- intended-use authorization for scoring or Decision Support.

### Optional or extensible

- notes;
- non-governing labels;
- domain-specific payload metadata; and
- namespaced extensions that do not override core fields.

Unknown or unavailable metadata must remain explicit. Implementations must not fabricate authors, versions, formulas, dates, sources, evidence, or owners to satisfy shape requirements.

## 12. Confidence governance

Confidence measures support for an analytical output. It does not measure player quality, favorability, score magnitude, or recommendation strength.

```text
score: 92
confidence: 0.41
```

is valid when a high analytical estimate has limited support.

Permitted confidence inputs include governed evidence completeness and quality, source and evidence-reference coverage, sample sufficiency, provenance, verification, model stability, calibration evidence, unresolved assumptions, and explicit limitations. A domain may use only inputs its governed boundary actually supplies.

Domains may define different formulas because their evidence structures differ. Shared normalization to the range zero through one and shared evidence-level mapping should remain consistent where applicable. Formula weights, thresholds, and penalties require documentation and versioning.

The current `IntelligenceResultContract` normalizes unknown or invalid confidence to numeric zero. Until that limitation changes, a result with unknown confidence must pair zero with explicit metadata such as `confidenceKnown: false` and an explanation. Consumers must not interpret that zero as measured absence of support.

## 13. Canonical analytical output criteria

An analytical output may be designated canonical only when all applicable criteria are met:

1. It accepts a governed input boundary.
2. It has an identified analytical owner.
3. Its derivation is documented and classified `DERIVED`.
4. Its behavior is deterministic where the output type permits determinism.
5. Model, contract, and applicable weight versions are identified.
6. Inputs, evidence, and provenance are traceable to the required degree.
7. Assumptions and limitations are explicit.
8. Structural and semantic validation pass.
9. Diagnostics cover determinism, immutability, prohibited claims, and state behavior.
10. Governance review authorizes canonical use.
11. Compatibility behavior is isolated from canonical derivation.
12. No critical ownership or provenance blocker remains unresolved.

Calibration is not universally mandatory for canonical status. A canonical but uncalibrated output must state `NOT_CALIBRATED` or the accurate equivalent, and consumers may restrict its use accordingly. Canonical status never hides calibration limitations.

## 14. Declared-output policy

Declared analytical outputs may enter through callers, human analysts, governed external models, legacy datasets, or manual workflows.

Receiving components must:

- preserve the original analytical owner and origin;
- label the output `DECLARED` when its declaration is established, or `UNKNOWN` when derivation cannot be established;
- avoid claiming to have derived or verified the value;
- avoid silently recalculating it;
- avoid upgrading governance, calibration, or reproducibility;
- preserve limitations and unresolved metadata;
- retain input, evidence, source, and analyst references when supplied; and
- keep the declaration structurally separate from objective evidence and canonical conclusions.

A canonical engine may state that a declaration was supplied and may transport it in a supplemental section. The declaration must not silently become the engine's score or conclusion.

## 15. Legacy analytical-output policy

Legacy outputs may be retained when active consumers require numerical compatibility or when audit history would otherwise be lost. Retention is a migration exception, not a claim of analytical legitimacy.

Legacy outputs must retain their exact supplied values where preservation is required, known source labels and dates, unknown derivation, documented calibration state, transitional governance, non-canonical derivation, limitations, active dependencies, and a capability-based removal condition.

They may be used only by explicitly documented compatibility consumers. They must not be used as evidence, copied into canonical conclusions without labels, treated as reproducible, or promoted because they are bounded or familiar.

The platform must not reverse-engineer an undocumented formula merely to reproduce stored values. A newly approximated formula would be a new model and requires its own governance; it cannot inherit the legacy output's identity or authority.

Production's modeled-output declaration is the current motivating example, but these rules apply to every domain.

## 16. Canonical-engine responsibilities

A canonical engine must:

- accept only governed inputs;
- perform no hidden registry or persistence lookup;
- preserve Player Context;
- distinguish evidence, declarations, and engine-owned analysis;
- identify outputs it owns and label outputs it merely reports;
- expose limitations and confidence rationale;
- preserve deterministic ordering and caller data;
- produce validated immutable results where repository conventions require it;
- handle unavailable, unknown, partial, and insufficient-sample states explicitly; and
- avoid unsupported conclusions.

A canonical engine must not claim ownership of declared legacy outputs, invent provenance or derivation metadata, infer calibration, derive confidence from score magnitude, overwrite evidence, hide unknowns, silently promote transitional data, or accept application convenience as analytical authority.

## 17. Compatibility-layer responsibilities

A compatibility facade may own lookup, legacy-shape translation, canonical invocation, declaration transport, and preservation of active numerical behavior. It must not duplicate canonical analysis or claim that a transported value was canonically derived.

Compatibility implementations must:

- isolate registry and legacy dataset access from canonical modules;
- invoke canonical analysis at most once per compatibility operation;
- preserve legacy values only where an active dependency is documented;
- attach or retain transitional declarations and limitations;
- maintain snapshot diagnostics;
- identify the original owner and origin;
- preserve explicit transitional governance; and
- retain a removal condition.

A compatibility result may temporarily preserve a scalar required by active consumers without making that scalar canonical.

## 18. Consumer responsibilities

Player Evaluation, Draft Intelligence, Draft Board, Draft Decision, Trade Intelligence, Executive Summary, Explainability, simulators, and applications must evaluate availability, derivation, governance, owner, confidence, limitations, calibration, canonical authority, and intended use before relying on an output.

Conceptual permitted-use classes are:

| Use class | Meaning |
|---|---|
| `DISPLAY_ONLY` | May be shown with governance context; cannot affect analysis or decisions. |
| `SUPPORTING_CONTEXT` | May inform explanation or confidence but cannot independently determine a score. |
| `SCORING_INPUT` | May contribute to a governed analytical calculation. |
| `DECISION_INPUT` | May directly affect a governed recommendation or decision. |
| `BLOCKED` | Must not be used beyond audit or remediation. |

These are policy concepts, not runtime enums in this sprint. Consumers must not infer a broader class from structural validity or field presence.

Applications may render outputs but may not create, promote, merge, or canonicalize football intelligence.

## 19. Decision Support restrictions

Outputs used in player grades, team recommendations, draft or trade decisions, rankings, or simulations require stricter authorization because they materially affect downstream conclusions.

Canonical or specifically approved outputs may be Decision Support inputs when their intended use, confidence, calibration limitations, and model scope permit it.

Transitional legacy values may temporarily influence Decision Support only when all of the following are documented:

- explicit compatibility authorization;
- the exact active dependency;
- original ownership and non-canonical derivation;
- consumer-visible limitations where appropriate;
- a migration plan; and
- a capability-based removal condition.

Use by a Decision Engine does not legitimize an input, establish calibration, or create canonical authority.

## 20. Lifecycle

Lifecycle records the operational history of an output independently from governance status:

```text
PROPOSED -> ACTIVE -> SUPERSEDED -> DEPRECATED -> RETIRED
             |
             -> REJECTED
```

- `PROPOSED`: created for review and not authorized for active consumption.
- `ACTIVE`: the current instance for its authorized uses.
- `SUPERSEDED`: replaced by an identified newer output but retained for traceability.
- `DEPRECATED`: still accessible during migration but scheduled for capability-based removal.
- `RETIRED`: unavailable for active use and retained only as required for audit history.
- `REJECTED`: reviewed and denied activation.

Promotion requires review appropriate to the governance target. Supersession must identify predecessor and successor. Deprecation must identify remaining consumers and a removal condition. Retirement must preserve required audit references rather than rewriting history.

## 21. Migration rules

Reclassification requires new evidence and an approved migration; it is not a metadata-edit convenience.

- `DECLARED` to `DERIVED` requires documented logic, identified inputs, a new derived output identity or revision, and validation. The declaration remains historical.
- `PROVISIONAL` to `CANONICAL` requires satisfaction of canonical criteria and governance approval.
- Legacy `TRANSITIONAL` to `RETIRED` requires consumer migration and compatibility verification.
- `NOT_CALIBRATED` to `CALIBRATED` requires a documented calibration artifact and version.
- `UNKNOWN` derivation to documented derivation requires provenance establishing the actual historical method; a newly invented method creates a new output.
- External to internally governed output requires an internal model and derivation; copying the external value is insufficient.

Migrations must preserve predecessor references, values when audit preservation applies, and the reason for reclassification.

## 22. Removal conditions

Every transitional or deprecated analytical output requires a measurable, capability-based removal condition. Arbitrary calendar dates alone are insufficient.

Preferred form:

```text
Remove after all active consumers have migrated to a governed replacement,
the replacement's intended uses are approved, and compatibility snapshots
confirm equivalent or explicitly approved changed behavior.
```

Conditions should name the remaining capability, consumer class, replacement authority, required regression evidence, and audit-retention treatment.

## 23. Versioning

Version dimensions remain separate:

| Version | Changes when |
|---|---|
| Contract version | Structural representation or validation rules change. |
| Model version | Derivation logic or model semantics change. |
| Weight version | Configurable weights or thresholds change without otherwise changing model identity. |
| Calibration version | Calibration data, target, population, or method changes. |
| Policy version | AOGP governance requirements or taxonomy change. |
| Output instance version | A retained analytical output is revised or superseded. |

Changes affecting conclusions require a model or output-instance version even if the contract shape is unchanged. Documentation-only corrections that do not alter meaning may retain the analytical version but should remain auditable.

## 24. Explainability requirements

Explanations must separate:

- supplied facts and evidence;
- engine-owned analysis;
- assumptions;
- limitations;
- confidence rationale;
- declared outputs; and
- canonical conclusions.

A consumer must be able to determine whether each material conclusion was derived, declared, inherited through legacy compatibility, manually entered, or unavailable. Explanations must not translate a score into praise or concern unless that interpretation is part of the documented model.

## 25. Validation and diagnostics policy

Future implementations should validate:

- structural shape and required metadata;
- semantic consistency among ownership, derivation, governance, and use;
- deterministic output where applicable;
- immutability and caller preservation;
- provenance and declaration preservation;
- correct unknown and unavailable handling;
- prohibited ownership, calibration, and derivation claims;
- compatibility snapshots;
- lifecycle and supersession assertions; and
- relevant regression baselines.

Structural validity proves only that an artifact conforms to a representation. It does not prove analytical support, correctness, calibration, reproducibility, approval, or permitted use.

## 26. Domain-specific extension policy

AOGP is cross-domain. A domain may define evidence-specific confidence formulas, scoring models, calibration procedures, sample sufficiency rules, position-specific semantics, payloads, and explanation conventions.

Domain extensions must be versioned, must identify their owner, and may not weaken the core separation of evidence, analysis, confidence, derivation, governance, calibration, lifecycle, and permitted use.

## 27. Worked examples

### Recognition derived output

The governed Recognition projection supplies caller-owned records, completeness, references, verification, provenance, limitations, and Player Context. The canonical Recognition engine deterministically inventories records and seasons and derives evidence confidence using documented provisional logic. Its canonical score remains null. The legacy Recognition scorer separately applies documented compatibility weights and tiers. Reproducibility of that compatibility calculation does not make its score a canonical Recognition conclusion.

```text
owner: CANONICAL_ENGINE
derivationStatus: DERIVED
governanceStatus: CANONICAL for canonical factual/confidence outputs
score: null
compatibilityScoreOwner: COMPATIBILITY_LAYER
```

### Production legacy declaration

The Production declaration preserves supplied component and overall scores, strengths, concerns, notes, source label, and update value. No formula, calibration record, or model version exists.

```text
owner: LEGACY_SYSTEM
origin: LEGACY_SYSTEM
derivationStatus: UNKNOWN
governanceStatus: TRANSITIONAL
calibrationStatus: NOT_DOCUMENTED
reproducibilityStatus: NOT_DOCUMENTED
canonicalDerivation: false
permittedUse: documented compatibility only
```

### Production scoreless canonical result

A planned canonical Production engine accepts only `ProductionInputProjection`. It may report objective statistical categories, supplied and unresolved fields, completeness, scope, sample status, and limitations. It may supplementally report that a legacy declaration exists.

```text
score: null
confidence: 0
confidenceKnown: false
canonicalConclusion: factual evidence inventory only
legacyDeclaration: supplemental and separately governed
```

No productivity grade, strength, concern, or evaluative conclusion is inferred from raw totals.

### Future governed Production score

A future Production model may supersede compatibility use after it defines governed inputs, position and sample semantics, documented deterministic logic, versions, confidence rationale, diagnostics, and an approved intended use. Its output receives a new model identity. It does not inherit the legacy value's identity merely because results are numerically similar.

```text
owner: CANONICAL_ENGINE
derivationStatus: DERIVED
governanceStatus: CANONICAL after approval
calibrationStatus: explicit
reproducibilityStatus: REPRODUCIBLE
supersedes: compatibility dependency, not historical declaration
```

### Human analyst declaration

A manual scouting grade may be governed as an analyst declaration when it identifies the analyst, scope, evidence references, rationale, confidence, review state, limitations, and intended use.

```text
owner: HUMAN_ANALYST
derivationStatus: DECLARED
governanceStatus: APPROVED or PROVISIONAL
canonicalDerivation: false
```

Review may authorize the declaration for a use; it must not relabel it as model-derived.

## 28. Anti-patterns

The following are prohibited:

- storing or transporting a score without ownership metadata;
- treating a declared score as engine-derived;
- treating confidence as player quality;
- deriving confidence from score magnitude;
- copying legacy values into canonical conclusions without labels;
- inferring calibration from a bounded value;
- reverse-engineering an undocumented formula and claiming historical continuity;
- replacing evidence with a summary or score;
- silently promoting provisional, external, or transitional outputs;
- allowing applications to create or canonicalize football intelligence;
- treating persistence or consumer use as analytical approval;
- using one overloaded field for origin, owner, derivation, governance, calibration, lifecycle, and confidence; and
- converting unknown metadata into convenient defaults.

Orthogonal dimensions improve traceability because each claim can be reviewed and migrated independently. They also prevent a composite label from concealing which property is established and which remains unknown.

## 29. Adoption plan

1. Approve Analytical Output Governance Policy 1.0.0.
2. Implement the scoreless canonical Production engine.
3. Preserve the Production compatibility facade and snapshots.
4. Compare Recognition and Production conformance.
5. Define shared analytical-output conformance checks if justified.
6. Audit Athletic Intelligence.
7. Audit Football IQ.
8. Audit Scheme Fit.
9. Audit Player Traits.
10. Audit Player Evaluation.
11. Audit Draft and any future Trade Intelligence.

This policy does not implement any adoption step.

## 30. Open questions and deferred decisions

- Whether a shared runtime analytical-output metadata contract is necessary.
- Whether `IntelligenceResultContract` should add score-origin and governance metadata.
- Whether evidence authority levels should gain an explicit interoperability contract across FID, Research Repository, and intelligence outputs.
- Whether unknown confidence should continue to normalize to numeric zero.
- Whether consumers need machine-enforced permitted-use classes.
- Whether calibration should be mandatory for particular Decision Support uses.
- Whether human and external declarations need more granular owner categories.
- Whether ensemble outputs require a distinct derivation type or can remain `DERIVED` with multiple owner/input references.
- How retained analytical artifacts may eventually be persisted without becoming FID facts.
- Which authority approves canonical analytical status and use-specific exceptions.

These questions require separate architecture review and do not weaken the requirements established here.

## 31. Relationship to FID

FID owns canonical football knowledge and its governed record relationships. Intelligence engines consume governed FID information. Analytical outputs never overwrite FID facts, and persisting an analytical artifact would not make it a canonical football fact.

AOGP does not redesign FID provenance, verification, lifecycle, identity, or ownership policies. It references those artifacts through stable references and preserves their authority.

## 32. Relationship to FIIS

FIIS governs validation and authorization of information entering FID. It does not evaluate football, derive analytical outputs, or automatically authorize analysis as canonical intelligence.

An FIIS-authorized fact may become a governed engine input. The analytical output still requires its own owner, derivation, governance, confidence, and intended-use treatment.

## 33. Relationship to Decision Support

Decision Support consumes governed intelligence and produces downstream analytical recommendations. It does not retroactively legitimize inputs. An output's presence in Draft Decision, Draft Board, a future Trade Decision, or a simulator does not make it canonical, calibrated, reproducible, or fit for unrestricted use.

Decision outputs themselves are governed analytical outputs under this policy and require traceable inputs, ownership, derivation, confidence, limitations, versions, and intended-use controls.

## 34. Current repository alignment

This policy formalizes existing architectural distinctions rather than replacing their owners:

- the framework separates facts, intelligence, evaluation, decisions, and applications;
- `IntelligenceResultContract` standardizes result shape but does not encode output origin;
- Research Repository contracts distinguish Recorded Observations from Analytical Observations and maintain independent verification;
- FIIS documents that engine-derived intelligence is not a canonical fact merely because it was calculated;
- Recognition separates governed canonical reporting from legacy compatibility scoring;
- Production separates objective input projection from transitional modeled-output declaration;
- shared confidence utilities normalize confidence without defining domain formulas; and
- active legacy Decision Support consumers demonstrate why compatibility authority must remain explicit and temporary.

Where existing modules lack AOGP metadata, this document records a future conformance requirement. It does not silently reclassify existing outputs.

