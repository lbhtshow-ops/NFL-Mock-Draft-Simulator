# Installation mutation boundary

Future command working directory:

`C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main\frontend`

Exact proposed command (not authorized for execution by this sprint):

`npm.cmd install --save-exact pg@8.22.0`

Allowed future mutations, if independently authorized: `frontend/package.json` and `frontend/package-lock.json` only. No `engines.node` mutation is approved under Node Policy A.

Prohibited: source, scripts, Vite configuration, other manifests/lockfiles, migrations, predecessor REF artifacts/inventories, Sprint 17C history, unrelated upgrades, audit fixes, database/SQL work, and inferred rollback.

Post-command stop checks: exact dependency equals 8.22.0; lockfile remains v3; registry resolved URL and integrity match; full tree and complete npm output captured; package diffs and lock summary captured; read-only audit captured; no unrelated drift; no source import; unchanged build/browser reachability; browser bundle excludes `pg`, `node:net`, and `node:tls`. One attempt is consumed permanently when execution begins; retry and rollback require new authority.
