# Browser and Vite isolation design

Current static review found no `pg` application import and no Vite-entry import of runtimeEvidence. Passing v1_10B requires: no Node module export from browser-facing barrels; no React/Vite/client-service importer; a dependency walk from `src/main.jsx` excluding `v1_10`, `pg`, credential code, `node:net`, and `node:tls`; build success; emitted bundle scans with zero matching package/module identifiers; explicit Node ESM import success; and a negative browser-boundary fixture.

Vite warnings, shims, conditional browser files, or externalization do not pass the gate. The proof is absence of a static/dynamic import path from every browser entry.
