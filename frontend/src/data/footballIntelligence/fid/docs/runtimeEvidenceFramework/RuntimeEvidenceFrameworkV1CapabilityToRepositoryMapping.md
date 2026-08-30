# REF V1 Capability-to-Repository Mapping

All classifications reproduce REF-6. “First” means required before the first Sprint 17C runtime-evidence operation.

| # | Capability / REF-6 class | Repository support and reuse | Minimum V1 need / owner | Security / First / deferral |
| --- | --- | --- | --- | --- |
| 1 | Governed operation manifest / Required | Deployment manifests, plans, declarations, runbook steps | New REF composition referencing operation-owned scope/stages/stops | No embedded secret; Yes; no deferral |
| 2 | Artifact identity / Required | SQL artifact contracts, SHA-256 declarations, static oracles | Reuse operation artifact identity; controller verifies bytes | Digest plus path-safe label; Yes |
| 3 | Target identity / Required | Deployment environment and target authorizations | Reference canonical sanitized target and database witness | No URL/credential leakage; Yes |
| 4 | Environment identity / Required | `FidDeploymentEnvironment*Contract` and runtime configuration | Reference governed environment identity | Allowlist only; Yes |
| 5 | Authorization reference / Required | Numerous immutable `*Authorization.js` lifecycles | Reference only; authorization governance owns | Never reopen/extend; Yes |
| 6 | Execution identity / Required | Execution records and REF lifecycle | REF generates correlation instance linked to canonical identities | Non-secret random identifier; Yes |
| 7 | Operator/executor declaration / Required | `FidDeploymentOperatorConfirmationContract` | Reuse actor declaration plus attestation source | Pseudonymous/bounded; Yes |
| 8 | Client/submission observation / Required | Supabase client/command boundary; manual runbooks | Local controller records exact handoff and response | Never log token; Yes |
| 9 | Runtime/database session / Required where observable | RPC/SQL patterns; 17C.60 shows current gap | Narrow witness fields or explicit unobservable reason | Sanitize role/host; Yes as observation-or-gap |
| 10 | Operation stages / Required | Runbook steps, SQL staged declarations and evaluators | Witness emits ordered bounded stage events | No general statement logging; Yes |
| 11 | Result correlation / Required | Result records/evaluators and adapter mappers | Preserve raw bounded server row plus client-visible form | Size limits/redaction; Yes |
| 12 | Error/uncertainty / Required | Failure records; REF outcome taxonomy | Package all failures, interruptions and alternatives | Safe errors only; Yes |
| 13 | Evidence package / Required | No cross-boundary equivalent | New REF package composing references and artifacts | Least disclosure, immutable digest; Yes |
| 14 | Integrity verification / Required | SHA/static oracle conventions | Canonical serialization and digest inventory | Hashes do not establish authenticity alone; Yes |
| 15 | Provenance / Required | REF-3 and FID source lineage | Reference canonical vocabulary; derivation entries | No parallel vocabulary; Yes |
| 16 | Custody / Required | REF chain-of-custody; source control | New package custody events | Bounded custodians/access; Yes |
| 17 | Claim sufficiency / Required | REF sufficiency model, static evaluators | Claim matrix with observed/gap/contradiction status | No overclaim; Yes |
| 18 | Protected history / Required | Deployment records and source-controlled revisions | Append-only evidence bundle/reference; no DB schema | Restricted repository path; Yes |
| 19 | Review record / Required | Review contracts and 17C reviews | REF evidence review referencing existing reviewer governance | Independence/limitations; Yes |
| 20 | Final conclusion reference / Required | REF relationship/history models and 17C conclusions | Link only; decision owner remains external | No automatic conclusion; Yes |

Optional additional independent observation is deferred unless a claim needs it. Cross-platform adapter abstraction is limited to an interface seam and deferred until a second adapter exists. Automated collection/storage frameworks are beyond V1. Analytics, dashboards, alerting and broad query capability are prohibited.

## Sprint 17C claim coverage

The 20 target claims map respectively to capabilities 2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 10, 10, 10, 10, 10, 11, 10/12, 17/20, 12/17, and 13/16/18/19. Before-state, both ACL stages, direct ACL observation, effective privilege and rollback outcome require the database witness. Persistent post-state remains a separate conclusion based on rollback semantics plus separately governed post-state evidence; it is not asserted by the controller.

