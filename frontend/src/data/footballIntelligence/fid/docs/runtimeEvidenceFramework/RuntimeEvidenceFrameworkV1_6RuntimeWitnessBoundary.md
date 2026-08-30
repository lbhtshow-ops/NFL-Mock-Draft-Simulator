# REF-V1.6 Runtime Witness Boundary and PostgreSQL Feasibility

## Decision and repository audit

Outcome: `OUTCOME_A_REF_V1_RUNTIME_WITNESS_PORT_AND_POSTGRESQL_FEASIBILITY_BOUNDARY_ESTABLISHED`.

The repository-owned REF package under `src/data/footballIntelligence/fid/runtimeEvidence` remains the canonical owner. `RuntimeEvidenceContracts.js`, `contractSupport.js`, `canonicalIdentity.js`, and `evidenceModel.js` are reused unchanged for declarations, freezing, identity, observations, relationships, custody, and claim sufficiency. `runtimeEvidenceController.js` remains the orchestration owner; `deterministicFakeTransport.js` remains transport-only. The research-repository persistence ports and Supabase/database adapters are unsuitable because they own application persistence or platform-specific behavior. Sprint 17C deployment, authorization, migration, SQL-review, PostgreSQL-17, function-identity/OID, transaction-local-setting, JSONB-limit, and protected-history artifacts are predecessor references only and are not extended.

Relevant artifact ownership: REF governance documents are protected governance history; REF-V1.1 through V1.5 documents and implementation are protected predecessor design; Sprint 17C deployment/review artifacts are protected execution history; the existing runtimeEvidence package is reusable canonical code; persistence and Supabase adapters are reference-only and unsuitable for the witness port. Additive extension is justified only in the runtimeEvidence package and this V1.6 document.

## Boundary

Dependency direction is controller -> `observeGovernedExecution(request)` port -> deterministic fake adapter -> future PostgreSQL transaction witness. The port imports no database client, SQL, Supabase, filesystem, network, process, controller internals, or operation implementation. Transport submission and witness observation remain separate injected dependencies.

The immutable request binds manifest, execution plan, observation plan, authorization, operation, execution, attempt, target/environment declarations, expected stages, required observations, transaction policy, scope, prohibitions, cancellation reference, deterministic temporal references, and extensions. Sensitive fields and executable inputs are rejected. The immutable result separates witness status, readiness/acceptance, session and transaction reference states, stages, state/result/error/uncertainty observations, chronology, relationships, outcome, gaps, contradictions, limitations, and mandatory stop. Witness completion, operation completion, transaction completion, result capture, evidence sufficiency, and operational success are independent facts.

Session and transaction use explicit `PRESENT`, `ABSENT`, `UNOBSERVABLE`, `INSUFFICIENT`, and `CONTRADICTORY` states; null is never the whole meaning and controller IDs are never promoted. Transaction outcomes distinguish not-started, started, active, request versus observed rollback/commit, failure, abort, unknown, disconnect, and contradiction. A later stage is not proof of earlier completion. State observations conceptually bind subject, reviewed mechanism reference, before/after classification, session, transaction, stage, bounded observed/expected state, comparison, provenance, fidelity, completeness, uncertainty, gaps, and disclosure limits.

Fake evidence is `DECLARED` synthetic fixture evidence with explicit `fixtureOnly`, `actualRuntimeEvidence: false`, and `actualDatabaseEvidence: false`. It cannot satisfy canonical policies requiring `DATABASE_OBSERVED` or `RUNTIME_OBSERVED`. Transport acceptance cannot satisfy stage completion; no session leaves the claim unresolved; unobservable transaction leaves binding insufficient; rollback request is not rollback observation; witness output does not establish persistence; conflicts remain contradictions. Fixture-specific policies may assess a synthetic stage only as a synthetic claim and do not weaken V1.4.

## PostgreSQL feasibility and future adapter contract

