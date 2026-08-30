# REF V1 Module and Dependency Placement

## Recommended placement

Governance and design remain in `frontend/src/data/footballIntelligence/fid/docs/runtimeEvidenceFramework`. Future behavior-free contracts should live in a new sibling `frontend/src/data/footballIntelligence/fid/runtimeEvidence` only after REF-V1.2 authorizes it. Controller tooling should live under a dedicated local tooling child of that module, not in browser UI, persistence adapters, deployment history, or diagnostics. Operation-specific Sprint 17C witness artifacts remain owned by `fid/persistence/deployment` and are referenced by REF.

Evidence packages should initially live in a protected, operation-specific repository evidence-history location selected in REF-V1.2. They must not be mixed with executable SQL, canonical business records, fixtures, build output or generic logs.

## Ownership and dependency direction

`operation governance -> canonical operation manifest/artifact/authorization -> REF controller and observation plan -> observation adapter -> REF evidence package -> established review/conclusion governance`.

REF owns evidence composition, integrity, custody, correlation, uncertainty and claim assessment. Persistence/deployment owns SQL semantics, target, transaction policy, witness operation and operational safety. Authorization governance owns authority and consumption. Review/conclusion authorities retain decisions.

The future REF module may import stable shared validation/serialization primitives and accept operation artifacts through ports. FID operation modules must not import REF to define business validity. The PostgreSQL adapter depends on REF observation interfaces and persistence-owned declarations; core REF contracts never depend on Supabase, browser, SQL or Sprint 17C types. This prevents circular dependencies and preserves a platform-neutral core.

## Runtime and tests

The selected controller runtime is Node.js ESM, matching `package.json` and existing JavaScript modules. Browser execution is excluded for privileged operations. PostgreSQL is a narrow adapter runtime. Supabase JavaScript may transport a governed invocation only if feasibility proves atomicity and visibility; Deno/Edge Functions and PowerShell orchestration are deferred.

Future tests belong beside the new REF module as deterministic contract/conformance fixtures. Adapter tests must use fakes until a separately authorized non-production feasibility sprint. Static diagnostics may verify shape/hash/coverage but may never claim runtime proof. Documentation remains here.

## Persistence decision

No database persistence is required initially. V1 uses canonical, append-only structured files and a locally generated immutable bundle committed through existing repository governance. This permits package-format stabilization without a schema, credentials or retention migration. Supabase tables and existing FID persistence adapters are deferred: they own business persistence and do not currently provide an evidence-store lifecycle.

Any later store must identify authoritative owner, append-only lifecycle, immutability controls, access policy, retention, supersession rather than overwrite, provenance/custody linkage, and migration implications before schema design.

