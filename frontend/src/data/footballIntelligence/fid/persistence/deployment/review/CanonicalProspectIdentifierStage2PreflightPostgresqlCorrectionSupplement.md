# Canonical Prospect Identifier Stage 2 PostgreSQL Compatibility Correction Supplement

Status: `READY_FOR_CONTROLLED_DEPLOYMENT_STAGE_2_READ_ONLY_PREFLIGHT_REEXECUTION`

## Sanitized execution evidence

Manual execution of protected `017c2_stage2_read_only_target_preflight_successor.sql` returned SQLSTATE `0A000`, classified as `PREFLIGHT_SQL_POSTGRESQL_ORDER_BY_COMPATIBILITY_FAILURE`, at line 123. PostgreSQL rejected `migration_id COLLATE "C"` in the `ORDER BY` directly attached to a `UNION ALL`. Database mutations were zero, migration 014 was not executed, Stage 2 did not complete, and automatic progression remains prohibited.

## Narrow correction

The authorized additive successor is `017c3_stage2_read_only_target_preflight_postgresql_correction.sql`, SHA-256 `70B611749B1F544F8382944449C12F7FD760AA31E5F19E7C5B9A1FAC6EF0D5B2`.

Block 8 now places the two unchanged union branches inside `combined_results`. A normal outer `SELECT` returns the same four columns and applies `ORDER BY ordinal_position NULLS LAST, migration_id COLLATE "C"`. This preserves expected migrations in ordinal order and unexpected identifiers last in deterministic C-collation order while avoiding PostgreSQL’s set-operation ordering restriction.

All ten predecessor blocks, classifications, role observations, schema privileges, and six exact index checks remain present. Every statement remains read-only; no locking read, UUID/RPC invocation, sensitive catalog, payload access, runtime activation, or migration execution was introduced.

No repository-local PostgreSQL parser or `psql` executable was available. No package was installed. Static diagnostics prove the incompatible structure is absent, the outer-query structure is present, returned columns and ordering are preserved, and protected hashes remain exact.

## Exact next action

Manually execute only the authorized `017c3` Stage 2 read-only preflight successor against the exact Supabase test target, return its complete sanitized results for review, and stop. Do not execute migration 014.
