# Installation Mutation and Risk Review

Exact command: `npm.cmd install --save-exact pg@8.22.0` from the bound `frontend` directory. Allowed changes are only `frontend/package.json` and `frontend/package-lock.json`.

| Risk | Precondition | Detection | Stop condition / evidence | Rollback |
|---|---|---|---|---|
| unrelated dependency or lock churn | bound hashes/status pass | exact manifest diff; bounded lock delta | any unrelated direct/script/engine change; save diffs and hashes | not authorized |
| peer/optional side effects | exact npm 11.13.0 command | tree and optional result capture | unexpected package or resolution | not authorized |
| Node/npm incompatibility | Node v24.16.0 satisfies `>=16.0.0` | complete output/exit code | engine/package-manager error | not authorized |
| lifecycle execution | metadata has no install lifecycle | capture all stdout/stderr | unexpected lifecycle output | not authorized |
| audit/advisory change | current review accepted conditionally | read-only audit after install | applicable unpatched result | not authorized |
| registry integrity/signature/metadata drift | exact approved metadata | lock integrity/source and current metadata compare | mismatch, signature inconsistency, deprecation, version substitution | not authorized |
| Windows/npm mutation behavior | exact `.cmd`, exact cwd | before/after status inventory | any unexpected file | not authorized |
| dirty-worktree ambiguity | package files clean and hash-bound | scoped status and hashes | boundary cannot be proven | not authorized |

Package installation is not driver readiness and grants no source, SQL, database, credential, migration, deployment, remediation, reconciliation, or Sprint 17C authority.
