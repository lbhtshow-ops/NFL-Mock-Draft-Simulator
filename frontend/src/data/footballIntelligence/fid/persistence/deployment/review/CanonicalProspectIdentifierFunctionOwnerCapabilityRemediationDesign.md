# Function-owner capability result review and remediation design

## Decision

`READY_FOR_GOVERNED_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DESIGN`

This is a declaration-only decision. It does not authorize executable privilege SQL, migration 014, migration 015, role assumption, RPC invocation, or database activity.

## Sanitized 017c8 result

The single authorized 017c8 execution completed read-only against project `ahmorpzcaapvoymiqlkv`, Primary Database, as `postgres` on PostgreSQL 17.6. The exact deployment and session identities matched. `postgres` is a member of `fid_function_owner`, can govern that membership through ADMIN, but cannot SET the role. The owner has schema USAGE but lacks schema CREATE. Neither prerequisite for the ownership transfer is satisfied together, so `ownership_transfer_capability` is false. The authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`.

ADMIN is governance authority over membership; it is not SET authority. PostgreSQL 17 makes ADMIN, INHERIT, and SET independent membership options. The positive ADMIN result therefore permits a later, separately reviewed membership amendment but cannot be treated as deployment authorization.

## Repository precedent

Migration 001 verifies that `fid_function_owner` is NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS, and NOINHERIT, then creates schema `fid` as the deployment role. It does not create or amend the owner role and does not grant schema privileges. Migration 008 creates the original SECURITY DEFINER RPC with `search_path = pg_catalog, fid` and transfers ownership to `fid_function_owner`. Migrations 009–010 enable and force RLS and create owner-specific allow policies plus public/browser denies. Migration 011 applies revoke-first, exact table privileges to the owner, schema USAGE and RPC EXECUTE to `service_role`, and no direct table access to service/browser roles. Migration 012 verifies the exact model and explicitly expects owner schema USAGE true and CREATE false.

Thus owner CREATE was deliberately prohibited by the deployed verification contract, while earlier ownership transfers implicitly assumed that the platform identity could satisfy PostgreSQL's ownership-transfer checks. The 017c8 result disproves that assumption for the authorized target. Adding CREATE changes a schema ACL only; it does not change any owner role attribute. Adding membership `SET TRUE` with `INHERIT FALSE` changes membership-edge options only; it does not change `fid_function_owner`'s NOINHERIT role attribute and does not give `postgres` automatic inherited use of owner privileges.

## Official semantics

PostgreSQL 17 requires an `ALTER FUNCTION ... OWNER` actor to be able to SET ROLE to the new owner, and requires the new owner to have CREATE on the function's schema. PostgreSQL independently models membership `ADMIN`, `INHERIT`, and `SET`; a SET-enabled membership permits deliberate role assumption, while `INHERIT FALSE` prevents automatic privilege inheritance. Schema CREATE permits creation of objects in that schema, while USAGE permits lookup/access subject to object privileges. A SECURITY DEFINER function subsequently executes as its owner. Supabase documents that its `postgres` project role has admin privileges but is not equivalent to an unrestricted bootstrap superuser, and that browser roles and `service_role` remain separate PostgreSQL identities governed by RLS and explicit grants.

Official references:

- https://www.postgresql.org/docs/17/sql-alterfunction.html
- https://www.postgresql.org/docs/17/role-membership.html
- https://www.postgresql.org/docs/17/sql-grant.html
- https://www.postgresql.org/docs/17/ddl-priv.html
- https://www.postgresql.org/docs/17/sql-set-role.html
- https://supabase.com/docs/guides/database/postgres/roles
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Paths A–D

Path A is selected. Persist owner CREATE only on `fid` and amend only the `postgres`→`fid_function_owner` membership edge to SET true with INHERIT false. Preserve the observed ADMIN state without expansion. This is the smallest reproducible model for migration 014 and future ownership transfers.

Path B is technically possible: after transfer, revoking deployment SET does not change ownership, and revoking owner schema CREATE does not by itself stop an already-created function from executing. However, two-phase elevation and revocation creates additional failure and unknown-commit states, makes later migrations depend on repeated temporary elevation, and weakens reproducibility. It is not selected.

Path C could create a function directly while operating as the owner, avoiding the later owner-transfer statement. It still requires SET authority, introduces identity transitions inside the migration, and complicates ownership of the three new tables, subsequent grants, and atomic review. It does not narrowly repair the existing migration and is rejected.

Path D is unnecessary because the existing restricted owner remains suitable. Replacing it would reopen the complete security-definer, forced-RLS, policy, privilege, and service-boundary architecture.

## Security effect of selected design

The selected design does not modify migration 014 or any function body. SECURITY DEFINER, fixed `pg_catalog, fid` search path, forced RLS, owner policies, exact owner table privileges, service-role-only EXECUTE, public/browser denial, and direct-table denial remain unchanged. The owner remains unable to log in or bypass RLS. Schema CREATE does increase what code deliberately executing as the owner can create within `fid`; this is bounded by NOLOGIN, the non-inherited membership edge, exact target restriction, future preflight, and explicit review. No privilege is granted on another schema and no browser or service-role privilege changes.

## Future implementation contract

A future sprint may design an executable amendment, but it must not combine that amendment with migration 014. It must require the exact before-state, apply the membership-option and schema-ACL changes in one transaction, roll back fully on error, and stop. An unknown result requires a separately authorized read-only catalog reconciliation. A post-amendment read-only preflight must prove SET true, membership INHERIT false, owner CREATE/USAGE only on `fid`, all restricted owner attributes unchanged, all browser/service boundaries unchanged, and migration 014 still rolled back. Only a later independent review may consider migration 014 execution readiness.
