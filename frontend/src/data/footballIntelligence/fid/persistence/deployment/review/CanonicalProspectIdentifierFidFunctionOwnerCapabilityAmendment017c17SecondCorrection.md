# Sprint 17C.17 second correction

Status: repository-only correction; no execution authorization.

The three successor SQL units are read-only anonymous PL/pgSQL blocks. Each resolves
`fid.fid_persistence_migrations` with `pg_catalog.to_regclass` into an OID before
reaching `EXECUTE`. A null OID returns immediately with a sanitized missing-metadata
or unresolved notice. The optional relation is never named in a static `FROM` or
`JOIN`, so PostgreSQL cannot resolve an absent table while parsing an executed
metadata statement.

When the OID exists, one constant query is assembled with `pg_catalog.format`.
Its only identifier is `metadata_oid::pg_catalog.regclass`, obtained from the
catalog lookup. No schema, table, column, predicate, value, or SQL fragment comes
from an operator or client. The query returns only counts; notices expose no
migration rows or payloads. Unexpected errors are not caught.

The reconciliation result contract has exactly six stable classifications:

1. `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_UNAPPLIED`
2. `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED`
3. `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SET_ONLY_PARTIALLY_APPLIED`
4. `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CREATE_ONLY_PARTIALLY_APPLIED`
5. `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED`
6. `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED`

Unresolved evidence is evaluated before every positive state. Boundary or metadata
drift is inconsistent, not partial or successful. Missing metadata causes an
immediate stop; operators must not continue to the amendment.

PostgreSQL 17 review: `to_regclass` returns null for a missing visible relation;
the OID cast to `regclass` occurs only after the null branch; `EXECUTE` plans the
constant statement at execution time; `pg_auth_members` supplies independent
`admin_option`, `inherit_option`, and `set_option` fields; catalog ACL expansion is
read-only; aggregate nulls and missing membership are classified before positive
outcomes. Anonymous blocks report sanitized SQL Editor notices and create no helper.

The protected 17C.15 amendment remains unchanged and limited to:

```sql
GRANT CREATE ON SCHEMA fid TO fid_function_owner;

GRANT fid_function_owner TO postgres
  WITH ADMIN TRUE, INHERIT FALSE, SET TRUE;
```

Recommended next sprint: conduct a second corrected deployment review of these
fixed-hash successors, then separately decide whether to create an execution
authorization. Do not execute migration 014 as part of that review.
