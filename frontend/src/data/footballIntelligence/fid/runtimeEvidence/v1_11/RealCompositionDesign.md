# No-live real-composition design

Next repository-only composition:

`local Node entry point → TargetAttestationProvider → CredentialProvider → SanitizedConnectionConfiguration → PgClientFactory → PgClientDriver → existing postgresTransactionWitnessAdapter → controller → evidence package → append-only writer`.

The next sprint may add interfaces/providers, immutable validation, dependency assembly, and fake endpoint/credential diagnostics. It must remain Node-only and local-only, inject dependencies, expose no browser/Vite barrel, construct no real configured Client, read no credential, execute no SQL/network operation, and create no live authorization. Existing V1.10B factory/driver, root adapter/controller, and V1.8B writer are reused without protected-history changes.
