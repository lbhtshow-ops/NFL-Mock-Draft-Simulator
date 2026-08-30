# Sprint 17C.16 controlled-deployment review

Status: `FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CORRECTION_REQUIRED`

The four Sprint 17C.15 corrected SQL units retain their fixed hashes and were not modified. The amendment is atomic, limits mutation to the two governed GRANT statements, checks grant authority before mutation, and asserts the before and after privilege boundaries.

The package is not ready for an execution-authorization review. The preflight, reconciliation, and post-verification each directly reference `fid.fid_persistence_migrations`. PostgreSQL resolves a statically named relation before returning query rows, so absence of that optional metadata relation raises `undefined_table` instead of producing a sanitized classification. This violates the guarded-missing-object requirement and is an explicit stop condition.

The reconciliation also emits one shared `PARTIALLY_APPLIED` label for both SET-only and CREATE-only states. It therefore does not expose the six distinct governed outcomes required by this review.

No Supabase connection was made, no SQL was executed, and no execution authorization was created. Migrations 001 through 014 and all protected historical artifacts remain untouched.

Recommended next sprint: create a new fixed-hash correction successor that guards metadata discovery without any static reference to the optional relation, gives SET-only and CREATE-only distinct reconciliation classifications, and then independently re-runs the complete PostgreSQL 17 review.
