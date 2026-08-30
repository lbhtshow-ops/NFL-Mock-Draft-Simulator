export const NFL_ADVANCED_EARLY_SEASON_WEIGHT_POLICY_PI2_CONTRACT =
  "NFLAdvancedEarlySeasonWeightPolicyPI2";

export const NFL_ADVANCED_EARLY_SEASON_WEIGHT_POLICY_PI2_VERSION =
  "FIE-PI2-ADVANCED-EARLY-SEASON-WEIGHT-POLICY-1.0.0";

export const NFL_ADVANCED_EARLY_SEASON_POLICY_IDS = Object.freeze({
  BASELINE: "BASELINE",
  MATURITY_ALIGNED: "MATURITY_ALIGNED",
  WEEK_RAMP: "WEEK_RAMP",
  EARLY_25: "EARLY_25",
});

const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);

function evidenceSeason(teamEvidence = {}) {
  const value = Number(
    teamEvidence?.advancedMatchupEvidence?.season
  );
  return Number.isFinite(value) ? value : null;
}

function maturityReliability(teamEvidence = {}) {
  const value = Number(
    teamEvidence?.maturity?.reliability
  );
  return Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : null;
}

function usesPriorSeasonAdvanced(snapshot = {}) {
  const gameSeason = Number(snapshot?.game?.season);
  const homeSeason = evidenceSeason(snapshot?.evidence?.home);
  const awaySeason = evidenceSeason(snapshot?.evidence?.away);

  if (!Number.isFinite(gameSeason)) {
    return false;
  }

  return [homeSeason, awaySeason].some(
    (season) =>
      Number.isFinite(season) &&
      season < gameSeason
  );
}

/**
 * RESEARCH_ONLY.
 *
 * This multiplier applies only to the existing advanced Matchup Edge
 * contribution (protectionPressure, explosivePlay, redZone) in historical
 * replay experiments. It does not authorize or modify production weights.
 */
export function resolveNFLAdvancedEarlySeasonWeightMultiplierPI2({
  snapshot = {},
  policyId = NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE,
} = {}) {
  const week = Number(snapshot?.game?.week);

  if (
    policyId ===
    NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE
  ) {
    return 1;
  }

  // The PI.2 ablation showed the prior-season Week 1 fallback improved
  // binary winner selection. Preserve its full contribution in all
  // calibrated candidates.
  if (
    week === 1 ||
    usesPriorSeasonAdvanced(snapshot)
  ) {
    return 1;
  }

  if (
    policyId ===
    NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.MATURITY_ALIGNED
  ) {
    const home =
      maturityReliability(snapshot?.evidence?.home);
    const away =
      maturityReliability(snapshot?.evidence?.away);

    const valid = [home, away].filter(finite);

    return valid.length
      ? Math.min(...valid)
      : 1;
  }

  if (
    policyId ===
    NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.WEEK_RAMP
  ) {
    if (week <= 3) return 0.25;
    if (week <= 5) return 0.50;
    if (week <= 8) return 0.75;
    return 1;
  }

  if (
    policyId ===
    NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.EARLY_25
  ) {
    return week <= 4 ? 0.25 : 1;
  }

  throw new Error(
    `Unknown PI.2 advanced early-season policy: ${policyId}`
  );
}

export default {
  NFL_ADVANCED_EARLY_SEASON_WEIGHT_POLICY_PI2_CONTRACT,
  NFL_ADVANCED_EARLY_SEASON_WEIGHT_POLICY_PI2_VERSION,
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS,
  resolveNFLAdvancedEarlySeasonWeightMultiplierPI2,
};
