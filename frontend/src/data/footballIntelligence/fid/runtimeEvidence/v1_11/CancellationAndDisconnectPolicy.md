# Cancellation and disconnect policy

Before connect or BEGIN, cancellation stops without submission. During connect, the single attempt is ended and connection state may be unresolved. After any stage may have been submitted, operator cancellation, local timeout, explicit cancel request, `pg` error/end event, socket loss, or destruction mandates stop and records possible external continuation. No second Client, retry, replay, reconnect, or failover is allowed.

Cancellation request is not server acknowledgement. Connection close is not rollback evidence. A rollback request without acknowledgement remains `ROLLBACK_REQUESTED/UNKNOWN`; an end request with uncertainty remains unresolved. Only explicit server acknowledgement can support rollback-observed evidence. Any persistent-state conclusion belongs to a separate reconciliation authorization.
