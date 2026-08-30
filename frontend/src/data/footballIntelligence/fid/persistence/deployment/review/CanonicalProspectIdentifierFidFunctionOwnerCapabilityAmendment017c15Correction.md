# Sprint 17C.15 capability-amendment review correction

This additive, unapplied successor preserves the four Sprint 17C.13 SQL units and binds the correction to project `ahmorpzcaapvoymiqlkv`, PostgreSQL 17.6, Primary Database, `postgres`, and `DEDICATED_NON_PRODUCTION_TEST`. It creates no execution authorization.

The amendment now proves GRANT authority from `pg_namespace.nspowner` or a direct schema ACL row whose `privilege_type` is `CREATE` and `is_grantable` is true. Effective CREATE alone is expressly insufficient. The full migration-001 and migration-008–012 privilege baseline is asserted before either GRANT and reasserted after both GRANTs. It covers the deployment and owner roles, service-role USAGE/EXECUTE, exact owner table privileges, browser denial, PUBLIC ACL denial, function EXECUTE, absence of sequences, denial of owner CREATE on other schemas, restricted owner attributes, and the fully rolled-back migration-014 state.

Read-only successors resolve governed role, schema, and function OIDs before privilege evaluation. Reconciliation covers all six classifications and treats browser, runtime, PUBLIC, owner-table, function, schema, and other-schema expansion as governed drift. Post-verification proves the complete boundary and ownership-transfer capability.

The only mutations remain `GRANT CREATE ON SCHEMA fid TO fid_function_owner` and `GRANT fid_function_owner TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET TRUE`, inside one transaction. Any assertion error aborts the transaction; no exception is swallowed.

Static review outcome: `READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTED_DEPLOYMENT_REVIEW`. This is review readiness only, not execution authorization.
