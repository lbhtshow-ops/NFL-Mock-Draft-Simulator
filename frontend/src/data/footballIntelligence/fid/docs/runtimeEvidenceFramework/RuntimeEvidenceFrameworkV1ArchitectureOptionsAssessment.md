# REF V1 Architecture Options Assessment

## Decision criteria

Ratings are relative to the Sprint 17C evidence boundary: strong, partial, weak, or unavailable. All options must preserve operation ownership, least privilege, bounded output, explicit uncertainty, and separate authorization.

| Option | Artifact/client/target binding | Session/transaction/stages/result | Authenticity, custody, interference | Repository fit, complexity, cost | Disposition |
| --- | --- | --- | --- | --- | --- |
| A. Repository manifest plus manual execution/capture | Partial: strong repository hash; client selection and target are attested | Weak: screenshots/results cannot reliably prove server completion or same transaction | Manual custody and truncation gaps; low observer interference | Strong fit, low build cost | Insufficient alone; retain as degraded/manual fallback. |
| B. Local controlled Node CLI/controller | Strong local bytes, declared target, submission and raw response | Partial: transport receipt and client result are visible; database session/transaction are not inherently visible | Deterministic hashing and bundle custody; secrets can remain process-local | Strong Node ESM fit, moderate complexity, portable | Selected controller half. |
| C. Supabase Edge Function/hosted executor | Stronger hosted executor attestation, but platform receipt/transform/retry remain provider-dependent | Partial unless database witness is added | Adds deployment, hosted secret, logs, platform custody and operating cost | No Edge Function/Deno pattern found; high new surface | Deferred; no evidence it closes the decisive gap. |
| D. PostgreSQL governed RPC/wrapper or instrumentation | Weak local/client-byte proof unless paired | Strong same-session/transaction stages, state, result and explicit termination when designed atomically | High fidelity but observer can alter transaction; requires narrowly governed privileges | PostgreSQL/RPC patterns exist; database-specific and security-sensitive | Necessary witness concept, never standalone or general logging. |
| E. Hybrid local controller plus database-side transaction witness | Strong local hash/submission plus strong same-transaction witness | Strongest available correlation through one execution/correlation value and one bounded returned record | Two trust boundaries are explicit; hashes and custody join them; moderate interference must be assessed | Reuses Node and PostgreSQL; moderate complexity; low operating cost | Selected minimum architecture. |
| F. Browser/dashboard controller plus transaction witness | Browser can bind user selection and visible response, but byte/file and secret controls are weaker | Database witness can be strong; browser/platform transformation remains | Screenshot and browser extension/session risks; credentials exposed to client boundary | Browser exists, but unsuitable for privileged controlled execution | Prohibited for first operation; manual capture only as secondary evidence. |

## Detailed trust limits

| Fact | A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| Exact local artifact bytes | Strong hash | Strong | Partial unless supplied/hash-checked | Unavailable | Strong | Partial |
| Bytes submitted by client | Attested | Strong before transport | Strong at hosted code boundary | Unavailable | Strong before transport plus witness identity | Partial |
| Bytes received by external platform | Unavailable | Platform-dependent | Partial hosted receipt | Unavailable | Platform-dependent; declared gap | Platform-dependent |
| Statements parsed/execution start/completion | Unavailable | Unavailable | Partial | Strong only if witness runs/records stages | Strong database-side | Strong database-side |
| Session/transaction/local state | Unavailable | Usually unavailable | Partial | Strong where PostgreSQL exposes bounded identifiers/state | Strong | Strong database-side |
| Transaction termination/commit/rollback | Attested | Client-visible only | Partial | Strong for explicit outcome; disconnect remains uncertain | Strongest correlated evidence; persistent state still separately assessed | Partial |
| Persistent post-transaction state | Manual later observation | Separate later observation | Separate observation | Separate authoritative observation | Separate observation/review | Separate observation |
| Client-visible returned row | Manual capture | Strong raw capture | Hosted/client split | Server return only | Strong server-to-client correlation | Visible but transformation/truncation risk |
| Platform retries/transformations | Unavailable | Only if exposed | Only if exposed | Unavailable | Only if exposed; never inferred | Only if exposed |
| Operator actions/screenshot fidelity | Attestation/manual | Initiation declaration; no complete human proof | Hosted request identity | Unavailable | Declaration plus events | Screenshot remains weak |

No option proves hidden platform transformations, unexposed retries, or the exact bytes parsed by PostgreSQL merely from a local hash. The selected design narrows this gap by having the database witness validate an artifact digest/correlation declaration and produce bounded stage evidence, but this remains a protocol binding, not omniscience.

## Security, portability, and feasibility

E can run without storing secrets: credentials are injected locally at execution time, remain in process memory, are excluded from arguments, output and bundles, and are destroyed with the process. The database witness must be operation-specific, transaction-bounded, non-logging, least-privileged, and separately authorized. PostgreSQL dependence is accepted only for the Sprint 17C observation adapter; manifest/package contracts and controller remain platform-neutral. No hosted executor is required for V1.

