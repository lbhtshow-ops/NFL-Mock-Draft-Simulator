# Security-advisory review

Official GitHub Advisory Database searches were performed for `pg`, node-postgres, each direct dependency, and determinable transitives. No applicable reviewed advisory was found for the selected `pg@8.22.0` or the registry versions listed in `DependencyTreeReview.md` in the queried official source.

Historical advisory `CVE-2017-16082` (critical remote code execution through a crafted column name) affects old `pg` lines: 2.x before 2.11.2, 3.x before 3.6.4, 4.x before 4.5.7, 5.x before 5.2.1, 6.x before 6.4.2, and 7.x before 7.1.2. Selected 8.22.0 is outside every affected range. Search/index behavior and package aliasing can be incomplete, and a future lockfile may resolve different versions within caret/tilde ranges. Therefore advisory coverage is incomplete and transitive applicability requires a post-install read-only `npm audit` plus lockfile-specific GitHub Advisory Database review.

Gate result: no applicable unpatched advisory was identified, but independent review is required before mutation. No audit fix is authorized.

Sources: GitHub Advisory Database package/ecosystem queries and repository security/advisory surfaces, reviewed 2026-08-02.
