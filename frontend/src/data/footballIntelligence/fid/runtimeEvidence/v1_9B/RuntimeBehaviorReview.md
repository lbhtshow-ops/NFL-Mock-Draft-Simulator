# TLS, authentication, retry, reconnect, and cancellation review

The exact client supports an `ssl` object passed to Node TLS, including CA/certificate verification and ordinary Node hostname validation. Policy requires encryption and forbids blanket `rejectUnauthorized: false`. It supports `connectionTimeoutMillis`, client-side `query_timeout`, startup `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`, `application_name`, and `enableChannelBinding` for SCRAM-SHA-256-PLUS when offered. Supabase CA details remain unresolved for later platform proof.

Exact source shows a standalone Client rejects reuse after connect, creates one connection, serializes queued queries, and marks the client non-queryable on socket error. It has no hidden Pool, automatic retry, reconnect, failover, connection replacement, or query replay. REF nevertheless forbids relying on its deprecated concurrent query queue: calls must be awaited serially.

Cancellation distinctions: `query_timeout` rejects locally and removes a queued query but does not prove server cessation; PostgreSQL `statement_timeout` is server-side; an explicit cancel request opens a separate connection and uses backend PID/secret; connection destruction terminates local transport. Exact public AbortSignal support was not established. Server acknowledgement and external continuation after local timeout remain unresolved. REF-V1.10 must source-review and fake-client-test each path, treat timeout as uncertain, and never replay a stage.

Required execution policy remains one explicitly constructed `Client`, no Pool, one connect, one explicit transaction, serialized stages, one rollback or separately authorized commit, zero retry/reconnect/failover/replay, and one end.
