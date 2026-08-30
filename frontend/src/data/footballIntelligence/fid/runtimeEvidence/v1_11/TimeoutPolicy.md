# Timeout policy

Exact live values remain unresolved pending endpoint latency and operator review. Every value must be finite and declared before authorization.

| Timeout | Owner / relationship |
|---|---|
| connect | `pg` configuration; shortest network acquisition bound |
| local query | driver/controller; exceeds applicable server statement/lock bound only by bounded acknowledgement margin |
| statement / lock / idle-in-transaction | server session/transaction policy; lock < statement < local query; idle bound prevents abandoned transactions |
| controller | controller; greater than one planned serial lifecycle but less than authorization window |
| evidence capture | writer/controller; cannot extend database work |
| rollback | driver; separate bounded acknowledgement wait after failure |
| end | factory/driver; final bounded release wait |

No timeout triggers retry, replay, second Client, reconnect, commit, or a claim of server stop/rollback. Post-submission timeout means possible external continuation; unacknowledged rollback/end remain unresolved and require separately authorized reconciliation. Values must be conservative for one rollback-required diagnostic, validated against Supabase limits, and independently reviewed.
