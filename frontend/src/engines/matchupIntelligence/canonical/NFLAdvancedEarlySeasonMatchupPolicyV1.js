export const NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_CONTRACT =
  "NFLAdvancedEarlySeasonMatchupPolicyV1";

export const NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_VERSION =
  "FIE-NFL-ADVANCED-EARLY-SEASON-MATCHUP-POLICY-1.0.0";

export const NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_AUTHORITY =
  Object.freeze({
    state: "ACTIVE",
    productionAuthorityGranted: true,
    authorityGrantedBy: "EXPLICIT_PI5_PROMOTION",
    sourceResearchPolicy: "MATURITY_ALIGNED",
    sourceSprint: "PI.2",
    baseWeightsChanged: false,
    governedDimensions: Object.freeze([
      "protectionPressure",
      "explosivePlay",
      "redZone",
    ]),
  });

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function sourceSeason(teamIntelligence = {}) {
  const value = Number(teamIntelligence?.advancedMatchupEvidence?.season);
  return Number.isFinite(value) ? value : null;
}

function reliability(teamIntelligence = {}) {
  const value = Number(
    teamIntelligence?.matchupRuntimeEvidence?.teamStrength?.sampleMaturity?.reliability
  );
  return Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : null;
}

function priorSeasonAdvanced({ season, homeIntelligence, awayIntelligence }) {
  const gameSeason = Number(season);
  if (!Number.isFinite(gameSeason)) return false;
  return [sourceSeason(homeIntelligence), sourceSeason(awayIntelligence)]
    .some((value) => Number.isFinite(value) && value < gameSeason);
}

export function resolveNFLAdvancedEarlySeasonMatchupPolicyV1({
  season = null,
  week = null,
  homeIntelligence = null,
  awayIntelligence = null,
} = {}) {
  const normalizedWeek = Number(week);

  if (
    normalizedWeek === 1 ||
    priorSeasonAdvanced({ season, homeIntelligence, awayIntelligence })
  ) {
    return Object.freeze({
      contract: NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_CONTRACT,
      version: NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_VERSION,
      state: "ACTIVE",
      productionAuthorityGranted: true,
      policyId: "MATURITY_ALIGNED",
      multiplier: 1,
      reason:
        normalizedWeek === 1
          ? "WEEK_1_PRIOR_BASELINE_PRESERVED"
          : "PRIOR_SEASON_ADVANCED_EVIDENCE_PRESERVED",
      governedDimensions:
        NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_AUTHORITY.governedDimensions,
    });
  }

  const valid = [
    reliability(homeIntelligence),
    reliability(awayIntelligence),
  ].filter(finite);

  return Object.freeze({
    contract: NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_CONTRACT,
    version: NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_VERSION,
    state: "ACTIVE",
    productionAuthorityGranted: true,
    policyId: "MATURITY_ALIGNED",
    multiplier: valid.length ? Math.min(...valid) : 1,
    reason:
      valid.length
        ? "CURRENT_SEASON_SAMPLE_MATURITY"
        : "MATURITY_EVIDENCE_UNAVAILABLE_FAIL_OPEN_BASELINE",
    governedDimensions:
      NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_AUTHORITY.governedDimensions,
  });
}

export default {
  NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_CONTRACT,
  NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_VERSION,
  NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_AUTHORITY,
  resolveNFLAdvancedEarlySeasonMatchupPolicyV1,
};
