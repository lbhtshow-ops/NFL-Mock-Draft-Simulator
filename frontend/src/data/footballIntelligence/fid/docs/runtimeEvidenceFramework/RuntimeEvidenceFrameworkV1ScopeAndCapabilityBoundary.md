# Runtime Evidence Framework V1 Scope and Capability Boundary

## 1. Narrow purpose

REF V1 is the smallest reusable capability able to cross the Sprint 17C.62 evidence boundary: one trustworthy execution-time evidence chain binding an authenticated immutable artifact, target, environment, submission context, observable server/database session, governed stages, same-transaction observation where applicable, result, error or uncertainty, and one correlated protected execution record.

It is not a general observability platform and does not select technology.

## 2. Capability classification

| Capability | V1 classification | Minimum responsibility |
| --- | --- | --- |
| Governed operation manifest | Required | Reference authoritative proposal, scope, stages, expected evidence, stops, and exclusions. |
| Artifact identity binding | Required | Bind exact immutable representation to authorization, submission, and evidence. |
| Target identity binding | Required | Bind evidence to the exact authorized target with residual gaps declared. |
| Environment identity binding | Required | Distinguish authorized operational context. |
| Authorization reference | Required | Reference existing authority and scope without inventing it. |
| Execution identity | Required | Correlate the single execution across observable boundaries. |
| Operator or executor identity declaration | Required | Declare actor identity and attestation source. |
| Client or submission observation | Required | Record complete submission or explicit uncertainty. |
| Runtime or database session observation | Required where observable | Bind server/database context; declare platform limitations. |
| Operation-stage observations | Required | Record completion, failure, partiality, or uncertainty for governed stages. |
| Result correlation | Required | Attribute raw and visible results to the execution. |
| Error and uncertainty capture | Required | Preserve errors, boundary gaps, and unresolved alternatives. |
| Evidence artifact production | Required | Produce one correlated, least-disclosure evidence package. |
| Integrity verification | Required | Verify protected artifacts and evidence against declared identities. |
| Provenance recording | Required | Reuse REF-3 source and derivation vocabulary. |
| Custody recording | Required | Record creation, transfer, transformation, and review custody. |
| Claim-specific sufficiency assessment | Required | Assess only the target claims. |
| Protected execution history | Required | Append attempt, consumption evidence, result, uncertainty, and review. |
| Review record | Required | Preserve reviewer scope, competence, independence, findings, and limitations. |
| Final conclusion reference | Required | Link the evidence package to the separately governed conclusion. |
| Additional independent observation | Optional | Add only when a target claim needs and can support independence. |
| Cross-platform adapter abstraction | Optional | Consider only if one minimal boundary can remain platform-neutral. |
| Automated collection, storage technology, and generalized adapter framework | Deferred beyond V1 | Require dedicated implementation and threat-model audits. |
| General analytics, dashboards, alerting, or broad query capability | Prohibited from V1 | Not required by the evidence gap. |

“Required where observable” remains required as a capability to record either the observation or the precise technical limitation; it is not permission to claim universal visibility.

## 3. Security and least disclosure

V1 records only claim-relevant identities, stage facts, results, errors, and custody data. It minimizes secrets, credentials, personal data, unrestricted role details, query content outside the protected artifact, and unrelated state. Access, retention, redaction, export, and review follow least privilege and REF-3 derivative lineage. Permanent credential capture and permanent query logging are prohibited.

Artifact and target bindings must be authenticatable without exposing unnecessary content. Evidence must not create a new execution, replay, privilege, or inference channel. Observer permissions are separately governed and no broader than required.

## 4. Explicit V1 non-goals

V1 prohibits general application logging; performance or infrastructure monitoring; distributed tracing replacement; production analytics; user telemetry; arbitrary database auditing; unrestricted role or permission inspection; permanent credential capture; permanent query logging; general deployment automation; automatic remediation; automatic retry; migration execution orchestration; application release orchestration; business-domain event sourcing; and replacement of existing FID provenance or persistence systems.

V1 also does not execute SQL, authorize operations, establish business success, determine migration state by result alone, or remediate contradictions.

## 5. Implementation boundary

Manifest shape, identifier technology, observation mechanism, storage, adapter design, execution integration, security implementation, and package placement remain deferred to a dedicated design sprint after a fresh audit. V1 readiness never implies execution authority.
