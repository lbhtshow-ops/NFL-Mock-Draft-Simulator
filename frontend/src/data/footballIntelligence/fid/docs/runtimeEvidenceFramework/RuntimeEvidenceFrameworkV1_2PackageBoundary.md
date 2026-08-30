# REF V1.2 Package and Dependency Boundary

Status: `REF_V1_DECLARATION_BOUNDARY_ESTABLISHED`.

## Canonical placement and ownership

Declaration-only contracts, constants, support validation, barrel exports, and diagnostics live at `frontend/src/data/footballIntelligence/fid/runtimeEvidence`. FID owns this module as the implementation boundary of REF governance. Governance and design remain at `frontend/src/data/footballIntelligence/fid/docs/runtimeEvidenceFramework`.

Future local-controller code belongs below `fid/runtimeEvidence/controller`; future observer port declarations below `fid/runtimeEvidence/ports`; future local and database adapters below `fid/runtimeEvidence/adapters/local` and `fid/runtimeEvidence/adapters/postgresql`. Those paths are reservations, not directories created by this sprint. Future operation-specific evidence records belong in an append-only child selected by the operation owner; review and protected-history records remain separately appended and referenced. No runtime or evidence-history directory was created.

Dependency direction is unidirectional: canonical FID operation, identity, authorization, target, result, uncertainty, provenance, review, conclusion, and protected-history declarations are referenced by REF contracts; future controller and ports consume REF contracts; future adapters implement ports. Canonical operation domains never import REF to establish business validity. Shared contracts never import adapters, database clients, filesystem facilities, network facilities, governed operation history, or privileged behavior.

## Seven-contract decision

Seven contracts are necessary. Execution plan owns expected operation stages and boundaries; observation plan owns observation layers and claim sufficiency. Combining them would conflate operation ownership with evidence governance.

| Contract | Owner | Purpose | Canonical reuse |
| --- | --- | --- | --- |
| `GovernedOperationEvidenceManifest` | REF composition; supplied context remains operation-owned | Bind evidence scope to governed context | References operation, artifact, authorization, target, environment, operator, owner and predecessor identities |
| `RuntimeEvidenceExecutionPlan` | Operation owner | Declare expected stages and boundaries | References canonical operation, manifest, stages, stops, results and uncertainty |
| `RuntimeEvidenceObservationPlan` | REF | Declare layers, points, correlation and sufficiency | References canonical identities, claim and uncertainty concepts |
| `RuntimeEvidencePackage` | REF | Immutable evidence composition for one execution/attempt | References canonical evidence, provenance, integrity, custody, review and conclusion records |
| `RuntimeEvidenceClaimAssessment` | REF assessor/reviewer | Claim-specific support assessment | References canonical claim, uncertainty, evidence and assessor identity |
| `RuntimeEvidenceCustodyRecord` | Evidence custodian | Custody, preservation, derivative and continuity declaration | References canonical package, custodian, provenance and temporal policy |
| `RuntimeEvidenceReviewRecord` | Review governance | Append a governed package/claim review | References canonical reviewer, decision and conclusion records |

All are version `1.0.0`, schema version `1.0.0`, and mode `DECLARATION_ONLY`. The shared disposition vocabulary specializes REF record disposition only; it does not replace operation or authorization lifecycle. Accepted values are `DRAFT`, `REVIEWED`, `ACCEPTED`, `SUPERSEDED`, `ARCHIVED`, `REJECTED`, and `UNRESOLVED`. Supersession is additive; no conversion, deletion, or automatic transition exists.

## Compatibility and structural validation

Patch/minor additions may add optional, non-security-sensitive fields without changing owned meaning. New required fields, changed ownership, or changed security semantics require a major version. Unknown top-level fields are preserved only when explicitly modeled; bounded `extensions` accept at most 32 keys and cannot override canonical/version/required fields. Collections are bounded at 256 items. Schema conversion, persistence migration, and automatic deprecation are deferred.

Validation is pure and input-preserving: required reference presence, declared enum membership, collection bounds, duplicate-reference rejection, prohibited-field rejection, extension bounds, and recursive rejection of functions, authority/execution behavior, secret-bearing keys, unrestricted environment data, database clients, network clients, filesystem writers, and operation text. It performs no resolution, I/O, hashing, execution verification, target verification, business interpretation, or conclusion creation. Outputs are deeply frozen.

## Field classification

Fields ending in `Ref` or `Refs` are non-sensitive references owned by their canonical domains; REF does not assign their identities. Required references bind identity and ownership; optional references declare unavailable or irrelevant context as `null`, never empty-string evidence. Observation state explicitly represents `OBSERVED`, `ABSENT`, `UNOBSERVABLE`, `INSUFFICIENT`, `CONTRADICTORY`, and `UNRESOLVED`. Evidence values are references to bounded observations, not unrestricted payloads. Operator/custodian/reviewer declarations are attestations unless separately backed by runtime-observed evidence. Contract objects are immutable; later records supersede or append.

## Future boundaries

Artifact identity, target/environment attestation, and authorization reference are externally governed input ports. Local submission observation and database transaction witness are ports with future local/PostgreSQL adapters. Result capture and integrity are pure/bounded services behind ports. Evidence-package writer and custody recorder are repository writers. Claim assessor is a pure claim-scoped service; evidence reviewer is governed review input. All are deferred. No behavior-bearing interface was necessary for package clarity.

## Sprint 17C successor representational check

The observation-plan diagnostic declares references for exact artifact, target/environment, new authorization, execution, operator, submission, receipt, observable session/transaction, before gate, two ACL stages, immediate direct ACL, effective privilege, returned result, transaction termination, persistent-state uncertainty, external-platform gap, contradiction, and final claim sufficiency. This demonstrates representational capacity only; it creates no operation-specific manifest, evidence, authority, operation text, or conclusion.

