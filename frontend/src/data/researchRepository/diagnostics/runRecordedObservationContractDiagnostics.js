import researchRepository, {
  RECORDED_OBSERVATION_CONTRACT_VERSION,
  RECORDED_OBSERVATION_ORIGINS,
  RECORDED_OBSERVATION_PRECISION_LEVELS,
  RECORDED_OBSERVATION_SCHEMA_VERSION,
  RECORDED_OBSERVATION_SPATIAL_TYPES,
  RECORDED_OBSERVATION_SUBJECT_ROLES,
  RECORDED_OBSERVATION_TEMPORAL_TYPES,
  RECORDED_OBSERVATION_TYPES,
  RECORDED_OBSERVATION_VERIFICATION_STATES,
  createRecordedObservation,
  createUnavailableRecordedObservation,
  isMeasurementObservation,
  isRecordedObservation,
  isStatementObservation,
  isVerifiedRecordedObservation,
  validateRecordedObservation,
} from "../index.js";

const SUITE = "RecordedObservationContractDiagnostics";

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function same(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message, { actual, expected });
}

function hasCode(validation, code, field = "errors") {
  return (validation?.[field] || []).some((entry) => entry.code === code);
}

function subject(ref = "subject-001", role = RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY) {
  return { subjectRef: ref, subjectType: "concept", role, label: ref, notes: null };
}

function baseInput(overrides = {}) {
  return {
    observationId: "observation-001",
    sessionRef: "session-001",
    sourceRefs: ["source-001"],
    observationType: RECORDED_OBSERVATION_TYPES.EVENT,
    origin: RECORDED_OBSERVATION_ORIGINS.DIRECT_OBSERVATION,
    title: "Recorded occurrence",
    description: "The documented event occurred.",
    subjects: [subject()],
    temporal: {
      type: RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT,
      occurredAt: "2026-01-02T10:00:00Z",
      precision: RECORDED_OBSERVATION_PRECISION_LEVELS.EXACT,
    },
    spatial: { type: RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE },
    verification: { state: RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED },
    provenance: { recordedBy: "researcher-001", recordedAt: "2026-01-02T10:05:00Z" },
    metadata: { tags: ["recorded"], externalRefs: [], relatedObservationRefs: [] },
    ...overrides,
  };
}

function verifiedEvent(overrides = {}) {
  return baseInput({
    verification: {
      state: RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED,
      verifiedBy: "reviewer-001",
      verifiedAt: "2026-01-03T09:00:00Z",
      method: "Record comparison",
      limitations: [],
    },
    ...overrides,
  });
}

function timeUnknown() {
  return { type: RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN };
}

function noLocation() {
  return { type: RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE };
}

function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      keys.add(key);
      keysDeep(entry, keys);
    });
  }
  return keys;
}

