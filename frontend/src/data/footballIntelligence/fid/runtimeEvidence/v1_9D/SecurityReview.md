# Security review

Decision: `PG_INSTALLATION_SECURITY_REVIEW_PASSED_WITH_INHERITED_AUDIT_FINDINGS`.

The exact pg artifact uses the official registry URL and expected integrity. All 14 added entries are official-registry, integrity-pinned lock entries. No alternate pg, local/git source, pg-native, native build, install script, or reviewed pg-tree audit package exists. The 17 named audit groups are all present at identical versions before installation and do not intersect the pg dependency tree. Advisory IDs and exact per-package severities are unavailable because the full audit output was not preserved; remediation is not authorized.

