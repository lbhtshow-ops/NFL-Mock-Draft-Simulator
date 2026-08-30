import {
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CONTRACT,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_VERSION,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_MODE,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CANDIDATE,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP,
} from "./NFLProtectionPressureMatchupShadowContract.js";

const BASE_WEIGHTS = Object.freeze({
  overallStrength: 0.30,
  passMatchup: 0.14,
  rushMatchup: 0.08,
  protectionPressure: 0.10,
  explosivePlay: 0.08,
  redZone: 0.06,
  recentForm: 0.07,
  specialTeams: 0.04,
  quarterback: 0.06,
  availability: 0.03,
  weatherStyle: 0.01,
  homeField: 0.02,
  rest: 0.01,
});

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function weightedAverage(parts) {
  const valid = parts.filter(
    (part) =>
      finite(part?.value) &&
      finite(part?.weight) &&
      part.weight > 0
  );

  if (!valid.length) return null;

  const totalWeight = valid.reduce(
    (sum, part) => sum + part.weight,
    0
  );

  return valid.reduce(
    (sum, part) =>
      sum + part.value * part.weight,
    0
  ) / totalWeight;
}

function evidenceComplete(evidence) {
  return Boolean(
    evidence &&
      finite(evidence?.offense?.sackAllowedRate) &&
      finite(evidence?.defense?.sackGeneratedRate)
  );
}

export function buildNFLProtectionPressureSackOnlyRaw({
  homeEvidence,
  awayEvidence,
} = {}) {
  if (
    !evidenceComplete(homeEvidence) ||
    !evidenceComplete(awayEvidence)
  ) {
    return null;
  }

  const homeProtection =
    (1 - homeEvidence.offense.sackAllowedRate) -
    awayEvidence.defense.sackGeneratedRate;

  const awayProtection =
    (1 - awayEvidence.offense.sackAllowedRate) -
    homeEvidence.defense.sackGeneratedRate;

  return homeProtection - awayProtection;
}

export function normalizeNFLProtectionPressureShadowDimension({
  rawValue,
  p95AbsScale,
  cap = NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP,
} = {}) {
  if (
    !finite(rawValue) ||
    !finite(p95AbsScale) ||
    p95AbsScale <= 0 ||
    !finite(cap) ||
    cap <= 0
  ) {
    return null;
  }

  return clamp(
    (rawValue / p95AbsScale) * cap,
    -50,
    50
  );
}

function buildShadowMatchupEdge({
  canonicalDimensions,
  canonicalContext,
  shadowProtectionPressure,
  advancedWeightMultiplier = 1,
} = {}) {
  const dimensions =
    canonicalDimensions &&
    typeof canonicalDimensions === "object"
      ? canonicalDimensions
      : {};

  const context =
    canonicalContext &&
    typeof canonicalContext === "object"
      ? canonicalContext
      : {};

  return weightedAverage([
    {
      key: "overallStrength",
      value: dimensions.overallStrength,
      weight: BASE_WEIGHTS.overallStrength,
    },
    {
      key: "passMatchup",
      value: dimensions.passMatchup,
      weight: BASE_WEIGHTS.passMatchup,
    },
    {
      key: "rushMatchup",
      value: dimensions.rushMatchup,
      weight: BASE_WEIGHTS.rushMatchup,
    },
    {
      key: "protectionPressure",
      value: shadowProtectionPressure,
      weight:
        BASE_WEIGHTS.protectionPressure *
        advancedWeightMultiplier,
    },
    {
      key: "explosivePlay",
      value: dimensions.explosivePlay,
      weight:
        BASE_WEIGHTS.explosivePlay *
        advancedWeightMultiplier,
    },
    {
      key: "redZone",
      value: dimensions.redZone,
      weight:
        BASE_WEIGHTS.redZone *
        advancedWeightMultiplier,
    },
    {
      key: "recentForm",
      value: dimensions.recentForm,
      weight: BASE_WEIGHTS.recentForm,
    },
    {
      key: "specialTeams",
      value: dimensions.specialTeams,
      weight: BASE_WEIGHTS.specialTeams,
    },
    {
      key: "quarterback",
      value: dimensions.quarterback,
      weight: BASE_WEIGHTS.quarterback,
    },
    {
      key: "availability",
      value: dimensions.availability,
      weight: BASE_WEIGHTS.availability,
    },
    {
      key: "weatherStyle",
      value: dimensions.weatherStyle,
      weight: BASE_WEIGHTS.weatherStyle,
    },
    {
      key: "homeField",
      value: context.homeField,
      weight: BASE_WEIGHTS.homeField,
    },
    {
      key: "rest",
      value: context.rest,
      weight: BASE_WEIGHTS.rest,
    },
  ]);
}

