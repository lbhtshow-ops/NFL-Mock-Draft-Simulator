# Corrected Supabase function-owner capability preflight review

The corrected 017c7 artifact passed repository-local review. Its SHA-256 is `BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57`.

The 017c6-to-017c7 delta is limited to the version header and block E: schema OID evidence, current/session identity binding, deployment-role schema USAGE/CREATE, target-owner schema USAGE/CREATE, missing-capability classifications, and the strengthened ownership-transfer Boolean and classification. Blocks A–D are otherwise identical.

All executable statements begin with SELECT or WITH. Called catalog functions—`current_setting`, `current_database`, `to_regrole`, `to_regnamespace`, `pg_has_role`, and `has_schema_privilege`—inspect identity or privilege state without mutation. No transaction, session, role, object, privilege, data, UUID, RPC, or persistence mutation is present.

PostgreSQL 17 catalog fields and privilege modes are valid. The recursive membership CTE terminates by tracking visited role OIDs. ORDER BY expressions belong to their final SELECT statements, and no reserved relation alias is used.

The positive classification requires exact current and session roles, effective SET, deployment schema USAGE/CREATE, and target-owner schema USAGE/CREATE. Role/schema absence and identity mismatch are checked first. ADMIN capability is reported independently and is not required for ownership transfer. Individual Boolean outputs preserve distinctions when a shared missing-schema classification is used.

Outputs are limited to governed role names, the `fid` schema name, PostgreSQL version, database name, Boolean role and schema capabilities, membership path metadata, and sanitized classifications. No credentials or operational records are accessed.

Selected status: `READY_FOR_CONTROLLED_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_EXECUTION`. This authorizes one manual read-only 017c7 execution only and does not authorize migration 014 or any role change.
