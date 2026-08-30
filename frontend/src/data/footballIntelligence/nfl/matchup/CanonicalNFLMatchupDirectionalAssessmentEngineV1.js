/**
 * Canonical NFL Matchup Directional Assessment Engine V1
 * Sprint 2.19-RC6
 *
 * Implements the governed RC5 policy over an already-composed canonical
 * Matchup Intelligence runtime result.
 *
 * IMPORTANT:
 * - Does not recompute Team Strength.
 * - Does not recompute opponent adjustment.
 * - Does not recompute dependency intelligence.
 * - Does not recompute availability impact.
 * - Does not mutate Decision Model probability or winner.
 */

export const CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1 =
  "FIE-NFL-MATCHUP-DIRECTIONAL-ASSESSMENT-ENGINE-V1-1.0.0";

export const MATCHUP_DIRECTIONAL_ASSESSMENT_POLICY_V1 = Object.freeze({
  completenessMinimum: 0.80,
  confidenceMinimum: 0.60,
  homeEdgeMinimum: 0.15,
  awayEdgeMaximum: -0.15,
  contributionCaps: Object.freeze({
    TEAM_STRENGTH_CONTEXT: 0.30,
    OFFENSE_VS_DEFENSE: 0.20,
    DEFENSE_VS_OFFENSE: 0.20,
    OPPONENT_ADJUSTED_PERFORMANCE: 0.15,
    QB_AND_DEPENDENCY_CONTEXT: 0.10,
    PLAYER_AVAILABILITY_IMPACT: 0.05,
  }),
});

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function contributionFromDimension(dimension, cap) {
  if (!dimension || dimension.state === "UNAVAILABLE") {
    return {
      rawDirectionalSignal: 0,
      boundedContribution: 0,
      available: false,
      reason: "DIMENSION_UNAVAILABLE",
    };
  }

  const raw =
    dimension.directionalSignal ??
    dimension.signal ??
    dimension.edge ??
    0;

  const rawDirectionalSignal = clamp(raw, -1, 1);
  const boundedContribution = clamp(rawDirectionalSignal * cap, -cap, cap);

  return {
    rawDirectionalSignal,
    boundedContribution,
    available: true,
    reason: null,
  };
}

function buildDuplicateSuppression(input = {}) {
  const embedded = input.embeddedSignals ?? {};
  const suppressed = [];

  if (embedded.teamStrengthIncludesOpponentAdjustment === true) {
    suppressed.push({
      dimension: "OPPONENT_ADJUSTED_PERFORMANCE",
      reason: "ALREADY_EMBEDDED_IN_TEAM_STRENGTH",
    });
  }

  if (embedded.teamStrengthIncludesQBDependency === true) {
    suppressed.push({
      dimension: "QB_AND_DEPENDENCY_CONTEXT",
      reason: "ALREADY_EMBEDDED_IN_TEAM_STRENGTH",
    });
  }

  if (embedded.teamStrengthIncludesAvailabilityImpact === true) {
    suppressed.push({
      dimension: "PLAYER_AVAILABILITY_IMPACT",
      reason: "ALREADY_EMBEDDED_IN_TEAM_STRENGTH",
    });
  }

  return suppressed;
}

function isSuppressed(id, duplicateSuppression) {
  return duplicateSuppression.some(x => x.dimension === id);
}

function validProvenance(provenance) {
  return Array.isArray(provenance) && provenance.length > 0;
}

