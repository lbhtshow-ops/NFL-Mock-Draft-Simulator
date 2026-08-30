# Real Driver Architecture and Security Design

## Option assessment

| Option | Affinity and evidence | Main risk | Decision |
|---|---|---|---|
| A. Local Node + direct PostgreSQL | Best: dedicated client, explicit transaction, same-connection observations and command completion | Direct host reachability (including IPv4/IPv6), TLS/CA, dependency and role unresolved | **Selected minimum**, conditional on proof gates |
| B. Local Node + Supabase session-mode pooler | Logical client/transaction affinity likely possible; physical backend identity and failover semantics require platform proof | Proxy transformation/reassignment/cancellation and prepared-statement behavior | Fallback only after primary platform evidence |
| C. Transaction-mode pooler | Transaction affinity may exist, but session affinity outside/around the transaction is not guaranteed | Transaction pooling conflicts with one backend-session claim | Rejected for governed diagnostic |
| D. Edge Function owns connection | Can keep secrets server-side | Deno dependency/runtime, HTTP and function timeout/retry, cold-start and session evidence gaps | Rejected as non-minimum |
| E. Narrow PostgreSQL RPC | Database can make operation atomic | Hides stage-level submission/completion and session evidence behind one API call | Rejected for REF witness needs |
| F. Dashboard SQL Editor | Operator-visible and historically used | Opaque connection/session/retry, manual byte handling, weak machine correlation | Rejected |
| G. Local controller + DB witness function | Strong database-side correlation possible | Adds privileged function and duplicates/changes governance surface | Deferred; unnecessary initially |
| H. Browser Supabase client / existing research adapter | Repository-supported API path | Exposes an untrusted boundary and cannot own PostgreSQL session | Prohibited |

All options can locally bind artifact bytes/digest, target declaration, authorization reference, and evidence package. Only A directly exposes the minimum connection and stage lifecycle. None alone proves the Supabase project/region/branch from PostgreSQL; platform/operator attestation remains distinct.

## Selected composition and ownership

Future location: a new versioned local-only sibling such as `src/data/footballIntelligence/fid/runtimeEvidence/v1_10/server/`, imported only by a local Node entry point and never by a protected/root barrel.

`local Node entry -> credential provider -> target/environment attestation provider -> direct connection provider -> PostgreSQL transaction-witness adapter -> Runtime Evidence Controller -> evidence package -> append-only writer`

One atomic adapter owns the real dedicated connection and is both governed transport and witness. It emits separate logical records for submission request, bytes handed to driver, server completion/error, immediate same-transaction observations, returned result, and transaction outcome. A second transport must not execute the same operation. The REF-V1.5 fake transport remains only for synthetic tests.

## Candidate drivers

| Candidate | Repository availability | Capabilities and risks | REF conclusion |
|---|---|---|---|
| `pg` / node-postgres | Not installed | ESM-interoperable; `Client` or checked-out `PoolClient` supports dedicated connection and explicit transaction, serialized calls, TLS, timeouts, command/row metadata and injectable tests. Cancellation API and reconnect/failover absence must be proven for the pinned version. Pool replacement must not continue an attempt. | Preferred candidate, but dependency/version approval blocks implementation |
| postgres.js | Not installed | ESM and explicit transactions; reservation API may dedicate a connection. Tagged-template normalization, cancellation, reconnect/failover, and exact supplied-text execution require proof. | Secondary candidate |
| Supabase JS | Installed (`^2.110.7`) | HTTP API/RPC, not a PostgreSQL connection; no backend session ownership | Unsuitable |
| Deno PostgreSQL driver | Not found as locked dependency | Edge-only possibility; version, TLS, connection, cancellation and platform support unresolved | Unsuitable for selected local Node path |
| RPC/platform HTTP/native transport | RPC patterns exist; no native HTTP PostgreSQL transport found | Atomic server function possible, but stage and session details are hidden or transformed | Unsuitable |

The future driver port must expose only `acquireDedicatedConnection`, `beginTransaction`, exact single-stage execution, bounded mapped result, `requestRollback`, separately governed `requestCommit`, safe cancellation, and release-once. It must reject concurrent queries, batching outside the profile, retry, reconnect continuation, failover continuation, unrestricted caller SQL, and a changed connection object/session. Exact payload text and digest cross the port unchanged.

## Target and session binding

