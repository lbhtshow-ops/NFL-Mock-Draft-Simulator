# Installed pg boundary review

`package.json` and lockfile pin `pg` to 8.22.0. Installed metadata declares Node >=16, CommonJS `./lib`, ESM `./esm/index.mjs`, and conditional exports for import/require. Import-only Node ESM inspection found callable `Client` and `Pool` exports; neither was constructed. `Pool` is technically exported but REF-prohibited.

The Client constructor boundary is `pg/lib/client.js`; construction creates connection-capable state and must occur only inside the future injected factory. Package sources depend on connection/protocol facilities and expose network/TLS capability through Node networking layers. Browser substitution exists in package internals for selected files, but that is not an isolation control. No browser field or Vite externalization can replace graph unreachability.

Observed configuration semantics include `connectionTimeoutMillis`, `query_timeout`, `statement_timeout`, `lock_timeout`, and `idle_in_transaction_session_timeout`. `Client.cancel(client, query)` opens a distinct cancellation connection; it cannot satisfy the one-connection policy without separate authorization and therefore is not part of v1_10B.
