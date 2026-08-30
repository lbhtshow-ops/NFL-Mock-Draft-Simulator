# Sprint 2A.3C repository, evidence, security, and adversarial review

## Repository result and immutable strategy

The pre-mutation audit verified repository root `NFL-Mock-Draft-Simulator-main`, branch `main`, HEAD `f9f8272e8ea868534c9fbc36cf174769367fc6a1`, origin `https://github.com/lbhtshow-ops/NFL-Mock-Draft-Simulator.git`, and upstream `origin/fid-persistence-v1.0.1`. The inherited dirty worktree was preserved. All writes are additive inside this directory. No predecessor, package, migration, SQL, REF, Sprint 17C, resolver, simulator, Big Board, Draft Room, or Draft Results file was modified.

Strategy B was selected: unchanged 2A.3B preparation records are referenced by immutable `revision-0001` enrichment records and one additive enrichment manifest. This preserves the 2A.2 intake predecessor, 2A.3A contract boundary, 2A.3B preparation predecessor, source/evidence lineage, operation, version, temporal reference, and limitations without pretending the enrichment is a canonical profile revision.

## Artifact audit

All listed predecessor files are repository-owned governed data. `U` means untracked in the inherited worktree at audit time; this new directory is also untracked. “Reuse” never expands canonical authority.

| Exact repository-relative path | Owner/version | Current role | Decision | Authority / duplicate risk | Git |
| --- | --- | --- | --- | --- | --- |
| `fid/docs/prospectDatabase/phase2A/sprint2A_1/consolidated-review.md` | FID / 2A.1 | population-readiness decision | reuse unchanged | documentation; no duplicate authority | U |
| `fid/prospectDatabase/phase2A/sprint2A_2/cohortResearch.js` | FID / 2A.2 v1 | 16 sources, 32 evidence declarations, cohort | reference unchanged | preparation research; stale-program observations retained | U |
| `fid/prospectDatabase/phase2A/sprint2A_2/intakeCandidates.js` | FID / 2A.2 v1 | governed intake candidates/reviews/blockers | reference unchanged | non-canonical; no duplicate identity | U |
| `fid/prospectDatabase/phase2A/sprint2A_2/additiveInventory.json` | FID / verified | predecessor inventory/aggregate | verify unchanged | inventory only | U |
| `fid/prospectDatabase/phase2A/sprint2A_3A/ProspectProfilePreparationRecord.js` | FID / `FID-PROSPECT-PROFILE-PREPARATION-1.0.0` | active preparation boundary and immutable builder | reuse unchanged | explicitly non-canonical | U |
| `fid/prospectDatabase/phase2A/sprint2A_3A/constants.js` | FID / schema 1.0.0 | position/status/bounds policy | reuse unchanged | contract authority; no replacement | U |
| `fid/prospectDatabase/phase2A/sprint2A_3A/additiveInventory.json` | FID / verified | predecessor inventory | verify unchanged | inventory only | U |
| `fid/prospectDatabase/phase2A/sprint2A_3B/supportingRecords.js` | FID / 2A.3B | 112 supporting declarations | reference unchanged | preparation-only; additive successors avoid duplicate owner | U |
| `fid/prospectDatabase/phase2A/sprint2A_3B/preparationCohort.js` | FID / 2A.3B | 16 preparation records/manifest | reference unchanged | preparation authority; no silent mutation | U |
| `fid/prospectDatabase/phase2A/sprint2A_3B/additiveInventory.json` | FID / verified | aggregate `E55DE9...04E5` | verify unchanged | inventory only | U |
| `fid/contracts/ProspectProfileContract.js` and canonical entity records | FID / active repository versions | canonical-only profiles/identity | do not use or modify | high duplicate-authority risk if reused for preparation | mixed inherited state; unchanged |
| `fid/records/footballEntity/peter-woods/revision-0001.js` | FID / revision 1 | existing Peter Woods canonical history | exclude and preserve | duplicate identity prohibited | inherited, unchanged |
| `data/draft/prospects*`, `resolveProspect.js` | application draft data | legacy 2026 fixtures/resolver | do not modify | application/canonical leakage risk | dirty inherited, unchanged |
| `fid/persistence/deployment/sql/001...014` | FID persistence | governed migration inventory | inspect only | migration 014 remains paused/unapplied; 015 absent | inherited, unchanged |
| `supabase/migrations/20260714_create_research_repository_tables.sql` | generic research repository | separate Supabase migration inventory | inspect only | not FID migrations; no execution | inherited, unchanged |
| `fid/researchRepository` and source packages | FID research | source acquisition/provenance conventions | pattern reuse only | no new authority or arbitrary HTML | inherited, unchanged |

