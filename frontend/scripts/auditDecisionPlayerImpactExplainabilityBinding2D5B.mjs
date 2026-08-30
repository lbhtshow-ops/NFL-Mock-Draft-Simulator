import fs from "node:fs";

const requiredFiles = [
  "src/engines/playerAvailability/integration/NFLPlayerImpactContextInputIntegrationService.js",
  "src/engines/gameDecisionSupport/canonical/NFLDecisionPlayerImpactExplainabilityProjection.js",
  "src/engines/gameDecisionSupport/canonical/NFLDecisionAvailabilityExplainabilityAdapter.js",
  "src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLDecisionPlayerImpactExplainabilityGovernance.js",
];

const searchTargets = [
  {
    path:
      "src/engines/playerAvailability/integration/NFLPlayerImpactContextInputIntegrationService.js",
    tokens: [
      "NFLPlayerImpactIntegratedInputs",
      "canonicalCaliber",
      "replacementCaliber",
      "teamDependencyEvidence",
      "contextResolution",
      "directImpactScoringInvoked: false",
      "predictionScoringInvoked: false",
    ],
  },
  {
    path:
      "src/engines/gameDecisionSupport/canonical/NFLDecisionPlayerImpactExplainabilityProjection.js",
    tokens: [
      "playerId",
      "playerName",
      "expectedReplacementPlayerId",
      "expectedReplacementCaliberTier",
      "teamDependency",
      "basePlayerImpact",
      "adjustedPlayerImpact",
      "availabilityImpactDelta",
      "policyVersion",
      "replacementGapCalculatedByAdapter: false",
      "playerImpactRecalculatedByAdapter: false",
    ],
  },
  {
    path:
      "src/engines/gameDecisionSupport/canonical/NFLDecisionAvailabilityExplainabilityAdapter.js",
    tokens: [
      "availabilityIntelligence",
      "playerAdjustments",
      "READ_ONLY_CANONICAL_PROJECTION",
      "missingCanonicalValuesRemainNull",
    ],
  },
];

const fileReports = requiredFiles.map((path) => ({
  path,
  exists: fs.existsSync(path),
}));

const tokenReports = searchTargets.map((spec) => {
  const exists = fs.existsSync(spec.path);
  const text = exists ? fs.readFileSync(spec.path, "utf8") : "";
  const checks = Object.fromEntries(
    spec.tokens.map((token) => [token, text.includes(token)])
  );
  return {
    path: spec.path,
    exists,
    checks,
    passed: exists && Object.values(checks).every(Boolean),
  };
});

const passed =
  fileReports.every((x) => x.exists) &&
  tokenReports.every((x) => x.passed);

console.log(
  JSON.stringify(
    {
      contractVersion:
        "FIE-NFL-DECISION-PLAYER-IMPACT-EXPLAINABILITY-BINDING-AUDIT-2D5B-1.0.0",
      sprint: "2D.5B",
      mode: "READ_ONLY_BINDING_PREFLIGHT",
      decision: passed
        ? "DECISION_API_PLAYER_IMPACT_EXPLAINABILITY_BINDING_READY_FOR_CONSUMER_VALIDATION"
        : "DECISION_API_PLAYER_IMPACT_EXPLAINABILITY_BINDING_INCOMPLETE",
      fileReports,
      tokenReports,
      safeguards: {
        productionAdapterExecutionAuthorized: false,
        productionPlayerImpactActivationAuthorized: false,
        teamStrengthMutated: false,
        matchupMutated: false,
        decisionScoringMutated: false,
        pickemScoringMutated: false,
        databaseMutated: false,
      },
    },
    null,
    2
  )
);

if (!passed) process.exitCode = 2;
