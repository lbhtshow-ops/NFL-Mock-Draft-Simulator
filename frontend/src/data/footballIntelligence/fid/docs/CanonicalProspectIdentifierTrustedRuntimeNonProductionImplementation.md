# Canonical Prospect Identifier Trusted Runtime Non-Production Implementation

Sprint 15B implements the first server-only, locally testable generation path under `supabase/functions/canonical-prospect-identifier-issuance`. It consumes the canonical 1.1.0 runtime contracts directly and is excluded from the browser-facing prospect-intake barrel. Sprint 15 originally stopped at the declaration-only 1.0.0 ceiling; Sprint 15A supplied the explicit implementation-capable successors used here.

The secure-source adapter calls the injected or platform `crypto.getRandomValues` capability with a newly allocated 16-byte `Uint8Array`. It rejects non-integers, every size other than 16, unavailable sources, wrong return identity/type, wrong length, and raw platform exceptions. It has no fallback, cache, module entropy state, logging, encoding, retry, or persistence.

The non-production provider validates provider, entropy-port 1.1.0, policy 1.1.0, byte length, environment, attempt, and cancellation bindings. It invokes the source once and transfers the `Uint8Array` directly into `PROSPECT_IDENTIFIER_ENTROPY_RUNTIME_RESULT@1.1.0`. Expected failures are sanitized and contain no bytes.

The encoder uses a dependency-free RFC 4648 Base64URL bit-packing implementation. It accepts exactly one 16-byte `Uint8Array` and returns exactly 22 characters from the approved alphabet, without padding, whitespace, `+`, or `/`. The generator adapter binds generator port 1.1.0, validates the governed layer/namespace pairing, calls the provider and encoder once, assembles `namespace:opaque-component`, performs defensive structural and length checks, and returns `PROSPECT_IDENTIFIER_GENERATION_RUNTIME_RESULT@1.1.0`. It claims no uniqueness, collision check, reservation, issuance, ledger write, identity, record, or persistence.

The dependency-injected handler validates POST/JSON/CORS/environment/request restrictions, then keeps authentication and Sprint 5 authorization as separate test boundaries. Matching idempotent replay returns redacted stored properties before generation. A fresh request follows generation, issuer-style structural validation, and a non-persisting transaction-port double. Responses expose only structural booleans and categorical failures. Transaction uncertainty becomes `RUNTIME_RECOVERY_REQUIRED` without retry.

Test-only authentication, authorization, idempotency, deterministic secure-source, and transaction doubles live under the package test directory and are not exported from the server runtime boundary. Development composition rejects deterministic sources; production and browser composition always fail. No Supabase client, service credential, SQL, RPC, persistence adapter, registry, registration, deployment, or production authority exists.

No operational `Deno.serve` entry point is included. Live authentication, governed configuration, rate limiting, and the real persistence transaction port remain absent, so an endpoint would be misleading and fail the approved activation gates. The server export exposes only implementation factories and contains no test doubles.

Controlled tests generate transient entropy and synthetic pre-issuance candidates, but print and snapshot only sanitized structural properties. No exact entropy, encoded component, or candidate is retained. All generated values are unissued, noncanonical, and unpersisted.

The next boundary is the non-production persistence transaction design. It must define the exact RPC/transaction contract, authoritative collision/reservation/ledger semantics, recovery reconciliation, and least-privilege Supabase access before any live integration.