export function assessCanonicalNFLMatchupDirectionV1(runtimeResult = {}) {
  const policy = MATCHUP_DIRECTIONAL_ASSESSMENT_POLICY_V1;

  const matchupId = runtimeResult.matchupId ?? null;
  const evidenceCompleteness = clamp01(runtimeResult.evidenceCompleteness ?? 0);
  const runtimeConfidence = clamp01(runtimeResult.confidence ?? 0);
  const provenance = Array.isArray(runtimeResult.provenance)
    ? structuredClone(runtimeResult.provenance)
    : [];

  const fallbackReasons = Array.isArray(runtimeResult.fallbackReasons)
    ? [...runtimeResult.fallbackReasons]
    : [];

  const duplicateSuppression = buildDuplicateSuppression(runtimeResult);

  if (
    runtimeResult.status === "INSUFFICIENT_EVIDENCE" ||
    !runtimeResult.identity?.homeTeam ||
    !runtimeResult.identity?.awayTeam ||
    runtimeResult.identity.homeTeam === runtimeResult.identity.awayTeam
  ) {
    return {
      contractVersion: CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1,
      owner: "CANONICAL_FIE",
      matchupId,
      assessment: "INSUFFICIENT_EVIDENCE",
      normalizedScore: 0,
      dimensionContributions: [],
      confidence: 0,
      evidenceCompleteness,
      provenance,
      fallbackReasons: [...fallbackReasons, "INVALID_OR_INCOMPLETE_MATCHUP_IDENTITY"],
      duplicateSuppression,
      decisionSupportProjection: {
        mode: "ADDITIVE_ONLY",
        probabilityDelta: 0,
        probabilityDeltaApplied: false,
        winnerMutationApplied: false,
      },
    };
  }

  if (!validProvenance(provenance)) {
    return {
      contractVersion: CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1,
      owner: "CANONICAL_FIE",
      matchupId,
      assessment: "NEUTRAL",
      normalizedScore: 0,
      dimensionContributions: [],
      confidence: 0,
      evidenceCompleteness,
      provenance: [],
      fallbackReasons: [...fallbackReasons, "INVALID_OR_MISSING_PROVENANCE"],
      duplicateSuppression,
      decisionSupportProjection: {
        mode: "ADDITIVE_ONLY",
        probabilityDelta: 0,
        probabilityDeltaApplied: false,
        winnerMutationApplied: false,
      },
    };
  }

  if (evidenceCompleteness < policy.completenessMinimum) {
    return {
      contractVersion: CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1,
      owner: "CANONICAL_FIE",
      matchupId,
      assessment: "INSUFFICIENT_EVIDENCE",
      normalizedScore: 0,
      dimensionContributions: [],
      confidence: 0,
      evidenceCompleteness,
      provenance,
      fallbackReasons: [...fallbackReasons, "BELOW_MINIMUM_EVIDENCE_COMPLETENESS"],
      duplicateSuppression,
      decisionSupportProjection: {
        mode: "ADDITIVE_ONLY",
        probabilityDelta: 0,
        probabilityDeltaApplied: false,
        winnerMutationApplied: false,
      },
    };
  }

  if (runtimeConfidence < policy.confidenceMinimum) {
    return {
      contractVersion: CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1,
      owner: "CANONICAL_FIE",
      matchupId,
      assessment: "NEUTRAL",
      normalizedScore: 0,
      dimensionContributions: [],
      confidence: runtimeConfidence,
      evidenceCompleteness,
      provenance,
      fallbackReasons: [...fallbackReasons, "BELOW_MINIMUM_RUNTIME_CONFIDENCE"],
      duplicateSuppression,
      decisionSupportProjection: {
        mode: "ADDITIVE_ONLY",
        probabilityDelta: 0,
        probabilityDeltaApplied: false,
        winnerMutationApplied: false,
      },
    };
  }

  const dimensions = Array.isArray(runtimeResult.dimensions)
    ? runtimeResult.dimensions
    : [];

  const dimensionContributions = Object.entries(policy.contributionCaps).map(
    ([id, cap]) => {
      const dimension = dimensions.find(x => x?.id === id) ?? null;
      const base = contributionFromDimension(dimension, cap);

      if (isSuppressed(id, duplicateSuppression)) {
        return {
          dimension: id,
          cap,
          available: base.available,
          rawDirectionalSignal: base.rawDirectionalSignal,
          contribution: 0,
          suppressed: true,
          suppressionReason:
            duplicateSuppression.find(x => x.dimension === id)?.reason ?? "DUPLICATE_SIGNAL",
        };
      }

      return {
        dimension: id,
        cap,
        available: base.available,
        rawDirectionalSignal: base.rawDirectionalSignal,
        contribution: base.boundedContribution,
        suppressed: false,
        suppressionReason: null,
      };
    }
  );

  const teamContext = dimensionContributions.find(
    x => x.dimension === "TEAM_STRENGTH_CONTEXT"
  );

  if (!teamContext?.available) {
    return {
      contractVersion: CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1,
      owner: "CANONICAL_FIE",
      matchupId,
      assessment: "INSUFFICIENT_EVIDENCE",
      normalizedScore: 0,
      dimensionContributions,
      confidence: 0,
      evidenceCompleteness,
      provenance,
      fallbackReasons: [...fallbackReasons, "MISSING_REQUIRED_TEAM_STRENGTH_CONTEXT"],
      duplicateSuppression,
      decisionSupportProjection: {
        mode: "ADDITIVE_ONLY",
        probabilityDelta: 0,
        probabilityDeltaApplied: false,
        winnerMutationApplied: false,
      },
    };
  }

  const normalizedScore = clamp(
    dimensionContributions.reduce((sum, x) => sum + x.contribution, 0),
    -1,
    1
  );

  let assessment = "NEUTRAL";
  if (normalizedScore >= policy.homeEdgeMinimum) assessment = "HOME_EDGE";
  else if (normalizedScore <= policy.awayEdgeMaximum) assessment = "AWAY_EDGE";

  const availableDimensionCount = dimensionContributions.filter(
    x => x.available && !x.suppressed
  ).length;

  const dimensionAvailabilityRatio = availableDimensionCount / 6;
  const finalConfidence = Math.min(
    runtimeConfidence,
    evidenceCompleteness,
    clamp01(dimensionAvailabilityRatio)
  );

  return {
    contractVersion: CANONICAL_NFL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_V1,
    owner: "CANONICAL_FIE",
    matchupId,
    assessment,
    normalizedScore,
    dimensionContributions,
    confidence: finalConfidence,
    evidenceCompleteness,
    provenance,
    fallbackReasons,
    duplicateSuppression,
    decisionSupportProjection: {
      mode: "ADDITIVE_ONLY",
      probabilityDelta: 0,
      probabilityDeltaApplied: false,
      winnerMutationApplied: false,
    },
  };
}
