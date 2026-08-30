# Cancellation and timeout design

Model distinct phases: before submission (safe stop), after submission (external continuation unresolved), error before response, socket error/end after possible receipt, cancellation requested, cancellation acknowledgement unavailable, and transaction outcome unknown. End/disconnect is never rollback evidence.

`connectionTimeoutMillis` may bound acquisition. Local controller deadlines and `query_timeout` may bound waiting but do not prove server stop. Server `statement_timeout`, `lock_timeout`, and idle-in-transaction timeout are configuration declarations whose actual enforcement requires future database evidence. `AbortSignal` is not assumed as a supported `pg@8.22.0` query contract. `Client.cancel` uses another connection and is excluded. On unusable connection: stop, preserve uncertainty, call `end()` at most once where locally safe, create no replacement client, issue no cleanup SQL, retry, reconnect, or failover.
