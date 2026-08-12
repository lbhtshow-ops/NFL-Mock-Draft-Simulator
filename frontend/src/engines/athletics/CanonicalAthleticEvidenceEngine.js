import {
  DATA_STATES,
  EVIDENCE_LEVELS,
  createIntelligenceResult,
} from "../contracts/IntelligenceResultContract.js";
import {
  createAthleticInputProjection,
  isAthleticInputProjection,
} from "./AthleticInputProjection.js";

export const CANONICAL_ATHLETIC_EVIDENCE_MODEL = "CANONICAL_ATHLETIC_EVIDENCE_ENGINE";
export const CANONICAL_ATHLETIC_EVIDENCE_VERSION = "1.0.0";

const MEASUREMENT_FIELDS = Object.freeze(["height", "weight", "armLength", "handSize", "wingSpan"]);
const TESTING_FIELDS = Object.freeze([
  "fortyYardDash", "tenYardSplit", "twentyYardSplit", "verticalJump", "broadJump",
  "threeCone", "shortShuttle", "benchPress", "gpsMetrics", "accelerationMetrics",
  "velocityMetrics", "gameSpeedMetrics",
]);
const FUTURE_TESTING_FIELDS = Object.freeze(["gpsMetrics", "accelerationMetrics", "velocityMetrics", "gameSpeedMetrics"]);
const GOVERNANCE = Object.freeze({
  owner: "CANONICAL_ENGINE",
  origin: "GOVERNED_CALLER_INPUT",
  derivationStatus: "DERIVED",
  governanceStatus: "CANONICAL",
  calibrationStatus: "NOT_APPLICABLE",
  reproducibilityStatus: "REPRODUCIBLE",
  canonicalDerivation: true,
  permittedUse: "EVIDENCE_REPORTING",
});

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function clone(value) { if (Array.isArray(value)) return value.map(clone); if (!isObject(value)) return value; return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, clone(item)])); }
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.values(value).forEach(deepFreeze); return Object.freeze(value); }
function supplied(value) { return value !== null && value !== undefined; }

function governedInput(value) {
  if (!isAthleticInputProjection(value)) return null;
  const reconstructed = createAthleticInputProjection({
    identity: value.identity,
    measurements: value.measurements,
    testing: value.testing,
    testingAvailability: value.testingAvailability,
    testingContext: value.testingContext,
    measurementMetadata: value.measurementMetadata,
    testingMetadata: value.testingMetadata,
    evidenceMetadata: value.evidenceMetadata,
    limitations: value.limitations,
    unknownFields: value.unknownFields,
  });
  return reconstructed.validation.valid ? reconstructed : null;
}

function metadataValue(metadata, field, key) {
  if (!isObject(metadata)) return null;
  if (isObject(metadata.fields?.[field]) && supplied(metadata.fields[field][key])) return clone(metadata.fields[field][key]);
  if (isObject(metadata[key]) && supplied(metadata[key][field])) return clone(metadata[key][field]);
  return supplied(metadata[key]) && !isObject(metadata[key]) ? clone(metadata[key]) : null;
}

function inventory(section, fields, metadata, dateKey) {
  return fields.map((field) => ({
    field,
    supplied: supplied(section[field]),
    value: clone(section[field]),
    unit: metadataValue(metadata, field, "units"),
    sourceReference: metadataValue(metadata, field, "sourceReference") ?? metadataValue(metadata, field, "source"),
    verificationStatus: metadataValue(metadata, field, "verification"),
    date: metadataValue(metadata, field, dateKey),
    unresolvedLimitations: supplied(section[field]) ? [] : [`${field} was not supplied.`],
  }));
}

function metadataInventory(input) {
  const sections = ["measurementMetadata", "testingMetadata", "evidenceMetadata", "testingContext"];
  const suppliedFields = [];
  const unresolvedFields = [];
  sections.forEach((section) => {
    const value = input[section];
    if (!isObject(value) || Object.keys(value).length === 0) unresolvedFields.push(section);
    else Object.keys(value).sort().forEach((field) => suppliedFields.push(`${section}.${field}`));
  });
  return { suppliedFields, unresolvedFields };
}

function declaredConflicts(input) {
  const values = [input.measurementMetadata?.conflicts, input.testingMetadata?.conflicts, input.evidenceMetadata?.conflicts, input.testingContext?.conflicts];
  return values.flatMap((value) => Array.isArray(value) ? clone(value) : value == null ? [] : [clone(value)]);
}

function availability(input, measurementCount, testingCount) {
  const total = measurementCount + testingCount;
  if (total === MEASUREMENT_FIELDS.length + TESTING_FIELDS.length) return "AVAILABLE";
  if (total > 0) return "PARTIAL";
  return input.testingAvailability === "UNAVAILABLE" ? "UNAVAILABLE" : "UNKNOWN";
}