const CASES = [
  ["valid-verified-event", () => {
    const result = createRecordedObservation(verifiedEvent());
    assert(result.validation.valid && isVerifiedRecordedObservation(result), "Verified event failed.");
  }],
  ["valid-measurement", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { name: "length", value: 12.5, unit: "cm", precision: RECORDED_OBSERVATION_PRECISION_LEVELS.EXACT } }));
    assert(result.validation.valid && isMeasurementObservation(result) && result.measurement.value === 12.5, "Measurement failed.");
  }],
  ["valid-ranged-measurement", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { name: "temperature", minimum: 18, maximum: 22, unit: "C", precision: RECORDED_OBSERVATION_PRECISION_LEVELS.RANGE } }));
    assert(result.validation.valid, "Ranged measurement failed.");
  }],
  ["valid-direct-statement", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { speakerRef: "speaker-001", text: "The meeting began at noon.", isDirectQuote: true, language: "en" } }));
    assert(result.validation.valid && isStatementObservation(result), "Direct statement failed.");
  }],
  ["valid-translated-statement", () => {
    const original = "La reunión comenzó al mediodía.";
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { speakerLabel: "Witness", text: original, isDirectQuote: false, language: "es", translatedText: "The meeting began at noon." } }));
    assert(result.validation.valid && result.statement.text === original, "Translation replaced original text.");
  }],
  ["valid-documented-fact", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT, record: { field: "publicationDate", valueText: "2026-01-02", recordType: "document" } }));
    assert(result.validation.valid, "Documented fact failed.");
  }],
  ["valid-data-point-measurement", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.DATA_POINT, measurement: { name: "count", value: 4 } }));
    assert(result.validation.valid && result.observationType === RECORDED_OBSERVATION_TYPES.DATA_POINT, "Measurement data point failed.");
  }],
  ["valid-data-point-record", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.DATA_POINT, record: { field: "count", value: 4 } }));
    assert(result.validation.valid && result.observationType === RECORDED_OBSERVATION_TYPES.DATA_POINT, "Record data point failed.");
  }],
  ["valid-media-record", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEDIA_RECORD, media: { mediaType: "video", mediaRef: "media-001" }, spatial: { type: RECORDED_OBSERVATION_SPATIAL_TYPES.MEDIA_LOCATION, mediaLocator: { timestampStart: "00:10", timestampEnd: "00:20" } } }));
    assert(result.validation.valid, "Media record failed.");
  }],
  ["valid-transaction", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.TRANSACTION, record: { field: "transfer", valueText: "Recorded transfer" } }));
    assert(result.validation.valid, "Transaction failed.");
  }],
  ["valid-status", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATUS, record: { field: "availability", valueText: "available" } }));
    assert(result.validation.valid, "Status failed.");
  }],
  ["valid-relationship-event", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.RELATIONSHIP_EVENT, subjects: [subject("subject-001"), subject("subject-002", RECORDED_OBSERVATION_SUBJECT_ROLES.SECONDARY)] }));
    assert(result.validation.valid, "Relationship event failed.");
  }],
  ["valid-other-observation", () => {
    assert(createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.OTHER, temporal: timeUnknown() })).validation.valid, "OTHER failed.");
  }],
  ["valid-unknown-observation-warning", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.UNKNOWN, temporal: timeUnknown() }));
    assert(result.validation.valid && hasCode(result.validation, "UNKNOWN_OBSERVATION_TYPE", "warnings"), "UNKNOWN warning failed.");
  }],
  ["unknown-observation-type", () => {
    assert(hasCode(createRecordedObservation(baseInput({ observationType: "UNRECOGNIZED" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown type accepted.");
  }],
  ["unknown-origin", () => {
    assert(hasCode(createRecordedObservation(baseInput({ origin: "UNRECOGNIZED" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown origin accepted.");
  }],
  ["unknown-verification-state", () => {
    assert(hasCode(createRecordedObservation(baseInput({ verification: { state: "UNRECOGNIZED" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown verification accepted.");
  }],
  ["unknown-temporal-type", () => {
    assert(hasCode(createRecordedObservation(baseInput({ temporal: { type: "UNRECOGNIZED" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown temporal type accepted.");
  }],
  ["unknown-temporal-precision", () => {
    const result = createRecordedObservation(baseInput({ temporal: { type: RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT, occurredAt: "2026-01-01", precision: "UNRECOGNIZED" } }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown precision accepted.");
  }],
  ["unknown-spatial-type", () => {
    assert(hasCode(createRecordedObservation(baseInput({ spatial: { type: "UNRECOGNIZED" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown spatial type accepted.");
  }],
  ["unknown-subject-role", () => {
    const result = createRecordedObservation(baseInput({ subjects: [{ ...subject(), role: "UNRECOGNIZED" }] }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown subject role accepted.");
  }],
  ["invalid-observation-id", () => {
    assert(hasCode(createRecordedObservation(baseInput({ observationId: "" })).validation, "INVALID_REFERENCE"), "Invalid observation ID accepted.");
  }],
  ["invalid-session-reference", () => {
    assert(hasCode(createRecordedObservation(baseInput({ sessionRef: "" })).validation, "INVALID_REFERENCE"), "Invalid session reference accepted.");
  }],
  ["invalid-source-reference", () => {
    assert(hasCode(createRecordedObservation(baseInput({ sourceRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid source reference accepted.");
  }],
  ["insufficient-observation-provenance", () => {
    const result = createRecordedObservation(baseInput({ sourceRefs: [], sessionRef: null, provenance: {} }));
    assert(hasCode(result.validation, "OBSERVATION_REFERENCE_REQUIRED"), "Unanchored observation accepted.");
  }],
  ["verified-missing-source", () => {
    const result = createRecordedObservation(verifiedEvent({ sourceRefs: [] }));
    assert(hasCode(result.validation, "VERIFIED_SOURCE_REQUIRED"), "Verified source requirement missing.");
  }],
  ["verified-missing-verifier", () => {
    const result = createRecordedObservation(verifiedEvent({ verification: { state: RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED, verifiedAt: "2026-01-03" } }));
    assert(hasCode(result.validation, "VERIFIER_REQUIRED"), "Verifier requirement missing.");
  }],
  ["verified-missing-date", () => {
    const result = createRecordedObservation(verifiedEvent({ verification: { state: RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED, verifiedBy: "reviewer-001" } }));
    assert(hasCode(result.validation, "VERIFICATION_DATE_REQUIRED"), "Verification date requirement missing.");
  }],
  ["verified-with-limitations-missing-limitations", () => {
    const result = createRecordedObservation(verifiedEvent({ verification: { state: RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS, verifiedBy: "reviewer-001", verifiedAt: "2026-01-03" } }));
    assert(hasCode(result.validation, "VERIFICATION_LIMITATIONS_REQUIRED"), "Limitations requirement missing.");
  }],
  ["event-missing-description", () => {
    assert(hasCode(createRecordedObservation(baseInput({ description: null })).validation, "EVENT_DESCRIPTION_REQUIRED"), "Event description requirement missing.");
  }],
  ["event-missing-temporal-information", () => {
    const result = createRecordedObservation(baseInput({ temporal: { type: RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT } }));
    assert(hasCode(result.validation, "EVENT_TEMPORAL_LOCATOR_REQUIRED"), "Event temporal requirement missing.");
  }],
  ["event-without-subject-warning", () => {
    const result = createRecordedObservation(baseInput({ subjects: [] }));
    assert(result.validation.valid && hasCode(result.validation, "EVENT_SUBJECT_MISSING", "warnings"), "Event subject warning failed.");
  }],
  ["measurement-missing-name", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { value: 4 } }));
    assert(hasCode(result.validation, "MEASUREMENT_NAME_REQUIRED"), "Measurement name requirement missing.");
  }],
  ["measurement-missing-value", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { name: "count" } }));
    assert(hasCode(result.validation, "MEASUREMENT_VALUE_REQUIRED"), "Measurement value requirement missing.");
  }],
  ["measurement-range-order", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { name: "range", minimum: 9, maximum: 2 } }));
    assert(hasCode(result.validation, "INVALID_MEASUREMENT_RANGE"), "Measurement range order accepted.");
  }],
  ["measurement-not-converted-to-rating", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { name: "count", value: 87 } }));
    assert(result.measurement.value === 87 && !keysDeep(result).has("rating"), "Measurement was converted or rated.");
  }],
  ["statement-missing-text", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { speakerLabel: "Witness" } }));
    assert(hasCode(result.validation, "STATEMENT_TEXT_REQUIRED"), "Statement text requirement missing.");
  }],
  ["statement-missing-speaker", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { text: "Recorded words", isDirectQuote: false } }));
    assert(hasCode(result.validation, "STATEMENT_SPEAKER_REQUIRED"), "Statement speaker requirement missing.");
  }],
  ["direct-quote-missing-source", () => {
    const result = createRecordedObservation(baseInput({ sourceRefs: [], observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { speakerLabel: "Witness", text: "Recorded words", isDirectQuote: true } }));
    assert(hasCode(result.validation, "DIRECT_QUOTE_SOURCE_REQUIRED"), "Direct quote source requirement missing.");
  }],
  ["translation-preserves-original", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { speakerLabel: "Witness", text: "Original", translatedText: "Translation" } }));
    assert(result.statement.text === "Original" && result.statement.translatedText === "Translation", "Translation altered original.");
  }],
  ["documented-fact-missing-field", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT, record: { value: 4 } }));
    assert(hasCode(result.validation, "RECORD_FIELD_REQUIRED"), "Documented field requirement missing.");
  }],
  ["documented-fact-missing-value", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT, record: { field: "count" } }));
    assert(hasCode(result.validation, "RECORD_VALUE_REQUIRED"), "Documented value requirement missing.");
  }],
  ["documented-fact-missing-source", () => {
    const result = createRecordedObservation(baseInput({ sourceRefs: [], observationType: RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT, record: { field: "count", value: 4 } }));
    assert(hasCode(result.validation, "DOCUMENTED_FACT_SOURCE_REQUIRED"), "Documented source requirement missing.");
  }],
  ["data-point-missing-content", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.DATA_POINT }));
    assert(hasCode(result.validation, "DATA_POINT_CONTENT_REQUIRED"), "Empty data point accepted.");
  }],
  ["media-record-missing-reference", () => {
    const result = createRecordedObservation(baseInput({ sourceRefs: [], observationType: RECORDED_OBSERVATION_TYPES.MEDIA_RECORD, media: { mediaType: "audio" } }));
    assert(hasCode(result.validation, "MEDIA_REFERENCE_REQUIRED"), "Media reference requirement missing.");
  }],
  ["media-record-missing-locator-warning", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEDIA_RECORD, media: { mediaType: "audio", mediaRef: "media-001" } }));
    assert(result.validation.valid && hasCode(result.validation, "MEDIA_LOCATOR_MISSING", "warnings"), "Media locator warning failed.");
  }],
  ["transaction-temporal-requirement", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.TRANSACTION, temporal: { type: RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT }, record: { field: "transfer" } }));
    assert(hasCode(result.validation, "TRANSACTION_TEMPORAL_REQUIRED"), "Transaction temporal requirement missing.");
  }],
  ["relationship-event-needs-two-subjects", () => {
    const result = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.RELATIONSHIP_EVENT, subjects: [subject()] }));
    assert(hasCode(result.validation, "RELATIONSHIP_SUBJECTS_REQUIRED"), "Relationship subject requirement missing.");
  }],
  ["invalid-subject-structure", () => {
    assert(hasCode(createRecordedObservation(baseInput({ subjects: ["subject-001"] })).validation, "INVALID_SUBJECT_STRUCTURE"), "Invalid subject accepted.");
  }],
  ["invalid-coordinates", () => {
    const result = createRecordedObservation(baseInput({ spatial: { type: RECORDED_OBSERVATION_SPATIAL_TYPES.PHYSICAL, coordinates: { latitude: 91, longitude: -181 } } }));
    assert(hasCode(result.validation, "NUMBER_OUT_OF_RANGE"), "Invalid coordinates accepted.");
  }],
  ["invalid-temporal-order", () => {
    const result = createRecordedObservation(baseInput({ temporal: { type: RECORDED_OBSERVATION_TEMPORAL_TYPES.INTERVAL, startedAt: "2026-02-01", endedAt: "2026-01-01" } }));
    assert(hasCode(result.validation, "INVALID_DATE_ORDER"), "Temporal order accepted.");
  }],
  ["invalid-media-timestamp-order", () => {
    const result = createRecordedObservation(baseInput({ spatial: { type: RECORDED_OBSERVATION_SPATIAL_TYPES.MEDIA_LOCATION, mediaLocator: { timestampStart: "00:20", timestampEnd: "00:10" } } }));
    assert(hasCode(result.validation, "INVALID_MEDIA_TIMESTAMP_ORDER"), "Media timestamp order accepted.");
  }],
  ["invalid-frame-order", () => {
    const result = createRecordedObservation(baseInput({ spatial: { type: RECORDED_OBSERVATION_SPATIAL_TYPES.MEDIA_LOCATION, mediaLocator: { frameStart: 20, frameEnd: 10 } } }));
    assert(hasCode(result.validation, "INVALID_FRAME_ORDER"), "Frame order accepted.");
  }],
  ["duplicate-scalar-references", () => {
    const result = createRecordedObservation(baseInput({ sourceRefs: ["source-001", " source-001 "] }));
    same(result.sourceRefs, ["source-001"], "Reference duplicates remain.");
    assert(hasCode(result.validation, "DUPLICATE_NORMALIZED_VALUE", "warnings"), "Reference duplicate warning missing.");
  }],
  ["duplicate-tags", () => {
    const result = createRecordedObservation(baseInput({ metadata: { tags: ["recorded", " recorded "] } }));
    same(result.metadata.tags, ["recorded"], "Tag duplicates remain.");
  }],
  ["exact-duplicate-subjects", () => {
    const item = subject();
    const result = createRecordedObservation(baseInput({ subjects: [item, { ...item }] }));
    assert(result.subjects.length === 1 && hasCode(result.validation, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Subject duplicates remain.");
  }],
  ["no-interpretation-fields", () => {
    const keys = keysDeep(createRecordedObservation(baseInput()));
    const forbidden = ["interpretation", "meaning", "intent", "quality", "cause", "responsibility", "skill", "importance", "valueJudgment"];
    assert(forbidden.every((key) => !keys.has(key)), "Interpretation field exists.");
  }],
  ["no-evaluation-fields", () => {
    const keys = keysDeep(createRecordedObservation(baseInput()));
    const forbidden = ["score", "grade", "direction", "evidenceRole", "component", "trait", "recommendation", "conclusion", "confidence"];
    assert(forbidden.every((key) => !keys.has(key)), "Evaluation field exists.");
  }],
  ["timestamps-not-invented", () => {
    const result = createRecordedObservation(baseInput({ temporal: timeUnknown(), provenance: { recordedBy: "researcher-001" } }));
    assert(result.provenance.recordedAt === null && result.provenance.createdAt === null && result.validation.checkedAt === null, "Timestamp invented.");
  }],
  ["locations-not-inferred", () => {
    const result = createRecordedObservation(baseInput({ spatial: noLocation() }));
    assert(result.spatial.locationRef === null && result.spatial.label === null && result.spatial.coordinates.latitude === null, "Location inferred.");
  }],
  ["subjects-not-inferred", () => {
    const result = createRecordedObservation(baseInput({ subjects: [] }));
    assert(result.subjects.length === 0, "Subject inferred.");
  }],
  ["sources-not-inferred", () => {
    const result = createRecordedObservation(baseInput({ sourceRefs: [], sessionRef: "session-001", provenance: { recordedBy: "researcher-001" } }));
    assert(result.sourceRefs.length === 0, "Source inferred.");
  }],
  ["verification-not-inferred", () => {
    const result = createRecordedObservation(baseInput({ origin: RECORDED_OBSERVATION_ORIGINS.SOURCE_REPORTED }));
    assert(result.verification.state === RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED && !isVerifiedRecordedObservation(result), "Verification inferred.");
  }],
  ["factory-input-immutability", () => {
    const input = verifiedEvent();
    const before = JSON.stringify(input);
    createRecordedObservation(input);
    assert(JSON.stringify(input) === before, "Factory mutated input.");
  }],
  ["validator-input-immutability", () => {
    const input = verifiedEvent();
    const before = JSON.stringify(input);
    validateRecordedObservation(input);
    assert(JSON.stringify(input) === before, "Validator mutated input.");
  }],
  ["stable-repeated-normalization", () => {
    same(createRecordedObservation(verifiedEvent()), createRecordedObservation(verifiedEvent()), "Repeated normalization is unstable.");
  }],
  ["type-guards", () => {
    const verified = createRecordedObservation(verifiedEvent());
    const measurement = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.MEASUREMENT, measurement: { name: "count", value: 4 } }));
    const statement = createRecordedObservation(baseInput({ observationType: RECORDED_OBSERVATION_TYPES.STATEMENT, statement: { speakerLabel: "Witness", text: "Recorded words" } }));
    assert(isRecordedObservation(verified) && isVerifiedRecordedObservation(verified), "Verified guards failed.");
    assert(isMeasurementObservation(measurement) && !isStatementObservation(measurement) && isStatementObservation(statement) && !isRecordedObservation({}), "Type guards failed.");
  }],
  ["unavailable-observation-factory", () => {
    const result = createUnavailableRecordedObservation({ observationId: "missing-001", sessionRef: "session-001", title: "Unavailable", description: "No record was available.", reason: "Not found.", verification: { state: RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED } });
    assert(isRecordedObservation(result) && !result.validation.valid && result.observationId === "missing-001" && result.sessionRef === "session-001", "Unavailable shape failed.");
    assert(result.title === "Unavailable" && result.description === "No record was available." && result.metadata.notes === "Not found.", "Unavailable values were not preserved.");
    assert(result.verification.state === null && hasCode(result.validation, "RECORDED_OBSERVATION_UNAVAILABLE"), "Unavailable verification or validation failed.");
  }],
  ["research-source-exports-intact", () => {
    const names = ["createResearchSource", "createUnavailableResearchSource", "validateResearchSource", "isResearchSource", "isApprovedResearchSource"];
    assert(names.every((name) => typeof researchRepository[name] === "function"), "Research Source exports regressed.");
  }],
  ["research-session-exports-intact", () => {
    const names = ["createResearchSession", "createUnavailableResearchSession", "validateResearchSession", "isResearchSession", "isCompletedResearchSession", "isVerifiedResearchSession"];
    assert(names.every((name) => typeof researchRepository[name] === "function"), "Research Session exports regressed.");
  }],
  ["recorded-observation-export-surface", () => {
    const names = ["createRecordedObservation", "createUnavailableRecordedObservation", "validateRecordedObservation", "isRecordedObservation", "isVerifiedRecordedObservation", "isMeasurementObservation", "isStatementObservation"];
    assert(names.every((name) => typeof researchRepository[name] === "function"), "Recorded Observation API incomplete.");
    assert(Object.isFrozen(RECORDED_OBSERVATION_TYPES) && Object.isFrozen(RECORDED_OBSERVATION_ORIGINS) && Object.isFrozen(RECORDED_OBSERVATION_VERIFICATION_STATES) && Object.isFrozen(RECORDED_OBSERVATION_PRECISION_LEVELS) && Object.isFrozen(RECORDED_OBSERVATION_TEMPORAL_TYPES) && Object.isFrozen(RECORDED_OBSERVATION_SPATIAL_TYPES) && Object.isFrozen(RECORDED_OBSERVATION_SUBJECT_ROLES), "Recorded Observation constants are not frozen.");
  }],
  ["diagnostic-runners-excluded", () => {
    assert(Object.keys(researchRepository).every((key) => !key.toLowerCase().includes("diagnostic")), "A diagnostic runner entered production exports.");
  }],
];

export function runRecordedObservationContractDiagnostics({ throwOnFailure = false } = {}) {
  const cases = CASES.map(([id, execute]) => {
    try {
      execute();
      return { id, passed: true, message: `${id} passed.`, details: null };
    } catch (error) {
      return {
        id,
        passed: false,
        message: typeof error?.message === "string" ? error.message : `${id} failed.`,
        details: error?.details ?? null,
      };
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: RECORDED_OBSERVATION_CONTRACT_VERSION,
    schemaVersion: RECORDED_OBSERVATION_SCHEMA_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
  };
  if (throwOnFailure && failed > 0) {
    throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  }
  return summary;
}

export default Object.freeze({ runRecordedObservationContractDiagnostics });
