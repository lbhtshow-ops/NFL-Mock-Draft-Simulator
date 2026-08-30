# Sprint 17C.35 exact-target-bound mismatch-detail independent review

Status: `EXACT_TARGET_BOUND_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_ADDITIONAL_CORRECTION_REQUIRED`

This was a repository-only independent review. It connected to no database or Supabase service, executed no SQL or RPC, created no execution authorization, and did not modify Sprint 17C.34, its protected predecessors, migration 014, or historical evidence. The authoritative state remains `MIGRATION_014_FULLY_ROLLED_BACK`; the Sprint 17C.23, 17C.26, and 17C.29 authorizations remain consumed and cannot be reused.

## Stop-condition finding

Sprint 17C.34 does not bind validation to the actual execution target. Its `constants` CTE supplies all eight fixed values. Its `target_binding` CTE then selects that same row and compares each value with the identical literal. Consequently `binding_valid` is invariantly true for every row the query can produce. The visible target fields also come from that literal row.

No independently observed organization, project name, region, project ID, database source, branch, SQL role, or governed environment participates in validation. In particular, a Dashboard execution against a wrong project or branch does not alter the constants, and even fields PostgreSQL can observe directly, such as database and session role, are not compared with their runtime values. Wrong, missing, malformed, case-altered, whitespace-altered, substituted, or overridden actual target context can therefore yield the same usable classification as the intended target.

The 17C.34 JavaScript scenarios do not close this gap. They validate a caller-supplied JavaScript `target` object, but the SQL accepts no corresponding input and reads no such runtime evidence. Those scenarios prove the standalone evaluator, not the reviewed SQL.

This triggers the required stop conditions: exact target fields are not bound to observed target evidence, and invalid target bindings can produce a usable result. Review stopped without correcting the protected SQL. No readiness for execution-authorization review is established. Parser-backed review and the remaining downstream parity areas cannot cure this semantic defect and are not asserted as completion evidence.

The active Python environment does not contain `pglast`; the repository parser reproduction failed at import with `ModuleNotFoundError`. No installation was attempted and no parser-backed claim is made. The principal status remains correction required because the independently reproducible semantic defect resolves the defect question without parser tooling.

## Repository gates

The repository root is `C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main`, the working directory is `frontend`, branch is `main`, origin is `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, and upstream is `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was recorded and preserved without clean, reset, stash, overwrite, or unrelated repair. Governed migrations are exactly 001–014 and migration 015 is absent.

The reviewed Sprint 17C.34 SHA-256 is `E4709DA5768F6D8099B1160DB845A9F744228C964AFE2CACBBE3A98520F96548`. Protected Sprint 17C.32 remains `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`; protected Sprint 17C.30 remains `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`.
