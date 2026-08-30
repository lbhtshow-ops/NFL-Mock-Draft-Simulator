import {
  createNFLTeamIntelligenceResult,
  isNFLTeamIntelligenceResult,
  NFL_TEAM_INTELLIGENCE_STATES,
} from "../teamIntelligence/NFLTeamIntelligenceResultContract.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tests = [];

function check(name, fn) {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.message,
    });
  }
}

check("unknown-confidence-remains-unknown", () => {
  const result = createNFLTeamIntelligenceResult({
    teamAbbreviation: "BAL",
    state: NFL_TEAM_INTELLIGENCE_STATES.PARTIAL,
    confidence: 0.88,
    confidenceKnown: false,
  });

  assert(result.confidence === null, "Unknown confidence leaked.");
  assert(result.confidenceKnown === false, "Unknown confidence promoted.");
});

check("unmodeled-score-remains-null", () => {
  const result = createNFLTeamIntelligenceResult({
    teamAbbreviation: "BAL",
    state: NFL_TEAM_INTELLIGENCE_STATES.PARTIAL,
  });

  assert(result.overallStrength === null, "Missing score was fabricated.");
});

check("scores-are-bounded", () => {
  const result = createNFLTeamIntelligenceResult({
    teamAbbreviation: "BAL",
    state: NFL_TEAM_INTELLIGENCE_STATES.AVAILABLE,
    overallStrength: 140,
    components: { offense: -5 },
  });

  assert(result.overallStrength === 100, "Upper score bound failed.");
  assert(result.components.offense === 0, "Lower score bound failed.");
});

check("contract-shape-validates", () => {
  const result = createNFLTeamIntelligenceResult({
    teamAbbreviation: "BAL",
    state: NFL_TEAM_INTELLIGENCE_STATES.PARTIAL,
    missingEvidence: ["performance.offense.epaPerPlay"],
  });

  assert(isNFLTeamIntelligenceResult(result), "Contract shape invalid.");
});

const failed = tests.filter((test) => !test.passed);

console.log(JSON.stringify({
  suite: "NFL Team Intelligence Result Contract",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
}, null, 2));

if (failed.length) process.exitCode = 1;
