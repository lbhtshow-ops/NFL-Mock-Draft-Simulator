#!/usr/bin/env node
import fs from "node:fs";
const src = fs.readFileSync(new URL("./auditNFLMatchupSurfacesAndDefineCanonicalContractV1.mjs", import.meta.url), "utf8");

const defs = [
 ["read-only", /READ_ONLY_SURFACE_AUDIT_AND_CONTRACT_DESIGN/],
 ["opponent-engine", /NFLOpponentAdjustmentEngine\.js/],
 ["historical-replay", /NFLHistoricalReplayTeamStrength\.js/],
 ["performance-registry", /NFLTeamPerformanceEvidenceRegistry\.js/],
 ["performance-contract", /NFLTeamPerformanceEvidenceContract\.js/],
 ["team-strength-integration", /NFLPlayerImpactTeamStrengthShadowIntegration\.js/],
 ["dependency-intelligence", /NFLPlayerTeamDependencyIntelligence\.js/],
 ["dependency-contract", /NFLTeamDependencyEvidenceContract\.js/],
 ["availability-contract", /CanonicalPlayerAvailabilityImpactContract\.js/],
 ["availability-service", /CanonicalPlayerAvailabilityImpactService\.js/],
 ["canonical-owner", /owner: "CANONICAL_FIE"/],
 ["game-identity", /"season","week","gameId","homeTeam","awayTeam"/],
 ["team-context-input", /teamContext:/],
 ["performance-input", /performanceEvidence:/],
 ["dependency-input", /dependencyState:/],
 ["availability-input", /availabilityImpact:/],
 ["offense-vs-defense", /OFFENSE_VS_DEFENSE/],
 ["defense-vs-offense", /DEFENSE_VS_OFFENSE/],
 ["opponent-adjusted", /OPPONENT_ADJUSTED_PERFORMANCE/],
 ["qb-dependency", /QB_AND_DEPENDENCY_CONTEXT/],
 ["availability-dimension", /PLAYER_AVAILABILITY_IMPACT/],
 ["confidence-output", /confidence: "FIRST_CLASS_OUTPUT"/],
 ["provenance-output", /provenance: "FIRST_CLASS_OUTPUT"/],
 ["evidence-completeness", /evidenceCompleteness: "FIRST_CLASS_OUTPUT"/],
 ["no-app-reasoning", /noApplicationLevelMatchupReasoning: true/],
 ["no-team-strength-duplicate", /noDuplicateTeamStrengthEngine: true/],
 ["no-opponent-duplicate", /noDuplicateOpponentAdjustmentEngine: true/],
 ["no-availability-duplicate", /noDuplicateAvailabilityResolver: true/],
 ["no-outcome-leakage", /noOutcomeLeakage: true/],
 ["neutral-or-confidence-degrade", /missingEvidenceMustFailNeutralOrDegradeConfidence: true/],
 ["provenance-inspectable", /provenanceMustRemainInspectable: true/],
 ["no-double-probability-adjustment", /matchupOutputMustNotApplyDecisionProbabilityAdjustmentTwice: true/],
 ["runtime-locked", /runtimeImplementationAuthorized: false/],
 ["scoring-locked", /matchupScoringAuthorized: false/],
 ["decision-model-locked", /productionDecisionModelMutationAuthorized: false/],
 ["pickem-locked", /pickemRepositoryMutationAuthorized: false/],
 ["db-locked", /databaseMutationAuthorized: false/],
 ["ref-locked", /refSprint17CResumptionAuthorized: false/],
 ["next-runtime-composition", /DEFINE_CANONICAL_MATCHUP_RUNTIME_COMPOSITION_AND_FIXTURE_GATES/]
];

const tests = defs.map(([name,re]) => ({name, passed: re.test(src)}));
const passed = tests.filter(x=>x.passed).length;
const failed = tests.length-passed;
console.log(JSON.stringify({
  suite:"NFL Matchup Surface Audit + Canonical Contract RC2 Diagnostics",
  sprint:"2.19-RC2", passed, failed, tests
},null,2));
if(failed) process.exitCode=1;