export function integrateNFLProtectionPressureMatchupShadow({
  canonicalMatchup = null,
  homeEvidence = null,
  awayEvidence = null,
  p95AbsScale = null,
  advancedWeightMultiplier = 1,
} = {}) {
  const canonicalDimensions =
    canonicalMatchup?.dimensions &&
    typeof canonicalMatchup.dimensions === "object"
      ? canonicalMatchup.dimensions
      : {};

  const canonicalContext =
    canonicalMatchup?.context &&
    typeof canonicalMatchup.context === "object"
      ? canonicalMatchup.context
      : {};

  const canonicalMatchupEdge =
    finite(canonicalMatchup?.matchupEdge)
      ? canonicalMatchup.matchupEdge
      : null;

  const rawValue =
    buildNFLProtectionPressureSackOnlyRaw({
      homeEvidence,
      awayEvidence,
    });

  const shadowProtectionPressure =
    normalizeNFLProtectionPressureShadowDimension({
      rawValue,
      p95AbsScale,
      cap:
        NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP,
    });

  const available =
    finite(shadowProtectionPressure);

  const shadowMatchupEdge =
    available
      ? buildShadowMatchupEdge({
          canonicalDimensions,
          canonicalContext,
          shadowProtectionPressure,
          advancedWeightMultiplier,
        })
      : null;

  return Object.freeze({
    contract:
      NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CONTRACT,

    version:
      NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_VERSION,

    mode:
      NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_MODE,

    state:
      available
        ? "AVAILABLE"
        : "UNAVAILABLE",

    governance: Object.freeze({
      candidate:
        NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CANDIDATE,

      cap:
        NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP,

      productionAuthorityGranted:
        false,

      canonicalMutationAuthorized:
        false,

      evidenceQualityMutationAuthorized:
        false,

      decisionApiMutationAuthorized:
        false,

      pickemMutationAuthorized:
        false,
    }),

    canonical: Object.freeze({
      protectionPressure:
        finite(
          canonicalDimensions.protectionPressure
        )
          ? canonicalDimensions.protectionPressure
          : null,

      matchupEdge:
        canonicalMatchupEdge,

      evidenceQuality:
        finite(
          canonicalMatchup?.evidenceQuality
        )
          ? canonicalMatchup.evidenceQuality
          : null,
    }),

    shadow: Object.freeze({
      rawCandidate:
        finite(rawValue)
          ? rawValue
          : null,

      p95AbsScale:
        finite(p95AbsScale)
          ? p95AbsScale
          : null,

      protectionPressure:
        available
          ? shadowProtectionPressure
          : null,

      matchupEdge:
        finite(shadowMatchupEdge)
          ? shadowMatchupEdge
          : null,

      matchupEdgeDelta:
        finite(shadowMatchupEdge) &&
        finite(canonicalMatchupEdge)
          ? shadowMatchupEdge -
            canonicalMatchupEdge
          : null,
    }),

    invariants: Object.freeze({
      canonicalDimensionsMutated:
        false,

      canonicalMatchupEdgeMutated:
        false,

      canonicalEvidenceQualityMutated:
        false,

      decisionApiMutated:
        false,

      pickemMutated:
        false,
    }),
  });
}

export default {
  buildNFLProtectionPressureSackOnlyRaw,
  normalizeNFLProtectionPressureShadowDimension,
  integrateNFLProtectionPressureMatchupShadow,
};
