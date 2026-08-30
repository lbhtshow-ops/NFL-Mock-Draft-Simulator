#!/usr/bin/env node
import fs from "node:fs";
const src = fs.readFileSync(new URL("./auditCanonicalFIEMilestoneClosureBaseline.mjs", import.meta.url), "utf8");

const defs = [
  ["bounded-policy-required", /defineBoundedPlayerAvailabilityImpactPolicyV1\.mjs/],
  ["availability-resolver-required", /resolveBoundedAvailabilityImpactV1\.mjs/],
  ["resolver-fixtures-required", /validateBoundedAvailabilityPolicyResolverV1\.mjs/],
  ["decision-adapter-contract-required", /defineCanonicalDecisionAvailabilityAdapterContractV1\.mjs/],
  ["decision-adapter-required", /applyAvailabilityToCanonicalDecisionV1\.mjs/],
  ["adapter-fixtures-required", /validateCanonicalDecisionAvailabilityAdapterFixturesV1\.mjs/],
  ["pickem-handoff-contract-required", /definePickemDecisionConsumerHandoffContractV1\.mjs/],
  ["final-gate-required", /runFinalFIEPickemHandoffGate\.mjs/],
  ["read-only-baseline", /READ_ONLY_BASELINE_AUDIT/],
  ["canonical-fie-owner", /canonicalFIEOwnsFootballReasoning:\s*true/],
  ["mds-owner-boundary", /mdsOwnsDraftSimulationAndDraftPresentation:\s*true/],
  ["pickem-owner-boundary", /pickemOwnsPicksLeaderboardCreatorCommunityPresentation:\s*true/],
  ["no-duplicate-fie", /applicationConsumersMustNotDuplicateFIEReasoning:\s*true/],
  ["availability-prerequisite", /playerAvailabilityFoundationPresent/],
  ["decision-prerequisite", /decisionBoundaryPresent/],
  ["provenance-prerequisite", /provenanceBoundaryExpected/],
  ["matchup-may-advance", /matchupIntelligenceMayAdvance/],
  ["closure-ready-decision", /FIE_2_18_MILESTONE_CLOSED_MATCHUP_INTELLIGENCE_READY/],
  ["closure-blocked-decision", /FIE_2_18_MILESTONE_CLOSURE_BLOCKED/],
  ["next-family-219", /nextSprintFamily:\s*"2\.19"/],
  ["next-capability-matchup", /nextMajorCapability:\s*"NFL_MATCHUP_INTELLIGENCE_V1"/],
  ["pickem-mutation-locked", /pickemRepositoryMutationAuthorized:\s*false/],
  ["decision-model-mutation-locked", /productionDecisionModelMutationAuthorized:\s*false/],
  ["db-mutation-locked", /databaseMutationAuthorized:\s*false/],
  ["ref-17c-stays-paused", /refSprint17CResumptionAuthorized:\s*false/],
  ["next-step-audit", /BEGIN_SPRINT_2_19_NFL_MATCHUP_INTELLIGENCE_V1_WITH_CANONICAL_REPOSITORY_AUDIT/]
];

const tests = defs.map(([name,re]) => ({name, passed: re.test(src)}));
const passed = tests.filter(x=>x.passed).length;
const failed = tests.length-passed;

console.log(JSON.stringify({
  suite: "Canonical FIE Milestone Closure & Baseline RC1 Diagnostics",
  sprint: "2.18.25-RC1",
  passed, failed, tests
}, null, 2));

if (failed) process.exitCode = 1;
