# Direct endpoint model

Future sanitized declarations must contain no URI or secret.

| Field | Expected safe value/reference | Evidence class |
|---|---|---|
| organization | Lunch Break Hot Take | `REPOSITORY_DECLARED` |
| project name/reference | LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` | `REPOSITORY_DECLARED`; later `PLATFORM_ATTESTED` |
| region / branch / source | `us-east-1` / `main` / Primary Database | `REPOSITORY_DECLARED`; later `PLATFORM_ATTESTED` |
| governed environment | `DEDICATED_NON_PRODUCTION_TEST` | `REPOSITORY_DECLARED` and `OPERATOR_ATTESTED` |
| endpoint identity and expected DNS name | opaque endpoint reference plus hostname | `UNRESOLVED`, then `PLATFORM_ATTESTED` |
| port / database name | bounded numeric/name declarations | `UNRESOLVED`, then `PLATFORM_ATTESTED` |
| connection mode | `DIRECT_POSTGRESQL` | `REPOSITORY_DECLARED`, later `CONNECTION_OBSERVED` |
| role reference | dedicated REF role reference | `UNRESOLVED`, later `DATABASE_OBSERVED` |
| TLS policy | verified TLS policy reference | `REPOSITORY_DECLARED`, later `CONNECTION_OBSERVED` |
| application name / connect timeout | bounded policy values | `REPOSITORY_DECLARED` |
| password | one bounded in-memory value | `SECRET_INJECTED`; never evidence |

Prohibited fields include password, full URI, query-string credentials, API/service keys, and certificate private material.
