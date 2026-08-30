# REF V1 Selected Architecture Decision

Decision: `HYBRID_LOCAL_CONTROLLER_PLUS_GOVERNED_DATABASE_TRANSACTION_WITNESS`.

Implementation-readiness outcome: `OUTCOME_A_MINIMUM_REF_V1_ARCHITECTURE_SELECTED_AND_CONTRACT_DESIGN_READY`.

## Architecture

An operation owner supplies a separately governed manifest, protected artifact and authorization reference. A local Node ESM controller verifies exact local bytes, constructs an execution identity without replacing canonical operation/request/authorization identities, records the operator declaration and sanitized target/environment, submits exactly one operation, captures the unmodified bounded response/error, builds the evidence package, and records local custody. It does not own SQL semantics or decide success.

An operation-specific PostgreSQL transaction witness, designed and authorized in later sprints, is executed as part of the governed operation. It binds the supplied artifact digest and correlation reference; emits bounded before gate, statement-stage, same-transaction direct ACL and effective-privilege observations; returns a bounded row; and makes transaction termination explicit. It does not become unrestricted instrumentation, general RPC execution, automatic remediation or database logging.

The REF package builder correlates both layers and records gaps. Established review governance assesses each claim and references a separately governed conclusion. Repository protected history is append-only and source controlled for V1; no database evidence schema is required.

## Why selected

The repository already supports Node ESM, SHA-oriented governed artifacts, Supabase client boundaries, PostgreSQL RPC/transaction patterns, operation declarations, authorization/result records, static evaluators, and source-controlled history. Only the hybrid binds controller-observed bytes and result to database-observed session/transaction stages without making REF the business-operation owner. It avoids a new hosted service, persistent credential store, generalized collector, and premature database schema.

## Proves, subject to implementation and evidence quality

- Exact local artifact bytes and digest; manifest/authorization references; declared target/environment; controller execution identity and operator declaration.
- Exact bytes handed by the controller to its client boundary, submission occurrence, timing, raw returned payload/error and local custody.
- When exposed by the witness: receipt of the declared digest/correlation value, database/session/backend and transaction identifiers, ordered stage entry/completion, before gate, immediate same-transaction catalog and effective-privilege observations, bounded result construction, and explicit rollback/commit path.
- Integrity of bundle components through canonical serialization and SHA-256, provenance of derived/redacted artifacts, and claim-specific sufficiency/uncertainty.

## Cannot prove universally

- Hidden platform routing, byte transformations, retries, buffering or truncation not exposed by the platform.
- That a local byte sequence equals every intermediate network representation or PostgreSQL parser input absent platform/server attestation.
- Human intent beyond declaration; actions outside the controller; absence of all side effects; or screenshot fidelity.
- Persistent post-transaction state from a rollback/commit signal alone. A separately correlated authoritative post-state observation and review are required when that claim matters.
- A session or transaction identity the platform does not expose. Such claims remain `UNOBSERVABLE` or `INSUFFICIENT`, never inferred.

## Residual gaps and stop rule

The principal residual gap is external-platform receipt/transformation between the local controller and database witness. The digest/correlation handshake reduces but does not erase it. If feasibility work shows Supabase cannot execute one atomic witness operation, expose adequate transaction evidence, or return bounded data without privilege expansion, stop before contract implementation and reconsider Outcome C or E. No governance contradiction was found in this sprint.

Exact next sprint: `REF-V1.2 — Declaration-only Contract and Package Boundary`.

