# Repository and Dependency Audit

## Repository truth

| Fact | Repository observation |
|---|---|
| Root | `C:/Users/zeyga/NFL-Mock-Draft-Simulator-main/NFL-Mock-Draft-Simulator-main` |
| Branch / upstream | `main` / `origin/fid-persistence-v1.0.1` |
| HEAD | `f9f8272e8ea868534c9fbc36cf174769367fc6a1` |
| Origin | `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git` |
| Worktree | Extensively dirty: tracked modifications and many untracked files; preserved. REF-V1.8A, REF-V1.8B, and REF-V1.9 artifacts are untracked, so no historical Git custody is claimed. |

Git was read with a per-command safe-directory override because the sandbox account differs from the owner; repository configuration was not changed.

## Baselines and migrations

- The immutable REF-V1.7 predecessor manifest at `src/data/footballIntelligence/fid/runtimeEvidence/amendments/refV1_8A/refV1_7ExplicitPredecessorManifest.json` contains 68 entries. Independent verification reports no findings and calculates `951A59A705784157184F5EBA9F4C9C568E39670026AE45F8BEF368A4F43934C3`.
- The REF-V1.8B additive inventory contains eight current-filesystem-only, untracked entries and aggregate `476CDC5CC086663C59FB867951E96BCA42E8B50EEC92A3638E01D0097EDB5239`. Its 21-check/26-scenario diagnostic passed with one synthetic write, zero retries, zero network/database calls, zero authorizations, and no retained fixture.
- The governed FID migration directory `src/data/footballIntelligence/fid/persistence/deployment/sql` contains exactly `001` through `014`; migration `015` is absent.
- The separate Supabase CLI inventory at `supabase/migrations` contains one file: `20260714_create_research_repository_tables.sql`. It is not part of the governed FID 001–014 inventory.

## Relevant artifact matrix

Owner means repository responsibility, not database ownership.

| Path/group | Owner and current responsibility | Runtime | Reuse / extension | REF security, affinity, platform implications |
|---|---|---|---|---|
| `runtimeEvidence/runtimeEvidenceController.js`, `controllerIndex.js` | REF controller; validates invocation and composes evidence | Node-compatible JS | Reuse; extend only via injected dependencies | Must remain policy owner; cannot infer database success |
| `runtimeEvidence/runtimeWitness.js` | REF Runtime Witness Port and result vocabulary | Platform-independent JS | Reuse | Preserves uncertainty and request/observation separation |
| `runtimeEvidence/postgresTransactionWitnessAdapter.js` | One-connection, explicit-transaction stage orchestrator | Node-compatible JS with injected driver | Reuse after production hardening; no driver import | Enforces object/ref affinity, order, bounded output, rollback/commit acknowledgement; currently labels all output synthetic |
| `runtimeEvidence/deterministicFakePostgresDriver.js` | Deterministic injected PostgreSQL test double | In-memory Node/browser-compatible JS | Retain for diagnostics only; prohibited for real evidence | No real session, transaction, platform, or database observation |
| `runtimeEvidence/postgresAtomicOperationProfile.js` | Binds exact stage payload/digest/order/output/transaction policy | Platform-independent JS | Reuse | Prevents normalization and unbounded output; authorization still separate |
| `runtimeEvidence/v1_8B/composition.mjs` | Local synthetic composition root | local Node.js ESM | Design precedent only; future sibling version justified | Defaults to fake driver and fixture-only authority; prohibited for production execution |
| `runtimeEvidence/v1_8B/appendOnlyWriter.mjs` | Contained exclusive-write/read-back synthetic evidence writer | local Node.js | Reuse only after explicit production-evidence policy extension | Rejects secret-bearing fields; local multi-file write is non-transactional and has no Git custody |
| `frontend/package.json`, `package-lock.json` | Vite browser application dependencies | Node tooling + browser bundle | Dependency review required | Has `@supabase/supabase-js`; no `pg`, postgres.js, or pool package. Adding a server-only driver to this browser package risks bundle contamination unless isolated |
| `src/data/researchRepository/persistence/supabase/*` | Browser-oriented research repository API adapter | Vite/browser | Not reusable as REF PostgreSQL transport | Supabase API calls cannot prove backend session/transaction affinity; browser credentials boundary |
| `supabase/functions/canonical-prospect-identifier-issuance/runtime/*` | Edge Function composition and RPC transaction adapter | Supabase Deno/Edge | Patterns/test doubles reusable conceptually; execution path prohibited for selected design | RPC provides database atomicity but hides driver-stage/session evidence and adds HTTP/function timeout/retry uncertainty |
| `supabase/functions/.../tests/*` | Injected Edge/RPC doubles and diagnostics | local JS/Deno-compatible | Reusable test pattern | Synthetic only |
| `fid/persistence/deployment/review/*` and runbooks | Historical target, role, authorization, execution and uncertainty records | documentation/manual Dashboard | Read-only evidence source; never reuse authority | Declares project and prior `postgres` usage; declarations are not current database observations |
| `fid/persistence/deployment/sql/001...014` | Governed FID migration artifacts | PostgreSQL | Protected; no modification | Migration 014 exists; no 015 |
| `supabase/migrations/*` | Supabase CLI migration inventory | Supabase/PostgreSQL | Separate inventory | Must not be collapsed into FID history |
| protected root barrels `runtimeEvidence/index.js`, `fid/index.js` | Browser-facing exports | Vite/browser | Do not extend for real driver | A PostgreSQL driver must never become reachable from browser bundles |

## Dependency and behavior findings

- Observed local runtime: Node `v24.16.0`; no repository `.nvmrc`, `.node-version`, or Node engine pin was found. The package is ESM (`"type": "module"`). Runtime compatibility remains a next-sprint gate.
- One `package.json` and one `package-lock.json` exist under `frontend`. No `pg`, postgres.js, native PostgreSQL, or explicit pool dependency is installed. No package was installed or updated.
- `@supabase/supabase-js` is the only installed database-related client. It is HTTP/API-oriented and cannot supply a dedicated PostgreSQL connection object or expose one physical backend session for the whole attempt.
- Edge Function code is a separate Deno/platform boundary and uses an RPC adapter. It does not establish that a Deno PostgreSQL driver is vendored or locked.
- Repository patterns include injected ports/doubles, explicit transactions in REF abstractions, bounded error/result records, one attempt/no retry, and mandatory stop. No production direct PostgreSQL acquire/release/cancel/TLS implementation exists.
- Environment-variable names occur in trusted runtime/Edge composition, but values were not read. No secret files or values were inspected. Future REF code must accept an injected credential provider, never an environment dump.
- Historical Dashboard and RPC workflows exist. They are prohibited as evidence substitutes for a direct session and no historical Sprint 17C authorization may be reused.
- No repository evidence proves platform CA handling, direct-host IPv4 availability, session-pooler endpoint behavior, cancellation forwarding, transparent failover policy, or automatic retry semantics. These are unresolved rather than guessed.

