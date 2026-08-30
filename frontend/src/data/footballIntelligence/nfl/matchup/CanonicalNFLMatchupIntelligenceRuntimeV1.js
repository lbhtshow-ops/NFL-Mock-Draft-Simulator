/**
 * Canonical NFL Matchup Intelligence Runtime V1
 * Sprint 2.19-RC4
 *
 * Non-scoring composition boundary. This runtime composes canonical results that
 * are supplied by their owning FIE services. It does not recalculate Team Strength,
 * opponent adjustment, dependency, availability, or Decision Model probabilities.
 */

export const CANONICAL_NFL_MATCHUP_INTELLIGENCE_RUNTIME_V1 =
  "FIE-NFL-MATCHUP-INTELLIGENCE-RUNTIME-V1-1.0.0";

const DIMENSIONS = Object.freeze([
  "TEAM_STRENGTH_CONTEXT",
  "OFFENSE_VS_DEFENSE",
  "DEFENSE_VS_OFFENSE",
  "OPPONENT_ADJUSTED_PERFORMANCE",
  "QB_AND_DEPENDENCY_CONTEXT",
  "PLAYER_AVAILABILITY_IMPACT",
]);

function bounded01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function validTeam(team) {
  return typeof team === "string" && team.trim().length >= 2;
}

function stableMatchupId(input) {
  if (typeof input?.matchupId === "string" && input.matchupId.trim()) {
    return input.matchupId.trim();
  }
  const season = input?.season ?? "UNKNOWN_SEASON";
  const week = input?.week ?? "UNKNOWN_WEEK";
  const away = input?.awayTeam ?? "AWAY";
  const home = input?.homeTeam ?? "HOME";
  return `${season}-W${week}-${away}-${home}`;
}

function inspectEvidence(input) {
  const canonical = {
    teamContext: input?.teamContext ?? null,
    performanceEvidence: input?.performanceEvidence ?? null,
    opponentAdjustment: input?.opponentAdjustment ?? null,
    dependencyContext: input?.dependencyContext ?? null,
    availabilityImpact: input?.availabilityImpact ?? null,
  };

  const missing = Object.entries(canonical)
    .filter(([, value]) => value == null)
    .map(([key]) => key);

  return { canonical, missing, completeness: (5 - missing.length) / 5 };
}

function validProvenance(provenance) {
  return Array.isArray(provenance) && provenance.length > 0;
}

function dimensionState(id, sourceKey, canonical, missing) {
  return {
    id,
    state: missing.includes(sourceKey) ? "UNAVAILABLE" : "AVAILABLE",
    canonicalSource: sourceKey,
    evidence: clone(canonical[sourceKey]),
    scored: false,
    probabilityDelta: 0,
  };
}

export function composeCanonicalNFLMatchupIntelligenceV1(input = {}) {
  const original = clone(input);

  const matchupId = stableMatchupId(input);
  const homeTeam = input?.homeTeam ?? null;
  const awayTeam = input?.awayTeam ?? null;
  const { canonical, missing, completeness } = inspectEvidence(input);
  const provenanceOk = validProvenance(input?.provenance);

  const identityValid =
    validTeam(homeTeam) &&
    validTeam(awayTeam) &&
    homeTeam !== awayTeam &&
    input?.season != null &&
    input?.week != null;

  let status = "READY";
  const fallbackReasons = [];

  if (!identityValid) {
    status = "INSUFFICIENT_EVIDENCE";
    fallbackReasons.push("INVALID_OR_INCOMPLETE_MATCHUP_IDENTITY");
  }
  if (!canonical.teamContext) {
    status = "INSUFFICIENT_EVIDENCE";
    fallbackReasons.push("MISSING_TEAM_CONTEXT");
  }
  if (!provenanceOk) {
    status = "NEUTRAL";
    fallbackReasons.push("INVALID_OR_MISSING_PROVENANCE");
  }

  for (const key of missing) {
    if (key !== "teamContext") fallbackReasons.push(`MISSING_${key.toUpperCase()}`);
  }

  const evidenceCompleteness = bounded01(completeness);
  const requestedConfidence = bounded01(input?.confidence ?? evidenceCompleteness);
  let confidence = Math.min(requestedConfidence, evidenceCompleteness);

  if (!provenanceOk || !identityValid || !canonical.teamContext) confidence = 0;

  const dimensions = [
    dimensionState("TEAM_STRENGTH_CONTEXT", "teamContext", canonical, missing),
    dimensionState("OFFENSE_VS_DEFENSE", "performanceEvidence", canonical, missing),
    dimensionState("DEFENSE_VS_OFFENSE", "performanceEvidence", canonical, missing),
    dimensionState("OPPONENT_ADJUSTED_PERFORMANCE", "opponentAdjustment", canonical, missing),
    dimensionState("QB_AND_DEPENDENCY_CONTEXT", "dependencyContext", canonical, missing),
    dimensionState("PLAYER_AVAILABILITY_IMPACT", "availabilityImpact", canonical, missing),
  ];

  const result = {
    contractVersion: CANONICAL_NFL_MATCHUP_INTELLIGENCE_RUNTIME_V1,
    owner: "CANONICAL_FIE",
    matchupId,
    identity: {
      season: input?.season ?? null,
      week: input?.week ?? null,
      gameId: input?.gameId ?? null,
      homeTeam,
      awayTeam,
    },
    status,
    directionalAssessment:
      status === "READY"
        ? (input?.directionalAssessment ?? "UNSCORED")
        : status === "NEUTRAL"
          ? "NEUTRAL"
          : "INSUFFICIENT_EVIDENCE",
    dimensions,
    confidence,
    evidenceCompleteness,
    provenance: provenanceOk ? clone(input.provenance) : [],
    fallbackReasons,
    decisionSupportProjection: {
      mode: "ADDITIVE_ONLY",
      scored: false,
      probabilityDelta: 0,
      probabilityDeltaApplied: false,
      winnerMutationApplied: false,
    },
    runtimePolicy: {
      canonicalInputsOnly: true,
      teamStrengthRecomputed: false,
      opponentAdjustmentRecomputed: false,
      dependencyRecomputed: false,
      availabilityRecomputed: false,
      applicationOwnedReasoning: false,
    },
  };

  // Explicit invariant: caller-owned input remains unchanged.
  if (JSON.stringify(input) !== JSON.stringify(original)) {
    throw new Error("CANONICAL_MATCHUP_RUNTIME_INPUT_MUTATION_DETECTED");
  }

  return result;
}

export function getCanonicalNFLMatchupRuntimeDimensionsV1() {
  return [...DIMENSIONS];
}
