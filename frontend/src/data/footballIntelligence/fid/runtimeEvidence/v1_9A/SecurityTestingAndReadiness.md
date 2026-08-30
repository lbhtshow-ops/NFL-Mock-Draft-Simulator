# Supply Chain, Credentials, Testing, and Readiness

## Supply-chain review

Before a version can be approved, an independent reviewer must verify from official npm/upstream sources: exact package spelling and identity; publisher/repository attribution; license compatibility; release date and maintenance state; supported Node versions; security advisories and known vulnerabilities; dependency tree/transitive count; lifecycle/install/postinstall scripts; optional/native modules; tarball integrity; lockfile integrity; provenance/signing metadata when available; and typosquatting resistance. Repository evidence establishes none of these for an exact version. Network/registry research was prohibited in this sprint, so installation remains blocked.

The future authorization must bind package name, exact version, `frontend/package.json`, `frontend/package-lock.json`, production dependency category, exact npm command, allowed mutations, prohibited mutations, and mandatory post-install audits. Package approval is not driver execution, SQL, database, or Sprint 17C authorization.

## Credential and TLS boundary

Credential-provider selection is `SECURITY_REVIEW_REQUIRED` and `OPERATOR_WORKFLOW_REQUIRED`. The narrow asynchronous interface returns one opaque credential directly to the Node-only connection provider for one attempt and supports explicit disposal. It may not return an environment object or log/evidence representation. Credentials remain outside source, manifests, evidence, command arguments, browser code, and version control; failures are sanitized and lifetime minimized. A service-role API key is never substituted for a PostgreSQL password.

REF-V1.9 TLS policy remains unchanged: encryption, certificate validation, hostname verification, governed endpoint match, no trust-all/`rejectUnauthorized: false`, no raw CA in portable evidence, and only a bounded TLS-policy reference/result recorded. The exact `pg` version’s TLS option mapping and the Supabase CA trust source remain later proof gates.

## No-live implementation test plan

The subsequent implementation sprint must inject a fake client constructor/factory; importing the adapter must not construct or connect. The fake implements connect, query, cancellation/event emission, and end entirely in memory and retains exact call history. Tests provide no hostname, DNS, socket, credential, connection string, or live target.

Required assertions:

- exactly one client construction and connect;
- no Pool import/construction;
- `BEGIN` exactly once, exact stages exactly once and in profile order, same-transaction observations in order;
- rollback exactly once for rollback-required policy; commit only under separately governed policy;
- end exactly once, including bounded failure paths;
- zero retry, reconnect, failover continuation, replay, concurrency or background reuse;
- disconnect before/after possible receipt produces the correct uncertainty;
- cancellation request is distinct from acknowledgement;
- errors/results are whitelist-mapped and bounded; secrets, raw configs and stacks absent;
- browser import graph and Vite output exclude driver and credential modules;
- existing adapter/controller correlation remains intact;
- writer integration remains synthetic/no-live until production evidence is separately approved;
- test harness records zero DNS, socket, credential and database calls.

## Installation gates

| Gate | State |
|---|---|
| Ownership and source placement | PASS: existing frontend manifest/lockfile and `v1_10/node` |
| Driver candidate | CONDITIONAL PASS: `pg` preferred |
| Exact version, official identity, advisories, license, transitives, scripts, Node support | BLOCKED: official-source research required |
| Repository Node policy | PARTIAL: local Node 24 observed only; resolve after version review |
| Exact command | BLOCKED template declared |
| Expected lockfile impact | PARTIAL: two allowed files identified; exact tree unknown |
| Browser exclusion | DESIGNED, not implemented/tested |
| Fake/no-live plan | DESIGNED |
| Credential and TLS boundaries | DESIGNED; provider/CA details unresolved |
| One-client/no-pool/no-retry rules | RETAINED |
| Independent dependency/security review | REQUIRED |
| Separate installation authorization | REQUIRED |
| SQL/database authority | NOT CREATED; prohibited |

## Adversarial review

The design explicitly blocks: treating a mixed frontend manifest as browser permission; `pg` reaching Vite; adding to a wrong/nested manifest; creating another lockfile; broad upgrades; `latest` or a range; assuming Node 24 is canonical; unsupported ESM/CJS interop; Pool use; retry/reconnect/failover continuation; credentials in source/manifests/evidence; service-role substitution; TLS verification bypass; ignored lifecycle scripts/transitive vulnerabilities/publisher identity; and confusion between dependency, implementation, runtime, SQL, or Sprint 17C authority.

Residual limitations are the absent exact version, unreviewed upstream metadata, unresolved Node minimum, exact lockfile delta, driver cancellation/default behavior, credential workflow, and Supabase TLS/endpoint proof.

## Consolidated decision and next sprint

`pg` and the Node-only package boundary are technically selected, but an install cannot be approved without an exact version. Outcome: `OUTCOME_B_PG_VERSION_AND_SECURITY_RESEARCH_REQUIRED_BEFORE_INSTALLATION_APPROVAL`.

Next sprint: perform separately authorized official npm/node-postgres security and compatibility research, select an exact version, resolve the minimum Node policy, predict/audit the exact lockfile delta, and issue or deny a narrowly bound dependency-installation authorization. It must still not connect, load credentials, execute SQL, create database authority, or reopen Sprint 17C.

## Documentation diagnostics

- Repository identity, dirty state, migrations and prior inventories: verified.
- Sole manifest/lockfile, lockfile v3, package manager, Node pins, ESM/Vite/Node boundaries: audited.
- Supabase present and direct PostgreSQL driver absent: verified.
- Ownership options A–E, driver decision, exact pinning, blocked command, mutation boundary, browser isolation, credential/TLS boundaries, supply-chain checklist, no-live plan and 22 gates: covered.
- Package/lockfile mutation, production driver, connection, network, credentials, SQL and authorization: absent.
- ESLint/build: not applicable; documentation/JSON only.

