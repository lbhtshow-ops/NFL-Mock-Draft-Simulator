# Sprint 17C.50 independent review

## Decision

`FID_ATOMIC_FUNCTION_ACL_FAILED_REMEDIATION_RECONCILIATION_CORRECTION_REQUIRED`

The protected `017c49a_fid_atomic_function_acl_failed_remediation_read_only_reconciliation.sql` hash matches `C175D000D9DD72F6270FF1DDF6CD79BBB873B832720DD16DFBA9775978D2AEF0`. It was not modified. No successor and no execution authorization were created.

## Blocking findings

1. `OPTIONAL_METADATA_SHAPE_VALIDATION_INCOMPLETE`: lines 57–60 declare metadata compatibility after checking only that three column names exist. The guard does not validate relation kind or that `migration_id`, `migration_sequence`, and `applied_migration_ids` have types compatible with `LIKE`, comparison to integer 14, and `ANY`. A malformed optional relation can therefore pass the guard and fail inside the dynamic aggregate instead of returning sanitized unresolved evidence. This fails the malformed-metadata adversarial gate.
2. `VISIBLE_DETAIL_COUNT_FIELD_MISSING`: the result builds `failed_baseline_predicate_count` and `detail_count_matches_failed_count`, but does not expose the independently required numeric `detail_count`. The visible declaration likewise omits it. This fails the exact result-integrity contract.

## Passing review areas

The SQL has one explicit read-only transaction and one ordinary result SELECT. Static review found no DDL, DML, ACL/role/ownership/policy mutation, RPC, identifier or UUID operation, advisory or row lock, temporary object, operational-data projection, or sensitive output. Unexpected errors are not caught or converted into success. Identity resolution precedes ACL inspection; missing or ambiguous function/role evidence cannot reach a positive classification. Optional metadata is discovered with `to_regclass`, and the relation itself is referenced only through a fixed aggregate formatted with the discovered `regclass`.

Predicate parity covers the exact eight-argument function, all four roles, owner identity, SECURITY DEFINER, volatility, parallel safety, exact function configuration/search path, and each of the seven restricted-owner attributes. Direct ACL, effective privilege, ownership-derived authority, explicit owner ACL, PUBLIC/anon/authenticated/owner/service authority, both ACL endpoint states, partial state, and Migration-014 metadata/object evidence remain separated. The owner-preserving 17C.47 policy remains authoritative.

Classification precedence is correct: unresolved evidence; unexpected Migration-014 state; function-property drift; restricted-owner drift; exact unchanged state; owner-preserving already-applied state; partial/inconsistent ACL. Its evidence-completeness expression is non-null and prevents missing evidence from reaching either positive state.

## Required future correction scope

A later sprint may create a reviewed successor that validates relation kind and exact operand-compatible catalog types before dynamic SQL, and returns a separate numeric `detail_count` alongside the failed-predicate count and equality flag. This sprint authorizes neither that correction nor any execution.