Repository searches also covered measurement/athletic records, objective production, season statistics, testing, scouting/traits, strengths/concerns, eligibility/declaration, transfers, programs/aliases, position normalization, evidence authority, contradictions, provenance, revision builders, mapping/promotion readiness, fixture consumers, source logs, diagnostics, and inventories. No truthful reusable canonical college-program registry exists. Existing production/athletic engines are modeled-output or canonical consumer domains and were rejected as owners of preparation evidence. The compact 2A.3C declarations therefore remain local, additive, source-bound, and non-canonical; no broad reusable contract was required.

## Research acquisition and evidence policy result

The public-source audit accepted 16 current official roster/biography observations and eight bounded independent sources, creating 24 source records and 88 evidence records. Search-result snippets were used only to locate underlying pages; records retain the underlying URLs. No article body, arbitrary HTML, inaccessible source, allegation, character assessment, medical conclusion, or large excerpt is stored. Public pages may change after capture.

Three authoritative temporal program changes are preserved rather than overwriting the predecessor: Florida→Baylor (DJ Lagway), Nebraska→Oregon (Dylan Raiola), and Colorado→LSU (Jordan Seaton). A reported Minnesota→Oregon transition for Koi Perich lacks an accepted official destination biography, so Minnesota remains the last official program observation and the record is explicitly contradictory pending research. The other 12 program references resolve within existing display/provisional authority. None is a canonical program identity.

Every candidate has two numeric roster observations. Dylan Raiola and Koi Perich retain prior-official-roster measurement classifications because the current Oregon roster did not publish complete measurements; DJ Lagway retains the Florida 247-pound observation as a conflict beside Baylor's current 239-pound value. Values are never averaged and roster observations are never labeled athletic testing. All 16 have explicit 2025, position-appropriate production records; limited category sets remain explicit for offensive linemen and other incomplete official pages. No start, statistic, efficiency, grade, or intelligence value is inferred.

Testing is `TESTING_NOT_YET_APPLICABLE` for all 16 because no accepted current verified testing evidence was found. Eight candidates have bounded independent role corroboration; eight remain `ADDITIONAL_SCOUTING_REVIEW_REQUIRED`. Every record has one source-bound strength and one evidence concern, with no rankings, stars, grades, confidence, scheme/team-fit scores, medical speculation, or unsupported character statements.

## Eligibility, mapping, fixtures, and adversarial decisions

All 16 pathways are provisionally supported from year-three roster/participation evidence, but every declaration remains `DECLARATION_UNRESOLVED`. Twelve records are `CANONICAL_MAPPING_DATA_READY_WITH_ELIGIBILITY_LIMITATIONS`; three changed-program records are `CANONICAL_MAPPING_DATA_READY_WITH_PROGRAM_LIMITATIONS`; Koi Perich is `CANONICAL_MAPPING_REQUIRES_ADDITIONAL_RESEARCH`. These are data assessments only. Profile IDs, entity refs, and player-profile refs are null. Promotion is `PROMOTION_DEFERRED`, `IDENTIFIER_REQUIRED`, and `PERSISTENCE_DEFERRED` for every record.

All 16 remain Draft Room fixture-ready and Draft Results fixture-reference-ready with limitations. Available fixture components are display/program/position, roster measurement, production summary, strengths/concerns, evidence indicator, eligibility warning, and comparison data. This is not registration, UI implementation, a final results snapshot, or production availability.

The adversarial review found no ranking-driven order; draft-year label used as eligibility proof; measurement promotion; averaging; inferred starts; invented OL data; high-school testing promotion; external opinion converted to FID intelligence; unsourced strength/concern; invented score; fabricated canonical program; silent predecessor mutation; readiness-as-authorization; application registration; or indirect REF/Sprint 17C continuation.

Security: `FID_2027_ENRICHMENT_SECURITY_PASSED_WITH_NON_BLOCKING_LIMITATIONS`. Evidence: `FID_2027_ENRICHMENT_EVIDENCE_REVIEW_PASSED_WITH_CANONICAL_MAPPING_DEFERRED`. Outcome: `OUTCOME_B_COHORT_ENRICHED_WITH_BOUNDED_DATA_AND_ELIGIBILITY_LIMITATIONS`. Final status: `FOOTBALL_INTELLIGENCE_2027_PREPARATION_COHORT_EVIDENCE_ENRICHED_WITH_DATA_AND_ELIGIBILITY_LIMITATIONS`.
