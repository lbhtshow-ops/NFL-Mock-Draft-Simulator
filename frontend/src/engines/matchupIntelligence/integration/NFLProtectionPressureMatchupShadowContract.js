export const NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CONTRACT =
  "NFLProtectionPressureMatchupShadow";

export const NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_VERSION =
  "GI-V2-PP-SHADOW-1.0.0-RC1";

export const NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_MODE =
  "SHADOW_ONLY";

export const NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CANDIDATE =
  "sackOnly";

export const NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP =
  40;

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateNFLProtectionPressureMatchupShadowResult(value) {
  const errors = [];

  if (!value || typeof value !== "object") {
    return {
      valid: false,
      errors: ["RESULT_MUST_BE_OBJECT"],
    };
  }

  if (
    value.contract !==
    NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CONTRACT
  ) {
    errors.push("UNEXPECTED_CONTRACT");
  }

  if (
    value.version !==
    NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_VERSION
  ) {
    errors.push("UNEXPECTED_VERSION");
  }

  if (
    value.mode !==
    NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_MODE
  ) {
    errors.push("MODE_MUST_REMAIN_SHADOW_ONLY");
  }

  if (
    value.governance?.candidate !==
    NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CANDIDATE
  ) {
    errors.push("UNEXPECTED_CANDIDATE");
  }

  if (
    value.governance?.cap !==
    NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP
  ) {
    errors.push("UNEXPECTED_CAP");
  }

  if (
    value.governance?.productionAuthorityGranted !== false
  ) {
    errors.push("PRODUCTION_AUTHORITY_MUST_REMAIN_FALSE");
  }

  if (
    value.governance?.canonicalMutationAuthorized !== false
  ) {
    errors.push("CANONICAL_MUTATION_MUST_REMAIN_FALSE");
  }

  if (
    value.governance?.evidenceQualityMutationAuthorized !== false
  ) {
    errors.push("EVIDENCE_QUALITY_MUTATION_MUST_REMAIN_FALSE");
  }

  if (
    value.governance?.decisionApiMutationAuthorized !== false
  ) {
    errors.push("DECISION_API_MUTATION_MUST_REMAIN_FALSE");
  }

  if (
    value.governance?.pickemMutationAuthorized !== false
  ) {
    errors.push("PICKEM_MUTATION_MUST_REMAIN_FALSE");
  }

  if (
    value.state === "AVAILABLE" &&
    !finite(value.shadow?.protectionPressure)
  ) {
    errors.push("AVAILABLE_REQUIRES_FINITE_SHADOW_DIMENSION");
  }

  if (
    value.state === "AVAILABLE" &&
    !finite(value.shadow?.matchupEdge)
  ) {
    errors.push("AVAILABLE_REQUIRES_FINITE_SHADOW_MATCHUP_EDGE");
  }

  if (
    value.state === "UNAVAILABLE" &&
    value.shadow?.protectionPressure !== null
  ) {
    errors.push("UNAVAILABLE_REQUIRES_NULL_SHADOW_DIMENSION");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CONTRACT,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_VERSION,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_MODE,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CANDIDATE,
  NFL_PROTECTION_PRESSURE_MATCHUP_SHADOW_CAP,
  validateNFLProtectionPressureMatchupShadowResult,
};
