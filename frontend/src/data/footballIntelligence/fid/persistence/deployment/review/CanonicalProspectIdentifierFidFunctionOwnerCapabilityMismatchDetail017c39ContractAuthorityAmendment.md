# Sprint 17C.39 split-authority visible-result contract authority amendment

Status: `READY_FOR_SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_RESULT_CONTRACT_IMPLEMENTATION`

Next sprint: `SPRINT_17C40_SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_SQL_SUCCESSOR_IMPLEMENTATION`

This repository-only amendment defines a future result contract. It creates or modifies no SQL, executes no SQL or RPC, contacts no database or Supabase service, creates no execution authorization, and authorizes no retry, capability amendment, or migration 014 execution.

## Authority and lifecycle

Contract `SPLIT_AUTHORITY_25_FIELD_MISMATCH_DETAIL_VISIBLE_RESULT_CONTRACT`, version `17C.39.1`, is authoritative only for a future additive SQL successor. It is owned by `FID_FUNCTION_OWNER_CAPABILITY_DIAGNOSTIC_GOVERNANCE_OWNER` and has status `AUTHORITATIVE_FOR_FUTURE_IMPLEMENTATION`.

It supersedes `SPLIT_AUTHORITY_MISMATCH_DETAIL_VISIBLE_RESULT_CONTRACT@17C.37.1` because four required bounded database-evidence fields were omitted. The change is additive at the top level and intentionally changes the field count from 21 to 25 while preserving the identity and relative order of all 21 historical fields. Historical Sprint 17C.36 SQL and Sprint 17C.37/17C.38 declarations remain immutable evidence. The future implementation requires a separate independent review before any execution-authorization review.

## Exact 25-field order

1. `result_identity`
2. `result_version`
3. `mode`
4. `classification`
5. `mismatch_count`
6. `mismatch_details`
7. `detail_count`
8. `count_reconciled`
9. `captured_preflight_mismatch_count`
10. `captured_count_reconciled`
11. `unresolved_details`
12. `state_conflicts`
13. `expected_before_set_state`
14. `expected_before_create_state`
15. `membership_evidence`
16. `metadata_storage_present`
17. `migration_014_metadata_count`
18. `evidence_complete`
19. `database_observed_target_evidence`
20. `externally_authorized_target_binding`
21. `database_evidence_complete`
22. `external_target_attestation_required`
23. `overall_target_verified`
24. `read_only`
25. `mutation_count`

The order is mechanically derived from the exact Sprint 17C.37 sequence: `mode` follows `result_version`; the three metadata/evidence fields immediately precede `database_observed_target_evidence`. All fields are unique.

## Field and nested-key semantics

`mode` is governed non-caller-controlled sanitized text with exact value `MISMATCH_DETAIL_DIAGNOSTIC`, distinguishing this operation from `PREFLIGHT`, `RECONCILIATION`, `AMENDMENT`, and `POST_VERIFICATION`.

`metadata_storage_present` is a Boolean derived only from guarded catalog resolution. `migration_014_metadata_count` is a non-negative aggregate count with authoritative before-migration value zero and exposes no row or payload. `evidence_complete` describes required database-evidence completeness; it must be false for unresolved governed roles, schema, required objects, or session evidence and cannot become true from external metadata.

Within `externally_authorized_target_binding`, `project_id` is superseded by `project_reference` with value `ahmorpzcaapvoymiqlkv`, and `database_source` is superseded by `dashboard_database_source` with value `Primary Database`. The old keys are prohibited only in the future executable contract and remain untouched in historical artifacts. Both successor values remain externally attested and are not database observations.

The Model A authority split is unchanged: PostgreSQL supplies only `current_database()`, `CURRENT_USER`, and `SESSION_USER`; organization, project name/reference, region, branch, Dashboard source, and governed environment require external authorization and manual Dashboard verification. SQL-only overall target verification remains prohibited.

## Repository preservation

Repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`; working directory is `frontend`; branch is `main`; origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`; upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was preserved. Migrations remain exactly 001–014, migration 015 is absent, migration 014 remains unapplied, and authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`. Sprint 17C.23, 17C.26, and 17C.29 authorizations remain consumed.

Protected hashes remain: Sprint 17C.36 `ECB92D08C6712B81CEE71C59FD8DFD9CBCE4FA7B441EE0E6199ED912A28F894C`; Sprint 17C.34 `E4709DA5768F6D8099B1160DB845A9F744228C964AFE2CACBBE3A98520F96548`; Sprint 17C.32 `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`; Sprint 17C.30 `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`.