function limitations(input, inventories, conflicts, metadata) {
  const result = [...input.limitations];
  const measurementMissing = inventories.measurements.filter((item) => !item.supplied).map((item) => item.field);
  const testingMissing = inventories.testing.filter((item) => !item.supplied).map((item) => item.field);
  if (measurementMissing.length) result.push(`Incomplete measurement set; unresolved fields: ${measurementMissing.join(", ")}.`);
  if (testingMissing.length) result.push(`Incomplete testing set; unresolved fields: ${testingMissing.join(", ")}.`);
  if (!supplied(input.testingContext?.venue) && !supplied(input.testingContext?.testingVenue)) result.push("Testing venue is unknown.");
  if (!supplied(input.testingMetadata?.timing) && !supplied(input.testingContext?.timing)) result.push("Timing method is unknown.");
  if (!supplied(input.evidenceMetadata?.source) && !supplied(input.testingMetadata?.source) && !supplied(input.measurementMetadata?.source)) result.push("Evidence source is unknown.");
  if (!supplied(input.evidenceMetadata?.verification) && !supplied(input.testingMetadata?.verification) && !supplied(input.measurementMetadata?.verification)) result.push("Evidence verification is unknown.");
  if (!supplied(input.measurementMetadata?.units) && !supplied(input.testingMetadata?.units)) result.push("Measurement and testing units are unresolved.");
  if (conflicts.length) result.push("Caller-declared evidence conflicts remain unresolved; no source was selected as authoritative.");
  if (metadata.unresolvedFields.includes("testingContext")) result.push("Testing context is incomplete.");
  const absentFuture = FUTURE_TESTING_FIELDS.filter((field) => !supplied(input.testing[field]));
  if (absentFuture.length) result.push(`Future metric placeholders not populated: ${absentFuture.join(", ")}.`);
  result.push("Canonical Athletic scoring is not implemented.");
  result.push("Canonical Athletic confidence has not been established.");
  return [...new Set(result)];
}

export function getCanonicalAthleticEvidenceResult(athleticInput) {
  const input = governedInput(athleticInput);
  if (!input) {
    throw new TypeError("A validated AthleticInputProjection is required.");
  }
  const measurements = inventory(input.measurements, MEASUREMENT_FIELDS, input.measurementMetadata, "measurementDate");
  const testing = inventory(input.testing, TESTING_FIELDS, input.testingMetadata, "testingDate");
  const measurementSupplied = measurements.filter((item) => item.supplied).map((item) => item.field);
  const testingSupplied = testing.filter((item) => item.supplied).map((item) => item.field);
  const measurementUnresolved = measurements.filter((item) => !item.supplied).map((item) => item.field);
  const testingUnresolved = testing.filter((item) => !item.supplied).map((item) => item.field);
  const metadata = metadataInventory(input);
  const conflicts = declaredConflicts(input);
  const evidenceAvailability = availability(input, measurementSupplied.length, testingSupplied.length);
  const derivedLimitations = limitations(input, { measurements, testing }, conflicts, metadata);
  const available = measurementSupplied.length + testingSupplied.length > 0;
  const dataState = available ? DATA_STATES.AVAILABLE : evidenceAvailability === "UNAVAILABLE" ? DATA_STATES.UNAVAILABLE : DATA_STATES.UNKNOWN;
  const payload = {
    model: CANONICAL_ATHLETIC_EVIDENCE_MODEL,
    modelVersion: CANONICAL_ATHLETIC_EVIDENCE_VERSION,
    outputType: "FACTUAL_ATHLETIC_EVIDENCE_REPORT",
    governance: GOVERNANCE,
    identity: clone(input.identity),
    availability: { status: evidenceAvailability, declaredTestingAvailability: input.testingAvailability, inferredQuality: false },
    measurements,
    testing,
    testingContext: clone(input.testingContext),
    suppliedFields: { measurements: measurementSupplied, testing: testingSupplied, metadata: metadata.suppliedFields },
    unresolvedFields: { measurements: measurementUnresolved, testing: testingUnresolved, metadata: metadata.unresolvedFields, unknownFields: Object.keys(input.unknownFields).sort() },
    completeness: {
      suppliedMeasurementCount: measurementSupplied.length,
      unresolvedMeasurementCount: measurementUnresolved.length,
      suppliedTestingCount: testingSupplied.length,
      unresolvedTestingCount: testingUnresolved.length,
      suppliedMetadataFields: metadata.suppliedFields,
      unresolvedMetadataFields: metadata.unresolvedFields,
      coveragePercentage: null,
    },
    conflicts,
    limitations: derivedLimitations,
    confidenceAssessment: { confidenceKnown: false, confidenceMethod: null, reason: "No governed Athletic evidence-confidence method has been approved." },
    scoringStatus: { canonicalScoreAvailable: false, canonicalScore: null, legacyModeledOutputsConsumed: false },
  };

  return deepFreeze(createIntelligenceResult({
    domain: "athletic",
    available,
    dataState,
    score: null,
    value: payload,
    confidence: 0,
    evidenceLevel: EVIDENCE_LEVELS.NONE,
    playerId: input.identity.playerId,
    summary: `Athletic evidence availability is ${evidenceAvailability}; ${measurementSupplied.length} measurement field(s) and ${testingSupplied.length} testing field(s) were supplied. No Athletic quality conclusion was produced.`,
    explanation: {
      positiveFactors: [],
      limitingFactors: derivedLimitations,
      contextualFactors: ["Confidence is unknown; numeric zero only satisfies the shared result contract.", "No canonical Athletic score was calculated."],
    },
    evidence: [...measurements.filter((item) => item.supplied), ...testing.filter((item) => item.supplied)],
    missingEvidence: [...measurementUnresolved.map((field) => `measurements.${field}`), ...testingUnresolved.map((field) => `testing.${field}`)],
    sources: [],
    rawData: { model: CANONICAL_ATHLETIC_EVIDENCE_MODEL, validation: clone(input.validation), governedInputConsumed: true },
    frameworkVersion: "1.0.0",
    modelVersion: CANONICAL_ATHLETIC_EVIDENCE_VERSION,
  }));
}

export default { getCanonicalAthleticEvidenceResult };
