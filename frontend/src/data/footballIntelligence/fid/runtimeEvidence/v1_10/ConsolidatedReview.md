# REF-V1.10B consolidated review

## Repository and ownership audit

The protected runtime-evidence root owns the Runtime Witness Port, atomic-operation profile, result limits, controller/evidence integration, immutable-output convention, and authoritative `postgresTransactionWitnessAdapter.js`. Those artifacts remain unchanged and are reused through their existing injected-driver methods. The additive `v1_10/node` boundary owns only Client acquisition, the adapter-compatible driver, bounded pg result/error mapping, timeout/cancellation declarations, fake Client mechanics, and Node-only exports. Browser barrels, React code, Vite entries/configuration, package files, prior inventories, migrations, and capture evidence are protected and unchanged.

The installed `pg@8.22.0` ESM surface exposes `Client` and `Pool`; only `Client` is imported and `Pool` is neither imported nor constructed. Static package review confirms the public `connect`, `query`, `end`, error/end event, and serial query-queue semantics used by the boundary. No real Client was constructed during diagnostics.

## Design and behavior

One factory acquisition produces one injected Client and rejects a second acquisition or post-end reuse. Sanitized target configuration and an injected credential-provider result are separate; no environment object is accepted or read, and credentials are absent from outputs. The target provider emits declarations classified `DECLARED`, never database observations.

The driver binds each call to the validated profile's exact stage reference, sequence, type, payload text, and payload digest. It rejects reordered, duplicate, changed, concurrent, unplanned, inactive, or terminal calls. Queries are awaited serially. The supported transaction policy is rollback-required/commit-prohibited: one explicit BEGIN, one rollback after successful stages, zero commit, one end, zero retry/reconnect/replacement/failover/replay.

Result mapping allows bounded plain JSON-like scalar structures only, with 64 rows, 8192 canonical bytes, 32 columns, bounded strings, and bounded depth. Unsupported prototypes, dates, buffers/views, bigint, functions, symbols, cycles, excessive output, and Client-bearing results fail closed. Error mapping retains only bounded generic fields and uncertainty context; raw stack, detail, query text, credentials, and connection internals are excluded.

Timeout and cancellation support is declarative/fake-only. Any event after possible submission preserves unresolved external continuation and does not establish server cancellation, rollback, or operation failure. End is never treated as rollback evidence.

## Reviews and decisions

- Security: `PG_CLIENT_ADAPTER_IMPLEMENTATION_SECURITY_PASSED_WITH_NON_BLOCKING_LIMITATIONS`.
- PostgreSQL semantics: `PG_CLIENT_ADAPTER_STATIC_SEMANTICS_REVIEW_PASSED_WITH_RUNTIME_PROOF_REQUIRED`.
- Outcome: `OUTCOME_A_PG_CLIENT_DRIVER_IMPLEMENTED_AND_FAKE_ONLY_VALIDATED`.
- Final status: `RUNTIME_EVIDENCE_FRAMEWORK_V1_PG_CLIENT_ADAPTER_IMPLEMENTED_AND_FAKE_ONLY_VALIDATED`.

Residual limitations are deliberate: no live endpoint, TLS, credential provider, server timeout, cancellation transport, database attestation, transaction outcome, or PostgreSQL runtime behavior was tested. Those require a later, separately authorized REF-V1.11 sprint. No Sprint 17C authority was created or reactivated.
