# Sprint 2A.2 — First 2027 Research Cohort

Status: `FOOTBALL_INTELLIGENCE_2027_FIRST_RESEARCH_COHORT_ESTABLISHED_WITH_PROVISIONAL_ELIGIBILITY`.

Outcome: `OUTCOME_B_FIRST_2027_RESEARCH_COHORT_ESTABLISHED_WITH_ELIGIBILITY_LIMITATIONS`.

This additive repository-only package contains a non-ranked, exactly 16-person research fixture and inputs normalized through the authoritative `ProspectIntakeCandidate` factory. It does not contain canonical FID prospect profiles or identifiers and is not imported by an application barrel.

## Governance and contract audit

- Research authority: the generic Research Repository contracts and football-domain source-package workflows under `src/data/footballIntelligence/researchRepository`.
- Intake authority: `ProspectIntakeCandidateContract.js`; no `ProspectIntakeRecord` was created.
- Eligibility authority: the existing FID eligibility sufficiency policy. All 2027 pathways remain inferred and review-required.
- Prospect authority: `ProspectProfileContract.js`; no profile is created here because promotion is prohibited.
- Program handling: no canonical college-program registry contract was found. The package therefore uses minimal compatible provisional program references and records this as a promotion blocker.
- Position handling: official roster labels are preserved; secondary NFL-role labels are separate.
- Promotion: every candidate has a `DEFER` plan and no promotion decision authorizing action.

## Source acquisition log

Research date: 2026-08-03. Operator: repository research task. Queries were bounded `site:` searches against official athletics domains for each proposed player and 2026 roster. Accepted sources are official roster/biography pages. Search-result pages were discovery aids only and are not retained as evidence. No article bodies, arbitrary HTML, scripts, personal contact information, or unbounded quotations were stored.

Rejected or deferred source classes: draft rankings as eligibility proof; social-media claims; aggregators for official measurements; stale roster pages when a current 2026 roster was available; and scouting declarations not yet independently reviewed. Dylan Raiola and Koi Perich retain source-specific limitations because the current official roster context did not expose a stable current player biography in the captured result. Additional corroborating and scouting sources remain required before any promotion review.

## Reviews

Security: `FID_2027_COHORT_RESEARCH_SECURITY_PASSED_WITH_NON_BLOCKING_LIMITATIONS`.

Intake: `FID_2027_COHORT_INTAKE_REVIEW_PASSED_WITH_PROMOTION_AND_PERSISTENCE_DEFERRED`.

The package keeps declaration, eligibility, program-canonicalization, identifier issuance, persistence, simulator integration, and application availability blocked or deferred. Peter Woods is excluded as a duplicate-prevention test. Arch Manning, Francis Mauigoa, and Caleb Downs are excluded because their existing legacy diagnostic fixtures declare 2026 and are not canonical 2027 evidence.

## Files and inventory

The additive inventory is `ImplementationAuthorization.json`, `cohortResearch.js`, `intakeCandidates.js`, `runDiagnostics.mjs`, `index.js`, `README.md`, and `additiveInventory.json`. The aggregate is generated and verified by the inventory file and final validation record; prior Sprint 2A.1 artifacts are not modified.
