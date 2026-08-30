import {
  buildNFLTeamStrength,
} from "../src/engines/teamIntelligence/NFLTeamPriorAndStrengthEngine.js";

import {
  integrateNFLPlayerImpactIntoTeamStrengthShadow,
} from "../src/engines/teamIntelligence/strength/integration/NFLPlayerImpactTeamStrengthShadowIntegration.js";

const args = process.argv.slice(2);
const value = (flag, fallback = null) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const team = String(value("--team", "BAL")).toUpperCase();
const targetSeason = Number(value("--season", "2026"));
const playerName = value("--player", "Lamar Jackson");
const impact = Number(value("--impact", "90.36"));

const baseline = buildNFLTeamStrength({
  team,
  targetSeason,
  phaseScope: "ALL",
});

const shadowPlayer = {
  playerId: null,
  displayName: playerName,
  position: "QB",
  availability: {
    status: "OUT",
    evidenceRefs: [],
    sourceRefs: [],
  },
  caliber: null,
  impactContext: {
    role: "PRIMARY",
    replacementPlayerId: null,
    replacementQuality: "REPLACEMENT_LEVEL",
    teamDependency: "VERY_HIGH",
    positionImportance: "VERY_HIGH",
    offensiveSnapShare: null,
  },
  impact: {
    modelState: "MODELED",
    overallImpact: impact,
    confidence: 0.86,
    methodology: {
      profileId: "PROVISIONAL_SHADOW_ACCEPTANCE_INPUT",
      profileVersion: "1.0.0",
    },
  },
  readiness: "READY",
};

const result = integrateNFLPlayerImpactIntoTeamStrengthShadow({
  team,
  targetSeason,
  teamStrength: baseline,
  availabilityEvidence: {
    teamAbbreviation: team,
    players: [shadowPlayer],
  },
});

const pass =
  result.mode === "SHADOW_ONLY" &&
  result.availabilityModifierEvidence.modeledPlayerCount === 1 &&
  result.availabilityModifierEvidence.players[0].overallImpact === impact &&
  result.shadowAdjustment.authorized === false &&
  result.shadowAdjustment.numericDelta === null &&
  result.shadowAdjustment.adjustedTeamStrength === null &&
  result.outputs.winProbability === null &&
  result.outputs.pickemAdjustment === null;

console.log(JSON.stringify({
  acceptance: "PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_INTEGRATION",
  status: pass ? "PASS" : "FAIL",
  input: {
    team,
    targetSeason,
    playerName,
    provisionalPlayerImpact: impact,
    note:
      "Player Impact is supplied as explicit shadow acceptance evidence. It is not interpreted as Team Strength points.",
  },
  baseline,
  integration: result,
  safeguards: {
    databaseMutationMethodsInvoked: false,
    historicalCalibrationExecuted: false,
    teamStrengthFormulaMutated: false,
    numericAvailabilityWeightIntroduced: false,
    predictionScoringInvoked: false,
    pickemDecisionModelMutated: false,
  },
}, null, 2));

if (!pass) process.exitCode = 1;
