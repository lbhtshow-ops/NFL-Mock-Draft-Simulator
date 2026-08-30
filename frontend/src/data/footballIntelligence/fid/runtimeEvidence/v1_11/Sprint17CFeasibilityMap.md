# Sprint 17C feasibility map

| Claims | Classification |
|---|---|
| 1–2 exact artifact bytes/hash locally bound | `IMPLEMENTATION_READY` |
| 3 exact target; 4 exact environment | environment `IMPLEMENTATION_READY`; endpoint binding `REQUIRES_ENDPOINT_PROOF` |
| 5 new authorization identity | `UNRESOLVED` and separately governed |
| 6 one controller invocation; 7 one Client; 10 one explicit transaction; 22 no retry; 23 mandatory stop | `IMPLEMENTATION_READY` (fake-only validated) |
| 8 one connection | `REQUIRES_ENDPOINT_PROOF` and `REQUIRES_DATABASE_RUNTIME_PROOF` |
| 9 one backend session where observable | `REQUIRES_DATABASE_RUNTIME_PROOF`; pooler-dependent |
| 11 before gate; 12–13 ACL stages; 14–16 immediate observations/attribution | `REQUIRES_ROLE_PROOF` and `REQUIRES_DATABASE_RUNTIME_PROOF` |
| 17 rollback requested | `IMPLEMENTATION_READY` |
| 18 rollback acknowledged; 19 Client ended | `REQUIRES_DATABASE_RUNTIME_PROOF` |
| 20 persistent post-rollback state | `UNOBSERVABLE` in the transaction; separate reconciliation required |
| 21 external platform gaps retained | `IMPLEMENTATION_READY` |

Credential acquisition across claims 7–19 also `REQUIRES_CREDENTIAL_PROOF`. No root-cause conclusion or consumed Sprint 17C authority is reopened.
