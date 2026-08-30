import fs from "node:fs";

const required = [
  {
    path: "src/engines/teamIntelligence/strength/integration/NFLPlayerImpactTeamStrengthShadowIntegration.js",
    tokens: [
      "integrateNFLPlayerImpactIntoTeamStrengthShadow",
      "shadowAdjustment",
      "authorized: false",
      "numericDelta: null",
      "adjustedTeamStrength: null",
    ],
  },
  {
    path: "src/engines/matchupIntelligence/NFLMatchupDimensionEngine.js",
    tokens: [
      "overallStrength",
      "home?.overallStrength",
      "away?.overallStrength",
    ],
  },
  {
    path: "src/engines/matchupIntelligence/NFLMatchupIntelligenceEngine.js",
    tokens: [
      "evaluateNFLMatchupIntelligence",
      'key: "overallStrength"',
      "weight: 0.30",
      "matchupEdge",
    ],
  },
  {
    path: "src/engines/gameDecisionSupport/canonical/NFLGameDecisionModelV1.js",
    tokens: [
      "evaluateNFLGameDecisionV1",
      "matchupEdge",
      "evidenceQuality",
      "homeWinProbability",
      "expectedHomeMargin",
    ],
  },
];

const reports = required.map(spec => {
  const exists = fs.existsSync(spec.path);
  const text = exists ? fs.readFileSync(spec.path, "utf8") : "";
  const tokenChecks = Object.fromEntries(spec.tokens.map(token => [token, text.includes(token)]));
  return {
    path: spec.path,
    exists,
    tokenChecks,
    passed: exists && Object.values(tokenChecks).every(Boolean),
  };
});

const passed = reports.every(r => r.passed);
const report = {
  contractVersion: "FIE-NFL-PLAYER-IMPACT-CANONICAL-PROPAGATION-PREFLIGHT-2D4-1.0.0",
  sprint: "2D.4",
  decision: passed
    ? "CANONICAL_TEAM_STRENGTH_MATCHUP_DECISION_PATH_VERIFIED"
    : "CANONICAL_PATH_PREFLIGHT_FAILED_REPOSITORY_REAUDIT_REQUIRED",
  reports,
  architecture: {
    playerImpactToTeamStrengthShadow: true,
    teamStrengthFeedsMatchupOverallStrength: true,
    matchupOverallStrengthWeightExpected: 0.30,
    canonicalDecisionConsumesMatchupEdgeAndEvidenceQuality: true,
  },
  safeguards: {
    sourceFilesMutated: false,
    productionAuthorizationChanged: false,
    numericDeltaInjected: false,
    pickemMutated: false,
  },
};
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 2;
