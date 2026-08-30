# Dirty-Worktree Attribution Review

Repository identity is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, branch `main`, HEAD `f9f8272e8ea868534c9fbc36cf174769367fc6a1`. Expected upstream reference is `origin/fid-persistence-v1.0.1`; HEAD truth was verified without changing refs.

The repository has extensive inherited tracked modifications and untracked artifacts. REF predecessor and additive artifacts are currently untracked, so this review claims current-filesystem custody only, never historical Git custody. `frontend/package.json` and `frontend/package-lock.json` are individually clean, making exact two-file attribution possible.

Authorization must stop if either bound before-hash differs, if pre-command status for either file changes, or if the command changes any path other than those two files. No automatic rollback is authorized; evidence must be preserved for review.
