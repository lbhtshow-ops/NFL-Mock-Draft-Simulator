# Repository audit and reuse record

The audit covered REF-V1.10B Node files (pg factory, driver, fake Client, result/error mapping, timeout declarations), REF-V1.11 target, credential, TLS, role, application-name, timeout and composition designs, the Runtime Witness Port, authoritative `postgresTransactionWitnessAdapter.js`, `runtimeEvidenceController.js`, REF-V1.8B local composition, evidence models, append-only writer, deterministic fixtures, browser scans, inventories, authorization identities, protected history, application-name/no-retry/mandatory-stop policies, and Sprint 17C predecessor references.

Ownership remains with each predecessor component. REF-V1.12 adds provider/configuration/composition orchestration only. No controller, pg driver, transaction adapter, evidence model, writer, atomic profile, result mapper, error mapper, custody model, or claim assessment is duplicated. All executable additions are under `v1_12/node` or `v1_12/diagnostics`; protected root barrels are unchanged and browser/Vite reachability is prohibited.

Transport ownership uses option A: the existing fake transport models logical local submission, while the authoritative pg witness adapter solely owns the future physical transaction path. Neither declaration claims database receipt or exact live artifact submission.
