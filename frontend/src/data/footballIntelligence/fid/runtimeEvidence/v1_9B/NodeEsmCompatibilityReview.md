# Node and ESM compatibility review

Exact metadata declares `node >= 16.0.0`. Local Node v24.16.0 satisfies that range and was an LTS release, but is not the canonical production pin. Official Node status on the research date lists Node 24 and 22 as LTS and Node 26 as Current; production must use a supported LTS line.

Selected policy: `NODE_POLICY_A_DOCUMENT_SUPPORTED_LTS_ONLY`. No `engines.node` mutation is authorized because the package's permissive floor includes EOL lines and the repository need not be bound to one patch. REF-V1.10 must record and enforce a then-supported Node LTS runtime.

Exact-version exports route ESM import to `./esm/index.mjs`, whose source explicitly exports `Client`; therefore `import { Client } from 'pg'` is supported in a Node-only ESM module. CommonJS/default routes use `./lib/index.js`. There is no `type` or browser field in the exact manifest.

Future diagnostics must import from the isolated Node directory, scan protected barrels and Vite reachability, build without importing the implementation, and assert browser output contains neither `pg`, `node:net`, `node:tls`, nor credential-provider code.
