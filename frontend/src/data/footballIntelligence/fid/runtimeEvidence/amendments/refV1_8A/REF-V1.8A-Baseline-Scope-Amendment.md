# REF-V1.8A Baseline-Scope Amendment

## Correction

REF-V1.7 validly measured 68 current-filesystem predecessor files and recorded aggregate `778B57736A3BD9ABF2964622E612185A1F45C4A19D2DC85A97150A27BB798A61`. All were untracked, so neither that measurement nor this amendment establishes historical Git custody. The hashes were not incorrect and REF-V1.7 implementation behavior is not retroactively invalidated.

The defect was future-verification scope: the historical diagnostic discovers every direct `.js` and `.md` in two extensible directories. It therefore treats additive files as predecessors and fails on count before verifying the measured set. The original inventory, aggregate, diagnostic, review, disclosures, and conclusions remain unchanged. The old diagnostic remains historical evidence and a regression reference; once legitimate additive files exist in its direct scope, its open-directory count is not the authoritative future predecessor-integrity gate.

## Successor authority

`refV1_7ExplicitPredecessorManifest.json` explicitly binds exactly 68 paths, uppercase SHA-256 values, amendment-time untracked status, categories, required presence, and prohibitions on rename, substitution, or modification. Future files cannot enter it dynamically. `runRefV1_8ASuccessorBaselineDiagnostics.mjs` verifies structure, unique paths, presence, content, governance disclosures, and the manifest aggregate, while reporting additions separately.

The amendment aggregate uses REF-V1.3-compatible deterministic structured canonicalization: an object containing manifest version, schema version, and path-sorted entries reduced to `relativePath`, `sha256`, and identity-bearing `gitStateAtAmendment`; object keys sort lexically, arrays retain explicit path order, JSON has no whitespace, encoding is UTF-8, and digest output is uppercase hexadecimal SHA-256. Missing files, duplicate paths, unsupported paths, changed bytes, substitutions, or aggregate drift fail. Duplicate content hashes are not intrinsically invalid because path is identity-bearing. Current status drift is reported separately and never rewrites amendment-time status. The original aggregate uses its original policy and is preserved under a distinct name; equivalence is not claimed.

## Future policy

The smallest safe model is one immutable predecessor manifest plus one additive inventory per sprint. Future inventories chain by references and never rewrite prior manifests. Files are classified as current-sprint source/documentation, additive implementation/diagnostic/review, retained synthetic fixture, transient output, or unknown.

Future REF implementation belongs in versioned subdirectories such as `runtimeEvidence/amendments/refV1_8A` or a separately governed versioned implementation directory. Predecessor files are never relocated. Protected root barrels remain unchanged. New modules use explicit paths or a versioned subdirectory index; a new non-protected cumulative export surface or root consolidation requires a separate sprint.

## Experimental REF-V1.8 disposition

Five untracked direct source files—`localSubmissionBundle.js`, `appendOnlyEvidenceWriter.js`, `localRefComposition.js`, `runtimeEvidenceV1_8Fixtures.js`, and `runLocalCompositionWriterDiagnostics.js`—plus their four additive barrel lines and empty diagnostic-output directory were positively identified as created solely during the blocked attempt. They contained no pre-existing user work, were not referenced by protected history, and were removed as `REMOVE_BLOCKED_SPRINT_EXPERIMENT`. No evidence package was retained. No uncertain or user-owned file was touched.

## Restart gates

The explicit manifest exists, its 68 hashes and aggregate verify, additions are permitted without changing predecessor count, original artifacts are unchanged, blocked experiments are resolved, versioned exports avoid protected barrels, migrations remain separate, Sprint 17C remains protected, and no retroactive custody claim is made. REF-V1.8B may resume only under a separate governed request.
