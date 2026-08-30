# REF-V1.7 PostgreSQL Transaction-Witness Adapter

## Decision and status

Selected outcome: `OUTCOME_A_REF_V1_POSTGRESQL_TRANSACTION_WITNESS_ADAPTER_ESTABLISHED_WITH_FAKE_DRIVER`.

Maximum status: `RUNTIME_EVIDENCE_FRAMEWORK_V1_POSTGRESQL_TRANSACTION_WITNESS_ADAPTER_ESTABLISHED_WITH_FAKE_DRIVER`.

This sprint adds a production-shaped adapter boundary and exercises it only with an injected deterministic in-memory fake. It creates no database client, connection factory, executable operation artifact, migration, authorization, deployment, remediation, reconciliation, or persistent evidence writer.

## Repository audit

The audit established repository `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, branch `main`, upstream `origin/fid-persistence-v1.0.1`, and HEAD `f9f8272e8ea868534c9fbc36cf174769367fc6a1`. The extensive inherited dirty worktree was preserved. The governed FID migration inventory is exactly `001` through `014`; `015` is absent. Separately, the Supabase CLI inventory contains only `frontend/supabase/migrations/20260714_create_research_repository_tables.sql`. These inventories are not interchangeable.

REF governance, REF-V1.1 through REF-V1.6, and Sprint 17C execution/authorization history are protected predecessors. Existing REF implementation and documentation were untracked at audit time, so Git does not authenticate their historical contents. Application persistence ports prohibit the very client/connection capabilities this adapter must inject and were not reused. Canonical REF freezing, SHA-256 identity, witness result, controller, observation, package, custody, and claim-assessment utilities were reused. The additive owner is `runtimeEvidence`.

Relevant owners and decisions: governance documents are governance-owned and protected; deployment and Sprint 17C artifacts are deployment-governance-owned, protected, and reference-only; `RuntimeEvidenceContracts.js`, `canonicalIdentity.js`, `evidenceModel.js`, and `runtimeWitness.js` are REF-owned and reused; `runtimeEvidenceController.js` remains controller-owned and platform-independent; persistence/Supabase adapters are application-platform-owned and unsuitable; the three REF-V1.7 adapter modules are REF-owned additive extensions.

## Architecture and semantics

Dependency direction is controller -> platform-independent Runtime Witness Port -> PostgreSQL transaction-witness adapter -> injected narrow driver port -> deterministic fake. The controller imports no PostgreSQL module. The adapter imports no Supabase or production database client, filesystem, process, shell, business domain, remediation, migration, or authorization creator.

The atomic profile binds manifest, execution plan, observation plan, exact artifact identity, inactive authorization reference, target, environment, execution, attempt, correlation, transaction policy, ordered stages, exact UTF-8 payload digest, bounded output, stop conditions, and prohibited actions. It rejects missing bindings, duplicate/reordered stages, unsupported types/policies, optional partial selection, retry, interactive continuation, sensitive fields, application-data capture, unrestricted catalogs, and unbounded output. The profile never authorizes execution.

Stage payloads are opaque pre-reviewed fixture text plus an exact UTF-8 SHA-256 digest. Bytes are derived without normalization immediately before comparison. Payload identity failure occurs before connection acquisition. Payload content is never constructed or interpreted by the adapter, and no production ACL operation is embedded.

One adapter invocation acquires exactly one connection object and checks object and sanitized reference identity after every driver call. Session evidence is retained only when supplied safely by the fake; controller or attempt identifiers are never substituted. No reacquisition, failover, or retry exists. Release is attempted exactly once and release failure preserves uncertainty.

Transaction chronology separates begin request from acknowledgement; submission from completion; rollback/commit request from observed outcome; and release from transaction outcome. Default fixtures require rollback and prohibit commit. The structurally modeled commit path is synthetic only. A stable PostgreSQL transaction identifier is optional. Stages execute once, in exact sequence, on the same connection and transaction; the first failure stops later stages. Governed operation and bounded observation stages remain distinct. Results, errors, uncertainty, contradiction, session, transaction, and residual gaps remain distinct fields.

Bounded observation fixtures expose only synthetic classifications, Booleans, and bounded rows. Raw ACL arrays, OIDs, credentials, connection material, role graphs, catalogs, and application data are prohibited. Output above 8,192 bytes or 64 rows is invalid at the profile level, with fixture limits narrower still.

Cancellation before connection or later checkpoints stops progress. Cancellation or disconnect after submission is not proof PostgreSQL stopped; absent authoritative outcome, transaction outcome remains unknown and possible external continuation is a residual gap. Rollback or commit request without observation remains only a request. Known rollback plus release failure retains the known rollback and adds release uncertainty; unknown outcome plus release failure remains unknown.

The controller invokes transport and witness at most once and maps adapter declarations into existing observations, packages, custody, and claim assessments. All fake-driver results are `DECLARED`, `fixtureOnly`, `actualRuntimeEvidence: false`, and `actualDatabaseEvidence: false`. They cannot satisfy policies requiring database-observed, runtime-observed, platform-attested, or externally verified evidence. Neither adapter nor controller makes an operational-success or root-cause conclusion.

## Security review

The request/profile scanners reject credential, token, connection-string, environment-object, unrestricted client/pool/query, and executable fields. The adapter receives a precomposed driver and never loads credentials. Only sanitized references and bounded metadata enter evidence. Raw driver objects and stack traces never enter results. There is no role escalation, `SET ROLE`, arbitrary target, unrestricted executor, retry, automatic cleanup on another connection, or authorization mutation. Runtime behavior performs no filesystem, network, process, shell, or environment access.

Security result: accepted for deterministic fake-driver composition only; live composition remains prohibited.

## PostgreSQL 17 semantics review

The modeled distinctions are compatible with PostgreSQL transaction concepts: an explicit begin must be acknowledged before active state; each command completion is distinct from client submission; same-transaction observation requires session affinity; rollback/commit requests do not establish outcomes; and disconnect can make an outcome unknowable. No stable transaction ID is assumed. This is a static design review, not PostgreSQL evidence.

The fake cannot prove real driver session affinity, catalog visibility, utility-command completion, proxy or transaction-pooling behavior, hidden platform retries/transformations, cancellation/disconnect behavior, commit acknowledgement, Supabase routing, credential/TLS behavior, or production role permissions. Each remains a blocker for live composition.

## Adversarial review

Review found no arbitrary operation builder, authority creation, alternate target selection, payload editing/normalization, digest bypass, second connection, stage reorder/skip, request-to-outcome promotion, observation outside the modeled transaction, close-as-rollback inference, uncertainty erasure, hidden truncation, raw metadata exposure, fixture-to-real evidence promotion, retry, process/network/client import, runtime filesystem write, environment-secret read, or Sprint 17C authority reopening. The fake cannot expose pooling or proxy reassignment hidden below a future production driver; that limitation remains explicit.

## Synthetic Sprint 17C fixture boundary

The 22-scenario inventory covers the required success, digest, affinity, begin, stage failure, observation uncertainty, transaction attribution, rollback, disconnect, cancellation, contradiction, output, second-connection, no-retry, package, source-classification, and inactive-authority cases. Payloads name only synthetic roles: before-state gate, two governed ACL stages, direct-state observation, effective-state observation, and rollback. There is no executable SQL and historical consumed authorities remain inactive; a new authorization remains required and is not created.

## Baseline custody declaration

REF-V1.7 establishes a current-filesystem SHA-256 baseline for predecessor REF implementation and documentation. The measurement describes current bytes only. Historical Git tracking is not established, all measured predecessor REF files were recorded separately as untracked, and no retroactive custody or Git-authentication claim is made. Future comparisons may use this baseline. Additive REF-V1.7 files are reported separately to avoid recursive inventory. No predecessor file was rewritten to insert hashes.

## Next sprint

Exact next sprint: **REF-V1.8 — Controlled local submission composition and append-only evidence-package writer, with fake external dependencies only**.
