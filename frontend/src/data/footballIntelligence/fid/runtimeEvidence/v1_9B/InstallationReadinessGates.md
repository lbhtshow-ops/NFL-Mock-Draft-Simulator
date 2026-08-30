# Installation-readiness gates

| Gate | Result |
|---|---|
| Exact stable version, identity, repository, publisher | PASS |
| Integrity and registry tarball metadata | PASS |
| MIT license | PASS |
| Supported Node LTS compatibility | PASS with Node Policy A |
| ESM named Client import | PASS |
| Consumer install lifecycle acceptable; default client non-native | PASS |
| Direct dependency boundary inventoried | PASS |
| No applicable reviewed advisory found | PASS with incomplete-coverage limitation |
| Mutation boundary and exact command | PASS |
| Complete future resolved tree/audit | DEFERRED until lock generation |
| Independent mutation review | REQUIRED |

Selected outcome: `OUTCOME_B_EXACT_PG_VERSION_APPROVED_BUT_INSTALLATION_AUTHORIZATION_REQUIRES_INDEPENDENT_REVIEW`.

Final status: `RUNTIME_EVIDENCE_FRAMEWORK_V1_EXACT_POSTGRESQL_DRIVER_VERSION_APPROVED`.

No installation authorization is created. This avoids treating metadata approval as package-mutation authority and follows the decision model's maximum passing preference for independent review. Exact next sprint: independent review and, only if separately authorized, one dependency-only installation execution using the bounded command.
