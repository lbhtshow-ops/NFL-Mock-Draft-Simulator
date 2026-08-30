# Repository and adapter audit

Audit date: 2026-08-02. Owner: Runtime Evidence Framework (REF). Repository `NFL-Mock-Draft-Simulator`, branch `main`, origin `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, upstream `origin/fid-persistence-v1.0.1`, and HEAD `f9f8272e8ea868534c9fbc36cf174769367fc6a1` match the supplied baseline. The extensive inherited tracked and untracked worktree was preserved.

Inventories remain distinct: governed deployment migrations contain exactly `001` through `014` (14 files; no 015); deployment-review SQL contains 48 files outside that governed directory; Supabase CLI migrations contain only `20260714_create_research_repository_tables.sql`.

The authoritative runtime path is the Runtime Witness Port (`runtimeWitness.js`), atomic profile (`postgresAtomicOperationProfile.js`), transaction adapter (`postgresTransactionWitnessAdapter.js`), local controller (`runtimeEvidenceController.js`), v1_8B local composition and append-only writer. These artifacts are REF-owned, bounded, synthetic-first, and protected predecessor history. They are reusable unchanged. The deterministic fake driver is a contract precedent, not a `pg.Client` fake.

Current root barrels export the witness adapter and fixtures and are browser-risky; they must not export v1_10 Node modules. Vite enters at `src/main.jsx`; no current application import of `runtimeEvidence` or `pg` was found in that entry graph. Existing browser Supabase services, React, UI, global state, migrations, and Sprint 17C artifacts are prohibited dependencies.

Repository conventions favor injected dependencies, immutable factories, explicit metrics, deterministic fixtures, mandatory stop, zero retry, sanitized codes, and versioned additive records. Existing timeout usage is primarily UI; no repository-native real connection provider, credential provider, target-attestation provider, reconnect engine, or process-signal owner should be reused for this adapter.

Artifact matrix: existing REF contracts/profile/adapter/controller/evidence/writer are reused and not extended; the v1_10 Node boundary is additive and Node-suitable; browser barrels and Vite/UI/service files are neither reused nor extended. Security consequence: import direction must remain Node boundary to narrowly selected REF leaf modules, never the reverse.
