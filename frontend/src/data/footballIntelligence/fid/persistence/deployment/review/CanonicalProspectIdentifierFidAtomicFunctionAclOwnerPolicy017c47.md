# Sprint 17C.47 owner-preserving ACL correction

Decision: retain explicit `EXECUTE` for restricted `fid_function_owner`. The owner remains NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS, and NOINHERIT. Ownership, direct/effective EXECUTE, and ownership-derived control remain distinct facts.

The additive remediation requires the captured before state, revokes only PUBLIC/anon/authenticated, and grants only service_role. It neither revokes nor redundantly grants the owner. Its after state has exactly two direct EXECUTE entries: owner and service_role. Owner, security-definer setting, volatility, parallel safety, search path, and function-body digest are unchanged; Migration 014 remains fully rolled back.

Matrix derivation: the 017c19 matrix has 260 object-bound entries plus one invariant. Exactly the function/`fid_function_owner`/EXECUTE entry changes `expectedAfter` from false to true; all other entries and order are inherited.

The protected 017c46a preflight remains authoritative because its fully-unapplied state requires owner direct EXECUTE. New reconciliation and post-verification successors require owner and service direct EXECUTE in the corrected final state. Their optional metadata access remains guarded by `to_regclass`, they expose one sanitized row, and they are read-only.

Security boundary: retaining EXECUTE for a NOLOGIN owner does not grant browser or PUBLIC invocation. PUBLIC is removed, anon/authenticated effective EXECUTE becomes false, and service_role alone receives a new explicit function grant. No table, schema, sequence, membership, role, grant option, RLS policy, or function body changes.

PostgreSQL 17 review: object owners can revoke ordinary privileges from themselves while retaining implicit grant authority, so the historical revoke-owner/expect-effective-owner combination was inconsistent. Preserving the captured direct owner entry makes the new after-state satisfiable. Default PUBLIC function EXECUTE is modeled through `acldefault`; effective checks use `has_function_privilege`. SECURITY DEFINER does not make a caller authorization grant.

The bounded review covers captured/final states, missing owner privilege or role, wrong owner, PUBLIC/browser/service anomalies, NULL ACL defaults, optional metadata, Migration 014 conflicts, missing/ambiguous function, security drift, partial/blocked/inconsistent/unresolved states, ACL expansion, extra mutations, commits, exception suppression, RPC invocation, sensitive output, row cardinality, and false authorization.

Parser review uses pglast 8.4 reporting PostgreSQL grammar 18.4. It parses SQL, PL/pgSQL bodies, transaction statements, visible SELECTs, and fixed dynamic metadata SELECTs; PostgreSQL 18 grammar acceptance is syntax evidence only, not PostgreSQL 17 semantic proof.

No SQL was executed and no database connection was made. The remediation, reconciliation, and post-verification are not authorized. One immutable authorization is limited to one complete byte-for-byte execution of protected read-only preflight 017c46a at its fixed hash and exact non-production target.
