# 017c7 DISTINCT/ORDER BY failure and 017c8 correction

The single authorized 017c7 execution returned SQLSTATE `42P10` at line 34 before producing any result set. The read-only query caused no mutation, migration execution, or role change. The protected 017c7 hash remains `BC96C898B17BB9C55B34991E6CB164C2AB038BD16B1DDC45BC4B2F12D939FD57`.

Block B selected `DISTINCT expected.role_name` and other columns while ordering by the separate expression `expected.role_name COLLATE "C"`. PostgreSQL requires an ORDER BY expression attached to SELECT DISTINCT to appear in that select list.

The additive 017c8 successor deduplicates role names in an inner `distinct_roles` CTE, retains the original output columns in an outer non-DISTINCT SELECT, and applies deterministic C-collation ordering there. The remainder of 017c7 is preserved except the version header.

The complete file contains one safe inner SELECT DISTINCT without ORDER BY, one recursive UNION ALL whose ORDER BY belongs to the outer query, two outer ORDER BY clauses, no DISTINCT aggregate, INTERSECT, or EXCEPT, and no equivalent ordering defect.

017c8 SHA-256: `5131801D2DFDCDBE04504BD0414272B66329E620EBBCEB1557F6FE8336105495`. It remains read-only and unexecuted. A separate static-review sprint is required before any execution authorization.
