# Role proof plan

Design only. A separately authorized read-only database diagnostic must prove role existence, LOGIN and all elevated attributes, direct/transitive membership and inheritance, CONNECT, schema privileges, exact function privileges, bounded catalog visibility, mutation/ACL authority, ownership relationships, RLS bypass, final-policy impact, revocation path, credential rotation, and dedicated-test scope. Output must be predicate-oriented and sanitized. No SQL is authored or authorized here; no role selection becomes final until independent PostgreSQL/security review.
