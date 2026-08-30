#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assessCanonicalNFLMatchupDirectionV1,
  MATCHUP_DIRECTIONAL_ASSESSMENT_POLICY_V1
} from "../src/data/footballIntelligence/nfl/matchup/CanonicalNFLMatchupDirectionalAssessmentEngineV1.js";

function baseRuntime() {
  return {
    matchupId: "2026-W1-BAL-BUF",
    status: "READY",
    identity: {
      season: 2026,
      week: 1,
      homeTeam: "BUF",
      awayTeam: "BAL"
    },
    evidenceCompleteness: 1,
    confidence: 0.90,
    provenance: [{ provider: "SYNTHETIC_FIXTURE", evidenceId: "fixture:matchup:1" }],
    fallbackReasons: [],
    dimensions: [
      { id:"TEAM_STRENGTH_CONTEXT", state:"AVAILABLE", directionalSignal: 0.50 },
      { id:"OFFENSE_VS_DEFENSE", state:"AVAILABLE", directionalSignal: 0.50 },
      { id:"DEFENSE_VS_OFFENSE", state:"AVAILABLE", directionalSignal: 0.25 },
      { id:"OPPONENT_ADJUSTED_PERFORMANCE", state:"AVAILABLE", directionalSignal: 0.20 },
      { id:"QB_AND_DEPENDENCY_CONTEXT", state:"AVAILABLE", directionalSignal: 0.10 },
      { id:"PLAYER_AVAILABILITY_IMPACT", state:"AVAILABLE", directionalSignal: 0.20 }
    ]
  };
}

const tests = [];
function test(name, fn) {
  try { fn(); tests.push({name,passed:true}); }
  catch(e) { tests.push({name,passed:false,error:e.message}); }
}

test("policy-cap-sum-one", () => {
  const sum = Object.values(MATCHUP_DIRECTIONAL_ASSESSMENT_POLICY_V1.contributionCaps)
    .reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(sum-1) < 1e-12);
});

test("home-edge", () => {
  const x=assessCanonicalNFLMatchupDirectionV1(baseRuntime());
  assert.equal(x.assessment,"HOME_EDGE");
  assert.ok(x.normalizedScore >= 0.15);
});

test("away-edge", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:-1}));
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.equal(r.assessment,"AWAY_EDGE");
  assert.ok(r.normalizedScore <= -0.15);
});

test("neutral-band", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:0}));
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.equal(r.assessment,"NEUTRAL");
  assert.equal(r.normalizedScore,0);
});

test("home-threshold-inclusive", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:0}));
  x.dimensions[0].directionalSignal=0.5; // 0.5 * .30 = .15
  assert.equal(assessCanonicalNFLMatchupDirectionV1(x).assessment,"HOME_EDGE");
});

test("away-threshold-inclusive", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:0}));
  x.dimensions[0].directionalSignal=-0.5;
  assert.equal(assessCanonicalNFLMatchupDirectionV1(x).assessment,"AWAY_EDGE");
});

test("below-completeness-insufficient", () => {
  const x=baseRuntime(); x.evidenceCompleteness=0.79;
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.equal(r.assessment,"INSUFFICIENT_EVIDENCE");
  assert.equal(r.normalizedScore,0);
});

test("completeness-boundary-authorized", () => {
  const x=baseRuntime(); x.evidenceCompleteness=0.80;
  assert.notEqual(assessCanonicalNFLMatchupDirectionV1(x).assessment,"INSUFFICIENT_EVIDENCE");
});

test("below-confidence-neutral", () => {
  const x=baseRuntime(); x.confidence=0.59;
  assert.equal(assessCanonicalNFLMatchupDirectionV1(x).assessment,"NEUTRAL");
});

test("confidence-boundary-authorized", () => {
  const x=baseRuntime(); x.confidence=0.60;
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.notEqual(r.fallbackReasons.at(-1),"BELOW_MINIMUM_RUNTIME_CONFIDENCE");
});

test("missing-provenance-neutral", () => {
  const x=baseRuntime(); x.provenance=[];
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.equal(r.assessment,"NEUTRAL");
  assert.equal(r.confidence,0);
});

test("invalid-identity-insufficient", () => {
  const x=baseRuntime(); x.identity.homeTeam="BAL"; x.identity.awayTeam="BAL";
  assert.equal(assessCanonicalNFLMatchupDirectionV1(x).assessment,"INSUFFICIENT_EVIDENCE");
});

test("missing-team-strength-insufficient", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.filter(d=>d.id!=="TEAM_STRENGTH_CONTEXT");
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.equal(r.assessment,"INSUFFICIENT_EVIDENCE");
});

test("dimension-cap-team-strength", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:0}));
  x.dimensions[0].directionalSignal=99;
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.equal(r.dimensionContributions[0].contribution,0.30);
});

