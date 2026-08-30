# Dependency Ownership, Driver, and Isolation Decision

## Ownership options

| Option | Evaluation | Decision |
|---|---|---|
| A. `frontend/package.json` production dependency | Matches sole npm/lockfile boundary and local Node scripts. Required at runtime by the local controller. Browser risk is manageable only through strict unreachable Node-only placement and diagnostics. | **Selected** |
| B. Frontend development dependency | Misclassifies a runtime requirement; production/package pruning could remove it. | Rejected |
| C. Separate local-tooling package and lockfile | Strong isolation but creates unsupported workspace/second-lockfile conventions, duplicate installs and drift. | Rejected for V1 minimum |
| D. Repository-level Node tooling package | Root has no Node manifest/workspace; expands ownership and packaging burden. | Rejected |
| E. Existing alternate boundary | None discovered. | Unavailable |

Selected manifest: `frontend/package.json`, key `dependencies`. Selected lockfile: `frontend/package-lock.json` v3. This approves ownership only, not a version or installation.

## Driver decision

Decision: `PG_APPROVED_FOR_FUTURE_INSTALLATION` subject to exact-version security review.

`pg` best matches the established requirements because a directly constructed `Client` can represent exactly one governed connection; explicit `BEGIN`, serialized stage calls, `ROLLBACK` or separately authorized `COMMIT`, and `end` remain visible. Its conventional query result and PostgreSQL error metadata can be mapped into bounded REF records, and construction can be injected for fake-client tests. Node ESM may import its package surface, subject to an exact-version ESM/CJS interop test.

This sprint does not assert exact-version compatibility, cancellation semantics, TLS defaults, Node support, absence of internal retry/reconnect, or maintenance status because those facts are not established by repository evidence. They are gates. postgres.js remains secondary: its reserved-connection, tagged-template normalization, reconnect, cancellation and exact-text behavior would require more proof and offers no repository advantage.

## Exact future placement and imports

Future production modules belong under:

`frontend/src/data/footballIntelligence/fid/runtimeEvidence/v1_10/node/`

Suggested internal layout, not created here:

- `pgClientFactory.mjs` — only module allowed to statically import `pg`.
- `postgresConnectionProvider.mjs` — consumes factory plus sanitized declaration and credential provider.
- `sanitizedPgResultMapper.mjs` and `sanitizedPgErrorMapper.mjs`.
- `credentialProviderPort.mjs` and `targetAttestationProviderPort.mjs` — interfaces, not secret stores.
- `compositionRoot.mjs` — local explicit composition.
- `cli.mjs` — future local entry, with no automatic execution on import.
- `diagnostics/` and `fakes/` — fake constructor/client and no-live tests.

Allowed imports flow inward from the Node-only CLI/composition to connection provider, existing adapter/controller, and writer. Browser/application modules, Supabase browser adapters, protected root barrels, Vite entry points, and general REF exports may not import `v1_10/node`. Node-only code may import platform-neutral REF contracts; platform-neutral code must not import Node-only code.

## Browser/Vite exclusion policy

Future diagnostics must fail unless all are true:

1. `pg` imports occur only below `v1_10/node`.
2. No protected/root barrel exports any Node-only module.
3. No React component, browser service, application entry, Supabase browser adapter, or Vite config imports that subtree.
4. A static import graph from every Vite entry has no path to `pg`, credential providers, `node:net`, or `node:tls`.
5. No browser fallback, polyfill or conditional dynamic import hides reachability.
6. Production Vite build succeeds without resolving/bundling `pg` for the client.
7. Output manifest/chunks contain no `pg` package names, PostgreSQL protocol code, credential variable names, `node:net`, or `node:tls` markers.
8. A Node-only sentinel module throws a diagnostic failure when evaluated with browser globals/build conditions.

Do not merely configure Vite to externalize `pg`; externalization could leave a broken or security-sensitive browser import. Graph unreachability is required.

## Version and installation policy

The database driver must be an exact version with no caret, tilde, tag, or implicit latest. Lockfile resolution alone is insufficient because the manifest/authorization must express the approved identity. The repository does not establish an approved version, so the command is blocked and represented only as:

`npm.cmd install --save-exact pg@<EXACT_OFFICIALLY_VERIFIED_VERSION>`

Run only from `frontend` under a separate authorization. Do not use `latest`, `--force`, `--legacy-peer-deps`, another package manager, `npm audit fix`, or any update command.

Expected dependency-only mutations:

- `frontend/package.json`: one direct exact `pg` production dependency.
- `frontend/package-lock.json`: corresponding exact package/transitive resolution and integrity records.
- Optionally `frontend/package.json` `engines.node` only if separately approved in the same authorization.

Stop if any other manifest/lockfile, script, source, Vite config, protected REF artifact, Sprint 17C record, migration, authorization, or unrelated dependency version changes; if lockfileVersion/package-manager metadata changes; if lifecycle scripts execute unexpectedly; if `pg` is only transitive; or if browser reachability appears.

## Driver runtime and configuration policy

One governed attempt constructs one `Client`, calls connect once, performs one explicit transaction with serialized queries, issues exactly one rollback or separately authorized commit, and calls end once. Pools, a second client, concurrent statements, idle reuse, reconnect-and-continue, retry, failover continuation, and stage replay are prohibited. Driver connection/error/end/notice events must be handled as bounded evidence; an unexpected `error` or `end` after possible submission makes the outcome uncertain and stops the attempt. Exact-version review must prove whether any default behavior needs disabling.

An immutable portable connection declaration may contain target/environment/endpoint/role/application-name/TLS policy/credential-provider references, port, database name, and bounded timeout settings. It may not contain passwords, full connection strings, tokens, service-role keys, private keys, raw CA data, callback functions, or unrestricted driver options.

