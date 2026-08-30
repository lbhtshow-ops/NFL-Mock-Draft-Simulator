#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  composeCanonicalNFLMatchupIntelligenceV1,
  getCanonicalNFLMatchupRuntimeDimensionsV1,
} from "../src/data/footballIntelligence/nfl/matchup/CanonicalNFLMatchupIntelligenceRuntimeV1.js";

const base = {
  season: 2026,
  week: 1,
  gameId: "2026_01_BAL_BUF",
  homeTeam: "BUF",
  awayTeam: "BAL",
  teamContext: { home: { strength: 0.61 }, away: { strength: 0.59 } },
  performanceEvidence: { home: { epa: 0.11 }, away: { epa: 0.09 } },
  opponentAdjustment: { home: 0.02, away: 0.01 },
  dependencyContext: { home: { qb: "AVAILABLE" }, away: { qb: "AVAILABLE" } },
  availabilityImpact: { home: { state: "NEUTRAL" }, away: { state: "NEUTRAL" } },
  provenance: [{ provider: "CANONICAL_FIXTURE", evidenceId: "fixture:1" }],
  confidence: 0.84,
};

const tests = [];
function test(name, fn) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (e) { tests.push({ name, passed: false, error: e.message }); }
}

test("runtime-produces-stable-id", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).matchupId, "2026-W1-BAL-BUF");
});
test("runtime-owner-canonical-fie", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).owner, "CANONICAL_FIE");
});
test("runtime-ready-with-complete-evidence", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).status, "READY");
});
test("runtime-remains-unscored", () => {
  const x = composeCanonicalNFLMatchupIntelligenceV1(base);
  assert.equal(x.directionalAssessment, "UNSCORED");
  assert.equal(x.decisionSupportProjection.scored, false);
});
test("six-canonical-dimensions", () => {
  assert.equal(getCanonicalNFLMatchupRuntimeDimensionsV1().length, 6);
});
test("complete-evidence-completeness", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).evidenceCompleteness, 1);
});
test("confidence-bounded-by-completeness", () => {
  const x = composeCanonicalNFLMatchupIntelligenceV1({...base, performanceEvidence:null, confidence:1});
  assert.equal(x.confidence, 0.8);
});
test("missing-team-context-fails-closed", () => {
  const x = composeCanonicalNFLMatchupIntelligenceV1({...base, teamContext:null});
  assert.equal(x.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(x.confidence, 0);
});
test("missing-provenance-fails-neutral", () => {
  const x = composeCanonicalNFLMatchupIntelligenceV1({...base, provenance:[]});
  assert.equal(x.status, "NEUTRAL");
  assert.equal(x.directionalAssessment, "NEUTRAL");
  assert.equal(x.confidence, 0);
});
test("missing-availability-does-not-score", () => {
  const x = composeCanonicalNFLMatchupIntelligenceV1({...base, availabilityImpact:null});
  assert.equal(x.decisionSupportProjection.probabilityDelta, 0);
  assert.equal(x.decisionSupportProjection.probabilityDeltaApplied, false);
});
test("opponent-adjustment-not-recomputed", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).runtimePolicy.opponentAdjustmentRecomputed,false);
});
test("availability-not-recomputed", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).runtimePolicy.availabilityRecomputed,false);
});
test("team-strength-not-recomputed", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).runtimePolicy.teamStrengthRecomputed,false);
});
test("dependency-not-recomputed", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).runtimePolicy.dependencyRecomputed,false);
});
test("application-reasoning-prohibited", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).runtimePolicy.applicationOwnedReasoning,false);
});
test("input-not-mutated", () => {
  const input = structuredClone(base);
  const before = structuredClone(input);
  composeCanonicalNFLMatchupIntelligenceV1(input);
  assert.deepEqual(input,before);
});
test("probability-not-mutated", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).decisionSupportProjection.probabilityDeltaApplied,false);
});
test("winner-not-mutated", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).decisionSupportProjection.winnerMutationApplied,false);
});
test("provenance-inspectable", () => {
  assert.equal(composeCanonicalNFLMatchupIntelligenceV1(base).provenance[0].evidenceId,"fixture:1");
});
test("invalid-identity-fails-closed", () => {
  const x=composeCanonicalNFLMatchupIntelligenceV1({...base,homeTeam:"BAL",awayTeam:"BAL"});
  assert.equal(x.status,"INSUFFICIENT_EVIDENCE");
  assert.equal(x.confidence,0);
});

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"Canonical NFL Matchup Intelligence Runtime V1 Fixtures",
  sprint:"2.19-RC4",
  passed,failed,tests,
  decision: failed===0
    ? "CANONICAL_MATCHUP_INTELLIGENCE_RUNTIME_V1_VALIDATED_NON_SCORING"
    : "CANONICAL_MATCHUP_INTELLIGENCE_RUNTIME_V1_REJECTED",
  authorizationBoundary:{
    canonicalRuntimeImplemented: failed===0,
    canonicalRuntimeFixtureValidated: failed===0,
    governedMatchupAssessmentDesignMayAdvance: failed===0,
    matchupScoringAuthorized:false,
    productionDecisionModelMutationAuthorized:false,
    pickemRepositoryMutationAuthorized:false,
    databaseMutationAuthorized:false,
    refSprint17CResumptionAuthorized:false
  },
  nextStep: failed===0
    ? "DEFINE_GOVERNED_MATCHUP_DIRECTIONAL_ASSESSMENT_AND_SCORING_POLICY_WITHOUT_MUTATING_DECISION_MODEL"
    : "REMEDIATE_CANONICAL_MATCHUP_RUNTIME_BEFORE_ASSESSMENT_POLICY"
},null,2));
if(failed) process.exitCode=1;