test("dimension-cap-availability", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:0}));
  x.dimensions.find(d=>d.id==="PLAYER_AVAILABILITY_IMPACT").directionalSignal=-99;
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  const c=r.dimensionContributions.find(d=>d.dimension==="PLAYER_AVAILABILITY_IMPACT");
  assert.equal(c.contribution,-0.05);
});

test("aggregate-bounded", () => {
  const x=baseRuntime();
  x.dimensions=x.dimensions.map(d=>({...d,directionalSignal:99}));
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.ok(r.normalizedScore <= 1);
});

test("opponent-duplicate-suppressed", () => {
  const x=baseRuntime();
  x.embeddedSignals={teamStrengthIncludesOpponentAdjustment:true};
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  const c=r.dimensionContributions.find(d=>d.dimension==="OPPONENT_ADJUSTED_PERFORMANCE");
  assert.equal(c.contribution,0);
  assert.equal(c.suppressed,true);
});

test("qb-duplicate-suppressed", () => {
  const x=baseRuntime();
  x.embeddedSignals={teamStrengthIncludesQBDependency:true};
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  const c=r.dimensionContributions.find(d=>d.dimension==="QB_AND_DEPENDENCY_CONTEXT");
  assert.equal(c.contribution,0);
});

test("availability-duplicate-suppressed", () => {
  const x=baseRuntime();
  x.embeddedSignals={teamStrengthIncludesAvailabilityImpact:true};
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  const c=r.dimensionContributions.find(d=>d.dimension==="PLAYER_AVAILABILITY_IMPACT");
  assert.equal(c.contribution,0);
});

test("duplicate-suppression-inspectable", () => {
  const x=baseRuntime();
  x.embeddedSignals={
    teamStrengthIncludesOpponentAdjustment:true,
    teamStrengthIncludesQBDependency:true,
    teamStrengthIncludesAvailabilityImpact:true
  };
  assert.equal(assessCanonicalNFLMatchupDirectionV1(x).duplicateSuppression.length,3);
});

test("confidence-no-inflation", () => {
  const x=baseRuntime(); x.confidence=0.72;
  assert.ok(assessCanonicalNFLMatchupDirectionV1(x).confidence <= 0.72);
});

test("missing-optional-dimension-reduces-confidence", () => {
  const x=baseRuntime();
  x.dimensions.find(d=>d.id==="PLAYER_AVAILABILITY_IMPACT").state="UNAVAILABLE";
  const r=assessCanonicalNFLMatchupDirectionV1(x);
  assert.ok(r.confidence < x.confidence);
});

test("probability-delta-remains-zero", () => {
  assert.equal(assessCanonicalNFLMatchupDirectionV1(baseRuntime()).decisionSupportProjection.probabilityDelta,0);
});

test("probability-not-applied", () => {
  assert.equal(assessCanonicalNFLMatchupDirectionV1(baseRuntime()).decisionSupportProjection.probabilityDeltaApplied,false);
});

test("winner-not-mutated", () => {
  assert.equal(assessCanonicalNFLMatchupDirectionV1(baseRuntime()).decisionSupportProjection.winnerMutationApplied,false);
});

test("additive-only", () => {
  assert.equal(assessCanonicalNFLMatchupDirectionV1(baseRuntime()).decisionSupportProjection.mode,"ADDITIVE_ONLY");
});

test("provenance-preserved", () => {
  assert.equal(assessCanonicalNFLMatchupDirectionV1(baseRuntime()).provenance[0].evidenceId,"fixture:matchup:1");
});

test("dimension-breakdown-six", () => {
  assert.equal(assessCanonicalNFLMatchupDirectionV1(baseRuntime()).dimensionContributions.length,6);
});

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"Canonical NFL Matchup Directional Assessment Engine V1 Fixtures",
  sprint:"2.19-RC6",
  passed,failed,tests,
  decision: failed===0
    ? "CANONICAL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1_VALIDATED"
    : "CANONICAL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1_REJECTED",
  authorizationBoundary:{
    assessmentEngineImplemented: failed===0,
    syntheticFixtureValidationComplete: failed===0,
    matchupRuntimeDecisionSupportIntegrationMayAdvance: failed===0,
    productionDecisionProbabilityMutationAuthorized:false,
    productionWinnerMutationAuthorized:false,
    pickemRepositoryMutationAuthorized:false,
    databaseMutationAuthorized:false,
    refSprint17CResumptionAuthorized:false
  },
  nextStep: failed===0
    ? "RUN_FINAL_FIE_TO_MDS_MATCHUP_INTELLIGENCE_INTEGRATION_READINESS_GATE"
    : "REMEDIATE_MATCHUP_ASSESSMENT_ENGINE_BEFORE_MDS_READINESS_GATE"
},null,2));

if(failed) process.exitCode=1;
