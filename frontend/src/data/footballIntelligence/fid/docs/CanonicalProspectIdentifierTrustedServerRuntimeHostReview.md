# Canonical Prospect Identifier Trusted Server Runtime Host Review

Decision `CANONICAL_PROSPECT_IDENTIFIER_TRUSTED_SERVER_RUNTIME_HOST_DECISION` version `1.0.0` selects a Supabase Edge Function, using the Deno runtime, as the future non-production trusted orchestration host. Its status is `RUNTIME_HOST_SELECTED_NOT_IMPLEMENTED`. This sprint creates immutable declarations and deterministic diagnostics only.

## Evidence and comparison

The repository is a Vite ESM browser application with a development `/api` proxy. It has no governed Vercel Function, Supabase Edge Function, standalone Node service, or owned external-backend source. It does contain an extensive Supabase persistence boundary: migrations, forced RLS, service-role RPC-only access, a security-definer atomic RPC precedent, idempotency semantics, and deployment/security diagnostics. This makes Supabase Edge Functions the clearest owned future server boundary and keeps orchestration close to authoritative state.

Vercel Functions are technically viable but lack a repository-owned server boundary and transaction design. A dedicated Node service is capable but adds unjustified hosting and operational burden. The external proxy target is blocked because its source, ownership, security, and deployment authority are unverifiable. A Postgres function is retained only as a future narrow atomic persistence capability; it cannot own entropy, encoding, identifier strategy, authorization, or application orchestration. Browser generation remains prohibited.

## Governed boundary

The selected secure-source category is a Deno/Web Crypto platform-backed CSPRNG capable of returning exactly 16 secure bytes or a governed failure. No API is imported or invoked, and there is no fallback, partial result, retry, encoding, or candidate assembly at that source. The approved 128-bit output-size policy and RFC 4648 unpadded Base64URL encoding policy remain version `1.1.0` and retain their existing owners.

Future authenticated requests terminate at a server-controlled endpoint. Supabase Auth JWT validation establishes actor identity; Sprint 5 issuance authorization independently decides whether the operation may proceed. The client cannot supply entropy, candidates, namespaces, strategies, providers, adapters, policies, attempts, reservation or issuance decisions, ledger values, canonical IDs, or credentials. Service-role credentials remain in managed server-only configuration.

After governed candidate generation and structural validation, one future narrow Postgres RPC/database transaction should coordinate authoritative collision detection, reservation, issuance-ledger write, and canonical identifier binding. The issuer retains idempotency and recovery policy; the database supplies atomicity and authoritative constraints. No RPC or SQL was created in this review.

Future server implementation belongs under the conceptual package boundary `supabase/functions/canonical-prospect-identifier-issuer`; no directory or implementation exists. Browser code must never import server-only runtime implementations. Test, local-development, and preview/staging boundaries are eligible only with isolated non-production resources. Production remains prohibited pending separate security, deployment, operational, and production-readiness approval.

Allowed observability is limited to safe references and categorical outcomes. Raw or encoded entropy, candidate identifiers, full requests, authorization payloads, JWTs, credentials, dependency objects, database connection details, personal facts, sensitive stack traces, and random-state details must never be logged.

## Readiness

The compatibility result is `TRUSTED_SERVER_RUNTIME_HOST_READY_FOR_BOUNDARY_DESIGN`. Remaining design matters include endpoint protocol, CORS allowlist, JWT claim mapping, exact RPC schema/signature, region, timeouts, rate limits, and production approval. The resulting readiness is `READY_FOR_CANONICAL_PROSPECT_IDENTIFIER_TRUSTED_RUNTIME_BOUNDARY_DESIGN`; the exact next sprint is **Canonical Prospect Identifier Trusted Runtime Boundary Design**.