1. A future narrow PostgreSQL adapter, not the controller, should own the database client connection.
2. The controller should submit only through that reviewed adapter boundary; external-platform submission cannot guarantee PostgreSQL correlation.
3. A dedicated client connection can ordinarily retain one backend session, subject to pool/proxy behavior that must be verified.
4. One explicit transaction can contain governed stages and immediate observations only if the driver and intermediary preserve the same connection and transaction.
5. Driver completion can distinguish server response from client submission, but does not alone prove business success or durable commit.
6. Direct ACL catalog state may be observed immediately in the same transaction with reviewed bounded access.
7. Effective privilege checks may be observed in the same transaction, subject to role/session semantics and PostgreSQL version review.
8. Sanitized backend/session evidence may be available, but proxies and disclosure rules can reduce fidelity.
9. A stable, safe transaction identifier is not assumed; absence/unobservability is first-class.
10. Result rows require adapter-recorded same-connection, transaction, stage, and correlation bindings.
11. Commit/rollback requests and server acknowledgements can be captured separately; disconnects can leave the outcome unknown.
12. Platform transformations, external receipt, proxy routing, durable state after disconnect, and target authenticity may remain unavailable.
13. Supabase or other platform transformations remain outside the witness unless separately attested.
14. The least-privilege role needs only the pre-reviewed atomic operation and bounded observations; it is a future security decision.
15. Runtime connection material would be needed but must remain outside requests, logs, results, and evidence packages.
16. Secrets can remain in the future adapter's secret provider and never enter evidence.
17. Timeouts, backend termination, network loss, pool reassignment, client crash, ambiguous acknowledgement, and commit disconnect can leave outcomes uncertain.
18. Disconnect is represented explicitly with retained stage evidence and unresolved transaction outcome.
19. A single adapter invocation and controller mandatory stop enforce no retry; authority remains single-use.
20. The adapter accepts only a manifest-bound atomic operation profile, never arbitrary SQL.

Minimum future input: validated witness request, exact artifact/operation identity, target and environment declarations, authorization reference, allowed stages, explicit transaction policy, observation plan, cancellation signal, and output limits. Minimum output: sanitized session/connection observation, transaction observation, stage observations, bounded state/result/failure observations, uncertainty, transaction outcome, residual gaps, and mandatory stop. Credentials, connection strings, raw ACL arrays, unrestricted metadata, environment dumps, and application data are prohibited.

The first production witness should expose one pre-reviewed atomic operation. It rejects arbitrary or edited SQL, unrelated operations, alternate targets, partial execution, retry, continuation, unbounded output, unrestricted catalogs/application data, and privilege expansion. No SQL or adapter is implemented in V1.6.

## Security, adversarial review, and residual gaps

No credentials in evidence or logs; no connection-string capture; no environment dump; no arbitrary SQL/target; no role escalation or `SET ROLE` without separate governance; no superuser assumption; no witness tables; bounded sanitized output; one operation per authorization; explicit transaction; least privilege; mandatory stop; no retry; disconnect uncertainty retained. The manually used Dashboard `postgres` role is not approved for this architecture. A separately governed execution role is an open authorization/security question; V1.6 neither selects nor creates it.

Adversarial checks preserve these separations: witness is neither executor nor authorization authority; controller imports no PostgreSQL behavior; synthetic output is not actual evidence; transport is not witness; IDs are not manufactured; submission is not completion; later stage/result/request/witness completion do not imply prior stage, transaction outcome, or operation success; witness failure is not operation failure; missing facts are not false; contradictions and disconnect uncertainty remain; no retry/second attempt, unrestricted output, credential/environment/filesystem/network/process/database-client behavior, embedded SQL, or reopened Sprint 17C authority exists.

Residual gaps are driver/proxy session affinity, safe session evidence, stable transaction identity, commit acknowledgement ambiguity, precise least-privilege role, platform transformations, and production cancellation semantics. These require implementation review without live execution.

The exact next sprint is **REF-V1.7 — Controlled PostgreSQL transaction-witness adapter implementation in repository with no live execution**.
