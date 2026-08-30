# Feasibility, Threat, and Consolidated Reviews

## Evidence correlation

| Link | Classification |
|---|---|
| local bytes and SHA-256; manifest/profile bindings | locally calculated and directly observed |
| authorization identity/state | governance-record observed; not database-observed |
| controller invocation and attempt count | directly observed locally |
| acquisition, driver call, result mapping, release | driver-attested plus locally observed |
| safe session fields, transaction settings, catalog/function state | database-observed only when returned on the same connection |
| begin/stage/rollback/commit acknowledgements | driver-attested server responses |
| Supabase organization/project/region/branch/source mapping | operator/platform-attested; unresolved from database alone |
| evidence package/write/read-back/review input | locally calculated/directly observed; filesystem custody only |

If any acquisition, session, transaction, stage, result, or outcome link is unresolved, the maximum claim is a bounded partial attempt record with possible external continuation—not operational success. If platform mapping is unresolved, database responses cannot be attributed to the declared Supabase project. Post-rollback persistent state cannot be inferred from transaction-local evidence.

## Sprint 17C successor feasibility

| Claim(s) | Classification |
|---|---|
| exact bytes/digest; declarations; new authorization identity; controller invocation | Technically feasible locally; authorization must be created later |
| one connection and explicit transaction | Feasible with selected driver, requires real-driver proof |
| one backend session | Feasible with limitation via safe backend correlation; platform-dependent |
| before gate; two ACL statement completions; immediate direct/effective observations; returned-row attribution | Feasible with limitation on one connection/transaction; requires role validation and newly governed exact SQL |
| rollback request/acknowledgement and release | Technically feasible as distinct driver events; disconnect may make outcome unresolved |
| persistent post-rollback state | Separate future observation only; unobservable from transaction-local evidence |
| external platform identity and proxy behavior | Platform-dependent/unresolved |
| no retry and mandatory stop | Technically feasible only after pinned driver/path behavior proof |
| root cause | Unresolved and must not be claimed |

No SQL, successor artifact, or authorization is created in this sprint.

## Implementation-readiness gates

All 25 gates remain required. Current disposition:

1. `pg` is preferred but not approved/pinned. 2. Dependency addition is separately required. 3–4. Versioned local-only placement and Vite exclusion are designed, not tested. 5–8. Dedicated connection, explicit transaction, and absence/disablement of retry/reconnect require pinned-driver proof. 9–11. Direct path is selected conditionally; endpoint reachability, session affinity, and exclusion of transaction pooling require platform proof. 12. TLS verification policy is defined; CA source unresolved. 13–14. Credential and target-attestation interfaces are designed, not implemented. 15. Role constraints are defined; privileges unresolved. 16. Session fields are classified. 17–19. Timeout, cancellation, and sanitization policy are defined; driver behavior unresolved. 20–21. Correlation and writer integration are designed; production writer policy extension remains. 22. Design implies no live execution. 23–24. Independent security and PostgreSQL review required. 25. Sprint 17C successor remains separately designed and authorized.

The adapter is therefore not implementation-ready.

## Threat model

Protected assets are database credentials, exact operation bytes, authorization scope, target attribution, session/transaction affinity, evidence integrity, and user/application data. Trust boundaries are local operator-to-controller, credential provider-to-driver, TLS connection-to-Supabase, driver-to-REF mapper, and controller-to-filesystem writer.

Primary threats and controls:

