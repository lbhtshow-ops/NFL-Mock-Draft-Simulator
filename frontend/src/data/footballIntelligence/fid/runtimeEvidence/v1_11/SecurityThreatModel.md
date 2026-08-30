# Security threat model

| Threat | Mitigation | Residual risk |
|---|---|---|
| wrong project/branch or production-label confusion | multi-source target attestation; dedicated non-production classification; stop on mismatch | endpoint-project binding unproved |
| credential/environment/URI leakage | narrow provider, no dumps/logs/CLI URI, bounded errors | JS memory lifetime |
| browser exposure | Node-only local entry and no browser barrel | composition not yet implemented |
| TLS downgrade, mismatch, bad CA | mandatory verification/hostname and reviewed trust source | CA policy unproved |
| pooler switching/hidden retry | direct preferred, one Client, zero retry; affinity proof for fallback | platform behavior unproved |
| overprivileged role/owner login/service-role confusion | dedicated role; owner remains NOLOGIN; API keys rejected | role authority unproved |
| membership escalation/ACL contamination | transitive membership and effective-privilege proof; revocation plan | database proof pending |
| SECURITY DEFINER injection/search path | avoid new helper by default; fixed identifiers/search path and review if governed | no authority model selected |
| catalog/PID/SQL/error overcollection | predicate output, bounds, hashed/local PID, sanitization | correlation may be weaker |
| timeout/cancel/close mistaken for rollback | explicit acknowledgement states and separate reconciliation | external continuation possible |
| operator or Dashboard Retry | one-attempt authorization and mandatory stop | human/platform action outside process |
| consumed Sprint 17C authority reuse | explicit non-reuse and new authorization identity gate | future governance required |
