import {
  nflTeamPerformanceEvidenceRecords,
} from "../../../data/footballIntelligence/nfl/performance/NFLTeamPerformanceEvidenceRegistry.js";
import {
  buildNFLOpponentAdjustment,
} from "../../../data/footballIntelligence/nfl/performance/NFLOpponentAdjustmentEngine.js";
import {
  nflAdvancedMatchupEvidenceRecords,
} from "../../../data/footballIntelligence/nfl/matchup/NFLAdvancedMatchupEvidenceRegistry.js";

export const NFL_FIE_V2_C3_LIVE_FEATURE_ADAPTER_CONTRACT =
  "NFLFIEV2C3LiveFeatureAdapter";
export const NFL_FIE_V2_C3_LIVE_FEATURE_ADAPTER_VERSION =
  "NFL-FIE-V2-C3-LIVE-FEATURE-ADAPTER-1.0.0";

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function sourceTeam(team) {
  const code = typeof team === "string" ? team.trim().toUpperCase() : null;
  return code === "LAR" ? "LA" : code;
}

function latestCohort(records, { season, throughWeek = null, phaseScope }) {
  const byTeam = new Map();
  for (const record of records || []) {
    if (Number(record?.season) !== Number(season)) continue;
    if (phaseScope && record?.phaseScope !== phaseScope) continue;
    const candidateWeek = record?.throughWeek;
    if (
      throughWeek !== null &&
      (candidateWeek === null || candidateWeek === undefined || Number(candidateWeek) > Number(throughWeek))
    ) {
      continue;
    }
    const team = sourceTeam(record?.teamAbbreviation || record?.team);
    if (!team) continue;
    const existing = byTeam.get(team);
    const existingWeek = existing?.throughWeek ?? -1;
    const nextWeek = candidateWeek ?? 999;
    if (!existing || nextWeek >= existingWeek) byTeam.set(team, record);
  }
  return [...byTeam.values()];
}

function maturityReliability(record) {
  const games = Number(record?.sample?.gamesPlayed) || 0;
  if (games <= 0) return 0;
  if (games <= 2) return 0.25;
  if (games <= 4) return 0.5;
  if (games <= 7) return 0.75;
  return 1;
}

function metric(record, path) {
  let value = record;
  for (const key of path) value = value?.[key];
  return numberOrNull(value);
}

function blended(current, prior, path) {
  const c = metric(current, path);
  const p = metric(prior, path);
  const reliability = maturityReliability(current);
  if (finite(c) && finite(p)) return c * reliability + p * (1 - reliability);
  if (finite(c)) return c;
  if (finite(p)) return p;
  return null;
}

function opponentIndex(team, current, prior, currentOpponent, priorOpponent) {
  const reliability = maturityReliability(current);
  const source = sourceTeam(team);
  const c = numberOrNull(currentOpponent.get(source)?.opponentAdjustedIndex);
  const p = numberOrNull(priorOpponent.get(source)?.opponentAdjustedIndex);
  if (finite(c) && finite(p)) return c * reliability + p * (1 - reliability);
  if (finite(c)) return c;
  if (finite(p)) return p;
  return null;
}

function performanceProfile(team, { currentRecords, priorRecords, currentOpponent, priorOpponent }) {
  const source = sourceTeam(team);
  const current = currentRecords.find((record) => sourceTeam(record?.teamAbbreviation) === source) || null;
  const prior = priorRecords.find((record) => sourceTeam(record?.teamAbbreviation) === source) || null;

  const offenseEpa = blended(current, prior, ["offense", "epaPerPlay"]);
  const defenseEpaAllowed = blended(current, prior, ["defense", "epaAllowedPerPlay"]);
  const passOffenseEpa = blended(current, prior, ["offense", "passEpaPerPlay"]);
  const passDefenseEpaAllowed = blended(current, prior, ["defense", "passEpaAllowedPerPlay"]);
  const rushOffenseEpa = blended(current, prior, ["offense", "rushEpaPerPlay"]);
  const rushDefenseEpaAllowed = blended(current, prior, ["defense", "rushEpaAllowedPerPlay"]);
  const offenseSuccessRate = blended(current, prior, ["offense", "successRate"]);
  const defenseSuccessRateAllowed = blended(current, prior, ["defense", "successRateAllowed"]);

  return {
    current,
    prior,
    reliability: maturityReliability(current),
    netEpa: finite(offenseEpa) && finite(defenseEpaAllowed) ? offenseEpa - defenseEpaAllowed : null,
    passEpaBalance: finite(passOffenseEpa) && finite(passDefenseEpaAllowed)
      ? passOffenseEpa - passDefenseEpaAllowed
      : null,
    rushEpaBalance: finite(rushOffenseEpa) && finite(rushDefenseEpaAllowed)
      ? rushOffenseEpa - rushDefenseEpaAllowed
      : null,
    successRateBalance: finite(offenseSuccessRate) && finite(defenseSuccessRateAllowed)
      ? offenseSuccessRate - defenseSuccessRateAllowed
      : null,
    opponentAdjustedIndex: opponentIndex(team, current, prior, currentOpponent, priorOpponent),
  };
}

