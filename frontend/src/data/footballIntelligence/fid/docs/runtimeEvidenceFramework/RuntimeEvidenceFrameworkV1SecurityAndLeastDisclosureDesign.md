# REF V1 Security and Least-Disclosure Design

Status: `DESIGN_BOUNDARY_SELECTED`.

## Requirements

- Credentials are injected locally at execution time through an interactive or process-local secret boundary. No database password, access token, refresh token, connection string, unrestricted environment dump, command-line secret, persistent credential file, evidence field, log entry or error text may contain secret material.
- V1 can and should operate without storing secrets. The controller fails closed before submission if configuration sanitization cannot distinguish identity metadata from credentials.
- Target evidence is an approved opaque target reference plus bounded server-derived identifiers where available; it excludes raw URLs containing keys, network topology and unrelated project metadata.
- Session/transaction evidence is limited to claim-needed identifiers, transaction status and stage ordering. It excludes unrestricted role graphs, full settings, activity snapshots, general query logs and unrelated sessions.
- Outputs are schema-bounded, size-bounded and field-allowlisted. No application rows, unrelated catalog state, arbitrary SQL output, full role graph or unrestricted `pg_proc` data may enter a package.
- Direct ACL and effective-privilege evidence contains only the governed function identities, bounded grantee classes/counts and claim-required booleans. Raw access-control graphs require separate justification.
- Safe failures expose a category, stage, bounded platform code, sanitized message, timestamps and uncertainty. Stack traces, request headers, environment variables and connection details remain local and excluded.
- Every redaction or normalization creates a derived artifact with source digest, transformation identity/version, actor, timestamp, reason and output digest. Source evidence is never overwritten.
- Operator declarations use the minimum stable reviewer-meaningful identifier. Free text is discouraged and scrubbed for secrets and personal data before preservation.
- Custody events record creation, verification, transfer, transformation, review, supersession and archival. Access is limited to the operation owner, evidence custodian and authorized reviewers.
- Initial retention is repository-governed and bounded to the protected operation history. Export requires integrity verification and a custody event. Retirement is a status and never erasure of governing lineage.

## Privilege and observer boundary

The local controller receives no privilege beyond the separately authorized operation. It cannot retry automatically, select a different target, broaden scope, or consume authority twice. The database witness is operation-specific, transaction-local, non-persistent except for the operation’s authorized effects, and unable to inspect unrelated data. Its observer effect—extra statements, identifiers, timing and result construction—must be declared and tested.

The witness must not be a general SQL executor, `SECURITY DEFINER` escape hatch, permanent logging trigger, event trigger, unrestricted audit extension, or background collector. Any future database-side object requires its own migration/security/authorization review; REF-V1.1 creates none.

## Threat findings

Principal threats are artifact substitution after hashing, target substitution, correlation spoofing, credential leakage, partial submission, hidden platform retry, result truncation, package mutation, custodian replacement and overclaim from missing observations. Controls are immediate pre-submit hashing, immutable manifest references, target allowlisting, unpredictable execution identifiers, no retry, bounded raw capture, component and package digests, append-only custody, independent review and explicit `UNOBSERVABLE`/`INSUFFICIENT` outcomes.

The design does not treat SHA-256 alone as authenticity, operator access as authority, a successful response as commit proof, or general logs/screenshots as governed evidence.

