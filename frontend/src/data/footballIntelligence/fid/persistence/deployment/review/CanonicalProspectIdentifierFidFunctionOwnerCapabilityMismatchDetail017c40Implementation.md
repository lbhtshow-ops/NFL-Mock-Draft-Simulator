# Sprint 17C.40 split-authority 25-field mismatch-detail SQL successor

Status: `READY_FOR_SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_SQL_SUCCESSOR_INDEPENDENT_REVIEW`

Next sprint: `SPRINT_17C41_SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_SQL_SUCCESSOR_INDEPENDENT_REVIEW`

The additive successor is `017c40_fid_function_owner_capability_mismatch_detail_split_authority_25_field_successor.sql`, SHA-256 `8D56003C1835ED6889C947DA75B56C4D032736DD31532FCF428FD68FF421688E`. It was created and statically reviewed only. No SQL, RPC, migration, amendment, identifier, candidate, database, or Supabase operation occurred, and no execution authorization was created.

## Bounded implementation

The successor implements `SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_VISIBLE_RESULT_CONTRACT@17C.39.1`. Relative to protected Sprint 17C.36, changes are limited to the successor header/identity/version, fixed mode, four required visible fields, two nested external-key labels, completeness expression, and final one-row joins to existing one-row evidence CTEs.

The executable row has exactly 25 unique fields in the authoritative order. `mode` is fixed to `MISMATCH_DETAIL_DIAGNOSTIC`. `metadata_storage_present` is derived from the catalog-resolved `metadata.relation_ref`. `migration_014_metadata_count` is the aggregate-only `metadata.metadata_014` bigint. `evidence_complete` requires complete PostgreSQL session evidence, no sanitized unresolved evidence, no missing governed table, and a resolved governed function. External authorization constants cannot make it true.

The external object now exposes `project_reference` and `dashboard_database_source`; executable `project_id` and `database_source` JSON keys are absent. It remains labeled `REQUIRED_NOT_DATABASE_OBSERVED`. Database-observed evidence remains limited to `current_database()`, `CURRENT_USER`, and `SESSION_USER`; external attestation remains required and `overall_target_verified` remains false.

## Preserved diagnostic behavior

The CTE body from `database_observed_target AS` through `state_summary AS` is byte-identical to Sprint 17C.36. This preserves all 15 mismatch increment classes, one-detail-per-increment construction, deterministic contiguous ordinals, count/array reconciliation, captured-five comparison-only evidence, table prerequisite single-detail-and-skip behavior, resolved-OID privilege inspection, separate membership evidence, non-inflating SET/CREATE state conflicts, guarded optional metadata logic, the catalog-resolved `regclass` dynamic identifier, classification precedence, and sanitization.

ACL policy remains 260 object-bound governance units plus one exact zero-sequence invariant. The result remains one bounded physical row in a read-only transaction with `mutation_count=0` and no DDL, DML, grants, revokes, role changes, settings, locks, helpers, RPC, UUID generation, migration, or amendment execution.

## Repository preservation and validation

Repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`; working directory is `frontend`; branch is `main`; origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`; upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was preserved. Migrations remain exactly 001–014, migration 015 is absent, migration 014 remains unapplied, and authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`. Sprint 17C.23, 17C.26, and 17C.29 authorizations remain consumed.

Protected hashes remain: Sprint 17C.36 `ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C`; Sprint 17C.34 `E4709DA5768F6D8099B1160DB845A9F744228C964AFE2CACBBE3A98520F96548`; Sprint 17C.32 `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`; Sprint 17C.30 `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`.

The active Python environment does not contain `pglast`. A repository-consistent offline parser runner is provided, but no package was installed and no parser-backed claim is made. PostgreSQL 17 compatibility for the additions follows from ordinary text constants, Boolean expressions, scalar subqueries, existing CTE columns, JSON construction, and casts already supported in PostgreSQL 17; parser acceptance is not substituted for that assessment.
