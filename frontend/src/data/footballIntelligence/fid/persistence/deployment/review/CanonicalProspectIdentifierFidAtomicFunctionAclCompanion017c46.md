# Sprint 17C.46 companion correction and bounded final review

## Repository outcome

The expected repository, branch, origin, upstream, migration inventory, protected Sprint 17C.44 SQL hashes, and protected Sprint 17C.45 review hashes were verified. The inherited dirty worktree was preserved. Migrations remain exactly 001–014, Migration 015 is absent, Migration 014 remains unchanged and fully rolled back, and the capability amendment remains unapplied.

## Companion corrections

The three additive successors resolve optional metadata with `to_regclass`, retain only the catalog-resolved `regclass`, and execute one fixed aggregate metadata SELECT only after resolution. Missing metadata produces incomplete evidence and the unresolved classification. There is no executable static `FROM fid.fid_persistence_migrations` reference and no client-controlled identifier.

All modes expose separate direct ACL booleans for PUBLIC, anon, authenticated, owner, and service_role; separate effective EXECUTE booleans for the same principals; owner match; owner effective EXECUTE; and owner-derived authority computed as owner match plus effective authority. NULL `proacl` uses PostgreSQL's `acldefault('f', proowner)` before `aclexplode`. Function count, full identity arguments, owner, security-definer posture, search path, volatility, and parallel safety are independently reported.

Each artifact is one explicit read-only transaction. A valid transaction-local custom setting is initialized with a PENDING sentinel inside a DO block, overwritten in the same block, and emitted through exactly one final ordinary SELECT. Unexpected errors abort; no exception handler exists. No SQL unit mutates, locks, invokes an RPC, generates a UUID, creates an object, or returns raw ACLs, OIDs, bodies, data, credentials, candidates, or payloads.

## Output contract and state precedence

All modes return the same 29 columns in this order: `result_identity`, `result_version`, `mode`, `classification`, `function_identity_resolution_count`, `function_owner_match`, `security_definer_match`, `search_path_match`, `volatility_match`, `parallel_safety_match`, `public_direct_execute`, `anon_direct_execute`, `authenticated_direct_execute`, `owner_direct_acl_entry`, `service_direct_execute`, `public_effective_execute`, `anon_effective_execute`, `authenticated_effective_execute`, `owner_effective_execute`, `owner_derived_authority`, `service_effective_execute`, `metadata_storage_present`, `migration_014_metadata_count`, `migration_014_object_count`, `evidence_complete`, `external_target_attestation_required`, `overall_target_verified`, `read_only`, `mutation_count`.

Precedence is unresolved, inconsistent, exact mode-positive, reconciliation partial, then blocked. Preflight supports fully unapplied, already applied, blocked, inconsistent, and unresolved. Reconciliation supports fully unapplied, fully applied, partially applied, blocked, inconsistent, and unresolved. Post-verification passes only with the exact final state; otherwise it reports blocked, inconsistent, or unresolved.

## New remediation blocker

The companion corrections pass their bounded adversarial and parser review, but PostgreSQL 17 exposes a conclusive defect in protected `017c44a`. It executes `REVOKE EXECUTE ... FROM ... fid_function_owner`, then requires `has_function_privilege(owner_oid,function_oid,'EXECUTE')` to remain true. PostgreSQL permits owners to revoke their own ordinary privileges; ownership retains implicit grant options, not the revoked ordinary EXECUTE privilege. PostgreSQL documentation explicitly describes a non-null empty ACL as granting no ordinary privileges even to the owner. Therefore the protected after-state assertion and mutation are mutually incompatible, and the transaction cannot commit the claimed final state.

No replacement remediation is created because the required policy choice is material: either preserve an explicit owner EXECUTE ACL or redefine the desired owner boundary around implicit grant options rather than effective EXECUTE. That choice requires a separately governed correction. Since the corrected preflight's positive result would otherwise support a non-executable remediation, no execution authorization or manual runbook is created.

## Parser review

The existing disposable environment reports `pglast v8.4` and PostgreSQL 18.4 grammar. Each complete successor parses as `DoStmt`, `SelectStmt`, and `TransactionStmt`; each PL/pgSQL body parses; each fixed dynamic metadata SELECT parses independently as `SelectStmt`; and each file contains one final visible SELECT. PostgreSQL 18 grammar acceptance is syntax evidence only. PostgreSQL 17 semantics were reviewed separately.

No database, SQL, ACL, RPC, identifier, migration, prospect, reconciliation, or post-verification action occurred. No authorization was created.

Final status: `FID_ATOMIC_FUNCTION_ACL_REMEDIATION_IMPLEMENTATION_CORRECTION_REQUIRED`.
