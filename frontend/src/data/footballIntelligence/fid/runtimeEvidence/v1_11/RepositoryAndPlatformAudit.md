# REF-V1.11 repository and platform audit

## Repository truth

- Repository root: `C:/Users/zeyga/NFL-Mock-Draft-Simulator-main/NFL-Mock-Draft-Simulator-main`.
- Working directory: `frontend`; branch: `main`; HEAD: `f9f8272e8ea868534c9fbc36cf174769367fc6a1`.
- Origin fetch/push: `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`; upstream: `origin/fid-persistence-v1.0.1`.
- The extensive inherited dirty worktree was preserved. REF-V1.11 owns only this additive directory. No prior manifest, inventory, root barrel, package file, migration, Sprint 17C artifact, or installation capture was modified.

## Separated inventories and integrity

- Governed FID migration owner: `persistence/deployment/sql`; responsibility: canonical schema deployment; authoritative and protected. Exactly `001` through `014` exist; `015` is absent.
- Deployment-review SQL owner: `persistence/deployment` outside its `sql` subtree; responsibility: review/attempt history; authoritative records, protected. Count: 48.
- Supabase CLI owner: `frontend/supabase/migrations`; responsibility: separate CLI history; authoritative and protected. One file: `20260714_create_research_repository_tables.sql`.
- The REF-V1.7 explicit predecessor manifest has 68 entries and expected aggregate `951A59A705784157184F5EBA9F4C9C568E39670026AE45F8BEF368A4F43934C3`. REF-V1.8B through V1.10B inventories verify separately; none is extended or replaced here.
- `package.json`: `F374626FE20BA1F268F75AAA04AEF82E2D644668EA84C9B08BA1BED888C6A992`; `package-lock.json`: `1998FB062904AAD822926DB899D0C835CB9E8317F2FB7FB1EC246565E00015E8`; capture: `23A16A49410954B7215F76B024F2D22BA575356DC47BD3F5AAD2F37CFD08D8FB`. All match the required baseline.

## Artifact ownership and reuse

| Artifact | Owner / responsibility | Decision | Classification / protection | Implication |
|---|---|---|---|---|
| `runtimeEvidence/postgresTransactionWitnessAdapter.js` | REF root; authoritative transaction witness | Reuse unchanged | authoritative, protected | preserves one transaction, stage ordering, rollback uncertainty |
| `runtimeEvidence/v1_10/node/*` | REF-V1.10B; Client driver/factory and bounded mapping | Reuse later, no construction now | authoritative implementation, protected | Node-only, one Client, no Pool/retry |
| `runtimeEvidence/v1_8B/appendOnlyWriter.mjs` | REF-V1.8B; append-only custody | Reuse later | authoritative, protected | evidence writes remain append-only |
| target authorization/deployment artifacts under `persistence/deployment` | Sprint 17C governance/history | Reference only | authoritative, protected | consumed authority cannot be reused |
| `supabaseRuntimeConfigurationConstants.js`, credential/client policies, Edge Function runtime | application Supabase boundary | Context only; do not extend for REF | declarative/application runtime, protected | browser/API keys are not PostgreSQL credentials |
| migrations 011/014 and ACL review artifacts | persistence governance | Reference only | authoritative/declarative, protected | owner, RLS, ACL and role invariants constrain the future role |

Repository search found application Supabase variable-name patterns and service-role use, but no repository-authoritative, sanitized direct database hostname, pooler hostname, port, CA policy, or database-password provider for REF. No secret values or unrestricted environment object were inspected. No local Supabase `config.toml` or environment template established a direct PostgreSQL path. Windows PowerShell runbooks exist for deployment review, but none currently authorizes REF endpoint/DNS/TCP/TLS proof.

## Existing security conclusions

REF-V1.9 established platform feasibility limits; V1.9A–V1.9D established Node/dependency and installation custody; V1.10A designed the adapter boundary; V1.10B implemented and fake-only validated it. API/RPC, Dashboard SQL, Edge Function, and browser execution still fail the dedicated-session/runtime-evidence boundary. No new repository fact reopens them.
