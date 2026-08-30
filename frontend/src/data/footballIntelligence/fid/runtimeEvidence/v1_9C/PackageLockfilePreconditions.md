# Package and Lockfile Preconditions

Observed 2026-08-02 in `frontend`:

| File | Exists / parses | Bytes | SHA-256 | Git status |
|---|---|---:|---|---|
| `package.json` | yes / Node JSON parse pass | 1,007 | `904B4CF8161421E48FEB7111679D52816ABB66D0412577B9902D8E5FD45E77D0` | clean |
| `package-lock.json` | yes / Node JSON parse pass | 134,251 | `87078EB532B65A3E310A10F6092C8AEF87AE1BBF81D4E8217C65A5E77D233E36` | clean |

Lockfile version is 3. `pg` is absent from direct dependencies and `frontend/node_modules/pg` is absent. No direct PostgreSQL driver appears in `package.json`, and no `pg`, `postgres`, `postgresql`, `pg-promise`, `knex`, or `sequelize` package root appears in the lockfile.

The extensive inherited worktree dirt does not include either permitted file. Exact attribution remains possible only by binding the authorization to both hashes, capturing full pre/post hashes, reviewing the exact manifest diff and bounded lockfile delta, and stopping on any unexpected changed path. No cleanup, reset, stash, normalization, or rollback is authorized.
