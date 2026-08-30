# REF-4 runtime observation architecture review

Status: `APPROVED_FOR_OBSERVATION_ARCHITECTURE_ESTABLISHMENT`

Reviewed artifacts:

- `RuntimeEvidenceFrameworkObservationArchitecture.md`
- `RuntimeEvidenceFrameworkObservationLayerModel.md`
- `RuntimeEvidenceFrameworkObservationSufficiencyModel.md`

## Review conclusion

REF-4 establishes a generic, implementation-independent observation architecture without creating an observability subsystem or tailoring the model to Sprint 17C. The required concepts, layers, modes, separation, correlation, ordering, fidelity, completeness, interference, failures, multi-observer reasoning, replay distinction, security/privacy constraints, platform coverage, and claim-specific sufficiency model are present.

## Predecessor compatibility

| Authority | REF-4 treatment | Result |
| --- | --- | --- |
| REF-1 governance, trust domains, hierarchy, repository/runtime separation | Applied to observation and cross-layer claims | Preserved |
| REF-2 observation/source/evidence/claim/boundary/relationship/investigation concepts | Specialized; parent definitions remain controlling | Preserved |
| REF-3 authenticity, integrity, provenance, custody, continuity, preservation, review integrity | Required in records, derivatives, transfers, replay, and sufficiency | Preserved |

## Architecture audit

Existing runtime, persistence, deployment, authorization, diagnostic, evidence, and observation documents were reviewed by repository search. Existing artifacts are domain- or Sprint-specific; no competing generic runtime-observation architecture was found. REF-4 remains documentation-only and creates no implementation constants.

## Adversarial findings

- Client, platform, runtime, database, transaction, statement, catalog, and result layers cannot silently prove one another.
- Observation count cannot establish independence.
- High authenticity does not imply high fidelity or completeness.
- Confirmed chronology is insufficient for causality without additional governed support.
- In-band or transaction-local observation may strengthen context while weakening independence or changing behavior.
- “Non-interfering” requires evidence.
- Observation replay and operation replay remain distinct.
- Sufficiency is claim-specific and does not automatically assign an evidence class.
- Least-disclosure constrains evidence capture even where more data might be useful.

## Sprint 17C applicability

The generic model can represent the existing boundary using operator/client, platform, database-session, transaction, statement, catalog/state, and result layers plus submitted-artifact, target, identity, completion, ordering, and correlation gaps. This confirms applicability without changing the protected conclusion, asserting root cause, recommending remediation, designing SQL/diagnostics, or authorizing activity.

## Repository and migration review

Repository, branch, origin, upstream, and inherited dirty worktree were preserved. The governed FID migration package contains exactly `001`–`014`; `015` is absent. The separate frontend Supabase migration directory contains its inherited research-repository migration and is unchanged.

## Limitations

This review validates documentation architecture only. It observes no runtime, authenticates no evidence, and validates no implementation or live system.

## Disposition

Maximum status supported: `RUNTIME_EVIDENCE_FRAMEWORK_OBSERVATION_ARCHITECTURE_ESTABLISHED`.
