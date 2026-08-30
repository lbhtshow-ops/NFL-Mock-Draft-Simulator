# Least-privilege role assessment

Decision: `DEDICATED_REF_EXECUTION_ROLE_PREFERRED` pending database governance and proof.

| Candidate | Suitability |
|---|---|
| `postgres` | Expected overprivileged; emergency/operator exception only with explicit governance |
| `service_role` | API role/key must not be confused with PostgreSQL authentication; named database role suitability is unproved and final ACL target differs from execution role |
| `fid_function_owner` | Must remain `NOLOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS`, `NOINHERIT`; never convert to execution login |
| dedicated REF login | Preferred: non-production-scoped LOGIN, no elevated attributes, bounded CONNECT/USAGE/catalog visibility and exact governed authority only |
| other repository role | None is proven to satisfy the boundary |

The dedicated role receives no broad table/function/schema creation, role/default-privilege administration, ownership, migration authority, BYPASSRLS, or elevated membership. Credentials rotate; privileges and membership are revocable. Exact LOGIN state, attributes, memberships, CONNECT, schemas, catalogs, function rights, mutation authority, ownership, and RLS effects need read-only database proof.

Authority models: R1 direct grants risk excess and ACL contamination; R2 a narrow admin role can be auditable but membership/effective rights require proof; R3 SECURITY DEFINER can be narrow but creates search-path/injection/owner risk and a duplicate admin subsystem; R4 temporary exception is reversible but operationally risky; R5 `postgres` gives strong evidence but is overbroad; R6 owner-executed governed operation may preserve ownership but still needs an authorized mechanism. No implementation is selected. Prefer a narrowly scoped, existing governance mechanism if proven; do not casually create a helper.
