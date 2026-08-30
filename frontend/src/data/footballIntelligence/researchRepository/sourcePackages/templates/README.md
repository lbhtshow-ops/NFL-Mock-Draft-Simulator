# Research Source Package authoring templates

These files are intentionally incomplete development-time inputs for Research Source Package Standard v1.0. They are not governed records. `templates/` contains reusable blank authoring shapes, existing `fixtures/` contains synthetic diagnostics, and `retained/<package-directory>/` is reserved for human-authored package material. None is a runtime registry.

One package represents exactly one specifically identifiable primary source artifact. One subject may have many packages, and Population may aggregate separately authorized evidence across many packages. A package is not a player-wide research container.

A primary source artifact is a particular page, release, report, episode, interview, video, file, or retained dataset version. A generic publisher, analyst, website, channel, or database label is insufficient. A statistics page with several seasons or tables remains one artifact; sections, rows, timestamps, tables, and short excerpts may be separate content locators within it. `ResearchSource.access.location` owns the stable primary artifact identity. An `EvidenceArtifact` is a separate governed evidence container produced by research activity and must never reuse or replace the primary artifact identity.

## Creation order and production APIs

1. Complete `sourceIntakeTemplate.js`; process it with the Sprint 38 source-intake review API and then the production `ResearchSource` factory. A source label alone is not provenance and cannot establish approval.
2. Complete `researchSessionTemplate.js`; process it with `createResearchSession`.
3. Create explicit source-supported entries from `recordedObservationsTemplate.js`; process each with `createRecordedObservation`.
4. Only when justified, create entries from `analyticalObservationsTemplate.js`; process each with `createAnalyticalObservation`. Model output is not source evidence and cannot supply missing source content.
5. Complete `evidenceArtifactTemplate.js`; process it with `createEvidenceArtifact`.
6. Complete `evidenceReviewTemplate.js`; process it with the Sprint 41 evidence-review workflow.
7. Complete `populationLinkageTemplate.js`; process it with the Sprint 40 evidence-to-Population linkage workflow.
8. Complete `packageManifestTemplate.js`; validate it with `validateResearchSourcePackage` and assess it with `assessResearchSourcePackage`.

Repository evidence approval and Population-use authorization are separate human decisions. Neither contract validity nor package approval grants Population authorization.

## Values and identifiers

Preserve `UNKNOWN` when the value is explicitly unknown, `UNAVAILABLE` when it is known not to be available, `null` or an empty collection when it is missing, and explicit conflict declarations when sources disagree. Never resolve uncertainty merely to satisfy validation.

Use a lowercase namespaced identifier matching existing conventions, such as `research-package:rsp-0001`, `research-source:rsp-0001:source-001`, and `recorded-observation:rsp-0001:observation-001`. Create directories as `rsp-####-short-subject-label`. Keep package and primary-source identifiers stable across revisions; increment `packageRevision`, update lifecycle/provenance dates and authors, and set `previousPackageRevisionRef` to the preceding immutable revision reference. Corrections or additional evidence from the same primary artifact normally create a revision. A materially different artifact normally requires a new package ID.

## Copyright and security

Retain the minimum permitted material. Prefer a locator and research note over copied content, record restrictions, and never commit full copyrighted articles, credentials, API keys, access tokens, private medical records, restricted personal information, or material whose terms prohibit retention. Do not commit downloaded paywalled content merely because a researcher can access it.

## Validation

From the frontend directory, import and invoke `runResearchSourcePackageAuthoringDiagnostics`, then run `npm run lint`. The authoring diagnostic transitively runs the Sprint 43 package diagnostic, the Research Repository foundation diagnostic, and Sprint 41–37 regressions. Templates are imported directly for authoring and diagnostics; do not export them from production barrels or import them into FIIS, Population, simulator, UI, resolver, persistence, Supabase, or runtime modules.
