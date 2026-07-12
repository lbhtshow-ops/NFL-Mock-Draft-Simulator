import {
  getNFLRosterByTeam,
  nflPositionGroups,
} from "../data/footballIntelligence/nfl/rosters";

import { evaluateNFLRosterPlayer } from "./PlayerRosterEvaluationEngine";

const rosterScoreByTier = {
  elite: 95,
  highEndStarter: 88,
  starter: 80,
  replacementStarter: 70,
  rotational: 62,
  developmental: 55,
  unknown: null,
};

function getPlayerPosition(player = {}) {
  return player?.identity?.position || player?.position || "UNKNOWN";
}

function getPlayerStarterValue(player = {}) {
  return player?.roster?.starter ?? player?.starter ?? null;
}

function getPlayerStarter(player = {}) {
  return getPlayerStarterValue(player) === true;
}

function hasKnownStarterValue(player = {}) {
  return typeof getPlayerStarterValue(player) === "boolean";
}

function getRosterEvaluation(player) {
  const explicitScore =
    player?.evaluation?.rosterValue ?? player?.rosterValue ?? null;

  const explicitTier =
    player?.evaluation?.playerTier ?? player?.playerTier ?? null;

  if (
    typeof explicitScore === "number" &&
    explicitTier &&
    explicitTier !== "unknown"
  ) {
    return {
      ...player.evaluation,
      rosterValue: explicitScore,
      playerTier: explicitTier,
      evaluationSource: "LBHT Explicit Evaluation",
    };
  }

  return {
    ...evaluateNFLRosterPlayer(player),
    evaluationSource: "LBHT Player Roster Evaluation Engine",
  };
}

function getRosterValueScore(player) {
  const evaluation = getRosterEvaluation(player);

  if (typeof evaluation?.rosterValue === "number") {
    return evaluation.rosterValue;
  }

  const tier = evaluation?.playerTier || "unknown";

  return rosterScoreByTier[tier] ?? null;
}

function groupPlayersByPosition(roster = []) {
  return roster.reduce((groups, player) => {
    const position = getPlayerPosition(player);

    return {
      ...groups,
      [position]: [...(groups[position] || []), player],
    };
  }, {});
}

function evaluatePositionGroup(players = []) {
  if (!players.length) {
    return {
      playerCount: 0,
      starterCount: 0,
      gradedPlayerCount: 0,
      averageRosterValue: null,
      topRosterValue: null,
      depthScore: null,
      strengthGrade: "No Data",
      hasEvaluationData: false,
      hasStarterData: false,
    };
  }

  const rosterValues = players
    .map(getRosterValueScore)
    .filter((value) => typeof value === "number");

  const starterCount = players.filter(getPlayerStarter).length;
  const hasStarterData = players.some(hasKnownStarterValue);

  if (rosterValues.length === 0) {
    return {
      playerCount: players.length,
      starterCount,
      hasStarterData,
      gradedPlayerCount: 0,
      averageRosterValue: null,
      topRosterValue: null,
      depthScore: null,
      strengthGrade: "Ungraded",
      hasEvaluationData: false,
    };
  }

  const averageRosterValue = Math.round(
    rosterValues.reduce((total, value) => total + value, 0) /
      rosterValues.length
  );

  const topRosterValue = Math.max(...rosterValues);

  const depthScore = Math.round(
    averageRosterValue * 0.65 + Math.min(players.length, 4) * 8.75
  );

  let strengthGrade = "Weak";

  if (topRosterValue >= 90 && depthScore >= 80) {
    strengthGrade = "Elite";
  } else if (topRosterValue >= 84 && depthScore >= 72) {
    strengthGrade = "Strong";
  } else if (topRosterValue >= 76 && depthScore >= 64) {
    strengthGrade = "Solid";
  } else if (topRosterValue >= 68) {
    strengthGrade = "Vulnerable";
  }

  return {
    playerCount: players.length,
    starterCount,
    hasStarterData,
    gradedPlayerCount: rosterValues.length,
    averageRosterValue,
    topRosterValue,
    depthScore,
    strengthGrade,
    hasEvaluationData: true,
  };
}

function calculateRosterCoverage(roster = []) {
  const coveredPositions = new Set(
    roster.map(getPlayerPosition).filter(Boolean)
  );

  return {
    hasRosterData: roster.length > 0,
    playerCount: roster.length,
    coveredPositions: [...coveredPositions],
    coveredPositionCount: coveredPositions.size,
    expectedPositionCount: nflPositionGroups.length,
    coveragePercent: Math.round(
      (coveredPositions.size / nflPositionGroups.length) * 100
    ),
  };
}

export function buildNFLRosterIntelligence(teamAbbreviation) {
  const roster = getNFLRosterByTeam(teamAbbreviation);
  const positionGroups = groupPlayersByPosition(roster);
  const coverage = calculateRosterCoverage(roster);

  const evaluatedPositionGroups = nflPositionGroups.reduce(
    (results, position) => ({
      ...results,
      [position]: {
        position,
        ...evaluatePositionGroup(positionGroups[position] || []),
      },
    }),
    {}
  );

  return {
    team: teamAbbreviation,
    roster,
    positionGroups: evaluatedPositionGroups,
    coverage,
    metadata: {
      source: "LBHT NFL Roster Intelligence",
      playerCount: roster.length,
    },
  };
}

export default {
  buildNFLRosterIntelligence,
};