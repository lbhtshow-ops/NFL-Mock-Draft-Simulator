# Documentation diagnostics

Deterministic checks cover repository identity, dirty-state preservation, separated migrations, predecessor/additive inventories, package/capture hashes, protected-path non-mutation, V1.10B Node-only reuse, all four path options, IP/Windows/TLS/credential/attestation/role/session/timeout/cancellation/proof/composition/Sprint 17C/security/PostgreSQL decisions, prohibited-pattern review, inventory validation, whitespace, conflict markers, and `git diff --check`.

ESLint and build are not applicable because REF-V1.11 adds only Markdown and JSON. Diagnostics perform filesystem and Git reads only: no network, DNS, sockets, environment-secret reads, Client construction, credential loading, SQL, or external runtime operation.
