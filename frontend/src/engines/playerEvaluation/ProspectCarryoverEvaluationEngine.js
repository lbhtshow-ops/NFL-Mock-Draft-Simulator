import { resolveProspect } from "../../data/footballIntelligence/registry/resolveProspect.js";
import { getFootballPlayerRecord } from "../../data/footballIntelligence/database/footballPlayerRecords.js";

function getPlayerName(player = {}) {
  return (
    player?.identity?.playerName ||
    player?.playerName ||
    player?.name ||
    null
  );
}

function getIsRookie(player = {}) {
  const experience =
    player?.identity?.experience ??
    player?.experience ??
    player?.years_exp ??
    player?.yearsExp ??
    player?.roster?.experience ??
    player?.roster?.years_exp ??
    player?.roster?.yearsExp ??
    null;

  return (
    experience === 0 ||
    experience === "0" ||
    experience === "R" ||
    experience === "Rookie" ||
    player?.identity?.rookie === true ||
    player?.rookie === true ||
    player?.roster?.rookie === true
  );
}

function getCarryoverScoreFromRecord(record = {}) {
  return (
    record?.analytics?.overallPlayerScore ??
    record?.analytics?.traitScore ??
    record?.analytics?.productionScore ??
    record?.analytics?.athleticScore ??
    null
  );
}

export function getProspectCarryoverEvaluation(player = {}) {
  const playerName = getPlayerName(player);
  const isRookie = getIsRookie(player);
  const resolvedProspect = resolveProspect(player);
  const prospectRecord = resolvedProspect?.id
    ? getFootballPlayerRecord(resolvedProspect.id)
    : null;

  const carryoverScore = getCarryoverScoreFromRecord(prospectRecord);
  
  if (!isRookie) {
    return {
      available: false,
      carryoverScore: null,
      source: "Not a rookie",
      notes: [],
    };
  }

  if (typeof carryoverScore !== "number") {
    return {
      available: false,
      carryoverScore: null,
      source: "No prospect record grade available",
      resolvedProspect,
      notes: [],
    };
  }

  return {
    available: true,
    carryoverScore,
    source: "Football Intelligence Prospect Carryover",
    resolvedProspect,
    prospectRecord: {
      playerId: prospectRecord?.playerId || null,
      playerName: prospectRecord?.identity?.playerName || null,
      position: prospectRecord?.identity?.position || null,
      school: prospectRecord?.identity?.school || null,
      ranking: prospectRecord?.rankings?.overall || null,
      tier: prospectRecord?.rankings?.tier || null,
      projection: prospectRecord?.rankings?.projection || null,
    },
    notes: [
      "Rookie evaluated using Football Intelligence prospect carryover because no NFL production is available yet.",
      "Carryover score uses the canonical Football Player Record analytics score.",
      "Carryover influence should fade once NFL usage and production become available.",
    ],
  };
}

export default {
  getProspectCarryoverEvaluation,
};