function advancedBalance(record) {
  if (!record) return null;
  const pass = numberOrNull(record?.offense?.explosivePassRate);
  const rush = numberOrNull(record?.offense?.explosiveRushRate);
  const passAllowed = numberOrNull(record?.defense?.explosivePassAllowedRate);
  const rushAllowed = numberOrNull(record?.defense?.explosiveRushAllowedRate);
  const offense = finite(pass) && finite(rush) ? (pass + rush) / 2 : finite(pass) ? pass : rush;
  const defenseAllowed = finite(passAllowed) && finite(rushAllowed)
    ? (passAllowed + rushAllowed) / 2
    : finite(passAllowed) ? passAllowed : rushAllowed;
  return finite(offense) && finite(defenseAllowed) ? offense - defenseAllowed : null;
}

function latestAdvanced(team, currentAdvanced, priorAdvanced) {
  const source = sourceTeam(team);
  return (
    currentAdvanced.find((record) => sourceTeam(record?.team) === source) ||
    priorAdvanced.find((record) => sourceTeam(record?.team) === source) ||
    null
  );
}

function delta(home, away) {
  return finite(home) && finite(away) ? home - away : null;
}

function average(values) {
  const valid = values.filter(finite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

export function buildNFLFIEV2C3LiveFeatureInput({ season, week, homeTeam, awayTeam } = {}) {
  const targetSeason = Number(season);
  const targetWeek = Number(week);
  if (!Number.isInteger(targetSeason) || !Number.isInteger(targetWeek) || targetWeek < 1) {
    throw new Error("C3 shadow live feature adapter requires numeric season/week.");
  }
  if (!homeTeam || !awayTeam) throw new Error("C3 shadow live feature adapter requires both teams.");

  const throughWeek = targetWeek === 1 ? null : targetWeek - 1;
  const currentRecords = targetWeek === 1
    ? []
    : latestCohort(nflTeamPerformanceEvidenceRecords, {
        season: targetSeason,
        throughWeek,
        phaseScope: "REGULAR",
      });
  const priorRecords = latestCohort(nflTeamPerformanceEvidenceRecords, {
    season: targetSeason - 1,
    throughWeek: null,
    phaseScope: "ALL",
  });
  const currentAdvanced = targetWeek === 1
    ? []
    : latestCohort(nflAdvancedMatchupEvidenceRecords, {
        season: targetSeason,
        throughWeek,
        phaseScope: "REGULAR",
      });
  const priorAdvanced = latestCohort(nflAdvancedMatchupEvidenceRecords, {
    season: targetSeason - 1,
    throughWeek: null,
    phaseScope: "ALL",
  });

  if (!priorRecords.length) throw new Error(`C3_SHADOW_PRIOR_EVIDENCE_UNAVAILABLE:${targetSeason - 1}`);

  const currentOpponent = buildNFLOpponentAdjustment(currentRecords);
  const priorOpponent = buildNFLOpponentAdjustment(priorRecords);
  const home = performanceProfile(homeTeam, { currentRecords, priorRecords, currentOpponent, priorOpponent });
  const away = performanceProfile(awayTeam, { currentRecords, priorRecords, currentOpponent, priorOpponent });

  const teamEpaComposite = average([
    delta(home.netEpa, away.netEpa),
    delta(home.passEpaBalance, away.passEpaBalance),
    delta(home.rushEpaBalance, away.rushEpaBalance),
  ]);
  const teamSuccessRate = delta(home.successRateBalance, away.successRateBalance);
  const teamExplosiveness = delta(
    advancedBalance(latestAdvanced(homeTeam, currentAdvanced, priorAdvanced)),
    advancedBalance(latestAdvanced(awayTeam, currentAdvanced, priorAdvanced)),
  );
  const teamOpponentAdjusted = delta(home.opponentAdjustedIndex, away.opponentAdjustedIndex);

  const featureInput = {
    teamEpaComposite,
    teamSuccessRate,
    teamExplosiveness,
    teamOpponentAdjusted,
  };
  const missing = Object.entries(featureInput)
    .filter(([, value]) => !finite(value))
    .map(([key]) => key);
  if (missing.length) throw new Error(`INSUFFICIENT_C3_SHADOW_LIVE_FEATURES:${missing.join(",")}`);

  return Object.freeze({
    contract: NFL_FIE_V2_C3_LIVE_FEATURE_ADAPTER_CONTRACT,
    version: NFL_FIE_V2_C3_LIVE_FEATURE_ADAPTER_VERSION,
    featureInput: Object.freeze(featureInput),
    provenance: Object.freeze({
      targetSeason,
      targetWeek,
      snapshotThroughWeek: throughWeek,
      currentPhaseScope: "REGULAR",
      priorPhaseScope: "ALL",
      priorSeason: targetSeason - 1,
      currentPerformanceTeams: currentRecords.length,
      priorPerformanceTeams: priorRecords.length,
      currentAdvancedTeams: currentAdvanced.length,
      priorAdvancedTeams: priorAdvanced.length,
      leakagePolicy: "current-season evidence must be from a week strictly before target week; Week 1 uses prior-season evidence only",
    }),
  });
}

export default {
  NFL_FIE_V2_C3_LIVE_FEATURE_ADAPTER_CONTRACT,
  NFL_FIE_V2_C3_LIVE_FEATURE_ADAPTER_VERSION,
  buildNFLFIEV2C3LiveFeatureInput,
};
