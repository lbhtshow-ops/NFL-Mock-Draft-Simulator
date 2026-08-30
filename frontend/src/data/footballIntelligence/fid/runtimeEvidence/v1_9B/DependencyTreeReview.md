# Dependency-tree review

The package declares six direct names (five ordinary plus `pg-cloudflare`, which appears in both dependencies and optionalDependencies):

| Package | Declared range | Registry version reviewed | Runtime purpose / boundary | Native or lifecycle result |
|---|---:|---:|---|---|
| pg-connection-string | ^2.14.0 | 2.14.0 | connection string parsing, runtime, Node-oriented | JS; test scripts only |
| pg-pool | ^3.14.0 | 3.14.0 | Pool export support; present even though REF forbids Pool use | JS; test only |
| pg-protocol | ^1.15.0 | 1.15.0 | PostgreSQL wire protocol, runtime | JS; `prepublish` exists but is not an install lifecycle event for a registry consumer |
| pg-types | 2.2.0 | 2.2.0 | wire-value parsers, runtime | JS; test only |
| pgpass | 1.0.5 | 1.0.5 | optional password-file lookup path used when password is null; deprecated upstream for pg 9 | JS; pretest only |
| pg-cloudflare | ^1.4.0 | 1.4.0 | alternate Cloudflare socket path; optional | JS; `prepublish`, no consumer install script |

Estimated transitives from current registry range resolution: `pgpass -> split2@4.1.0`; `pg-types -> pg-int8@1.0.1, postgres-array@2.0.0, postgres-bytea@1.0.1, postgres-date@1.0.7, postgres-interval@1.1.0`; `postgres-interval -> xtend@4.0.0`. Queried metadata showed no preinstall/install/postinstall scripts or native compilation among these. Package ranges are not lock resolutions. Only a future package-lock can establish the complete resolved tree, deduplication, integrity, platform choices, and actually installed versions.

`pg-native >=3.0.1` is an optional peer, not automatically installed, and is the libpq/native route. The standard client is JavaScript and compiles no native binding by default. Supply-chain residuals include old small transitive packages, broad caret ranges, and incomplete advisory coverage; post-install lockfile review remains mandatory.
