# Sprint 17C.31 mismatch-detail diagnostic independent review

The repository identity, inherited-worktree preservation, migrations 001-014 inventory, captured aggregate record, reviewed hash `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`, and all protected hashes pass. Authorizations 17C.23, 17C.26, and 17C.29 remain consumed; no retry or mismatch-detail execution is authorized.

The diagnostic is syntactically read-only, uses one explicit read-only transaction, returns one ordinary row, has deterministic JSON ordering, does not swallow errors, and contains no mutation, lock, role change, persistent setting, helper object, RPC, UUID, or identifier generation. Its output fields are `result_identity`, `result_version`, `classification`, `mismatch_count`, `expected_before_set_state`, `expected_before_create_state`, `unresolved_count`, `inventory_conflict_count`, `mismatch_details`, `project_id`, `database`, `branch`, `sql_role`, `read_only`, and `mutation_count`. `mismatch_details` is a JSONB array of the ten documented sanitized fields; empty output is `[]`. One physical row avoids the Dashboard 100-row truncation limit.

Independent review found bounded correctness defects. Protected 17C.27 increments once and `CONTINUE`s when a governed table is absent or wrongly owned. The detail SQL instead emits a table-owner item and evaluates all table ACL units, so one aggregate condition can fan out into many details; `has_table_privilege` can also fail for an absent table. Consequently `summary.mismatch_count=count(*)`, JSON length, and captured aggregate count 5 have no proven reconciliation rule.

The expected-before-state contract is incomplete. SET true is not emitted when ADMIN/INHERIT shape passes. CREATE true is used as the owner schema-ACL comparison baseline, so a consistent unexpected CREATE state can also be omitted. The single `OWNER_MEMBERSHIP_OPTIONS` item collapses MEMBER, ADMIN, INHERIT, and SET identities, does not preserve the protected exact membership-row condition, and cannot identify which membership option drifted. Missing governed roles/schema are not classified as unresolved before privilege inspection.

Target binding is incomplete because `DEDICATED_NON_PRODUCTION_TEST` does not appear in the SQL. Database, branch, and SQL role are emitted as constants; only current/session role mismatch is inspected. The required governed-environment binding is therefore absent.

The 260 intended ACL policy rows and inventory checks do not invent a new privilege policy, and the visible projection is sanitized. Optional metadata uses `to_regclass` before an aggregate-only `query_to_xml` query with catalog-resolved `regclass`; missing metadata yields a sanitized item and unexpected errors propagate. Those passing properties do not cure the count, identity, unresolved-evidence, and binding defects.

Offline pglast v8.4 with PostgreSQL 18.4 grammar parses the complete diagnostic and dynamic aggregate SELECT. This is not PostgreSQL 17 proof. The individual constructs are PostgreSQL 17-compatible, but semantic correction remains required before execution-authorization review.

No SQL or database operation occurred, no authorization was created, and the amendment and migration 014 remain prohibited and unauthorized.
