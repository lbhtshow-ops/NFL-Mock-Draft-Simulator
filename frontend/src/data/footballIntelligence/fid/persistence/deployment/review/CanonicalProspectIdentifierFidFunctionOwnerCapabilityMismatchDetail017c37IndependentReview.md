# Sprint 17C.37 split-authority mismatch-detail independent review

Status: `SPLIT_AUTHORITY_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_ADDITIONAL_CORRECTION_REQUIRED`

This repository-only independent review executed no SQL or RPC, contacted no database or Supabase service, created no execution authorization, and did not modify Sprint 17C.36 or any protected SQL. Migration 014 remains unapplied and authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`. Sprint 17C.23, 17C.26, and 17C.29 authorizations remain consumed and cannot be reused.

## Blocking result-contract findings

The authority separation itself is materially sound: `current_database()`, `CURRENT_USER`, and `SESSION_USER` supply the database-observed object, while the external object is labeled `REQUIRED_NOT_DATABASE_OBSERVED`; external attestation is always required and `overall_target_verified` is always false. PostgreSQL documents these session values and their role semantics in [PostgreSQL 17 session information functions](https://www.postgresql.org/docs/17/functions-info.html) and [PostgreSQL 17 SET ROLE](https://www.postgresql.org/docs/17/sql-set-role.html). Supabase documents organization/project/branch Dashboard context, project regions, and projects as platform concepts in [Dashboard branching](https://supabase.com/docs/guides/deployment/branching/dashboard), [regions](https://supabase.com/docs/guides/platform/regions), and [the Supabase platform guide](https://supabase.com/docs/guides/platform). The conclusion that these external fields are not PostgreSQL session observations is a review inference from those documented boundaries and repository policy.

However, the single visible row omits four mandatory fields: `mode`, `metadata_storage_present`, `migration_014_metadata_count`, and `evidence_complete`. Metadata is inspected internally but no bounded metadata evidence is returned. Consumers therefore cannot validate the required complete Dashboard contract from the row.

The external JSON contract also uses `project_id` and `database_source`. Sprint 17C.37 requires the exact governed keys `project_reference` and `dashboard_database_source`. Although the values are correct, the key drift violates the explicit immutable external-authorization result contract and prevents deterministic composition by the future authorization evaluator.

These are stop-condition result-contract defects. The reviewed SQL was not patched. Execution-authorization review is not ready.

## Preserved behavior

The 17C.36 diagnostic preserves the Sprint 17C.32 mismatch body from `identities AS` through `state_summary AS`. Its 15 increment classes, one-detail-per-increment construction, deterministic `row_number()` ordering, count/JSON length reconciliation, table prerequisite skip, resolved-OID privilege inspection, membership and SET/CREATE evidence, guarded metadata access, dynamic catalog-resolved `regclass`, 260 object-bound ACL entries, and one sequence invariant remain intact. No fabricated mismatch identities or fixed five-detail array exists; five remains aggregate comparison evidence only.

The exact returned order is: `result_identity`, `result_version`, `classification`, `mismatch_count`, `mismatch_details`, `detail_count`, `count_reconciled`, `captured_preflight_mismatch_count`, `captured_count_reconciled`, `unresolved_details`, `state_conflicts`, `expected_before_set_state`, `expected_before_create_state`, `membership_evidence`, `database_observed_target_evidence`, `externally_authorized_target_binding`, `database_evidence_complete`, `external_target_attestation_required`, `overall_target_verified`, `read_only`, `mutation_count`.

The result is one bounded sanitized row. It exposes no raw ACLs, OIDs, definitions, SQL text, secrets, URLs, connection values, prospect/user/candidate data, or operational payloads. The transaction is read-only and contains no DDL, DML, grants, revokes, role changes, configuration changes, locking reads, advisory locks, helpers, RPC, UUID generation, migration, or amendment execution. Unexpected PostgreSQL errors are not swallowed.

## Repository and parser record

Repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`; working directory is `frontend`; branch is `main`; origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`; upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was recorded and preserved. Migrations remain exactly 001–014 and migration 015 is absent.

The reviewed SHA-256 is `ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C`. Protected hashes remain: 17C.34 `E4709DA5768F6D8099B1160DB845A9F744228C964AFE2CACBBE3A98520F96548`; 17C.32 `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`; 17C.30 `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`.

The installed Python interpreter does not provide `pglast`; no installation was attempted and no parser-backed claim is made. Deterministic semantic review is sufficient to establish the result-contract defects.
