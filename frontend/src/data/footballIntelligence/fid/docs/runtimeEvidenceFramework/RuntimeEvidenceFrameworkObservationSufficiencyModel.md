# Runtime Evidence Framework Observation Sufficiency Model

Status: `OBSERVATION_SUFFICIENCY_MODEL_ESTABLISHED`

Version: `REF-4`

## 1. Purpose

Observation sufficiency asks whether the available governed observations adequately support one precisely scoped `RuntimeEvidenceClaim`. It is not an artifact score, confidence percentage, implementation gate, evidence classification, or guarantee of truth.

## 2. Required assessment dimensions

| Dimension | Sufficiency question |
| --- | --- |
| Identity sufficiency | Are material observation, execution, artifact, operator, session, transaction, statement, and result identities distinguished and authenticated as required? |
| Target sufficiency | Is the exact relevant environment/system/resource bound across external and internal boundaries? |
| Ordering sufficiency | Is the required precedence/concurrency/order established on a defensible ordering basis? |
| Subject sufficiency | Was the exact claim-relevant event, state, output, error, or boundary condition observed? |
| Completeness sufficiency | Are all claim-relevant completeness dimensions adequately covered and gaps explicit? |
| Fidelity sufficiency | Does representation closeness and granularity meet the claim's need without hidden loss? |
| Provenance sufficiency | Is origin, mechanism, point, channel, context, transformation, and handling known enough? |
| Authenticity sufficiency | Is present evidence sufficiently bound to the originally produced observation? |
| Integrity sufficiency | Is unchanged protected state or every permitted transformation adequately established? |
| Custody sufficiency | Is continuity adequate through capture, transfer, review, and preservation? |
| Independence sufficiency | Are corroborating paths sufficiently independent for the failure modes at issue? |
| Contradiction status | Are conflicts absent, resolved within scope, limiting, or unresolved? |

Security/privacy proportionality and observer-interference assessment are mandatory constraints across the dimensions. Excess capture cannot cure a governance deficiency.

## 3. Completeness dimensions

The assessment separately records subject, temporal, sequence, boundary, output, error, identity, target, provenance, and custody completeness. Each states the required scope, available coverage, material gaps, and effect on the particular claim. An observation may be temporally complete yet target-incomplete, or output-complete yet sequence-incomplete.

| Dimension | Coverage governed |
| --- | --- |
| Subject completeness | All claim-relevant subjects, events, states, or effects |
| Temporal completeness | The required time interval and observation start/end |
| Sequence completeness | Required stages/events and detectable missing, delayed, or duplicate entries |
| Boundary completeness | Every claim-relevant trust-boundary crossing and binding |
| Output completeness | All required results, records, messages, and visible effects |
| Error completeness | Errors, warnings, uncertain outcomes, suppressed failures, and negative results |
| Identity completeness | Required observation, execution, artifact, operator, session, transaction, statement, and result identities |
| Target completeness | Exact environment, system, resource, branch, tenant, or equivalent target scope |
| Provenance completeness | Origin, source, mechanism, point, channel, transformations, and handling history |
| Custody completeness | Material control, transfer, review, preservation, and retrieval intervals |

## 4. Outcomes

| Outcome | Meaning | Permissible use |
| --- | --- | --- |
| Sufficient for Claim | All material dimensions meet declared criteria and no unresolved contradiction defeats the claim | May enter REF classification/review for the exact claim; verification is not automatic |
| Partially Sufficient | A bounded subset of the claim or dimensions is adequately supported | Only the supported subset may be used; limitations remain explicit |
| Insufficient | One or more material requirements are unmet | Cannot support acceptance of the claim; may document observed facts or gaps |
| Contradicted | Material governed evidence conflicts with the claim or required binding | Claim cannot be accepted without scoped conflict disposition; contradiction is preserved |
| Unresolved | Evidence cannot determine sufficiency because identity, ambiguity, gaps, dependencies, or criteria remain open | Claim remains unknown/provisional; no preferred explanation is promoted |

Outcomes are conceptual governance language, not constants. A later assessment supersedes rather than overwrites the prior result.

## 5. Assessment method

1. State one claim, scope, target, time, and required evidence class.
2. Inventory supporting, contradicting, limiting, and missing observations.
3. Map layers, modes, sources, subjects, points, channels, and trust boundaries.
4. Assess correlation to operation, execution, identities, sessions, transaction/statements if relevant, target, result, error, and uncertain outcome.
5. Assess intended/observed/confirmed/inferred order, concurrency, missing/delayed/duplicate events, and causality requirements.
6. Assign claim-relevant fidelity and every completeness dimension.
7. Assess intrusiveness, interference, authenticity, integrity, provenance, custody, independence, common-mode dependency, and contradictions.
8. Apply least-evidence/least-disclosure and note redaction-created limits.
9. Select the narrowest outcome and explain residual permissible conclusions.
10. Bind the assessment to review, decision, and any successor.

## 6. Relationship to evidence classification

Sufficiency precedes but does not determine classification. “Sufficient for Claim” means evidence can proceed to governed classification review; it does not mean `VERIFIED` or `CANONICAL`. Partial/insufficient evidence may still support narrower `OBSERVED` or `DECLARED` claims. Derived reasoning remains `INFERRED`; unresolved material support remains `UNKNOWN`. REF-1 controls classification.

## 7. Failure, ambiguity, and contradiction effects

Observation-start, channel, truncation, identity, correlation, target/session/transaction, ordering, interference, loss, authenticity, integrity, and explanatory ambiguity failures are mapped to affected dimensions rather than converted into one blanket failure. Review determines whether the residual claim is narrower, partial, insufficient, contradicted, or unresolved.

A runtime-operation failure may be sufficiently observed. An observation failure does not prove operation failure. Contradictory sources are not averaged or resolved by count.

## 8. Multi-observer sufficiency

Corroboration requires shared-claim relevance plus assessed independence. Complementary sources may fill different dimensions without independently corroborating one another. Derived duplicates, circular citations, shared platforms, shared observation channels, shared identity issuers, and common review paths reduce independence. Unresolved contradictions block sufficient status for the affected proposition unless the claim explicitly concerns the contradiction itself.

## 9. Historical and replay sufficiency

Observation replay can improve review of the preserved representation but cannot add missing historical runtime facts. Operation replay creates evidence for a new execution. It may support a general mechanism or reproduction claim but cannot make the prior execution sufficient retroactively. Historical claims preserve their original gaps and may receive additive successor assessments if new authentic historical evidence emerges.

## 10. Model boundary

REF-4 selects no scoring algorithm, threshold, enum, executable gate, checklist engine, collector, identifier, schema, or automation.