- Browser import or credential exposure: local-only entry, no protected/root barrel export, Vite build exclusion test, no browser inputs.
- Wrong target or role: exact declarations plus operator/platform attestation and bounded database session observations; mismatch blocks before stages.
- MITM or target spoofing: verified TLS chain and hostname; no trust bypass.
- SQL substitution/batching: exact bytes/digest, ordered profile, single stage calls, no normalization or unrestricted query interface.
- Pool switch/reconnect/retry/replay: dedicated connection, pinned behavior audit, single-use attempt, mandatory stop on disconnect/timeout; block if behavior cannot be disabled/proven.
- False completion/outcome: distinct request/acknowledgement/result/uncertainty states; release never proves rollback.
- Credential/evidence leakage: opaque provider, bounded whitelist mappers, no raw errors/stacks/connection strings/backend IDs/environment dumps.
- Excess privilege: dedicated REF role and object-specific grants after independent review; no owner/superuser defaults.
- Duplicate execution: one adapter owns transport and witness; no second submitting component.
- Evidence overwrite: existing create-only/read-back writer model; production classification requires explicit extension and still has local-filesystem custody limitations.

Residual risks include platform endpoint mapping, proxy/failover internals, cancellation races, disconnect-after-receipt ambiguity, local host compromise, multi-file writer non-atomicity, and absence of external archive/Git custody.

## Adversarial review

The design rejects: privileged browser paths; frontend credentials; treating Supabase API/RPC as a physical session; transaction-mode pooling with a session-affinity claim; hidden retry/reconnect/failover; pool switching; dual executors; transport/witness duplicate calls; submission or a resolved promise as broad success; rollback submission or release as rollback proof; commit acknowledgement as artifact proof without correlated stages; promotion of operator target declarations; raw backend-ID disclosure; TLS verification disabling; secrets in evidence; default use of `postgres`; confusion of service-role API credentials with database roles; Edge timeout/retry ambiguity; RPC stage hiding; Dashboard execution as authenticated REF evidence; persistent-state inference; Sprint 17C authority reuse; and implementation authorization implied by design.

No contradiction with REF-V1.6–V1.8B was found. The existing adapter is structurally reusable but requires production classifications and real-driver hardening; the writer is synthetic-only and requires a separately reviewed extension.

## Consolidated decision and next sprint

Selected architecture: local Node.js ESM controller, injected credential and target-attestation providers, `pg` as the preferred but unapproved pinned dependency, one direct Supabase PostgreSQL connection, one explicit transaction, one atomic transport/witness adapter with logically separate evidence channels, and the append-only writer after a production-evidence policy extension.

Fundamental blocker: no real PostgreSQL driver exists in the repository, so `OUTCOME_B_DRIVER_DEPENDENCY_OR_PACKAGE_BOUNDARY_REQUIRES_REVIEW` applies. Secondary blockers are direct endpoint reachability/session behavior, TLS CA policy, cancellation/retry/reconnect proof, credential mechanism, least-privilege role feasibility, and independent reviews. If direct connectivity fails, assess session-mode pooler with primary platform evidence; do not fall back to transaction mode while claiming session affinity.

The next sprint may add only the server/local-only driver port adapter, explicit connection configuration, injected credential/attestation providers, `pg` result/error/cancellation/timeout mapping, a fake connection provider, production writer policy design, bundle-exclusion checks, and no-live-execution diagnostics. It must not perform a governed database operation; dependency addition and any later execution require separate approval.

## Documentation diagnostics

- Repository identity, branch, upstream, HEAD, dirty status: PASS.
- FID 001–014 and separate Supabase migration inventories: PASS; migration 015 absent.
- 68-file predecessor manifest and expected aggregate: PASS; unchanged.
- REF-V1.8B eight-file additive inventory and diagnostic: PASS; unchanged.
- Package/lockfile, client/import, Node/Deno/browser/server/RPC/Edge boundaries: PASS.
- All options A–H, driver requirements/candidates, paths, affinity, transaction, result/outcome, retry/reconnect, TLS, credentials, role, correlation, Sprint 17C mapping, gates, threats and adversarial cases: COVERED.
- No live client, connection attempt, network call, secret loading, SQL artifact, authorization, migration, remediation, reconciliation, deployment, retry, staging, commit, or push: PASS.
- ESLint/build: NOT APPLICABLE; documentation/JSON only, no executable JavaScript added.
- Conflict markers, whitespace, protected/predecessor diff, additive inventory hashes, and `git diff --check`: verified in final diagnostics.

