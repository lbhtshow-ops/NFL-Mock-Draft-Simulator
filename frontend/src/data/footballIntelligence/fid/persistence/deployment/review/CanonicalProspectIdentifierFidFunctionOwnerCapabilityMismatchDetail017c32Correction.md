# Sprint 17C.32 mismatch-detail diagnostic correction

The protected Sprint 17C.30 diagnostic remains unchanged at SHA-256 `A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468`. The additive corrected successor is `017c32_fid_function_owner_capability_mismatch_detail_correction.sql`, SHA-256 `9A3A4E4583721182F3DE3A68B5DB29BECD6A120310CBE4C700850CC202D9A10D`.

The immutable increment mapping covers all protected scalar, loop, and composite increment sites. Each `raw_mismatches` row is one protected increment unit. `mismatch_count` is `count(*)`, `mismatch_details` aggregates the same rows, `detail_count` is `jsonb_array_length(mismatch_details)`, and `count_reconciled` proves equality. Composite checks remain one row. The captured count five is retained only as comparison evidence; the repository does not claim its identities.

Each governed table resolves to an OID and `acl_ready` state. Missing, wrong-kind, or wrong-owner tables emit one `TABLE_PREREQUISITE` detail and their 35 ACL units are excluded. `has_table_privilege` accepts only the resolved table OID and is protected by a CASE gate. Governed functions use the same resolved-OID safety pattern.

Missing roles, schema, or optional metadata produce deterministic sanitized `unresolved_details` before privilege inspection. When prerequisites are incomplete, counted inspection units are suppressed. MEMBER, ADMIN, INHERIT, and SET evidence is returned separately in `membership_evidence`; the protected MEMBER/ADMIN/INHERIT composite remains one counted unit. Unexpected SET true and CREATE true are reported in `state_conflicts` without inflating protected mismatch count. Expected false observations remain non-mismatches.

The fixed target contract includes project `ahmorpzcaapvoymiqlkv`, Primary Database, branch `main`, role `postgres`, and `DEDICATED_NON_PRODUCTION_TEST`. Output is one Dashboard-visible row with deterministic JSON arrays and no raw ACL, OID, SQL text, operational payload, credential, secret, UUID, user, or prospect content. Matrix policy remains `FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1`, version `17C.21.1`: 260 object-bound units plus one inventory invariant.

The complete successor and its single aggregate-only dynamic metadata SELECT parse under offline pglast v8.4 / PostgreSQL 18.4 grammar. This is not PostgreSQL 17 proof; all used transaction, CTE, catalog, privilege, JSONB, XML, aggregate, and window constructs are available in PostgreSQL 17.

No SQL or database operation occurred. No authorization was created. Prior authorizations remain consumed; retry, amendment, and migration 014 remain prohibited and unauthorized.

Exact next sprint: `SPRINT_17C33_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_CORRECTION_INDEPENDENT_REVIEW`.
