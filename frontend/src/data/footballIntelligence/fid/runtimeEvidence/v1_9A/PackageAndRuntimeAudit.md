# Repository Package and Runtime Audit

## Repository and protected baselines

| Item | Result |
|---|---|
| Repository | `C:/Users/zeyga/NFL-Mock-Draft-Simulator-main/NFL-Mock-Draft-Simulator-main` |
| Branch / upstream | `main` / `origin/fid-persistence-v1.0.1` |
| HEAD | `f9f8272e8ea868534c9fbc36cf174769367fc6a1` |
| Origin | `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git` |
| Worktree | 504 porcelain entries; inherited tracked and untracked work preserved |
| REF-V1.7 manifest | 68 entries verified; aggregate `951A59A705784157184F5EBA9F4C9C568E39670026AE45F8BEF368A4F43934C3`; no findings |
| REF-V1.8B | Eight-entry current-filesystem inventory unchanged; its 21-check/26-scenario diagnostic passed |
| REF-V1.9 | Four documentation entries verified; aggregate `34E26396D28053513A83AEF11853FC1FA36CB0E0F7DAC12F2E6202200F5F3254` |
| FID migrations | Exactly `001`–`014`; `015` absent |
| Supabase CLI migrations | Separately, only `20260714_create_research_repository_tables.sql` |

All REF-V1.8A, V1.8B, V1.9 and V1.9A artifacts are untracked. No historical Git custody is claimed.

## Package topology

| Path | Owner/purpose/state | REF support and risk |
|---|---|---|
| `frontend/package.json` | Sole npm manifest; Vite application plus local Node scripts; tracked | Canonical dependency owner. Mixed browser/tooling ownership creates contamination risk that must be controlled by imports and build diagnostics. Additive dependency change required later. |
| `frontend/package-lock.json` | Sole npm lockfile, lockfileVersion 3; tracked | Canonical integrity/resolution record. Must be changed only by the approved npm command and audited for unrelated churn. |
| `frontend/vite.config.js` | Vite browser build configuration; tracked | No explicit externalization boundary for `pg`; safety must come from unreachable Node-only source plus build/bundle scans. |
| `frontend/scripts/*.mjs` | Local Node ESM data synchronization entry points | Establishes repository precedent for Node-only commands inside this package; unsuitable for REF secrets but supports a future local CLI convention. |
| `runtimeEvidence/*.js` | Platform-neutral contracts/controller/adapter/fakes; untracked predecessor/additive work | Supports injection and diagnostics. Protected/root barrels must not export a real driver. |
| `runtimeEvidence/v1_8B/*.mjs` | Local Node ESM composition/writer and synthetic diagnostics; untracked protected predecessor | Strong precedent for Node built-ins, ESM, injected dependencies and no-live diagnostics; do not modify. |
| `runtimeEvidence/v1_9/*` | Architecture/security decision; untracked protected predecessor | Selects direct PostgreSQL path and Node-only future sibling. Do not modify. |
| `src/data/researchRepository/persistence/supabase/*` | Browser Supabase adapter | Unsuitable for REF direct PostgreSQL; API client cannot supply connection/session affinity. |
| `supabase/functions/*` | Deno/Edge and RPC composition | Separate platform runtime; unsuitable dependency owner for local Node REF. |

No repository-level or nested package manifests, workspace declaration, alternate lockfile, `.npmrc`, `packageManager` field, npm shrinkwrap, pnpm/yarn/bun lock, Volta declaration, `.nvmrc`, `.node-version`, asdf/mise pin, conditional exports, or canonical dependency-review automation was found. A second tooling package would therefore create a new convention and likely a second lockfile.

## Current runtime and dependencies

- `package.json` declares `"type": "module"`, but no `engines` constraint. The observed local executable is Node `v24.16.0`; it is evidence about this workstation only, not canonical policy.
- Production dependencies use caret ranges: `@supabase/supabase-js ^2.110.7`, Axios, React, React DOM/router/select, and html2canvas. Development dependencies are Vite, React plugin/types, ESLint and plugins. No optional/platform-specific dependency is declared directly.
- Lockfile v3 records resolved package identities and integrity data. It contains Supabase JS and no direct `pg`, postgres.js, or other PostgreSQL driver entry.
- Existing Node ESM code imports `node:fs`, `node:path`, `node:crypto`, and related built-ins. This demonstrates local Node execution but not browser safety by itself.
- Browser entry points under `src` are reachable by Vite. Existing REF root barrels are potentially browser-facing. A future real driver cannot be imported from them, application components, browser services, Supabase adapters, or Vite configuration.
- No canonical license/security-advisory/provenance workflow is documented. Exact package review must therefore be an explicit future gate rather than inferred from current conventions.
- Environment-variable access exists in repository runtime patterns, but values were not read. No secret material was inspected.

## Node policy assessment

The dependency review cannot infer the future `pg` supported Node range without an approved exact version. The next official-source review must compare that range with Vite, repository Web Crypto/ESM use, Windows development, and the future CLI. A repository `engines.node` declaration is recommended as part of the separately approved dependency/runtime-policy change after the exact driver version is selected. `.nvmrc` or Volta may be added only if the repository chooses a canonical operator tool; local Node 24 must not be copied blindly into policy.

