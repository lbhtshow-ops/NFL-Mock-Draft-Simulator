import { evaluateNFLRosterPlayer } from "../PlayerRosterEvaluationEngine";

function getPlayerName(player = {}) {
  return (
    player?.identity?.playerName ||
    player?.identity?.displayName ||
    player?.identity?.fullName ||
    player?.playerName ||
    player?.displayName ||
    player?.fullName ||
    player?.name ||
    "Unknown Player"
  );
}

function getPlayerTeam(player = {}) {
  return (
    player?.identity?.team ||
    player?.team ||
    player?.roster?.team ||
    "UNK"
  );
}

function getPlayerPosition(player = {}) {
  return player?.identity?.position || player?.position || "UNKNOWN";
}

function getPlayerId(player = {}) {
  return (
    player?.playerId ||
    player?.identity?.playerId ||
    player?.id ||
    null
  );
}

function buildDiagnosticRow(player = {}) {
  const evaluation = evaluateNFLRosterPlayer(player);

  return {
    playerId: getPlayerId(player),
    name: getPlayerName(player),
    team: getPlayerTeam(player),
    position: getPlayerPosition(player),

    playerQuality: evaluation.playerQuality,
    rosterValue: evaluation.rosterValue,
    playerTier: evaluation.playerTier,

    model: evaluation.positionEvaluation?.model || null,
    starterOutlook: evaluation.positionEvaluation?.starterOutlook || null,
    longTermAnswer: evaluation.positionEvaluation?.longTermAnswer ?? null,

modelPerformanceScore:
  evaluation.positionEvaluation?.performanceEvaluation?.performanceScore ?? null,

evidenceLevel:
  evaluation.positionEvaluation?.performanceEvaluation?.evidenceLevel ?? null,

  sampleSize:
  evaluation.positionEvaluation?.performanceEvaluation?.sampleSize || null,

  performanceEvaluation:
  evaluation.positionEvaluation?.performanceEvaluation || null,

    usageScore: evaluation.usage?.usageScore ?? null,
    productionScore: evaluation.production?.productionScore ?? null,
    recognitionScore: evaluation.recognition?.recognitionScore ?? null,
recognitionTier: evaluation.recognition?.tier || "No Major Recognition",

careerRecognitionScore:
  evaluation.recognition?.careerRecognitionScore ?? null,

recentRecognitionScore:
  evaluation.recognition?.recentRecognitionScore ?? null,

eliteSeasonCount:
  evaluation.recognition?.eliteSeasonCount ?? 0,

lastEliteSeason:
  evaluation.recognition?.lastEliteSeason ?? null,

provenEliteCeiling:
  evaluation.recognition?.provenEliteCeiling || false,

sustainedEliteRecognition:
  evaluation.recognition?.sustainedEliteRecognition || false,

  establishedCareerBaseline:
  evaluation.recognition?.establishedCareerBaseline ?? null,

usageAvailable: evaluation.usage?.available || false,
    productionAvailable: evaluation.production?.available || false,
    recognitionAvailable: evaluation.recognition?.available || false,

    prospectCarryover:
      evaluation.positionEvaluation?.prospectCarryover || null,

    notes: evaluation.positionEvaluation?.notes || [],
  };
}

export function getPlayerEvaluationDiagnostics(players = [], options = {}) {
  const {
    position = null,
    team = null,
    limit = 20,
    sortBy = "rosterValue",
    sortDirection = "desc",
  } = options;

  let rows = players.map(buildDiagnosticRow);

  if (position) {
    rows = rows.filter((row) => row.position === position);
  }

  if (team) {
    rows = rows.filter((row) => row.team === team);
  }

  rows.sort((a, b) => {
    const aValue = a?.[sortBy];
    const bValue = b?.[sortBy];

    if (typeof aValue !== "number" && typeof bValue !== "number") return 0;
    if (typeof aValue !== "number") return 1;
    if (typeof bValue !== "number") return -1;

    return sortDirection === "asc"
      ? aValue - bValue
      : bValue - aValue;
  });

  return rows.slice(0, limit);
}

export function getPositionModelDiagnostics(players = [], position, limit = 20) {
  return {
    position,
    highestRated: getPlayerEvaluationDiagnostics(players, {
      position,
      limit,
      sortBy: "rosterValue",
      sortDirection: "desc",
    }),
    lowestRated: getPlayerEvaluationDiagnostics(players, {
      position,
      limit,
      sortBy: "rosterValue",
      sortDirection: "asc",
    }),
  };
}

export function getTeamEvaluationDiagnostics(players = [], team, limit = 20) {
  return {
    team,
    topPlayers: getPlayerEvaluationDiagnostics(players, {
      team,
      limit,
      sortBy: "rosterValue",
      sortDirection: "desc",
    }),
    lowestPlayers: getPlayerEvaluationDiagnostics(players, {
      team,
      limit,
      sortBy: "rosterValue",
      sortDirection: "asc",
    }),
  };
}

export default {
  getPlayerEvaluationDiagnostics,
  getPositionModelDiagnostics,
  getTeamEvaluationDiagnostics,
};