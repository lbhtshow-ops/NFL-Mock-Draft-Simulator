# Sprint 17C.51 guarded reconciliation correction and independent review

## Decision

`READY_FOR_ONE_CONTROLLED_CORRECTED_FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_READ_ONLY_RECONCILIATION_EXECUTION`

The protected 17C.49 SQL remains unchanged. The additive `017c51a_fid_atomic_function_acl_failed_remediation_guarded_reconciliation.sql` corrects exactly the two 17C.50 blockers and passed independent static, semantic, parser, contract, and adversarial review without further correction.

## Bounded correction

The repository-created metadata storage contract is an ordinary table (`pg_class.relkind='r'`) named exactly `fid.fid_persistence_migrations`. Partitioned tables, views, materialized views, foreign tables, sequences, indexes, partitioned indexes, and composite relations are rejected. The three query columns must be visible, non-dropped user columns with exact catalog types and dimensions: `migration_id text`, `migration_sequence integer`, and `applied_migration_ids text[]`. The successor also resolves the exact built-in text LIKE, integer equality, and text equality operators. Dynamic SQL is unreachable unless relation identity, kind, columns, types, dimensions, and operators all match.

The failed-predicate count now comes from the predicate-row count. `detail_count` independently comes from `jsonb_array_length(failed_baseline_predicates)`. Both must be non-null, nonnegative, and equal; `detail_count_matches_failed_count` derives from that comparison. Count divergence makes `evidence_complete=false` and therefore precedes every positive classification.

All other 17C.49 behavior is preserved, including owner-retaining ACL policy, predicate detail ordering, direct/effective/ownership-derived authority separation, Migration-014 evidence, external target attestation, and one-row read-only output.

## Visible result contract

The exact ordered, typed, field-by-field contract is `FID_ATOMIC_FUNCTION_ACL_GUARDED_RECONCILIATION_RESULT_017C51_V1`. It preserves the 17C.49 order and inserts `detail_count integer` immediately after `failed_baseline_predicates jsonb`. Every field records its meaning, authority source, and sanitization rule in the repository contract artifact. Platform target fields remain externally attested; PostgreSQL-observed evidence is limited to catalogs and derived aggregate evidence.

Classification precedence remains: unresolved; unexpected Migration-014 state; function-property drift; restricted-owner drift; exact unchanged state; owner-preserving already-applied state; partial/inconsistent ACL state.

## PostgreSQL 17 semantic review

The successor uses PostgreSQL 17-supported catalog columns, relkind codes, `regtype`/`regoperator` resolution, ACL functions, JSONB aggregation, transaction-local configuration, and guarded `format('%s', regclass)` dynamic SQL. It has no exception suppression, so unexpected errors propagate. No client-controlled value enters dynamic SQL. It emits no raw ACL, OID, function definition, metadata row, identifier, payload, credential, token, URL, UUID, prospect, or operational record.

## Authorization decision

Independent review passed without correction. Exactly one immutable authorization was created for one complete byte-for-byte manual execution on the attested target. It is consumed immediately when execution begins under every outcome and cannot be retried or reused. It authorizes no remediation, replay, post-verification, migration, capability amendment, RPC, mutation, or application operation.
