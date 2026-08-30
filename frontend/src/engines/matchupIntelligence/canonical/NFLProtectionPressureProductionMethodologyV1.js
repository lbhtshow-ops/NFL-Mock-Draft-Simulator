export const NFL_PROTECTION_PRESSURE_PRODUCTION_METHODOLOGY_CONTRACT =
  "NFLProtectionPressureProductionMethodology";

export const NFL_PROTECTION_PRESSURE_PRODUCTION_METHODOLOGY_VERSION =
  "GI-V2-PP-PRODUCTION-1.0.0-RC1";

export const NFL_PROTECTION_PRESSURE_PRODUCTION_CANDIDATE =
  "sackOnly";

export const NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE =
  0.09468239032851022;

export const NFL_PROTECTION_PRESSURE_PRODUCTION_CAP =
  40;

export const NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE =
  Object.freeze({
    productionAuthorityGranted: true,
    canonicalDimensionMutationAuthorized: true,
    weightMutationAuthorized: false,
    evidenceQualityMutationAuthorized: false,
    playerImpactMutationAuthorized: false,
    decisionApiSchemaMutationAuthorized: false,
    pickemMutationAuthorized: false,
  });

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildNFLProtectionPressureProductionComponents({
  homeEvidence,
  awayEvidence,
} = {}) {
  const homeSackAllowedRate =
    homeEvidence?.offense?.sackAllowedRate;

  const awaySackGeneratedRate =
    awayEvidence?.defense?.sackGeneratedRate;

  const awaySackAllowedRate =
    awayEvidence?.offense?.sackAllowedRate;

  const homeSackGeneratedRate =
    homeEvidence?.defense?.sackGeneratedRate;

  if (
    !finite(homeSackAllowedRate) ||
    !finite(awaySackGeneratedRate) ||
    !finite(awaySackAllowedRate) ||
    !finite(homeSackGeneratedRate)
  ) {
    return null;
  }

  const homeProtection =
    (1 - homeSackAllowedRate) -
    awaySackGeneratedRate;

  const awayProtection =
    (1 - awaySackAllowedRate) -
    homeSackGeneratedRate;

  const rawValue =
    homeProtection -
    awayProtection;

  return Object.freeze({
    homeProtection,
    awayProtection,
    rawValue,
  });
}

export function normalizeNFLProtectionPressureProductionDimension(
  rawValue
) {
  if (!finite(rawValue)) {
    return null;
  }

  return clamp(
    (
      rawValue /
      NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE
    ) *
      NFL_PROTECTION_PRESSURE_PRODUCTION_CAP,
    -50,
    50
  );
}

export function buildNFLProtectionPressureProductionDimension({
  homeEvidence,
  awayEvidence,
} = {}) {
  const components =
    buildNFLProtectionPressureProductionComponents({
      homeEvidence,
      awayEvidence,
    });

  if (!components) {
    return null;
  }

  return normalizeNFLProtectionPressureProductionDimension(
    components.rawValue
  );
}

export default {
  NFL_PROTECTION_PRESSURE_PRODUCTION_METHODOLOGY_CONTRACT,
  NFL_PROTECTION_PRESSURE_PRODUCTION_METHODOLOGY_VERSION,
  NFL_PROTECTION_PRESSURE_PRODUCTION_CANDIDATE,
  NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE,
  NFL_PROTECTION_PRESSURE_PRODUCTION_CAP,
  NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE,
  buildNFLProtectionPressureProductionComponents,
  normalizeNFLProtectionPressureProductionDimension,
  buildNFLProtectionPressureProductionDimension,
};
