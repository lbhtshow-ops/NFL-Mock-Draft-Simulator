# Sprint 17C.34 exact-target-binding correction

Status: `READY_FOR_EXACT_TARGET_BOUND_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_INDEPENDENT_REVIEW`

Next sprint: `SPRINT_17C35_EXACT_TARGET_BOUND_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_INDEPENDENT_REVIEW`

This repository-only bounded correction creates no execution authorization, connects to no database or Supabase service, and executes no SQL, RPC, capability amendment, or migration. The authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`; the Sprint 17C.23, 17C.26, and 17C.29 authorizations remain consumed and cannot be reused.

## Repository and preservation

The repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`, the working directory is `frontend`, the branch is `main`, origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, and upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was recorded and preserved without cleaning, resetting, stashing, overwriting, or unrelated repair. Governed migrations remain exactly 001–014; migration 015 is absent. Migration 014 remains unchanged, unapplied, and SHA-256 bound to `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD`.

The protected Sprint 17C.32 hash remains `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`; the protected Sprint 17C.30 hash remains `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`. Neither protected file was modified.

## Bounded correction

The additive `017c34` successor preserves the complete 17C.32 mismatch detection and changes only the successor header, identity/version, exact-target constants and validation, target-failure classification precedence, and visible target fields. A normalization oracle removes those additions and proves byte equality with 17C.32.

The immutable target is organization `Lunch Break Hot Take`, project name `LBHT FID Persistence Test`, region `us-east-1`, project ID `ahmorpzcaapvoymiqlkv`, database `Primary Database`, branch `main`, SQL role `postgres`, and governed environment `DEDICATED_NON_PRODUCTION_TEST`. All eight values are explicit SQL constants. None is caller-controlled, environment-derived, dashboard-inferred, or dynamically overridable.

The single visible row exposes the eight fields in that order plus `target_binding_valid`. Exact validation precedes all other classification branches; an invalid binding returns `TARGET_BINDING_INCONSISTENT` regardless of whether the mismatch count is zero, five, or another value. The Dashboard `PRODUCTION` label is not introduced.

All 15 protected increment classes, table prerequisite skip behavior, resolved-OID privilege checks, deterministic ordinal/count contract, non-inflating SET/CREATE conflict evidence, separate membership evidence, guarded unresolved evidence, aggregate-only metadata inspection, and 260 object-bound plus one inventory governance units remain unchanged.

The SQL is a read-only transaction with one physical result row. It contains no mutation, DDL, ACL or role change, lock, RPC, UUID/candidate generation, configuration persistence, helper object, migration execution, or amendment execution. Output remains sanitized and bounded.

Parser reproduction is provided following repository practice. If `pglast v8.4` is unavailable in the active interpreter, that fact is reported without installing tooling or substituting regex evidence for parser evidence. PostgreSQL 18 grammar acceptance is not PostgreSQL 17 equivalence; the unchanged SQL constructs are separately inherited from the reviewed PostgreSQL 17-compatible 17C.32 body, while the new expressions use only text constants, equality, boolean conjunction, a CTE, and CASE precedence supported by PostgreSQL 17.
