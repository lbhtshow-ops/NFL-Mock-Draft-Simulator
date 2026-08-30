# Connection-path assessment

| Path | Dedicated Client/session/transaction | Network/IP implications | TLS/credential/role | Decision |
|---|---|---|---|---|
| A — direct PostgreSQL endpoint | Best fit: one `pg.Client`, stable socket and expected backend session, explicit transaction, transaction-local catalog visibility and rollback acknowledgement | Direct DNS/IPv4/IPv6 and Windows port reachability are unproved | PostgreSQL password, verified TLS, dedicated role are conceptually supported | Preferred, pending platform and reachability proof |
| B — session-mode pooler | Potential fallback; affinity may preserve a backend session for the client, but hidden replacement/failover behavior is unproved | Often materially different host/port/IP support; all unproved | Verified TLS and PostgreSQL credentials still required | Fallback only after session-affinity/no-retry proof |
| C — transaction-mode pooler | Logical Client may persist, but backend affinity across stages is not guaranteed | Pooler reachability unproved | Transaction pooling weakens server-session evidence | Rejected for REF same-session claims |
| D — API/RPC, Dashboard SQL, Edge Function, browser | Cannot preserve the required local Client/session/evidence chain | Different transport boundary | service/anon API keys are not database login credentials | Insufficient; prior rejection retained |

Primary selection: `DIRECT_ENDPOINT_PREFERRED_PENDING_REACHABILITY_PROOF`. This is a design preference, not target truth or connection authorization. Direct endpoint identity, port, address-family support, CA requirements, hidden failover behavior, and endpoint-to-project binding remain unresolved by repository evidence.
