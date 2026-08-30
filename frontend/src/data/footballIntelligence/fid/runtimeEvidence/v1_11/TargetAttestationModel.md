# Target-attestation model

Before connection, an immutable package binds organization, project name/reference, region, branch, database source, governed environment, opaque endpoint reference, database name, role reference, connection mode, TLS-policy reference, repository declaration digest, operator attestation, and available platform evidence.

Five namespaces remain distinct: `expectedTarget`, `operatorSelectedTarget`, `platformAttestedTarget`, `connectionObservedTarget`, and `databaseObservedTarget`. Declaration agreement is a gate, not proof. Endpoint-to-project binding remains explicitly unresolved until official platform evidence and bounded runtime observations agree.

Future database observations may include bounded database/current/session user, server-version family, application name, isolation/read-only state, and selected schema/function identity. They require separately governed SQL and cannot prove project reference or branch alone. Any mismatch mandates stop, no mutation, no retry, and uncertainty evidence.
