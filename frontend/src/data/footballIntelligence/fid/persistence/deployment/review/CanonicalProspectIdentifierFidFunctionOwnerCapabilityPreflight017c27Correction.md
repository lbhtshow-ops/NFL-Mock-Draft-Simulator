# Sprint 17C.27 custom parameter name correction

Status: `READY_FOR_CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_INDEPENDENT_REVIEW`.

The single authorized Sprint 17C.26 attempt is consumed. It executed protected 17C.24 SHA-256 `C70E565DD877A3A32876176D82660E0A23A7553D5FE86E6C5075CCC352579B2A` once and failed with SQLSTATE `42602`, category `INVALID_CONFIGURATION_PARAMETER_NAME`, at `pg_catalog.set_config(result_setting, 'PENDING', true)` (`inline_code_block` line 23 at `PERFORM`). PostgreSQL reported `invalid configuration parameter name "lbht.017c24_preflight_result"` because custom parameter names require two or more simple identifiers separated by dots. No row or classification appeared, no ACL outcome was established, and no mutation occurred. Retry is not authorized.

The component `017c24_preflight_result` begins with a digit. PostgreSQL rejects it before storing `PENDING`, aborts the read-only transaction, and never reaches the final SELECT. No local setting survives. The additive successor uses fixed `lbht.preflight_017c24_result`; both lowercase components match `[a-z_][a-z0-9_]*`, it has two components, is not dynamic or client-controlled, and cannot equal the protected invalid name.

Successor: `017c27_fid_function_owner_capability_acl_matrix_dashboard_visible_preflight_custom_setting_correction.sql`, SHA-256 `6D62107634519BD150C1772D7F9170CD48C4F245680CF630C2D07E07733DCD55`. Its only semantic changes are the header, result version `17C.27.1`, and setting name. The result identity and exact 16-column order remain unchanged.

The successor retains one read-only transaction, three transaction-local writes, PENDING/stale-result guards, ordinary final SELECT, error propagation, catalog-resolved optional metadata, aggregate-only dynamic SQL, visible unresolved metadata result, and sanitized output. Matrix `FID_FUNCTION_OWNER_ACL_MATRIX_017C21_V1` version `17C.21.1` remains 260 entries plus one invariant, totaling 261 units. No execution authorization was created.

PostgreSQL 17 compatibility is supported by the documented custom two-part name grammar and the unchanged, previously reviewed uses of transaction-local `set_config`, `current_setting`, read-only transactions, `to_regclass`/`regclass`, `aclexplode`, membership-option catalog fields, and privilege functions. Parser acceptance is recorded separately and is not treated as PostgreSQL 17 proof.

No Supabase connection, SQL execution, RPC, amendment, migration, identifier operation, or database change occurred. Migration 014 remains fully rolled back and both it and the amendment remain unauthorized.

Exact next sprint: `SPRINT_17C28_CORRECTED_DASHBOARD_VISIBLE_FID_FUNCTION_OWNER_CAPABILITY_PREFLIGHT_INDEPENDENT_REVIEW`. That sprint must not execute SQL or create execution authorization.
