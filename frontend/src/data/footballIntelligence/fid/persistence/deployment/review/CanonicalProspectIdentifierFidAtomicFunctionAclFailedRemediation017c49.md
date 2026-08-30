# Sprint 17C.49 failed remediation reconciliation review and future runbook draft

## Readiness

`READY_FOR_FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_READ_ONLY_RECONCILIATION_INDEPENDENT_REVIEW`. This is not execution readiness and creates no authorization.

## Immutable failure record

The single-use `OWNER_PRESERVING_FID_ATOMIC_FUNCTION_ACL_REMEDIATION_ONE_EXECUTION_017C48_V1` authorization was consumed when attempt one began and is permanently non-reusable. The protected `017c47a_fid_atomic_function_acl_owner_preserving_remediation.sql` (`9F94425D99A6941FFF41246B4D655F340725C018B45A9844817D4867D9AD9C68`) returned SQLSTATE `P0001`, sanitized error `Governed function or restricted-owner baseline mismatch`, zero visible rows, and no success result. The error was raised by the initial baseline assertion before the authorized `REVOKE` and `GRANT`. Transactional semantics therefore imply rollback, but the UI response alone is not used to claim commit state or current ACL state.

Target binding is externally attested: Lunch Break Hot Take / LBHT FID Persistence Test / `ahmorpzcaapvoymiqlkv` / us-east-1 / main / Primary Database / postgres / DEDICATED_NON_PRODUCTION_TEST. The Dashboard `PRODUCTION` label means primary-branch topology only. PostgreSQL cannot observe these platform values, so the SQL result requires external target attestation and always reports `overall_target_verified=false`.

## Protected assertion inventory

The exact first `P0001` gate requires one eight-argument function identity in schema `fid`; exactly resolved restricted owner, service, anon, and authenticated roles; the function owner to be `fid_function_owner`; SECURITY DEFINER; volatile; parallel unsafe; exact `proconfig` equal to `search_path=pg_catalog, fid`; and all seven owner restrictions: NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS, and NOINHERIT. The execution-identity check precedes it but has a different error.

The second before-state gate, which was not reached, requires default-expanded direct EXECUTE entries for PUBLIC and the owner only; no direct service, anon, or authenticated entries; two direct EXECUTE entries total; none grantable; and effective EXECUTE for anon, authenticated, service, and owner. The third gate, also not reached, requires zero Migration-014 metadata matches and zero governed Migration-014 objects. No membership predicate or schema-privilege predicate exists in the protected remediation. Function ownership is distinct from an explicit owner ACL entry.

## Preflight comparison

The protected 17C.46 preflight and 17C.47 remediation use the same signature string, owner/security/volatility/parallel/search-path checks, default ACL expansion, direct before-state counts, effective role checks, and Migration-014 metadata/object rollback checks. Their meaningful oracle differences are:

- The preflight resolves `fid_function_owner` by name only; the remediation folds all seven restricted-role attributes into owner resolution. Thus the preflight could classify fully unapplied while the remediation's first baseline gate fails on owner-role attribute drift.
- The preflight uses `p.proconfig=ARRAY[...]`; the remediation uses `IS DISTINCT FROM` in the failure predicate. Both reject NULL or a different/order-varied configuration for the observed successful row, although their NULL expression behavior differs internally.
- The preflight explicitly computes ownership-derived authority and classifies state. The remediation first checks owner identity, then separately requires effective owner privilege in its ACL gate.
- The preflight's after-state oracle expected no explicit owner ACL entry (`direct_owner=0`, total one), while the later Sprint 17C.47 owner policy deliberately preserves the explicit owner entry (`direct_owner=1`, total two). This does not explain the reported first-gate error but is a real successor-oracle timing/policy mismatch.
- The remediation statically references the metadata relation; the new diagnostic safely discovers and shape-checks it before dynamic aggregation. Neither protected predecessor checks role membership or schema privileges.

These repository differences identify possible oracle mismatches only. They do not establish the target cause without a separately authorized runtime reconciliation.

## Reconciliation contract and precedence

`017c49a_fid_atomic_function_acl_failed_remediation_read_only_reconciliation.sql` is one read-only transaction and returns exactly one ordinary row. It exposes sanitized booleans/counts only, an ordered JSON detail array of every failed protected before-state predicate, the array length as `failed_baseline_predicate_count`, and a reconciliation Boolean. It does not expose OIDs, raw ACL arrays, definitions, rows, identifiers, payloads, or secrets.

Classification precedence is: unresolved evidence; unexpected Migration-014 state; function-property drift; restricted-owner attribute drift; exact unchanged state; already-applied owner-preserving state; partial/inconsistent ACL state. Missing optional metadata or incompatible metadata columns is unresolved evidence. Migration metadata/objects are considered only after evidence is available. Direct ACL, effective privilege, owner-derived authority, and explicit owner ACL entry are separate fields.

## Future runbook draft

Independent review must first verify repository hashes, result-column order, predicate coverage, PostgreSQL 17 semantics, and external target binding. A future sprint may create a single-use read-only reconciliation authorization. Only that later authorization may permit byte-for-byte Dashboard execution. Capture exactly one visible result row, stop, and return it to repository review. Do not retry, repair interactively, execute post-verification, run Migration 014, apply the capability amendment, invoke an RPC, or perform identifier/prospect operations. A corrected remediation and any execution authorization require separate future governance after reconciliation evidence is adjudicated.
