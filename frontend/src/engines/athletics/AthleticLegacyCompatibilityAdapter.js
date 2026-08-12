import { createAthleticInputProjection } from "./AthleticInputProjection.js";
import { createAthleticModeledOutputDeclaration } from "./AthleticModeledOutputDeclaration.js";

const TESTING_FIELDS = Object.freeze([
  "fortyYardDash", "tenYardSplit", "twentyYardSplit", "verticalJump", "broadJump",
  "threeCone", "shortShuttle", "benchPress", "gpsMetrics", "accelerationMetrics",
  "velocityMetrics", "gameSpeedMetrics",
]);

function hasTesting(profile) {
  return TESTING_FIELDS.some((field) => profile?.testing?.[field] != null);
}

function identity(profile, callerIdentity = {}) {
  return {
    playerId: profile?.playerId || callerIdentity.playerId || "UNKNOWN",
    playerName: profile?.playerName || callerIdentity.playerName || "Unknown Player",
    position: profile?.position || callerIdentity.position || "UNKNOWN",
  };
}

export function adaptLegacyAthleticProfile(profile = {}, callerIdentity = {}) {
  const projection = createAthleticInputProjection({
    identity: identity(profile, callerIdentity),
    measurements: {
      height: profile?.measurements?.height ?? null,
      weight: profile?.measurements?.weight ?? null,
      armLength: profile?.measurements?.armLength ?? null,
      handSize: profile?.measurements?.handSize ?? null,
      wingSpan: profile?.measurements?.wingspan ?? null,
    },
    testing: Object.fromEntries(TESTING_FIELDS.map((field) => [field, profile?.testing?.[field] ?? null])),
    testingAvailability: hasTesting(profile) ? "PARTIAL" : "UNAVAILABLE",
    testingContext: null,
    measurementMetadata: null,
    testingMetadata: null,
    evidenceMetadata: profile?.source || profile?.lastUpdated
      ? { source: profile?.source || null, lastUpdated: profile?.lastUpdated || null, verification: "UNKNOWN" }
      : null,
    limitations: [],
    unknownFields: {},
  });

  const declaration = createAthleticModeledOutputDeclaration({
    overallScore: profile?.scores?.overallAthleticScore ?? null,
    componentScores: {
      speed: profile?.scores?.speed ?? null,
      explosiveness: profile?.scores?.explosiveness ?? null,
      agility: profile?.scores?.agility ?? null,
      strength: profile?.scores?.strength ?? null,
      sizeAdjustedAthleticism: profile?.scores?.sizeAdjustedAthleticism ?? null,
    },
    storedConfidence: profile?.confidence ?? null,
    strengths: profile?.strengths,
    limitations: profile?.limitations,
    summary: profile?.notes ?? null,
    sourceLabel: profile?.source ?? null,
    lastUpdated: profile?.lastUpdated ?? null,
  });

  if (!projection.validation.valid || !declaration.validation.valid) {
    throw new TypeError("Legacy Athletic profile could not be adapted to governed compatibility contracts.");
  }

  return Object.freeze({ projection, declaration });
}

export default { adaptLegacyAthleticProfile };
