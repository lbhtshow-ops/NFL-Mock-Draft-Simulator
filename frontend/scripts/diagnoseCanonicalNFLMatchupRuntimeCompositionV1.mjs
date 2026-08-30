#!/usr/bin/env node
import fs from "node:fs";
const a=fs.readFileSync(new URL("./defineCanonicalNFLMatchupRuntimeCompositionV1.mjs",import.meta.url),"utf8");
const b=fs.readFileSync(new URL("./validateCanonicalNFLMatchupRuntimeCompositionFixturesV1.mjs",import.meta.url),"utf8");
const both=a+"\n"+b;
const defs=[
 ["canonical-owner",/owner: "CANONICAL_FIE"/],
 ["team-strength-delegation",/NFLTeamPriorAndStrengthEngine/],
 ["performance-delegation",/NFLTeamPerformanceEvidenceRegistry/],
 ["opponent-delegation",/NFLOpponentAdjustmentEngine/],
 ["dependency-delegation",/NFLPlayerTeamDependencyIntelligence/],
 ["availability-delegation",/CanonicalPlayerAvailabilityImpactService/],
 ["no-canonical-recompute",/recomputesCanonicalLogic: false/],
 ["probability-locked",/probabilityMutationAllowed: false/],
 ["winner-locked",/decisionWinnerMutationAllowed: false/],
 ["confidence-first-class",/confidenceFirstClass: true/],
 ["provenance-first-class",/provenanceFirstClass: true/],
 ["completeness-first-class",/evidenceCompletenessFirstClass: true/],
 ["additive-only",/decisionSupportProjectionAdditiveOnly: true/],
 ["missing-team-fail-closed",/FAIL_CLOSED_INSUFFICIENT_EVIDENCE/],
 ["missing-performance-degrade",/missingPerformanceEvidence: "DEGRADE_CONFIDENCE_OR_NEUTRALIZE_DIMENSION"/],
 ["missing-opponent-degrade",/missingOpponentAdjustment: "DEGRADE_CONFIDENCE_OR_NEUTRALIZE_DIMENSION"/],
 ["missing-dependency-degrade",/missingDependencyContext: "DEGRADE_CONFIDENCE_OR_NEUTRALIZE_DIMENSION"/],
 ["missing-availability-preserve",/PRESERVE_BASELINE_AND_MARK_UNAVAILABLE/],
 ["invalid-provenance-neutral",/invalidProvenance: "FAIL_NEUTRAL"/],
 ["runtime-exception-fail-closed",/FAIL_CLOSED_NO_DECISION_MUTATION/],
 ["determinism-gate",/deterministicForSameCanonicalInputs: true/],
 ["symmetry-gate",/homeAwaySymmetryInspectable: true/],
 ["neutrality-gate",/missingEvidenceNeutralityRequired: true/],
 ["no-input-mutation-gate",/noInputMutation: true/],
 ["no-double-availability",/noDoubleAvailabilityApplication: true/],
 ["no-double-opponent",/noDoubleOpponentAdjustment: true/],
 ["no-decision-probability",/noDecisionProbabilityMutation: true/],
 ["no-app-reasoning",/noApplicationOwnedReasoning: true/],
 ["fixture-determinism-test",/deterministic-same-input/],
 ["fixture-provenance-test",/missing-provenance-fails-neutral/],
 ["fixture-team-context-test",/missing-team-context-fails-closed/],
 ["fixture-availability-test",/missing-availability-preserves-baseline/],
 ["fixture-opponent-test",/opponent-adjustment-not-reapplied/],
 ["runtime-implementation-locked",/runtimeImplementationAuthorized: false/],
 ["scoring-locked",/matchupScoringAuthorized: false/],
 ["decision-model-locked",/productionDecisionModelMutationAuthorized: false/],
 ["pickem-locked",/pickemRepositoryMutationAuthorized: false/],
 ["db-locked",/databaseMutationAuthorized: false/],
 ["ref-locked",/refSprint17CResumptionAuthorized: false/],
 ["next-validation",/VALIDATE_CANONICAL_MATCHUP_RUNTIME_COMPOSITION_FIXTURES_BEFORE_RUNTIME_IMPLEMENTATION/]
];
const tests=defs.map(([name,re])=>({name,passed:re.test(both)}));
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"NFL Matchup Runtime Composition RC3 Diagnostics",sprint:"2.19-RC3",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
