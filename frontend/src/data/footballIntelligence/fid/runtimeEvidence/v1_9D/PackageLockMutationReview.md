# package-lock mutation review

The diff adds root `dependencies.pg = "8.22.0"` and exactly 14 package entries: pg, pg-cloudflare, pg-connection-string, pg-int8, pg-pool, pg-protocol, pg-types, pgpass, postgres-array, postgres-bytea, postgres-date, postgres-interval, split2, and xtend.

There are no removed or changed pre-existing entries, no unrelated ordering rewrite, no package-manager metadata churn, no unrelated version or integrity drift, and lockfileVersion remains 3. All added resolved URLs use `https://registry.npmjs.org/`. `pg-cloudflare` carries `optional: true`; pg-native is represented only as pg's optional peer and is not installed. Classification: `EXACT_EXPECTED_PG_DEPENDENCY_MUTATION`.