Target: Lunch Break Hot Take / LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` / `us-east-1` / `main` / Primary Database / `DEDICATED_NON_PRODUCTION_TEST`. `PRODUCTION` is only a primary-branch topology label.

| Value | Required classification |
|---|---|
| organization, project name, reference, region, branch, database source, governed environment | repository-declared plus operator/platform-attested; never promoted to database-observed |
| endpoint host, port, database, connection path, TLS policy, role | environment-injected bounded declarations; host/port/path also operator-attested |
| `current_database`, `current_user`, `session_user`, application name, isolation/read-only state | database-observed after connect |
| endpoint-to-project mapping | platform-attested; unresolved until separately verified |
| backend PID | sensitive, unstable, correlation-only; hash or package-local opaque reference, never raw portable output |
| client address | sensitive and optional; omit by default |
| transaction timestamp | optional, unstable, correlation-only |
| server version | optional bounded major/minor; insufficient alone |
| database host attribution / connection mode | often proxy/platform-derived; unresolved unless explicitly attested |
| target schema/function identity | required, database-observed with bounded names/metadata |

There is no assumed stable PostgreSQL transaction identifier. Session-mode and transaction-mode poolers differ materially: transaction mode may bind a backend only for the transaction and cannot support broader session claims; session mode is a possible fallback but requires proof of no reassignment/failover during the client lifetime. Direct connection is selected because it most directly meets one logical connection, one observable backend session, one explicit transaction, ordered stages, and same-connection observation. Physical identity remains a bounded correlation claim, not platform identity proof.

## Completion and transaction evidence

The driver mapper records these states distinctly: submission requested; exact bytes/digest handed to driver; call accepted locally; server command-completion received; bounded rows/command tag received; server error received; failure before known receipt; disconnect after possible receipt; timeout with possible continuation; cancellation requested; cancellation acknowledged where the server/driver proves it; result received; and attribution uncertain.

A resolved driver promise permits only: **the client received a PostgreSQL response attributed by the selected driver to that command on the governed connection**. It does not establish broader operational success, persistent state, target/platform identity, or root cause.

Transaction states are likewise separate: begin requested/acknowledged/active; rollback requested/acknowledged; commit requested/acknowledged; server-error aborted; disconnect/close unknown; and separately verified post-transaction state. Release is cleanup evidence only, never rollback proof. Submission is not acknowledgement. Commit acknowledgement proves transaction outcome only when every stage and binding is correlated; persistent post-rollback state is always a separate later claim.

## Timeout and cancellation policy

| Control | Owner/source | Evidence and uncertainty |
|---|---|---|
| connect timeout | connection provider; authorized config | requested, elapsed, connected/failed; no server receipt inferred |
| statement timeout | PostgreSQL transaction-local setting in separately authorized stage/profile | server acknowledgement and SQLSTATE if returned; timeout after submit can leave outcome uncertain until response |
| lock timeout | same as statement timeout | server acknowledgement/error only |
| idle-in-transaction timeout | target/session policy plus bounded declaration | observed setting where permitted; disconnect may make transaction outcome unknown |
| local AbortSignal/controller timeout | controller | local request and time; does not prove server cancellation |
| driver/server cancellation | driver adapter | request and explicit acknowledgement separated; transport loss preserves possible continuation |
| evidence-capture timeout | controller/writer | package completeness only; cannot change database outcome |
| release timeout | connection provider | cleanup state; never transaction proof |

Every timeout leads to mandatory stop, zero retry, zero replay, no automatic cleanup SQL, and an uncertainty record whenever submission may have reached the server. Connection/pool replacement may clean resources internally but may not resume the governed attempt. Any unavoidable automatic retry, reconnect, failover, Edge/API retry, or transparent transaction replay is an implementation blocker.

## TLS and secrets

Encryption, certificate-chain validation, and hostname verification are mandatory. `rejectUnauthorized: false`, trust-all callbacks, hostname bypass, and secrets in errors/evidence are prohibited. The configured endpoint must match the governed target declaration. CA bytes/path are secret-adjacent local configuration, not portable evidence; only a bounded policy identifier and validation result may be recorded. Whether Supabase direct/session endpoints use public system trust or require a platform CA is unresolved and must be established from approved primary platform evidence without downloading anything in this sprint.

Credentials remain outside the repository, plans, manifests, evidence, arguments, and browser. A future injected provider may use a local secret store, Windows credential mechanism, minimally scoped environment injection, or interactive masked input. Direct database password/temporary database credentials are relevant; a service-role API key is not a PostgreSQL credential. Edge Function secrets apply only to an Edge architecture. The provider must minimize lifetime, support rotation, return an opaque credential to the connection provider, and sanitize all errors.

## Least-privilege role

A new dedicated REF execution role is conceptually preferred. `postgres` is overprivileged; `service_role` is an API role/key and unsuitable; `fid_function_owner` risks ownership power and must not be assumed suitable. No role is created or approved here.

Required, subject to exact successor SQL review: database `CONNECT`; schema `USAGE`; resolution/`EXECUTE` only on the governed function(s); bounded catalog visibility; authority for exactly the authorized ACL diagnostic statements; same-transaction direct/effective privilege observation; and ordinary transaction rollback. It must not have superuser, `CREATEDB`, `CREATEROLE`, replication, `BYPASSRLS`, role administration/membership changes, unrestricted DDL/data/function rights, default-privilege changes, or application-data access.

Unanswered security questions: which object owner can execute the exact ACL statements; whether ownership or grant option is indispensable; whether catalog access exposes sensitive metadata; whether a security-definer function would narrow or enlarge risk; whether RLS is touched; and which login/rotation process is approved. Independent security and PostgreSQL reviews are mandatory.

## Authorization binding

A later authorization must bind exact adapter and pinned driver versions, exact operation bytes/digest, target/environment/role/path/TLS policy, transaction policy, stage order, observation plan, output limits, one attempt/one execution, no retry, and mandatory stop. REF-V1.9 creates none and all Sprint 17C authorities remain historical/inactive.

