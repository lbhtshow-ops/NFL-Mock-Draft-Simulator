export const NFL_PROTECTION_PRESSURE_EVIDENCE_CONTRACT =
  "NFLProtectionPressureEvidence";

export const NFL_PROTECTION_PRESSURE_EVIDENCE_VERSION =
  "GI-V2-PP-EVIDENCE-1.0.0-RC1";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function nonNegativeInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function boundedRate(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

function text(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

export function createNFLProtectionPressureEvidence(input = {}) {
  const source =
    input && typeof input === "object"
      ? input
      : {};

  const result = Object.freeze({
    contract:
      NFL_PROTECTION_PRESSURE_EVIDENCE_CONTRACT,

    version:
      NFL_PROTECTION_PRESSURE_EVIDENCE_VERSION,

    team:
      text(source.team)?.toUpperCase() || null,

    season:
      Number.isInteger(Number(source.season))
        ? Number(source.season)
        : null,

    throughWeek:
      Number.isInteger(Number(source.throughWeek))
        ? Number(source.throughWeek)
        : null,

    phaseScope:
      text(source.phaseScope),

    sample: Object.freeze({
      offensiveDropbacks:
        nonNegativeInteger(
          source.sample?.offensiveDropbacks
        ),

      defensiveDropbacks:
        nonNegativeInteger(
          source.sample?.defensiveDropbacks
        ),
    }),

    offense: Object.freeze({
      pressureAllowedRate:
        boundedRate(
          source.offense?.pressureAllowedRate
        ),

      sackAllowedRate:
        boundedRate(
          source.offense?.sackAllowedRate
        ),
    }),

    defense: Object.freeze({
      pressureGeneratedRate:
        boundedRate(
          source.defense?.pressureGeneratedRate
        ),

      sackGeneratedRate:
        boundedRate(
          source.defense?.sackGeneratedRate
        ),
    }),

    provenance: Object.freeze({
      source:
        text(source.provenance?.source),

      provider:
        text(source.provenance?.provider),

      dataset:
        text(source.provenance?.dataset),

      sourceVersion:
        text(source.provenance?.sourceVersion),

      generatedAt:
        text(source.provenance?.generatedAt),
    }),
  });

  return result;
}

export function assessNFLProtectionPressureEvidence(value) {
  const evidence =
    createNFLProtectionPressureEvidence(value);

  const offenseObserved =
    evidence.sample.offensiveDropbacks !== null &&
    evidence.sample.offensiveDropbacks > 0 &&
    finite(evidence.offense.pressureAllowedRate) &&
    finite(evidence.offense.sackAllowedRate);

  const defenseObserved =
    evidence.sample.defensiveDropbacks !== null &&
    evidence.sample.defensiveDropbacks > 0 &&
    finite(evidence.defense.pressureGeneratedRate) &&
    finite(evidence.defense.sackGeneratedRate);

  const complete =
    offenseObserved && defenseObserved;

  return Object.freeze({
    validIdentity:
      Boolean(
        evidence.team &&
        Number.isInteger(evidence.season) &&
        Number.isInteger(evidence.throughWeek)
      ),

    offenseObserved,
    defenseObserved,
    complete,

    scoreAuthorityGranted: false,
    evidenceQualityAuthorityGranted: false,
    productionAuthorityGranted: false,

    evidence,
  });
}

export default {
  NFL_PROTECTION_PRESSURE_EVIDENCE_CONTRACT,
  NFL_PROTECTION_PRESSURE_EVIDENCE_VERSION,
  createNFLProtectionPressureEvidence,
  assessNFLProtectionPressureEvidence,
};
