# Node-only placement design

The approved location is `src/data/footballIntelligence/fid/runtimeEvidence/v1_10/node/`. Its private index may be imported only by explicit Node diagnostics or a future Node-only composition root. It must not be re-exported by `runtimeEvidence/index.js`, `controllerIndex.js`, the FID root barrel, any React/UI/service module, or a Vite entry.

Allowed imports: `pg`; necessary Node built-ins; selected REF leaf contracts, atomic profile, adapter port, and evidence utilities; additive modules inside this directory. Prohibited: React/DOM/browser APIs, browser Supabase client, UI/services, protected barrels, mutable app state, migrations, deployment/review SQL, remediation/reconciliation, and Sprint 17C executable artifacts.

Gates: source scan prohibited tokens/imports; resolve an import graph from every Vite entry and prove no v1_10/pg/node:net/node:tls/credential module; scan production output for the same; Node ESM import succeeds; a browser-boundary diagnostic rejects importing the private index. Structural isolation is mandatory.
