# Security review

Decision: `PG_ADAPTER_IMPLEMENTATION_SECURITY_REVIEW_ACCEPTED`.

Package capability is contained by a private Node import boundary, injected least-capability providers, one-client/no-Pool rules, exact stage identities, bounded output, fail-closed sanitization, no retry/reconnect, and fake-only diagnostics. No secret is portable; no raw SQL/error/connection object is evidence. Package installation grants no runtime authority.

Residual limitations: static and fake diagnostics cannot prove endpoint identity, TLS negotiation, server timeout/cancel behavior, transaction outcome after disconnect, database state, or operational success. Those remain unresolved and require separately authorized future runtime evidence.
