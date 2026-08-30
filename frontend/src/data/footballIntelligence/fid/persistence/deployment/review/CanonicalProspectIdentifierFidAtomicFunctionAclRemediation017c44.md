# Sprint 17C.44 FID atomic function ACL remediation final review and implementation

## Independent review result

Sprint 17C.43 is confirmed. Migrations 008–012 establish one exact `SECURITY DEFINER` function owned by `fid_function_owner`, fixed to `search_path=pg_catalog, fid`. Migration 011 revokes EXECUTE from PUBLIC, anon, authenticated, and service_role before directly granting EXECUTE only to service_role. Migrations 009–010 force RLS and give the owner only the table operations required behind the server-only function. Migration 012 verifies service execution and browser denial.

PostgreSQL 17 distinguishes ACL rows from effective authority. `aclexplode(proacl)` exposes direct ACL entries; `has_function_privilege` answers effective authority. PUBLIC receives function EXECUTE by default, so its direct ACL supplies effective authority to every role until revoked. ACL mutation instantiates default owner entries, but owner identity and owner-derived control remain separate governance facts. Consequently, the captured PUBLIC entry is the root of PUBLIC, anon, authenticated, and service_role effective authority; service_role separately lacks its required direct entry. The owner ACL entry is removable without changing ownership.

The exact drift is: PUBLIC direct EXECUTE present; anon and authenticated direct EXECUTE absent but effective EXECUTE present through PUBLIC; owner ACL EXECUTE present and owner-derived authority present; service_role direct EXECUTE absent but effective EXECUTE present through PUBLIC. Migration-014 objects remain absent and its metadata count remains zero. The historical five-versus-six comparison stays unresolved and is not assigned to a unit.

## Bounded implementation

The mutating artifact uses one transaction and aborts on any deviation. Before mutation it validates postgres execution identity, one exact function signature, owner, security-definer posture, search path, captured direct and effective ACL shape, no grant options, and fully rolled-back Migration 014 object/metadata inventory. It then performs exactly two ACL statements: revoke EXECUTE from PUBLIC, anon, authenticated, and `fid_function_owner`; grant EXECUTE to service_role. It verifies the final direct and effective states and compares owner, security posture, configuration, and a function-source digest captured before mutation. No exception is swallowed.

The preflight, unknown-commit reconciliation, and post-verification companions are explicit read-only transactions. They return stable sanitized rows, keep owner-derived authority separate, expose direct and effective observations independently where applicable, check Migration 014 object and metadata absence, and require external Dashboard target attestation. Reconciliation gives unresolved and inconsistent evidence precedence and distinguishes fully unapplied, fully applied, partially applied, inconsistent, and unresolved states.

The 261-unit ACL matrix is preserved without amendment. Principal observations remain separate while root-cause grouping remains governance metadata. No executable diagnostic was added merely to restate captured evidence.

## Security and lifecycle

The package changes no function body, signature, owner, security-definer flag, search path, schema/table/sequence ACL, RLS flag, policy, role, membership, migration, operational data, or other function. It invokes no function and creates no helper or RPC. Any future uncertain completion requires the fixed reconciliation artifact; retry is prohibited without new governance. The controlled deployment plan and runbook below are preparation only and create no authorization.

Prepared order under future, separately granted authority: externally attest the exact target; verify hashes; run preflight; review a fully-unapplied result; separately authorize remediation; reconcile any uncertain outcome; post-verify a confirmed commit. Migration 014 and the capability amendment remain unapplied throughout.

## Parser and PostgreSQL review boundary

`run_017c44_pglast_review.py` parses all four complete SQL files, the remediation PL/pgSQL body, transaction statements, and visible result SELECT statements using the existing disposable pglast environment. Its reported grammar is recorded verbatim. PostgreSQL 18 grammar acceptance is syntax evidence only, not PostgreSQL 17 compatibility proof. PostgreSQL 17 semantic compatibility is reviewed separately against official privilege, system-information, `pg_proc`, and row-security documentation and migrations 008–012.

Final repository-only status: `READY_FOR_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_CONTROLLED_DEPLOYMENT_REVIEW`. This is not ACL execution readiness, capability-amendment readiness, or Migration-014 readiness.
