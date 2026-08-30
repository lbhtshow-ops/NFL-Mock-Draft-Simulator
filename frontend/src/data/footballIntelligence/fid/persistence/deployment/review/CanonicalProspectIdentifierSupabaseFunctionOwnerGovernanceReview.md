# Supabase deployment identity and function-owner governance review

Accessed 2026-07-25. This review uses only official Supabase and PostgreSQL 17 documentation.

## Repository finding

Migration 001 verifies but does not create `fid_function_owner`. Migration 008 transfers the existing atomic RPC to that restricted NOLOGIN role. Migrations 009–011 establish forced RLS, owner-specific policies, revoke-first privileges, and service-role-only execution; migration 012 verifies those invariants. No repository artifact authorizes an alternate deployment identity, direct connection, CLI or CI runner, temporary role assumption, membership amendment, support-assisted procedure, or direct login as the owner role.

The successful 017c5 result is authoritative: migration 014 fully rolled back and remains unapplied. Migration 015 is unnecessary.

## Official evidence

- Supabase roles: https://supabase.com/docs/guides/database/postgres/roles
- Supabase superuser restrictions: https://supabase.com/docs/guides/database/postgres/roles-superuser
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase CLI `db push`: https://supabase.com/docs/reference/cli/supabase-projects-create#supabase-db-push
- Supabase RLS and SECURITY DEFINER: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL 17 role membership: https://www.postgresql.org/docs/17/role-membership.html
- PostgreSQL 17 information functions: https://www.postgresql.org/docs/17/functions-info.html
- PostgreSQL 17 GRANT: https://www.postgresql.org/docs/17/sql-grant.html
- PostgreSQL 17 ALTER FUNCTION: https://www.postgresql.org/docs/17/sql-alterfunction.html
- PostgreSQL 17 ALTER ROLE: https://www.postgresql.org/docs/17/sql-alterrole.html

Supabase supports custom roles and official CLI migration deployment, but its project `postgres` role is not a true superuser. Moving the same authenticated database identity from Dashboard to CLI, `psql`, or a migration runner changes transport and workflow, not PostgreSQL authority.

PostgreSQL 17 separates membership, inherited usage, SET capability, and ADMIN authority. `ALTER FUNCTION ... OWNER TO` requires effective SET capability to the new owner and CREATE privilege for that owner on the schema. `ADMIN OPTION` governs whether membership can be granted, revoked, or amended; it does not itself supply SET capability. Removing a deployment role's membership after ownership transfer does not change the function owner, but no temporary amendment is authorized here.

Supabase documentation confirms custom-role management and migration tooling, but the reviewed official material does not document a special administrative ownership-transfer service or guarantee how project upgrades, restarts, branch operations, or managed-role resets affect custom membership options. No support request is justified until current ADMIN and SET evidence is captured.

## Path decision

Path A remains possible only if a governed identity already has SET capability. Path B is not authorized, but its feasibility depends on ADMIN evidence. Path C has no documented repository or platform-specific procedure beyond normal database identities. Path D is deferred because replacing the restricted owner is unnecessary until A–C are exhausted and would require a separate architecture review.

The existing reconciliation captured MEMBER, USAGE, SET, and membership-path options, but the supplied authoritative result did not preserve the complete ADMIN/governance result. The additive 017c6 preflight fills that narrow evidence gap without changing roles or database state.

Selected outcome: `READY_FOR_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_REVIEW`. This is not authorization to execute the preflight, alter membership, modify or deploy migration 014, or contact Supabase.
