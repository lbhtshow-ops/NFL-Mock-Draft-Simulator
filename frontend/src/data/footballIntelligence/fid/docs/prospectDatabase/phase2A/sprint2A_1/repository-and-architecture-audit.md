# Repository and Architecture Inventory

## Repository identity

| Item | Current truth |
| --- | --- |
| Repository root | `C:/Users/zeyga/NFL-Mock-Draft-Simulator-main/NFL-Mock-Draft-Simulator-main` |
| Application root | `frontend` (the Git root is its parent; no competing application root was found) |
| Branch / HEAD | `main` / `f9f8272e8ea868534c9fbc36cf174769367fc6a1` |
| Origin | `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git` |
| Upstream | `origin/fid-persistence-v1.0.1` |
| Initial worktree counts | 29 tracked modifications; 1,041 untracked files |
| Package state | `frontend/package.json` and `frontend/package-lock.json` are modified; SHA-256 captured during validation |
| Prospect state | `src/data/draft/prospects.js`, its registry/resolver, FID intake diagnostics/specification, and intelligence profiles are modified; extensive related artifacts are untracked |
| FID / REF state | tracked FID files are modified and the large persistence, identity, REF, review, and runtime-evidence body is untracked |
| Untracked 2027 data | the Population cohort fixture and identity dry-run fixtures are untracked; they are declarations/fixtures, not canonical prospects |

Git inspection used a command-local `safe.directory` override because the sandbox user does not own the worktree. No Git configuration or repository state was changed.

## Migration inventories

### Governed FID deployment SQL

`src/data/footballIntelligence/fid/persistence/deployment/sql/` contains exactly `001` through `014`; `015` is absent. Files 001–013 establish schema, versioning, canonical/auxiliary storage, relationships, constraints, indexes, atomic persistence, RLS, policies, privileges, verification, and metadata. `014_create_fid_identifier_issuance_transaction.sql` declares the identifier issuance transaction. Its SHA-256 is `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD`.

Repository evidence does not prove deployed database state. Migration 014 remains a reviewed, failed/rolled-back or unapplied live operation at the pause boundary; it was not executed here.

### Deployment-review artifacts

`src/data/footballIntelligence/fid/persistence/deployment/review/` contains 144 files: 48 SQL, 78 Markdown, and 18 Python files. They group into read-only preflight/static review; proposed remediation; guarded reconciliation; post-verification; and manual runbook/review artifacts. Prior execution authorizations are consumed or bounded historical artifacts. None authorizes prospect population. The ACL/owner investigations affect live atomic writes and proof, not construction of repository fixtures, source packages, intake candidates, or unpromoted governed records.

### Supabase CLI migration

`supabase/migrations/20260714_create_research_repository_tables.sql` is the single CLI migration. It declares Research Repository tables; source presence is not deployment proof.

### Declarations and adapters

- Research: `src/data/researchRepository/contracts/*`, `persistence/*`, and `persistence/supabase/createSupabaseResearchRepositoryAdapter.js`; application-domain workflows are under `src/data/footballIntelligence/researchRepository/*`.
- FID persistence: `fid/persistence/*`, deployment SQL/reviews, durable port, in-memory proof repository, Supabase adapter/client/runtime boundary.
- Identity/intake/revision: `fid/prospectIntake/*`, `fid/intake/core/*`, `fid/contracts/*`, persistence envelopes and revision/predecessor rules.
- Evidence/provenance/review/blockers/promotion: Research Repository contracts/workflows plus Prospect Intake candidate, identity intake, promotion decision/workflow/execution contracts.
- Simulator: `src/data/draft/prospects.js`, `src/data/draft/prospects/prospectRegistry.js`, and `resolveProspect.js` are compatibility/application records, not FID persistence records.

## REF / Sprint 17C boundary

Sprint 17C.57–62 artifacts in `fid/persistence/deployment/review/` preserve the unresolved atomic-function ACL investigation. REF-1–6 documentation lives under `fid/docs/runtimeEvidenceFramework/`; REF-V1.1–V1.12 implementations/reviews culminate in `fid/runtimeEvidence/v1_12/ConsolidatedReview.md`.

REF-V1.12 proves repository composition using fake target, credential, and pg Client providers. Its status is `RUNTIME_EVIDENCE_FRAMEWORK_V1_REAL_COMPOSITION_WITH_FAKE_PROVIDERS_ESTABLISHED`; live endpoint, DNS/TCP/TLS, credential, authentication, role, database, and persistent-state proof remain absent. `ImplementationAuthorization.json` is `CONSUMED_PERMANENTLY_NON_REUSABLE`.

Therefore:

- Live identifier issuance, atomic persistence, migrations, reconciliation, and database read-back remain unauthorized and paused.
- Local contracts, validators, deterministic planners, fixtures, Research Source Packages, source-controlled record conventions, and in-memory diagnostics are reusable without claiming deployment.
- Repository-first source/evidence capture, candidate construction, provisional eligibility, review/blocker recording, and promotion planning can proceed without writes.
- The current application already reads legacy prospect data without FID atomic persistence.
- Repository-first work is safe only when it enters canonical intake/research contracts and stops before promotion/persistence; adding a second flat prospect authority would bypass FID.

## Directory ownership map

| Area | Owner and direction | Status / duplicate risk |
| --- | --- | --- |
| `footballIntelligence/fid/contracts`, `constants` | FID domain authority; receives governed references | Production-shaped contracts; mostly untracked in this worktree; authoritative representational layer |
| `fid/prospectIntake`, `fid/intake/core` | Prospect Intake and FIIS boundary | Candidate/identity/promotion contracts and planning exist; runtime orchestration incomplete; duplicate intake names require keeping `ProspectIntakeCandidateContract` authoritative |
| `fid/population` | Repository-only population validation | Fixture/declaration boundary; no persistence, resolver, or app dependency |
| `fid/persistence` | Durable record/version boundary | Production-shaped ports and SQL; live state blocked/deferred |
| `fid/records` | Source-controlled canonical-record convention | Active governed boundary; currently only Peter Woods, 2026 Draft, Kansas City, and a selection record |
| `researchRepository` (both locations) | Generic repository contracts plus football-domain workflows | Legitimate layering, but two roots are easy to confuse; Supabase declaration is not deployed truth |
| `registry`, `database`, profile folders | Legacy/transitional intelligence inputs | Application/engine compatibility; not canonical FID records |
| `athletics`, `production`, `scouting`, `footballIQ`, `schemes`, `teamContext` | Objective/declared/model input domains | Mix of defaults, legacy declarations, and engines; provenance coverage is incomplete |
| `resolver` and `src/data/draft/prospects/*` | Application-facing compatibility | Active simulator path; discards much FID governance because it never receives FID profiles |
| `runtimeEvidence`, deployment reviews | Runtime proof/governance | Synthetic or review-only; must not be treated as database truth |

Dependency direction should remain Research → FIIS → FID → intelligence/confidence/decision support → applications. Current simulator code largely starts at legacy draft data and then invokes intelligence engines, so it is transitional rather than the target direction.
