# Sprint 17C.52 consumed failure and bounded JSONB correction

## Status

`READY_FOR_FID_ATOMIC_FUNCTION_ACL_BOUNDED_JSONB_RECONCILIATION_INDEPENDENT_REVIEW`

This is not execution readiness. No execution authorization was created.

## Consumed failure

The one-use `FID_ATOMIC_FUNCTION_ACL_GUARDED_RECONCILIATION_ONE_EXECUTION_017C51_V1` authorization was consumed permanently when attempt one began. Protected `017c51a` returned SQLSTATE `54023`, sanitized error `cannot pass more than 100 arguments to a function`, context `PL/pgSQL function inline_code_block line 105 at PERFORM`, zero visible rows, no reconciliation classification, and no database mutation. Retry is prohibited.

The exact cause is the single 53-pair `pg_catalog.jsonb_build_object` call: 106 function arguments exceed PostgreSQL's 100-argument function-call limit.

## Additive correction

The protected SQL and all historical evidence remain unchanged. Successor `017c52a_fid_atomic_function_acl_failed_remediation_bounded_jsonb_reconciliation.sql` changes only its version-bound identity/header/setting and JSONB result construction. It uses three `jsonb_build_object` calls with 52, 38, and 16 arguments, joined with JSONB concatenation before conversion to text for the transaction-local setting.

All 53 unique keys remain present. The final `jsonb_to_record` declaration is byte-for-byte equivalent to protected 17C.51, preserving exact field names, types, and order. Field meanings, authority sources, sanitization rules, predicate logic, metadata guards, ACL evidence, classification precedence, count/detail behavior, one-row contract, and read-only behavior are unchanged.

## PostgreSQL review

PostgreSQL evaluates each bounded builder independently below the 100-argument ceiling, then applies JSONB concatenation. Because all 53 keys are unique, concatenation cannot overwrite a prior field. The surrounding parentheses ensure the complete JSONB value is converted to text only after concatenation. Unexpected errors continue to propagate.

The successor contains one read-only transaction, one visible SELECT, no DDL/DML, no ACL or role change, no locking read, no RPC/identifier operation, and no operational-data output. Independent execution review and any authorization require a later sprint.
