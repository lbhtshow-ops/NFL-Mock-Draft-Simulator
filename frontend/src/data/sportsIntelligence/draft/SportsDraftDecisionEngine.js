import { buildTeamDraftBoard } from "../../../engines/DraftBoardEngine.js";

const CONTRACT_VERSION = "SIE-DRAFT-DECISION-1.0.0";

function normalizePosition(position) {
  if (position === "DE") return "EDGE";
  if (position === "DL") return "DT";
  if (position === "OL") return "IOL";
  return position || null;
}

function pickNumber(pick) {
  return pick?.draft_pick?.pick_number ?? null;
}

function roundNumber(pick) {
  return pick?.draft_pick?.round ?? 1;
}

function candidatePoolSize({ pick, profile, availableCount }) {
  const base = roundNumber(pick) >= 4 ? 40 : 20;
  const bpaBoost = profile?.bpaPreference >= 8 ? 8 : 0;
  const aggressionBoost = profile?.aggression >= 8 ? 5 : 0;
  return Math.min(availableCount, base + bpaBoost + aggressionBoost);
}

function buildPositionsDrafted(teamPicks = []) {
  return new Set(
    teamPicks
      .filter((entry) => entry?.player)
      .map((entry) => normalizePosition(entry.player.position))
      .filter(Boolean)
  );
}

function buildTopCandidateSummary(player, index) {
  return {
    rank: index + 1,
    playerId: player?.id ?? null,
    name: player?.name ?? "Unknown prospect",
    position: normalizePosition(player?.position),
    school: player?.school || player?.college || null,
    decisionScore: Number.isFinite(player?.teamDraftScore)
      ? Math.round(player.teamDraftScore * 10) / 10
      : null,
    intelligenceScore: Number.isFinite(player?.intelligenceScore)
      ? player.intelligenceScore
      : null,
    teamFitScore: Number.isFinite(player?.teamFitScore)
      ? Math.round(player.teamFitScore * 10) / 10
      : null,
    consensusValue: Number.isFinite(player?.consensusValue)
      ? player.consensusValue
      : null,
    confidence: player?.draftExplanation?.confidence ?? null,
    reasons: player?.draftExplanation?.reasons || [],
  };
}

export function resolveSportsDraftDecision({
  players = [],
  team,
  pick,
  teamPicks = [],
  teamIntelligence = null,
  decisionProfile = null,
  fieApplicationContext = null,
} = {}) {
  if (!team || !pick || !Array.isArray(players) || players.length === 0) {
    return {
      available: false,
      contractVersion: CONTRACT_VERSION,
      recommendation: null,
      rankedCandidates: [],
      limitations: ["A team, active pick, and available prospect pool are required."],
    };
  }

  const poolSize = candidatePoolSize({
    pick,
    profile: decisionProfile,
    availableCount: players.length,
  });
  const candidatePool = players.slice(0, poolSize);
  const positionsDrafted = buildPositionsDrafted(teamPicks);

  const board = buildTeamDraftBoard({
    players: candidatePool,
    team,
    pick,
    positionsDrafted,
    teamAIProfile: decisionProfile,
  });

  const selected = board[0] || null;
  const rankedCandidates = board.slice(0, 5).map(buildTopCandidateSummary);

  return {
    available: Boolean(selected),
    contractVersion: CONTRACT_VERSION,
    engine: "LBHT Sports Intelligence Engine",
    capability: "DRAFT_DECISION_SUPPORT",
    pick: {
      id: pick.id ?? null,
      overall: pickNumber(pick),
      round: roundNumber(pick),
    },
    team: {
      id: team.id ?? null,
      name: team.name ?? null,
      abbreviation: teamIntelligence?.abbreviation || null,
      intelligenceSource: teamIntelligence?.sourceClassification || "UNAVAILABLE",
    },
    recommendation: selected
      ? {
          player: selected,
          playerId: selected.id ?? null,
          name: selected.name ?? null,
          position: normalizePosition(selected.position),
          decisionScore: Number.isFinite(selected.teamDraftScore)
            ? Math.round(selected.teamDraftScore * 10) / 10
            : null,
          confidence: selected?.draftExplanation?.confidence ?? null,
          reasons: selected?.draftExplanation?.reasons || [],
          components: {
            intelligenceScore: selected?.intelligenceScore ?? null,
            teamFitScore: Number.isFinite(selected?.teamFitScore)
              ? Math.round(selected.teamFitScore * 10) / 10
              : null,
            consensusValue: selected?.consensusValue ?? null,
          },
        }
      : null,
    rankedCandidates,
    teamIntelligence,
    canonicalFIE: {
      state: fieApplicationContext?.application?.fie?.teamIntelligence?.state || "UNAVAILABLE",
      teamAbbreviation: fieApplicationContext?.application?.fie?.teamIntelligence?.teamAbbreviation || null,
      overallStrength: fieApplicationContext?.application?.fie?.teamIntelligence?.overallStrength ?? null,
      confidence: fieApplicationContext?.application?.fie?.teamIntelligence?.confidence ?? null,
      confidenceKnown: Boolean(fieApplicationContext?.application?.fie?.teamIntelligence?.confidenceKnown),
      evidenceCompleteness: fieApplicationContext?.application?.fie?.teamIntelligence?.evidenceCompleteness ?? null,
      summary: fieApplicationContext?.application?.fie?.teamIntelligence?.summary || null,
      limitingFactors: fieApplicationContext?.application?.fie?.teamIntelligence?.explanation?.limitingFactors || [],
      influence: "CONTEXT_ONLY_NO_PROSPECT_SELECTION",
    },
    provenance: {
      prospectDecisionPath: "FOOTBALL_INTELLIGENCE_ENGINE",
      teamDecisionPath: teamIntelligence?.sourceClassification || "UNAVAILABLE",
      profilePath: decisionProfile ? "TRANSITIONAL_TEAM_DECISION_PROFILE" : "DEFAULT_TEAM_DECISION_PROFILE",
      applicationCalculatedFootballIntelligence: false,
      canonicalFIEFootballReasoningOwner: "CANONICAL_FIE",
      mdsDraftSelectionOwner: "LBHT_MOCK_DRAFT_SIMULATOR",
      canonicalFIEUsedForProspectRanking: false,
      reproducibleVariance: true,
    },
    limitations: [
      "Team decision profiles remain transitional until governed executive/coach/team decision profiles are fully connected.",
      "The current development prospect projection may not contain complete governed evaluation coverage for every candidate.",
      "Canonical FIE team intelligence is context-only in this sprint and does not select or re-rank prospects.",
      "This result is application decision support and does not modify canonical football knowledge.",
    ],
  };
}

export default { resolveSportsDraftDecision };
