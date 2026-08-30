# Security Review

Decision: **SECURITY_REVIEW_ACCEPTED_WITH_NON_BLOCKING_POST_INSTALL_GATES**.

On 2026-08-02, a read-only official npm packument query showed `8.22.0` remained `latest`, was not deprecated, and retained the approved identity/integrity metadata. A read-only GitHub reviewed-advisory API query for npm package `pg` returned no current entries. A separate exact query for CVE-2017-16082/GHSA-wc9v-mj63-m9g5 showed vulnerable ranges ending in the 7.x line; `8.22.0` is outside all listed ranges.

This search is not exhaustive and cannot establish the final resolved dependency graph before installation. Therefore installation remains conditioned on complete tree capture and read-only `npm audit` after the one command. Any applicable unpatched advisory, integrity mismatch, signature inconsistency, deprecation/metadata drift, or unexpected resolution is a stop condition; no retry, audit fix, uninstall, or rollback is authorized.
