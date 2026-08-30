# Fake Client contract

The deterministic injected fake implements only `connect()`, `query(config)`, `end()`, and error/end event registration/emission needed by the bridge. Cancellation is a separately scripted acknowledgement-unavailable event; it does not impersonate server cancellation.

It records factory/instance/connect/end/error/end-event/cancellation-request counts; ordered calls; opaque stage reference or payload digest; permitted values; BEGIN/ROLLBACK/COMMIT counts; maximum in-flight queries; and scripted outcomes. It rejects unexpected, edited, duplicate, skipped, replayed, concurrent, or out-of-order calls. Metrics must always report zero network, sockets, DNS, credential/environment reads, database executions, and migrations.
