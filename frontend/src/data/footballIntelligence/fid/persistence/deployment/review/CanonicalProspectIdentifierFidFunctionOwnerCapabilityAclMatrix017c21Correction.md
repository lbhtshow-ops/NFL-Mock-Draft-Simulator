# Sprint 17C.21 ACL matrix empty-sequence coverage correction

Status: `READY_FOR_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_REPEAT_FINAL_CONTROLLED_DEPLOYMENT_REVIEW`.

This repository-only correction creates no execution authorization and performs no database, Supabase, RPC, migration, identifier, FIIS, prospect, promotion, or simulator operation. The authoritative database state remains `MIGRATION_014_FULLY_ROLLED_BACK`.

## Versioned successor

- Protected source: `FID_FUNCTION_OWNER_ACL_MATRIX_017C19_V1`, version `17C.19.1`.
- Additive successor: `FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1`, version `17C.21.1`.
- Cardinality: 275 original object-bound rows minus exactly 15 synthetic sequence rows equals 260 retained object-bound rows; one inventory invariant is added, producing 261 governance units.
- Every retained entry is reused unchanged and in its original order. Schema, table, function, membership, ownership, role-attribute, direct/effective privilege, and grant-option policy is unchanged.

## Replacement invariant and coverage

The successor represents the sequence policy once as `EXACT_OBJECT_INVENTORY` for schema `fid` and object class `sequence`. Before and after counts are zero, governed identities are an immutable empty collection, and any discovered sequence requires `STATE_INCONSISTENT_RECOVERY_REQUIRED`. Per-object privilege, ownership, and grant-option entries are prohibited while that inventory is empty.

The protected 17C.19 preflight, reconciliation, and post-verification SQL each query `pg_class` with both `relnamespace=fid_oid` and `relkind='S'`. Presence increments `mismatch_count`; preflight and post-verification require zero mismatches, and reconciliation checks mismatches before every positive or partial classification. No SQL successor change is required.

The strengthened oracle rejects synthetic, wildcard, placeholder, or empty-set object identities; per-object rows under an exact-empty invariant; malformed empty/nonempty inventory identity sets; incomplete three-stage coverage; unrelated entry changes; and sequence SQL that is not namespace- and kind-bound or does not gate classification through `mismatch_count`.

Any future authorized sequence requires another versioned matrix containing its real identity and explicit object-bound ACL expectations.

Exact recommended next sprint: `SPRINT_17C22_REPEAT_FINAL_CONTROLLED_DEPLOYMENT_REVIEW_OF_FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT`.
