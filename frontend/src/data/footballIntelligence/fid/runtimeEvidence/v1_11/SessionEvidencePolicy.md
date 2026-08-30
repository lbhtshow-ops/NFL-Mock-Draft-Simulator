# Session-evidence policy

| Field | Classification |
|---|---|
| database name, current user, session user, application name | `REQUIRED` |
| transaction isolation, transaction read-only state, target schema/function identity | `REQUIRED` |
| PostgreSQL version family | `OPTIONAL` and `SENSITIVE_SANITIZE` |
| backend PID | `CORRELATION_ONLY`, `UNSTABLE`, local-only or hashed |
| connection mode | `REQUIRED` declaration plus observation where supported |
| target function/role/schema OIDs | `CORRELATION_ONLY`, `SENSITIVE_SANITIZE`; omit raw values from portable evidence |
| transaction and statement timestamps | `OPTIONAL`, `UNSTABLE` for identity |
| stable transaction identifier | `UNAVAILABLE`; must not be inferred |

Catalog output is bounded to required identity/privilege facts. Raw SQL, catalog rows, role lists, addresses, and unrelated metadata are prohibited.
