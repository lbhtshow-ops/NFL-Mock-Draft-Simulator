# Sprint 17C.24 dashboard-visible preflight future-review runbook draft

Draft only. This document does not authorize execution or retry.

A future independent review must verify the exact target, successor SHA-256, parser evidence, read-only transaction, transaction-local result transfer, complete 261-unit coverage, one stable 16-column result row, and absence of any new authorization. It must also independently decide whether Supabase Dashboard SQL Editor presentation is sufficient for the ordinary `SELECT` followed by transaction completion.

If a later sprint creates a new one-shot authorization, its runbook must require complete-script execution exactly once in a new SQL Editor query and capture the single result row containing:

`result_identity`, `result_version`, `mode`, `classification`, `mismatch_count`, `set_state`, `create_state`, `metadata_storage_present`, `migration_014_metadata_count`, `evidence_complete`, `read_only`, `mutation_count`, `project_id`, `database`, `branch`, and `sql_role`.

The operator must stop on any SQL error, zero-row result, incomplete row, multiple rows, conflicting result, unexpected identity/version, or uncertain Dashboard response. No blind retry is permitted. The operator must not execute the protected 17C.19 preflight again, the amendment, reconciliation, post-verification, migration 014, RPC, or any identifier/prospect operation without separate authorization.

Recommended next sprint: `SPRINT_17C25_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_INDEPENDENT_REVIEW`.
