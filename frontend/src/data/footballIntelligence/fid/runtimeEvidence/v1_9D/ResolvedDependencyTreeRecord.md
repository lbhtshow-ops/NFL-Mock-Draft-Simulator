# Resolved dependency-tree record

All rows were absent in the before lockfile and introduced by this installation. All sources are official npm registry tarballs; integrity values are from the lockfile. None has `hasInstallScript` or a lifecycle script in installed package metadata.

| Package | Version | Integrity (sha512 prefix) | Relationship |
| --- | --- | --- | --- |
| pg | 8.22.0 | `8wih1vVIBMxo...` | direct |
| pg-cloudflare | 1.4.0 | `Vo7z/6rrQYxp...` | optional dependency, installed |
| pg-connection-string | 2.14.0 | `XwWDGcLRGCXA...` | pg dependency |
| pg-pool | 3.14.0 | `gKtPkFdQPU3D...` | pg dependency; peer edge back to pg deduped |
| pg-protocol | 1.15.0 | `cq9sECI5s0+u...` | pg dependency |
| pg-types | 2.2.0 | `qTAAlrEsl8s4...` | pg dependency |
| pgpass | 1.0.5 | `FdW9r/jQZhSe...` | pg dependency |
| pg-int8 | 1.0.1 | `WCtabS6t3c8S...` | pg-types dependency |
| postgres-array | 2.0.0 | `VpZrUqU5A69e...` | pg-types dependency |
| postgres-bytea | 1.0.1 | `5+5HqXnsZPE6...` | pg-types dependency |
| postgres-date | 1.0.7 | `suDmjLVQg78n...` | pg-types dependency |
| postgres-interval | 1.2.0 | `9ZhXKM/rw350...` | pg-types dependency |
| xtend | 4.0.2 | `LKYU1iAXJXUg...` | postgres-interval dependency |
| split2 | 4.2.0 | `UcjcJOWknrNk...` | pgpass dependency |

Exact full `resolved` and `integrity` values remain canonically recorded in package-lock.json; Node validation compared pg's complete expected values. Local `node_modules` versions match every row. `pg-native` is absent. No native component is present.

