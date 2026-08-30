# REF-V1.12 consolidated review

Status: `RUNTIME_EVIDENCE_FRAMEWORK_V1_REAL_COMPOSITION_WITH_FAKE_PROVIDERS_ESTABLISHED`

Outcome: `OUTCOME_A_REAL_COMPOSITION_WITH_FAKE_PROVIDERS_IMPLEMENTED_AND_VALIDATED`

Security: `REF_V1_12_COMPOSITION_SECURITY_PASSED_WITH_RUNTIME_PROOF_REQUIRED`

PostgreSQL: `REF_V1_12_POSTGRESQL_COMPOSITION_STATIC_REVIEW_PASSED_WITH_LIVE_PROOF_REQUIRED`

The additive Node-only boundary reuses the REF-V1.10 `pg.Client` factory and driver, the authoritative PostgreSQL transaction witness adapter, runtime evidence controller, and evidence package pipeline. The controller's deterministic fake transport remains the logical local submission model; the injected pg witness is the sole future physical transaction owner. It performs one fake target acquisition, one fake credential acquisition, one fake Client acquisition, one explicit rollback transaction, one controller call, one witness call, and zero retry.

Target, credential-presence, TLS, endpoint, database, and role facts are fixture declarations only. They are not platform-attested, connection-observed, database-observed, or externally verified. The synthetic Sprint 17C successor fixture creates no SQL or authority and declares a new authorization required. Persistent state and root cause remain unresolved.

Residual limitations: no live endpoint, DNS, TCP, TLS, credential-store, authentication, role, database, cancellation-after-submission, server-timeout, or persistent-state proof exists. Live proof requires a separate future sprint and authorization.
