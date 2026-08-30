# 017c8 corrected ownership-capability preflight static review

The complete 017c8 artifact passed repository-local review with SHA-256 `5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495`.

Compared with protected 017c7, only the version header and block-B deduplication structure changed. Role names are deduplicated in an unordered `distinct_roles` CTE. The original role-attribute and classification columns are produced by an outer non-DISTINCT SELECT, where `expected.role_name` is in scope and deterministic `COLLATE "C"` ordering is legal.

The file contains one safe SELECT DISTINCT, no DISTINCT aggregate, one recursive UNION ALL, no INTERSECT or EXCEPT, and two outer ORDER BY/COLLATE clauses. The compound query is closed before its outer ordering. Recursive traversal terminates through the visited-role OID array. No reserved relation alias or alias-scope defect remains.

Every executable statement begins with SELECT or WITH. Catalog calls are limited to non-mutating identity, role, and schema-privilege inspection. There are no writes, locks, role/session changes, operational queries, UUID/RPC calls, secrets, credentials, function bodies, or payloads.

The positive transfer classification requires exact current/session `postgres` identity, deployment and owner roles, `fid` schema existence, effective SET, deployment schema USAGE/CREATE, and target-owner schema USAGE/CREATE. ADMIN and membership evidence remain separately observable and do not independently establish transfer capability.

Selected outcome: `READY_FOR_CONTROLLED_017C8_READ_ONLY_PREFLIGHT_EXECUTION`. Authorization is limited to one manual execution and does not authorize migration 014 or any role change.
