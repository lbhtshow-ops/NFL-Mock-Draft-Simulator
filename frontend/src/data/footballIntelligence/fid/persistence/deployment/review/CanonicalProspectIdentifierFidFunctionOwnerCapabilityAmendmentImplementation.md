# Sprint 17C.13 capability amendment implementation

This package is static, unapplied, and bound to Supabase project `ahmorpzcaapvoymiqlkv`, Primary Database, `main`, `us-east-1`, `DEDICATED_NON_PRODUCTION_TEST`, PostgreSQL 17.6. It creates no execution authorization.

The single transaction asserts the fully rolled-back migration-014 state, exact `postgres` identity, the existing governed membership edge, ADMIN true, membership INHERIT false, SET false, owner USAGE true, owner CREATE false, restricted owner attributes, and deployment schema authority. It then changes exactly two capabilities: CREATE on schema `fid` for `fid_function_owner`, and SET true on the existing `postgres` membership. The membership grant explicitly repeats ADMIN true and INHERIT false. After-state assertions precede COMMIT; any error aborts the transaction.

PostgreSQL 17 syntax basis: `GRANT CREATE ON SCHEMA`, and `GRANT role TO member WITH ADMIN TRUE, INHERIT FALSE, SET TRUE`. PostgreSQL role membership records expose `admin_option`, `inherit_option`, and `set_option` in `pg_auth_members`; `pg_has_role` supports `SET` and `MEMBER WITH ADMIN OPTION`. `ALTER FUNCTION ... OWNER TO` requires the caller to be able to SET ROLE to the new owner, while that owner must have CREATE on the function schema. References: PostgreSQL 17 `GRANT`, `pg_auth_members`, role information functions, and `ALTER FUNCTION` documentation.

Migration 012 remains unchanged as historical evidence. The additive successor recognizes CREATE only on `fid` as an authorized requirement for this target while rejecting CREATE on every other non-system schema and preserving all role/runtime restrictions.

Controlled deployment order is: independently verify the target, run preflight, obtain a separate authorization, execute the unchanged amendment as one unit, then run post-verification. If commit state is unknown, do not retry; run the reconciliation query, which emits one of the six governed classifications, and seek a new decision. Migration 014 remains separate and unauthorized throughout.

Review outcome: `READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DEPLOYMENT_REVIEW`. This is review readiness only.
