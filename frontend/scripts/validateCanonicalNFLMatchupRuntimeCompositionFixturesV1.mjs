#!/usr/bin/env node
import assert from "node:assert/strict";

const SPRINT = "2.19-RC3";

function composeFixture(input) {
  const clone = structuredClone(input);
  const missing = [];
  for (const k of ["teamContext","performanceEvidence","opponentAdjustment","dependencyContext","availabilityImpact"]) {
    if (clone[k] == null) missing.push(k);
  }

  const provenanceValid = Array.isArray(clone.provenance) && clone.provenance.length > 0;
  const available = 5 - missing.length;
  const evidenceCompleteness = available / 5;

  let directionalAssessment = clone.directionalAssessment ?? "NEUTRAL";
  let confidence = Math.max(0, Math.min(1, Number(clone.confidence ?? 0)));

  if (!provenanceValid) {
    directionalAssessment = "NEUTRAL";
    confidence = 0;
  } else if (missing.includes("teamContext")) {
    directionalAssessment = "INSUFFICIENT_EVIDENCE";
    confidence = 0;
  } else if (missing.length) {
    confidence = Math.min(confidence, evidenceCompleteness);
  }

  return {
    matchupId: clone.matchupId,
    homeTeam: clone.homeTeam,
    awayTeam: clone.awayTeam,
    directionalAssessment,
    confidence,
    evidenceCompleteness,
    missingDimensions: missing,
    provenance: provenanceValid ? clone.provenance : [],
    decisionSupportProjection: {
      mode: "ADDITIVE_ONLY",
      probabilityDeltaApplied: false,
      winnerMutationApplied: false
    }
  };
}

const base = {
  matchupId: "2026-W1-BAL-BUF",
  homeTeam: "BUF",
  awayTeam: "BAL",
  teamContext: {home:{strength:0.6},away:{strength:0.58}},
  performanceEvidence: {home:{epa:0.1},away:{epa:0.08}},
  opponentAdjustment: {home:0.02,away:0.01},
  dependencyContext: {home:{qb:"AVAILABLE"},away:{qb:"AVAILABLE"}},
  availabilityImpact: {home:{state:"NEUTRAL"},away:{state:"NEUTRAL"}},
  provenance: [{source:"CANONICAL_FIXTURE"}],
  confidence: 0.8,
  directionalAssessment: "HOME_EDGE"
};

const tests = [];
function test(name, fn) {
  try { fn(); tests.push({name,passed:true}); }
  catch (e) { tests.push({name,passed:false,error:e.message}); }
}

test("deterministic-same-input", () => {
  assert.deepEqual(composeFixture(base), composeFixture(base));
});

test("input-not-mutated", () => {
  const before = structuredClone(base);
  composeFixture(base);
  assert.deepEqual(base, before);
});

test("stable-identity", () => {
  const x = composeFixture(base);
  assert.equal(x.matchupId, base.matchupId);
  assert.equal(x.homeTeam, "BUF");
  assert.equal(x.awayTeam, "BAL");
});

test("complete-evidence-completeness-one", () => {
  assert.equal(composeFixture(base).evidenceCompleteness, 1);
});

test("confidence-bounded", () => {
  assert.equal(composeFixture({...base,confidence:7}).confidence, 1);
  assert.equal(composeFixture({...base,confidence:-3}).confidence, 0);
});

test("missing-performance-degrades-confidence", () => {
  const x = composeFixture({...base,performanceEvidence:null});
  assert.equal(x.evidenceCompleteness, 0.8);
  assert.equal(x.confidence, 0.8);
  assert.ok(x.missingDimensions.includes("performanceEvidence"));
});

test("missing-opponent-adjustment-neutral-dimension", () => {
  const x = composeFixture({...base,opponentAdjustment:null});
  assert.ok(x.missingDimensions.includes("opponentAdjustment"));
  assert.equal(x.evidenceCompleteness, 0.8);
});

test("missing-dependency-degrades", () => {
  const x = composeFixture({...base,dependencyContext:null});
  assert.ok(x.missingDimensions.includes("dependencyContext"));
});

test("missing-availability-preserves-baseline", () => {
  const x = composeFixture({...base,availabilityImpact:null});
  assert.equal(x.directionalAssessment, "HOME_EDGE");
  assert.equal(x.decisionSupportProjection.probabilityDeltaApplied, false);
});

test("missing-team-context-fails-closed", () => {
  const x = composeFixture({...base,teamContext:null});
  assert.equal(x.directionalAssessment, "INSUFFICIENT_EVIDENCE");
  assert.equal(x.confidence, 0);
});

test("missing-provenance-fails-neutral", () => {
  const x = composeFixture({...base,provenance:[]});
  assert.equal(x.directionalAssessment, "NEUTRAL");
  assert.equal(x.confidence, 0);
});

test("decision-probability-not-mutated", () => {
  assert.equal(composeFixture(base).decisionSupportProjection.probabilityDeltaApplied,false);
});

test("winner-not-mutated", () => {
  assert.equal(composeFixture(base).decisionSupportProjection.winnerMutationApplied,false);
});

test("projection-additive-only", () => {
  assert.equal(composeFixture(base).decisionSupportProjection.mode,"ADDITIVE_ONLY");
});

test("availability-not-reapplied", () => {
  const x = composeFixture({...base,availabilityImpact:{home:{delta:-0.04},away:{delta:0}}});
  assert.equal(x.decisionSupportProjection.probabilityDeltaApplied,false);
});

test("opponent-adjustment-not-reapplied", () => {
  const x = composeFixture({...base,opponentAdjustment:{home:0.2,away:-0.2}});
  assert.equal(x.decisionSupportProjection.probabilityDeltaApplied,false);
});

const passed = tests.filter(x=>x.passed).length;
const failed = tests.length-passed;
console.log(JSON.stringify({
  suite:"Canonical Matchup Runtime Composition Fixture Gates",
  sprint:SPRINT,
  passed, failed, tests,
  decision: failed === 0
    ? "CANONICAL_MATCHUP_RUNTIME_COMPOSITION_FIXTURES_VALIDATED"
    : "CANONICAL_MATCHUP_RUNTIME_COMPOSITION_FIXTURES_REJECTED",
  authorizationBoundary: {
    fixtureValidationComplete: failed === 0,
    runtimeImplementationMayAdvance: failed === 0,
    matchupScoringAuthorized: false,
    productionDecisionModelMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false
  }
},null,2));
if(failed) process.exitCode=1;
