# REF-V1.5 Local Controller Boundary

## Decision and scope

`OUTCOME_A_REF_V1_LOCAL_CONTROLLER_WITH_FAKE_TRANSPORT_ESTABLISHED` is selected. The canonical boundary is `runRuntimeEvidenceController`. It is a local Node.js ESM orchestrator for exactly one synthetic attempt. It accepts the existing manifest, execution-plan, and observation-plan declarations plus one narrow invocation object containing supplied references and exact in-memory artifact bytes. The invocation is not authority.

The controller owns structural validation, exact local byte verification, declared preconditions, a synthetic attempt context, invocation of injected fake transport, deterministic event/observation capture, V1.4 package/custody/claim construction, review-ready preparation, and mandatory stop. It does not own the governed operation, SQL, authorization validity, target truth, runtime or database truth, persistence, retry, remediation, reconciliation, operational success, or final conclusions.

## Audit and reuse

No existing REF controller, transport adapter, command dispatcher, cancellation controller, or execution service represented this boundary. Existing FID ports are either persistence/identity-specific or behavior-free designs and are unsuitable as a governed evidence transport. REF-V1.5 reuses the seven V1.2 contracts unchanged, V1.3 Web Crypto exact-byte and structured identities, and V1.4 observations, package builder/finalizer, custody continuity, claim sufficiency, and review-ready builder. Canonical FID identities and authorization declarations remain external references; no duplicate RuntimeExecution or authorization contract was created.

The only executable adapter is `createDeterministicFakeTransport`. Its bounded submission contains references and an artifact digest, never executable content. It records calls in memory, returns configured fixture data, labels itself as a deterministic fake, separates acceptance/result from operation success, and establishes no external receipt. Injected clock, identity, and cancellation providers eliminate current time, randomness, process, host, environment, filesystem, database, and network dependencies.

## Lifecycle and semantics

The deterministic lifecycle is invocation received; input, manifest, execution-plan, and observation-plan validation; artifact verification; target/environment declaration review; authorization-reference structural review; precondition result; synthetic context; attempt start; optional local modeling of single-use consumption; submission preparation; one fake transport call; submission/stage/result/failure/uncertainty capture; V1.4 package construction; two in-memory custody declarations; supplied claim assessment; review-ready preparation; termination; mandatory stop.

Mandatory precondition failures and digest mismatch block transport. `ACTIVE_UNCONSUMED` plus an explicit one-attempt, non-reusable, no-retry policy is structurally eligible. Attempt start may return a modeled local `CONSUMED` view without mutating or consuming the source authorization. Every transport outcome, including failure or uncertainty, still terminates after one call. A consumed fixture is rejected on a later invocation.

Controller lifecycle evidence is `CLIENT_OBSERVED`. Operator identity remains a supplied attestation reference. Configured fake observations are forced to fixture-only extensions and cannot establish actual runtime/database evidence. Missing platform receipt is `UNKNOWN/UNOBSERVABLE`; missing transaction attribution is `UNKNOWN/INSUFFICIENT`. Result return is not operational success, cancellation is not external stop, chronology is not causality, package construction is not claim sufficiency, and sufficiency is not a conclusion.

Custody records declare local creation and in-memory review transfer with explicit no-archive and persistence-deferred gaps. Consequently continuity is `GAPPED`, never continuous long-term custody. Claims are created only from supplied policies. The fake boundary cannot satisfy a real platform, database-session, transaction, or persistent-state witness requirement.

## Next sprint

The repository sequence confirms the exact next sprint is `REF-V1.6 — Non-production feasibility design/proof for one atomic PostgreSQL witness boundary`. REF-V1.5 grants no feasibility, database, or execution authority.
