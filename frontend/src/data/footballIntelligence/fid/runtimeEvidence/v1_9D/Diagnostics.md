# Diagnostics

Read-only diagnostics cover repository identity, branch/upstream/origin/HEAD, dirty status, distinct SQL inventories, REF-V1.7 predecessor references, REF-V1.8B through V1.9C inventories, authorization scope/consumption, hashes, Node parses, exact dependency and pg metadata, semantic/text diffs, resolved local tree, optional/native/lifecycle state, baseline audit-package presence, capture provenance, protected files, whitespace, conflict markers, and Git diff checks.

The authorization file remains historically `ACTIVE_UNCONSUMED`; REF-V1.9D immutably records the lifecycle transition rather than rewriting it. One attempt/execution is established by the authoritative execution result and capture. No retry/uninstall/audit fix/source implementation/database/SQL operation occurred.

## Final verification

- Identity: PASS — repository expected path; branch `main`; upstream `origin/fid-persistence-v1.0.1`; origin expected URL; HEAD `f9f8272e8ea868534c9fbc36cf174769367fc6a1`.
- Dirty worktree: PRESERVED — extensive inherited tracked/untracked changes remain; this sprint added only `v1_9D` artifacts. Package files and the capture remain untouched.
- Migration separation: PASS — governed SQL inventory is 001–014 (14 files); the separate Supabase CLI inventory contains `20260714_create_research_repository_tables.sql`; deployment-review SQL is a distinct review inventory and was not executed.
- REF-V1.7 explicit predecessor verifier: PASS — 68 files, aggregate `951A59A705784157184F5EBA9F4C9C568E39670026AE45F8BEF368A4F43934C3`.
- V1.8B/V1.9/V1.9A/V1.9B/V1.9C inventory content hashes: PASS — 8/4/4/13/12 entries, zero mismatches.
- V1.8B diagnostic: PASS, 21 checks. V1.9B pre-install diagnostic: expected successor-state failure at `pg unexpectedly present`; predecessor file was not changed.
- Package and lock hashes/Node predicates/tree: PASS. Exact diff: PASS. Unrelated lock drift: none.
- Capture: PASS — 532 bytes, expected hash, untracked, no apparent sensitive value.
- `npm.cmd run lint`: FAIL (repository baseline), 103 problems: 92 errors and 11 warnings in existing JS/JSX files; no REF-V1.9D Markdown/JSON finding.
- `npm.cmd run build`: PASS after the sandbox-blocked invocation was repeated with filesystem visibility; Vite 6.3.5 transformed 408 modules and emitted a non-blocking large-chunk warning. This was a build diagnostic, not a package-command retry.
- Build-output attribution: the successful build wrote ignored local `dist/` output (index plus generated CSS/JS assets). It is an expected current-sprint build artifact, not an npm-install mutation; Git status does not inventory it and pre-build byte custody was unavailable.
- No package install/update/uninstall/audit/audit-fix command ran in this sprint. No SQL, database, Supabase/PostgreSQL connection, credentials, migration, deployment, remediation, reconciliation, stage, commit, push, or external runtime operation ran.
