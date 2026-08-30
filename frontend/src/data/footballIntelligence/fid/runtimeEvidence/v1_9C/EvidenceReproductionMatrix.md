# Evidence Reproduction Matrix

All 40 required claims passed. Status counts: **INDEPENDENTLY_REPRODUCED: 34**, **INDEPENDENTLY_CORROBORATED: 6**, all other classifications: **0**.

| # | Claim | Classification | Independent support |
|---:|---|---|---|
| 1–2 | Name `pg`; version `8.22.0` | INDEPENDENTLY_REPRODUCED | Official npm exact-version record `_id`, name, version |
| 3–4 | Stable; not prerelease; not deprecated | INDEPENDENTLY_REPRODUCED | npm `latest=8.22.0`, semver, absent deprecation |
| 5–8 | npm identity, repository, publisher, MIT | INDEPENDENTLY_REPRODUCED | npm identity/repository/author/maintainer/license fields |
| 9–14 | SHA-512, SHA-1, tarball URL, time, count/size, Node engine | INDEPENDENTLY_REPRODUCED | npm `dist`, packument time, engines |
| 15–16 | ESM and CommonJS boundaries | INDEPENDENTLY_REPRODUCED | exports: import `./esm/index.mjs`; require/default `./lib/index.js` |
| 17–19 | Direct, optional, optional-peer dependencies | INDEPENDENTLY_REPRODUCED | exact npm dependency fields; optional overlap handled semantically |
| 20–22 | lifecycle/native/pg-native | INDEPENDENTLY_REPRODUCED | only consumer-visible script is `test`; JS default; optional peer metadata |
| 23–26 | advisory method/result/limitation | INDEPENDENTLY_CORROBORATED | current reviewed GitHub advisory queries plus exact CVE query; non-exhaustive limitation retained |
| 27–34 | exact pin, owners, lock v3, command, two files, engines exclusion | INDEPENDENTLY_REPRODUCED | current manifests, repository layout, command semantics |
| 35–39 | node-only placement, browser isolation, one Client/no Pool, no retry, separate authority | INDEPENDENTLY_CORROBORATED | repository import boundary and explicit policy review |
| 40 | post-install gates complete | INDEPENDENTLY_CORROBORATED | PostInstallValidationPlan.md adversarial cross-check |

Dependencies reproduced: required direct runtime dependencies are `pg-connection-string ^2.14.0`, `pg-pool ^3.14.0`, `pg-protocol ^1.15.0`, `pg-types 2.2.0`, and `pgpass 1.0.5`; optional dependency is `pg-cloudflare ^1.4.0`; optional peer is `pg-native >=3.0.1`. npm also repeats the optional dependency in its raw `dependencies` object; it is classified once as optional.
