# Implementation mutation boundary

Allowed additive v1_10B files under `v1_10/node/`, only as justified: client-factory port and pg factory; pg-client driver bridge; result/error mappers; cancellation/timeout support; injected fake; private Node index; fixtures; diagnostics; architecture review; additive inventory. Prefer fewer files and reuse the existing transaction adapter.

Narrow modification of an existing Node-only composition or versioned index requires explicit written justification. Modification of the authoritative transaction adapter requires a stop-and-review conflict record.

Prohibited: package files, node_modules, Vite config, React/browser/UI/services, protected predecessor files/root barrels, governed migrations, deployment-review SQL, Supabase migrations, Sprint 17C artifacts, prior inventories, install capture, unrelated source, SQL artifacts, credentials, and any live operation.
