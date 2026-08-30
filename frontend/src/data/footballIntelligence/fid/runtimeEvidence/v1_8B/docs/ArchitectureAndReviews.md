# REF-V1.8B Architecture and Reviews

Status: `RUNTIME_EVIDENCE_FRAMEWORK_V1_LOCAL_COMPOSITION_AND_APPEND_ONLY_EVIDENCE_WRITER_ESTABLISHED`.

Outcome: `OUTCOME_A_REF_V1_LOCAL_COMPOSITION_AND_APPEND_ONLY_EVIDENCE_WRITER_ESTABLISHED`.

## Audit and architecture

REF-V1.8A's explicit 68-entry manifest remains authoritative and unchanged. Existing REF identity, canonicalization, controller, fake transport, witness port, PostgreSQL transaction-witness adapter, fake driver, package, custody, and claim-assessment utilities are reused. No reusable repository filesystem writer, safe-path utility, or immutable file-history mechanism existed, so the writer boundary is an additive REF-owned extension under `runtimeEvidence/v1_8B`. Protected barrels are unchanged; `v1_8B/index.mjs` is the versioned export surface.

Dependency direction remains composition -> controller -> fake transport/witness -> fake driver -> finalized package -> writer. The controller owns no filesystem behavior. The writer knows no transport, driver, PostgreSQL, authorization, remediation, or business semantics.

The immutable submission bundle binds declarations, exact bytes/digest, inactive synthetic authorization reference, target/environment, operation/execution/attempt/invocation/correlation references, one attempt, bounded output, and no retry. It rejects sensitive/live/executable fields, consumed authority, multiple attempts, retry, and unbounded output; composition separately rejects digest or profile-binding mismatch before controller invocation.

The approved sandbox is `runtimeEvidence/v1_8B/evidenceOutput`. Retained synthetic records and diagnostic temporary outputs are separated. Paths must equal the approved root or a bounded diagnostic child, remain repository-relative, contain no traversal, drive/device/reserved components, or symlink components, and resolve inside the repository. Filenames are lowercase ASCII `kind--fixture--<64-hex>.canonical.json`, bounded by content identity, and cross-platform safe.

The minimum format is one canonical envelope containing package, custody records, claims, review reference, fixture classification, and mandatory stop, plus separate one-entry custody, history, and review files. REF-V1.3 canonicalization produces UTF-8 bytes. Files use exclusive `wx`, read-back byte and digest verification, and immutable receipts containing only repository-relative paths. Existing destinations fail without mutation. Multi-file persistence is deliberately not represented as transactional.

Custody records state in-memory creation, finalization, writer handoff, local write, verification, synthetic review availability, and the absence of external archive, database persistence, or Git custody. History is one-entry-per-file and states fixture-only, no external execution, and no active authority. Review input retains claims, contradictions, uncertainty, residual gaps, prohibited actions, and no conclusion or successor authorization.

## Filesystem security and adversarial review

Secret-bearing fields, raw clients/drivers, environment dumps, authorization headers, and stack fields are rejected. Errors are reduced to bounded codes and absolute host paths never enter portable records or receipts. The writer cannot execute operations, change evidence meaning, create authority, overwrite, delete, compact history, retry, or turn persistence into operational success.

Adversarial checks cover predecessor/barrel immutability, traversal, absolute/drive/reserved paths, symlink components, filename collisions, exclusive creation, read-back verification, history-after-package ordering, partial-state reporting, custody/Git overclaim, fixture promotion, stack/path leakage, and Sprint 17C authority reopening. Writer success remains distinct from runtime success; writer failure remains distinct from operation failure.

Residual limitations: filesystem TOCTOU is reduced but not eliminated; multi-file writes are not atomic; permission bits vary by platform; a crash can leave a verified package without later linked records; diagnostic cleanup removes only its own temporary subtree; JavaScript objects cannot detect duplicate keys discarded before object construction. General external JSON ingestion is absent and would require a duplicate-key-rejecting parser.

Exact next sprint: **REF-V1.9 — Real PostgreSQL driver and Supabase platform feasibility, security, and composition design with no live execution**.
