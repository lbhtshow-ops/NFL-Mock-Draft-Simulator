# PostgreSQL semantics review

PostgreSQL/pg semantics are implementation-ready with conservative claims. One awaited Client preserves connection affinity. BEGIN/ROLLBACK/COMMIT requests and command completions are separate observations. A returned command result is not durable-state proof; `end()` is not rollback acknowledgement. Transport loss after submission makes receipt and transaction outcome uncertain. Client-side timeout only ends waiting unless server cancellation/timeout acknowledgement is observed.

Initial policy is `ROLLBACK_REQUIRED` with `COMMIT_PROHIBITED`; COMMIT fixtures are unnecessary. Mandatory stages stop on first failure. No automatic cleanup query follows an unusable connection. Parameter values remain bounded and stage-bound; the driver cannot accept arbitrary interactive SQL or construct Sprint 17C SQL.
