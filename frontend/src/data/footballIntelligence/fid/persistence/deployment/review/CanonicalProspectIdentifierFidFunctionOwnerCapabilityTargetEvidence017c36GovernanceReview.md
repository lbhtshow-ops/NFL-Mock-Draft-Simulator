# Sprint 17C.36 Dashboard execution target evidence authority and binding correction

Status: `READY_FOR_SPLIT_AUTHORITY_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_INDEPENDENT_REVIEW`

Next sprint: `SPRINT_17C37_SPLIT_AUTHORITY_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_INDEPENDENT_REVIEW`

## Decision

Model A, split authority, is selected. PostgreSQL supplies only database-session evidence. Supabase platform identity and LBHT environment governance remain external authorization prerequisites. The successor never claims that SQL independently verified the external target and always returns `external_target_attestation_required=true` and `overall_target_verified=false`.

The repository already owns the external half through `CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_NON_PRODUCTION_TEST_TARGET_AUTHORIZATION@1.0.0`, its deterministic exact-target evaluator, the Stage 1 Dashboard supplement, the deployment manifest, the primary-branch/environment contract, and the one-attempt authorization consumption pattern. The correction reuses these contracts and creates no duplicate execution authorization.

## Documented capability boundary

PostgreSQL 17 documents `current_database()` as the current database name, `CURRENT_USER` as the effective execution identity, and `SESSION_USER` as the session identity. It also documents that `CURRENT_USER` can change through `SET ROLE` or a security-definer context and that a superuser can change `SESSION_USER` through `SET SESSION AUTHORIZATION`. These observations are useful session evidence but do not identify a Supabase project or organization. See [PostgreSQL 17 session information functions](https://www.postgresql.org/docs/17/functions-info.html) and [PostgreSQL 17 SET ROLE](https://www.postgresql.org/docs/17/sql-set-role.html).

PostgreSQL settings are not accepted as target authority: PostgreSQL documents that settings can be supplied through `SET`, configuration, client `PGOPTIONS`, and related sources, so an undocumented custom setting is not platform-controlled evidence. See [PostgreSQL 17 SHOW](https://www.postgresql.org/docs/17/sql-show.html).

Supabase documents organizations as project groupings and each project as owning a dedicated Postgres database, but does not document a PostgreSQL session function exposing organization or project display identity. See [Supabase Platform](https://supabase.com/docs/guides/platform). Supabase documents one primary region per project in platform configuration, not as a PostgreSQL session identity function. See [Supabase regions](https://supabase.com/docs/guides/platform/regions). Supabase also documents the Dashboard top bar as organization/project/branch context and states that SQL Editor changes target the currently selected branch. See [Supabase Dashboard branching](https://supabase.com/docs/guides/deployment/branching/dashboard). This supports operator Dashboard verification rather than an invented SQL observation.

## Authority map

`organization`, `project_name`, `project_id`, `region`, `branch`, and `database_source` are `SUPABASE_PLATFORM_OBSERVABLE` and require exact Stage 1/operator verification. `governed_environment` is `GOVERNED_EXTERNAL_ATTESTATION`, owned by LBHT governance; the Dashboard `PRODUCTION` label cannot establish it. `sql_role` is `DATABASE_SESSION_OBSERVABLE` through both `CURRENT_USER` and `SESSION_USER`. The database session also records `current_database()` as database evidence, while explicitly refusing to treat database name as project or Dashboard-source identity.

## Additive SQL correction

The successor removes the self-validating target comparison. It returns two explicitly separated JSON objects: `database_observed_target_evidence` and `externally_authorized_target_binding`. The latter is labeled `REQUIRED_NOT_DATABASE_OBSERVED`; it is immutable authorization metadata, not runtime proof. A future execution-authorization evaluator must combine an active exact authorization, exact authorization target, operator-confirmed Dashboard context, and complete SQL-observed session evidence.

The protected mismatch/ACL body is byte-identical to Sprint 17C.32 from `identities AS` through `state_summary AS`. Thus the 15 mismatch increment classes, detail reconciliation and ordering, table prerequisite skip behavior, guarded OID privilege calls, membership/state evidence, optional metadata behavior, 260 object-bound ACL units, and one sequence invariant remain unchanged. The successor returns one bounded sanitized row in a read-only transaction and performs no mutation.

## Repository and safety

The repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`, working directory is `frontend`, branch is `main`, origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, and upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was preserved. Governed migrations remain exactly 001–014; migration 015 is absent. Migration 014 remains unchanged and unapplied, and authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`. Authorizations 17C.23, 17C.26, and 17C.29 remain consumed.

No SQL, Supabase, RPC, amendment, migration, identifier, candidate, or database operation occurred. No execution authorization was created.

The only installed Python interpreter is Python 3.14 at `C:\Python314\python.exe`, and it does not provide `pglast`. The parser reproduction is included but no package was installed and no parser-backed claim is made. PostgreSQL 17 compatibility for the new expressions is assessed separately from the official PostgreSQL 17 documentation cited above; the protected diagnostic body is unchanged.
