# Sprint 17C.19 immutable ACL matrix and parser review

This repository-only review creates no execution authorization and performs no database, Supabase, RPC, or SQL execution. The authoritative database state remains `MIGRATION_014_FULLY_ROLLED_BACK`.

## Repository-derived boundary

The versioned, deeply frozen `FID_FUNCTION_OWNER_ACL_MATRIX_017C19_V1` expands every schema, table, sequence, and function privilege into a separate entry. Migrations 008–012 establish explicit owner table grants, an ownership-derived owner function capability, explicit `service_role` function execution, and denials for runtime/browser/PUBLIC principals. Every entry separately records direct ACL, effective privilege, grant option, before/after state, ownership, governing artifacts, and coverage in all three successors.

The seven tables remain owned by `postgres`; the atomic function is owned by `fid_function_owner`, is `SECURITY DEFINER`, and has the exact identity arguments and `search_path=pg_catalog, fid`. The expected sequence set is empty. PostgreSQL system schemas (`pg_*`, `information_schema`) and known managed platform schemas (`auth`, `storage`, `extensions`, `graphql`, `graphql_public`, `realtime`, `supabase_functions`, `vault`, `_analytics`, `_realtime`, `net`) are excluded from the other-application-schema CREATE prohibition.

## Successors and reconciliation

The preflight requires SET=false and CREATE=false after proving the rest of the matrix. Post-verification requires SET=true and CREATE=true after proving every unrelated entry remains exact. Reconciliation evaluates missing identity and optional metadata before positive states and preserves all six outcomes: fully unapplied, fully applied, SET-only, CREATE-only, inconsistent/recovery-required, and unresolved.

Optional migration metadata is discovered with `pg_catalog.to_regclass`. The aggregate query is prepared only after successful OID discovery, uses only `metadata_oid::pg_catalog.regclass` as relation identity, accepts no external identifier or SQL, and exposes aggregate counts only.

## Parser-backed review

The supplied external interpreter reported `pglast v8.4`; `pglast.parser.get_postgresql_version()` reported PostgreSQL grammar 18.4. This is recorded as PostgreSQL 18.4 grammar and is not treated as proof of PostgreSQL 17 equivalence.

Parser-proven top-level units:

- Protected 17C.15 amendment: transaction, anonymous block, GRANT ROLE, and GRANT statements.
- 17C.19 preflight, reconciliation, and post-verification: one anonymous `DO` statement each.

Each successor's sole formatted metadata aggregate was rendered with fixed representative literals and the catalog-resolved relation identity, then independently parsed as a `SELECT`. `parse_plpgsql_json` accepted all four anonymous-block bodies. Structural review covered declarations, conditionals, loops, return paths, exception propagation, dollar quoting, RAISE output, and EXECUTE paths. The successors contain no mutation.

Parser review cannot prove target catalog contents, OID resolution, role membership, ACL/effective-privilege results, ownership, server-version behavioral parity, or the authoritative database state. Those remain target-dependent checks for a later separately authorized controlled execution.

## Static oracle

The oracle checks matrix identity/cardinality, deep coverage, all principals/tables/privileges, exact function signature, sequence prohibition, ownership and grant-option tokens, direct/effective separation, metadata safety, mutation absence, six distinct outcomes, and unresolved-first ordering. It includes 271 scenarios spanning independent allowed/denied table privileges and all required drift, metadata, function, identity, and partial-state cases.

No migration or protected historical artifact was changed.
