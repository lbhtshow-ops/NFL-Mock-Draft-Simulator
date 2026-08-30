# REF-V1.1 implementation-design review

Final status: `RUNTIME_EVIDENCE_FRAMEWORK_V1_MINIMUM_ARCHITECTURE_SELECTED`.

Selected outcome: `OUTCOME_A_MINIMUM_REF_V1_ARCHITECTURE_SELECTED_AND_CONTRACT_DESIGN_READY`.

## Review conclusion

The repository, all 14 governed migrations, REF-1 through REF-6 governance, FID contracts/runtime boundaries, and protected Sprint 17C.57-62 history were audited. No governance contradiction was found. The minimum architecture is a local Node ESM evidence controller plus a narrowly governed, operation-specific PostgreSQL same-transaction witness. Repository-only append-only structured evidence is sufficient for initial persistence. Exact next sprint is `REF-V1.2 — Declaration-only Contract and Package Boundary`.

## Disposition summary

Reuse unchanged: operation/request/invocation/artifact/authorization/attempt identities; deployment target/environment, stages and stops; result/failure/uncertainty vocabularies; REF provenance, custody, observation, sufficiency, review and history governance; validation and immutable-hash patterns.

Potential additive extension: existing operation manifests/runbook records may gain REF evidence references, but only under their owners. New REF-specific artifacts are limited to cross-boundary evidence manifest composition, observation plan, evidence package, claim assessment, custody application and evidence review. Deferred: hosted executor, generalized adapters, automated storage, database schema and cross-platform abstraction. Prohibited: duplicate identities/lifecycles, general logging/observability, business-operation ownership, automatic retry/remediation and authority creation.

## Architecture and limitations

Options A-F were evaluated. Manual capture cannot cross the server/session/transaction boundary. Local-only control cannot prove database stages. Database-only observation cannot prove local bytes or client-visible results. Hosted execution has no demonstrated repository implementation and adds secret/custody boundaries. Browser execution is unsuitable for privileged control. The hybrid provides the strongest bounded correlation while preserving ownership.

It can prove only observations actually exposed and authenticated by its two components. Hidden platform transformations/retries, exact PostgreSQL parser input, unexposed transaction identity, human intent, and persistent state without separate observation remain gaps. Any such gap is recorded as uncertainty or insufficiency.

## Security and persistence

The initial design stores no secrets and requires process-local injection, allowlisted metadata, bounded results, sanitized errors, derivation lineage, least-privileged witness behavior and no unrestricted role/application/log capture. Evidence packages are immutable structured repository artifacts with append-only custody/review. Supabase persistence is deferred until owner, lifecycle, ACL, retention, supersession and migration governance exist.

## Activity boundary

REF-V1.1 created documentation only. It created no executable code, contract, adapter, schema, authorization or directory outside the established REF documentation location. It performed no SQL, Supabase, database, application runtime, migration, deployment, collector, observer, executable diagnostic, remediation, reconciliation, rollback diagnostic or authorization activity.

