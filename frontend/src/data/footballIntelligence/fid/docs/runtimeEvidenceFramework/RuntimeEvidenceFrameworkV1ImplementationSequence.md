# REF V1 Implementation Sequence

## Candidate contract boundary

Names are working names; REF-V1.2 must reconcile them with canonical repository terminology before schemas are finalized.

| Candidate / owner | Purpose and canonical references | Conceptual content / prohibited responsibility | Lifecycle / dependency |
| --- | --- | --- | --- |
| Governed Runtime Operation Evidence Manifest / operation owner supplies, REF composes | References existing proposal, artifact, target/environment, authorization, stages and stops | References, expected claims/observations/exclusions; cannot authorize, define SQL or execute | proposed -> bound -> consumed/superseded; V1.2 |
| Runtime Evidence Execution Plan / operation owner | Binds canonical execution/runbook and controller policy | one attempt, inputs, stop/failure rules; cannot create authority or retry | declared -> approved -> attempted/aborted; V1.2 |
| Runtime Evidence Observation Plan / REF | Applies REF observation/sufficiency models | layer, source, fidelity, interference, expected gap per claim; cannot execute operation | drafted -> reviewed -> bound; V1.2 |
| Runtime Evidence Package / REF | Composes existing identities, outcome, provenance and evidence references | component digests, observations, raw bounded result/error, gaps; cannot decide business success | open -> sealed -> verified -> superseded/retired; V1.4 |
| Runtime Evidence Claim Assessment / REF/reviewer | Applies canonical claim and sufficiency vocabulary | evidence links, adequacy dimensions, contradiction/uncertainty; cannot change source facts | pending -> assessed -> reviewed; V1.4 |
| Runtime Evidence Custody Record / evidence custodian | Specializes REF chain of custody | events, actors, component digests, transformations; cannot replace provenance or mutate evidence | append-only; V1.4 |
| Runtime Evidence Review Record / review governance | References existing reviewer/decision/conclusion concepts | scope, competence, independence, findings, limitations, conclusion reference; cannot self-authorize or overwrite | proposed -> completed -> appended; V1.7 |

## Sprint sequence

| Sprint | Objective and permitted scope | Prohibited scope | Dependencies / artifacts / maximum status / stop condition |
| --- | --- | --- | --- |
| REF-V1.2 | Declaration-only contract and package boundary; reconcile names, ownership, identifiers, lifecycle and canonical serialization | Runtime code, SQL, schema, secrets, execution | REF-V1.1; conceptual contracts and conformance plan; `REF_V1_CONTRACT_BOUNDARY_READY`; stop on duplication/ownership conflict |
| REF-V1.3 | Deterministic artifact/manifest identity and package canonicalization | Network/database access or authorization | V1.2; hash/canonicalization behavior and fixtures; `REF_V1_IDENTITY_COMPONENT_READY`; stop if exact-byte binding is ambiguous |
| REF-V1.4 | Evidence package, custody and claim-assessment model | Executor/adapter/persistence | V1.2-3; builders/validators/fixtures; `REF_V1_PACKAGE_MODEL_READY`; stop on unverifiable mutation/redaction lineage |
| REF-V1.5 | Local Node controller using fake transport only | Live service, SQL, automatic retry, stored secrets | V1.3-4; one-attempt controller and safe-failure tests; `REF_V1_LOCAL_CONTROLLER_READY_FOR_FEASIBILITY`; stop on secret leakage or identity loss |
| REF-V1.6 | Non-production feasibility design/proof for one atomic PostgreSQL witness boundary | Sprint 17C successor SQL, remediation, production, broad instrumentation | V1.5 plus separate feasibility authority; evidence report only; `REF_V1_TRANSACTION_WITNESS_FEASIBILITY_ESTABLISHED`; stop if atomicity/session/result binding unavailable or privilege is excessive |
| REF-V1.7 | Protected package history and independent review workflow | Database evidence schema or automatic conclusion | V1.4/6; repository history/review contracts; `REF_V1_REVIEW_PATH_READY`; stop if append-only custody cannot be enforced |
| REF-V1.8 | Sprint 17C successor operation-specific design | Execution or authorization; no reuse of 17C.57/60 authority | V1.6-7; owner-designed witness operation, threat model, claim matrix; `SPRINT_17C_SUCCESSOR_DESIGN_READY`; stop on residual minimum-claim failure |
| REF-V1.9 | Independent security/adversarial review | Execution, remediation, credentials | V1.8; findings/corrections; `REF_V1_SECURITY_REVIEW_COMPLETE`; stop on unresolved critical finding |
| REF-V1.10 | Conditional successor authorization review | Execution unless a later explicit authority separately permits it | All prior sprints; authorization decision only; `REF_V1_SUCCESSOR_AUTHORIZATION_DECIDED`; stop if scope/target/artifact/evidence plan is not exact |

The sequence intentionally places local deterministic work before external integration. REF-V1.6 may select Outcome C or E without invalidating the declaration contracts. No sprint status itself grants execution authority.

