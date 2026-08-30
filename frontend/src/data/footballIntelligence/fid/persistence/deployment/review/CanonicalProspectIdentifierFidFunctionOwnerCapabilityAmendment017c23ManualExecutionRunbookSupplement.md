# Sprint 17C.23 one-execution preflight runbook supplement

This runbook authorizes exactly one manual attempt of the protected read-only preflight. The authorization is consumed when the attempt begins, regardless of success, failure, interruption, or uncertainty. It never authorizes a retry.

1. Confirm the Supabase Dashboard shows Organization `Lunch Break Hot Take`, Project `LBHT FID Persistence Test`, Project ID `ahmorpzcaapvoymiqlkv`, Branch `main`, Source `Primary Database`, and Role `postgres`.
2. Recalculate the local preflight SHA-256 in PowerShell.
3. Confirm it equals `A58B83C605C9488985355CC3A38A44306B479D80E1B80C3F0A7CC9EBEA3222C2`.
4. Copy the SQL file contents—not a PowerShell command—to the clipboard.
5. Paste the complete SQL into a new Supabase SQL Editor query.
6. Confirm the first line is `-- Sprint 17C.19: PREFLIGHT read-only ACL-matrix successor.` and the last line is `$acl_matrix$ LANGUAGE plpgsql;`.
7. Execute exactly once.
8. Stop immediately on any SQL error.
9. Capture every complete sanitized result set.
10. Do not rerun if the response is uncertain.
11. Do not execute the amendment.
12. Do not execute reconciliation or post-verification unless separately authorized.
13. Do not execute migration 014.
14. Return all result sets for independent evaluation and stop.

## PowerShell commands

These are PowerShell commands. Do not paste either command into Supabase SQL Editor.

Hash verification:

```powershell
Get-FileHash "C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main\frontend\src\data\footballIntelligence\fid\persistence\deployment\review\017c19a_fid_function_owner_capability_acl_matrix_preflight.sql" -Algorithm SHA256
```

Clipboard copy:

```powershell
Get-Content "C:\Users\zeyga\NFL-Mock-Draft-Simulator-main\NFL-Mock-Draft-Simulator-main\frontend\src\data\footballIntelligence\fid\persistence\deployment\review\017c19a_fid_function_owner_capability_acl_matrix_preflight.sql" -Raw | Set-Clipboard
```

After returning all complete sanitized results, stop. A separate evaluation must classify the evidence before any future amendment execution-authorization sprint may begin.
