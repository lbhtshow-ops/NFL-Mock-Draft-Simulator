# Sprint 17C.59 after-state predicate audit

Status: `OWNER_PRESERVING_ACL_VALIDATOR_CORRECTION_REQUIRED`

Conclusion: Outcome D — repository evidence is insufficient. No successor remediation, correction SQL, or execution/reconciliation/remediation authorization is created.

The five failed 17C.58 reconciliation predicates are:

1. `after_public_direct_execute_absent` (`direct_public = 0`; observed 1).
2. `after_service_direct_execute_present` (`direct_service = 1`; observed 0).
3. `after_public_effective_execute_absent` (`effective_public IS FALSE`; observed effective privileges were unchanged).
4. `after_anon_effective_execute_absent` (`effective_anon IS FALSE`; observed unchanged).
5. `after_authenticated_effective_execute_absent` (`effective_authenticated IS FALSE`; observed unchanged).

These five describe the authoritative post-rollback snapshot. They do not identify the predicate or predicates that were false inside the failed remediation transaction.

## Dependency graph

`pg_proc.proacl` → `COALESCE(proacl, acldefault('f', proowner))` → `aclexplode` → PUBLIC/owner/service/anon/authenticated direct counts, total count, grantable count

role OIDs + function OID → `has_function_privilege` → owner/service/anon/authenticated effective EXECUTE

`pg_proc.proowner = owner_oid` → owner remains restricted owner

the negation of any of those twelve predicates → `RAISE EXCEPTION 'after-state ACL mismatch'`

The 17C.58 reconciliation additionally measures PUBLIC effective EXECUTE and ownership-derived authority, producing thirteen individually named after-state predicates.

## Predicate and transaction findings

Direct ACL evidence comes from `aclexplode`; effective authority comes from `has_function_privilege`; ownership comes from `pg_proc.proowner`; direct-entry totals are cardinality checks. Default ACL expansion is used only when `proacl` is null. `SECURITY DEFINER`, volatility, parallel safety, search path, function source, arguments, restricted-owner attributes, and Migration 014 rollback state are separate protected-property assertions.

The after-state query and assertion occur after `REVOKE` and `GRANT`, inside the same transaction. PostgreSQL transaction-local visibility therefore does not explain a stale direct ACL observation. The remediation directly removes PUBLIC/anon/authenticated ACL entries and grants service_role; it does not modify role memberships or revoke authority inherited through another role. Consequently, `anon` or `authenticated` can retain effective EXECUTE after the intended direct mutations if a membership path supplies it. `NOINHERIT` on the function owner does not resolve browser-role membership paths, and ownership-derived authority is distinct from ACL and membership authority.

The repository does not contain the complete executed 61-field 17C.58 result row, including `anon_membership_execute_path` and `authenticated_membership_execute_path`, and the failed 17C.57 record contains only the aggregate error. Because the successful reconciliation ran after rollback, it cannot reconstruct transaction-local after-state values.

Repository evidence therefore proves neither that the validator alone is defective nor that the remediation policy/SQL alone is defective. Replacing validation could weaken the intended effective-privilege policy; broadening mutation to role memberships would exceed the authorized ACL policy. A correction must wait for repository-canonical evidence that distinguishes those possibilities.

No SQL was executed and no database connection was made during Sprint 17C.59.
