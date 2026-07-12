import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary";
import scoutingProfiles from "../data/footballIntelligence/scouting/scoutingProfiles";
import defaultScoutingProfile from "../data/footballIntelligence/scouting/defaultScoutingProfile";

function getCanonicalPlayerId(player) {
  return (
    player?.canonicalId ||
    player?.playerId ||
    player?.prospectId ||
    player?.id ||
    null
  );
}

export function getScoutingProfile(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) return defaultScoutingProfile;

  return scoutingProfiles[playerId] || defaultScoutingProfile;
}

export function getScoutingSummary(player) {
  const playerId = getCanonicalPlayerId(player);
  const profile = getScoutingProfile(player);

  if (!playerId || profile === defaultScoutingProfile) {
    return createIntelligenceSummary({
      available: false,
      playerId,
      summary: "No scouting profile available yet.",
      notes: "No scouting profile available yet.",
      data: defaultScoutingProfile,
    });
  }

  return createIntelligenceSummary({
    available: true,
    playerId,
    confidence: profile.confidence || 0,
    source: profile.source || "Unknown",
    lastUpdated: profile.lastUpdated || null,
    summary: profile.executiveSummary || "",
    notes: profile.notes || "",
    data: profile,
  });
}

export default {
  getScoutingProfile,
  getScoutingSummary,
};