import {
  RECORDED_OBSERVATION_CONTRACT_NAME,
  RECORDED_OBSERVATION_CONTRACT_VERSION,
  RECORDED_OBSERVATION_ORIGINS,
  RECORDED_OBSERVATION_PRECISION_LEVELS,
  RECORDED_OBSERVATION_SCHEMA_VERSION,
  RECORDED_OBSERVATION_SPATIAL_TYPES,
  RECORDED_OBSERVATION_SUBJECT_ROLES,
  RECORDED_OBSERVATION_TEMPORAL_TYPES,
  RECORDED_OBSERVATION_TYPES,
  RECORDED_OBSERVATION_VERIFICATION_STATES,
} from "../constants/recordedObservationConstants.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createValidation(checkedAt = null) {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: optionalString(checkedAt),
    contractVersion: RECORDED_OBSERVATION_CONTRACT_VERSION,
    schemaVersion: RECORDED_OBSERVATION_SCHEMA_VERSION,
  };
}

function addValidation(validation, field, code, path, message) {
  const entry = { code, path, message };
  const exists = validation[field].some(
    (item) => item.code === code && item.path === path && item.message === message
  );
  if (!exists) validation[field].push(entry);
  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addValidation(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addValidation(validation, "warnings", code, path, message);
}

function mergeValidation(target, source) {
  source.errors.forEach((entry) => addError(target, entry.code, entry.path, entry.message));
  source.warnings.forEach((entry) => addWarning(target, entry.code, entry.path, entry.message));
  return target;
}

function normalizeString(value, path, validation, { required = false } = {}) {
  if (value == null) {
    if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`);
    return null;
  }
  return value.trim();
}

function normalizeReference(value, path, validation, { required = false } = {}) {
  if (value == null) {
    if (required) addError(validation, "MISSING_REQUIRED_REFERENCE", path, `${path} is required.`);
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_REFERENCE", path, `${path} must be a non-empty identifier or null.`);
    return null;
  }
  return value.trim();
}

function normalizeEnum(value, allowed, path, validation, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    return null;
  }
  if (!Object.values(allowed).includes(value)) {
    addError(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not a recognized value.`);
    return null;
  }
  return value;
}

function normalizeBoolean(value, path, validation) {
  if (value == null) return null;
  if (typeof value !== "boolean") {
    addError(validation, "INVALID_BOOLEAN", path, `${path} must be a boolean or null.`);
    return null;
  }
  return value;
}

function normalizeDate(value, path, validation) {
  const normalized = normalizeString(value, path, validation);
  if (normalized === null) return null;
  if (Number.isNaN(Date.parse(normalized))) {
    addError(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`);
    return null;
  }
  return normalized;
}

function normalizeNumber(value, path, validation, { minimum = null, maximum = null } = {}) {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addError(validation, "INVALID_NUMBER", path, `${path} must be a finite number or null.`);
    return null;
  }
  if (minimum !== null && value < minimum) {
    addError(validation, "NUMBER_OUT_OF_RANGE", path, `${path} must be at least ${minimum}.`);
    return null;
  }
  if (maximum !== null && value > maximum) {
    addError(validation, "NUMBER_OUT_OF_RANGE", path, `${path} must be no greater than ${maximum}.`);
    return null;
  }
  return value;
}

function normalizePrimitive(value, path, validation) {
  if (value == null) return null;
  if (!["string", "number", "boolean"].includes(typeof value) ||
      (typeof value === "number" && !Number.isFinite(value))) {
    addError(validation, "INVALID_PRIMITIVE_VALUE", path, `${path} must be a string, finite number, boolean, or null.`);
    return null;
  }
  return typeof value === "string" ? value.trim() || null : value;
}

function normalizeScalarArray(value, path, validation, { invalidCode = "INVALID_REFERENCE" } = {}) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addError(validation, invalidCode, `${path}[${index}]`, `${path} values must be non-empty strings.`);
      return;
    }
    const item = entry.trim();
    if (seen.has(item)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${item}.`);
      return;
    }
    seen.add(item);
    result.push(item);
  });
  return result;
}

function normalizeNested(value, path, validation, normalizer) {
  if (value == null) return normalizer({});
  if (!isObject(value)) {
    addError(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`);
    return normalizer({});
  }
  return normalizer(value);
}

function normalizeSubjects(value, validation) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", "subjects", "subjects must be an array.");
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((subject, index) => {
    if (!isObject(subject)) {
      addError(validation, "INVALID_SUBJECT_STRUCTURE", `subjects[${index}]`, "Subject entries must be objects.");
      return;
    }
    const normalized = {
      subjectRef: normalizeReference(subject.subjectRef, `subjects[${index}].subjectRef`, validation, { required: true }),
      subjectType: normalizeString(subject.subjectType, `subjects[${index}].subjectType`, validation),
      role: normalizeEnum(subject.role, RECORDED_OBSERVATION_SUBJECT_ROLES, `subjects[${index}].role`, validation),
      label: normalizeString(subject.label, `subjects[${index}].label`, validation),
      notes: normalizeString(subject.notes, `subjects[${index}].notes`, validation),
    };
    const identity = JSON.stringify(normalized);
    if (seen.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", "subjects", "Exact duplicate subject removed.");
      return;
    }
    seen.add(identity);
    result.push(normalized);
  });
  return result;
}

function normalizeMediaTime(value, path, validation) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d{1,3}:[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(value.trim())) {
    return value.trim();
  }
  addError(validation, "INVALID_MEDIA_TIMESTAMP", path, `${path} must be a non-negative number, media timestamp string, or null.`);
  return null;
}

function mediaSeconds(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const parts = value.split(":").map(Number);
  return parts.length === 2
    ? parts[0] * 60 + parts[1]
    : parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function compareDates(start, end, path, validation) {
  if (start && end && Date.parse(start) > Date.parse(end)) {
    addError(validation, "INVALID_DATE_ORDER", path, `${path} start must not be after end.`);
  }
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function hasMeasurement(measurement) {
  return Boolean(
    measurement.name &&
      (hasValue(measurement.value) || measurement.valueText ||
        (hasValue(measurement.minimum) && hasValue(measurement.maximum)))
  );
}

function hasRecord(record) {
  return Boolean(record.field && (hasValue(record.value) || record.valueText));
}

function hasTemporal(temporal) {
  return Boolean(temporal.occurredAt || temporal.startedAt || temporal.endedAt || temporal.dateLabel);
}

function hasMediaLocator(locator) {
  return [
    locator.timestampStart,
    locator.timestampEnd,
    locator.frameStart,
    locator.frameEnd,
    locator.segmentLabel,
  ].some((value) => value !== null);
}

function hasDocumentLocator(locator) {
  return [
    locator.page,
    locator.section,
    locator.paragraph,
    locator.table,
    locator.figure,
  ].some((value) => value !== null);
}

function normalizeObservation(input, checkedAt = null) {
  const validation = createValidation(checkedAt);
  const observation = isObject(input) ? input : {};
  if (!isObject(input)) {
    addError(validation, "INVALID_RECORDED_OBSERVATION_INPUT", "", "Recorded observation input must be an object.");
  }

  const normalized = {
    contract: RECORDED_OBSERVATION_CONTRACT_NAME,
    contractVersion: RECORDED_OBSERVATION_CONTRACT_VERSION,
    schemaVersion: RECORDED_OBSERVATION_SCHEMA_VERSION,
    observationId: normalizeReference(observation.observationId, "observationId", validation, { required: true }),
    sessionRef: normalizeReference(observation.sessionRef, "sessionRef", validation),
    sourceRefs: normalizeScalarArray(observation.sourceRefs, "sourceRefs", validation),
    observationType: normalizeEnum(observation.observationType, RECORDED_OBSERVATION_TYPES, "observationType", validation, { required: true }),
    origin: normalizeEnum(observation.origin, RECORDED_OBSERVATION_ORIGINS, "origin", validation, { required: true }),
    title: normalizeString(observation.title, "title", validation),
    description: normalizeString(observation.description, "description", validation),
    subjects: normalizeSubjects(observation.subjects, validation),
    temporal: normalizeNested(observation.temporal, "temporal", validation, (temporal) => ({
      type: normalizeEnum(temporal.type, RECORDED_OBSERVATION_TEMPORAL_TYPES, "temporal.type", validation, { required: true }),
      occurredAt: normalizeDate(temporal.occurredAt, "temporal.occurredAt", validation),
      startedAt: normalizeDate(temporal.startedAt, "temporal.startedAt", validation),
      endedAt: normalizeDate(temporal.endedAt, "temporal.endedAt", validation),
      dateLabel: normalizeString(temporal.dateLabel, "temporal.dateLabel", validation),
      precision: normalizeEnum(temporal.precision, RECORDED_OBSERVATION_PRECISION_LEVELS, "temporal.precision", validation),
      timezone: normalizeString(temporal.timezone, "temporal.timezone", validation),
      notes: normalizeString(temporal.notes, "temporal.notes", validation),
    })),
    spatial: normalizeNested(observation.spatial, "spatial", validation, (spatial) => ({
      type: normalizeEnum(spatial.type, RECORDED_OBSERVATION_SPATIAL_TYPES, "spatial.type", validation, { required: true }),
      locationRef: normalizeReference(spatial.locationRef, "spatial.locationRef", validation),
      label: normalizeString(spatial.label, "spatial.label", validation),
      coordinates: normalizeNested(spatial.coordinates, "spatial.coordinates", validation, (coordinates) => ({
        latitude: normalizeNumber(coordinates.latitude, "spatial.coordinates.latitude", validation, { minimum: -90, maximum: 90 }),
        longitude: normalizeNumber(coordinates.longitude, "spatial.coordinates.longitude", validation, { minimum: -180, maximum: 180 }),
      })),
      documentLocator: normalizeNested(spatial.documentLocator, "spatial.documentLocator", validation, (locator) => ({
        page: normalizePrimitive(locator.page, "spatial.documentLocator.page", validation),
        section: normalizeString(locator.section, "spatial.documentLocator.section", validation),
        paragraph: normalizePrimitive(locator.paragraph, "spatial.documentLocator.paragraph", validation),
        table: normalizeString(locator.table, "spatial.documentLocator.table", validation),
        figure: normalizeString(locator.figure, "spatial.documentLocator.figure", validation),
        notes: normalizeString(locator.notes, "spatial.documentLocator.notes", validation),
      })),
      mediaLocator: normalizeNested(spatial.mediaLocator, "spatial.mediaLocator", validation, (locator) => ({
        timestampStart: normalizeMediaTime(locator.timestampStart, "spatial.mediaLocator.timestampStart", validation),
        timestampEnd: normalizeMediaTime(locator.timestampEnd, "spatial.mediaLocator.timestampEnd", validation),
        frameStart: normalizeNumber(locator.frameStart, "spatial.mediaLocator.frameStart", validation, { minimum: 0 }),
        frameEnd: normalizeNumber(locator.frameEnd, "spatial.mediaLocator.frameEnd", validation, { minimum: 0 }),
        segmentLabel: normalizeString(locator.segmentLabel, "spatial.mediaLocator.segmentLabel", validation),
        notes: normalizeString(locator.notes, "spatial.mediaLocator.notes", validation),
      })),
      notes: normalizeString(spatial.notes, "spatial.notes", validation),
    })),
    measurement: normalizeNested(observation.measurement, "measurement", validation, (measurement) => ({
      name: normalizeString(measurement.name, "measurement.name", validation),
      value: normalizeNumber(measurement.value, "measurement.value", validation),
      valueText: normalizeString(measurement.valueText, "measurement.valueText", validation),
      unit: normalizeString(measurement.unit, "measurement.unit", validation),
      minimum: normalizeNumber(measurement.minimum, "measurement.minimum", validation),
      maximum: normalizeNumber(measurement.maximum, "measurement.maximum", validation),
      precision: normalizeEnum(measurement.precision, RECORDED_OBSERVATION_PRECISION_LEVELS, "measurement.precision", validation),
      methodologyRef: normalizeReference(measurement.methodologyRef, "measurement.methodologyRef", validation),
      notes: normalizeString(measurement.notes, "measurement.notes", validation),
    })),
    statement: normalizeNested(observation.statement, "statement", validation, (statement) => ({
      speakerRef: normalizeReference(statement.speakerRef, "statement.speakerRef", validation),
      speakerLabel: normalizeString(statement.speakerLabel, "statement.speakerLabel", validation),
      text: normalizeString(statement.text, "statement.text", validation),
      isDirectQuote: normalizeBoolean(statement.isDirectQuote, "statement.isDirectQuote", validation),
      language: normalizeString(statement.language, "statement.language", validation),
      translatedText: normalizeString(statement.translatedText, "statement.translatedText", validation),
      context: normalizeString(statement.context, "statement.context", validation),
      notes: normalizeString(statement.notes, "statement.notes", validation),
    })),
    record: normalizeNested(observation.record, "record", validation, (record) => ({
      field: normalizeString(record.field, "record.field", validation),
      value: normalizePrimitive(record.value, "record.value", validation),
      valueText: normalizeString(record.valueText, "record.valueText", validation),
      recordType: normalizeString(record.recordType, "record.recordType", validation),
      effectiveAt: normalizeDate(record.effectiveAt, "record.effectiveAt", validation),
      notes: normalizeString(record.notes, "record.notes", validation),
    })),
    media: normalizeNested(observation.media, "media", validation, (media) => ({
      mediaType: normalizeString(media.mediaType, "media.mediaType", validation),
      mediaRef: normalizeReference(media.mediaRef, "media.mediaRef", validation),
      representation: normalizeString(media.representation, "media.representation", validation),
      notes: normalizeString(media.notes, "media.notes", validation),
    })),
    verification: normalizeNested(observation.verification, "verification", validation, (verification) => ({
      state: normalizeEnum(verification.state, RECORDED_OBSERVATION_VERIFICATION_STATES, "verification.state", validation, { required: true }),
      verifiedBy: normalizeReference(verification.verifiedBy, "verification.verifiedBy", validation),
      verifiedAt: normalizeDate(verification.verifiedAt, "verification.verifiedAt", validation),
      method: normalizeString(verification.method, "verification.method", validation),
      limitations: normalizeScalarArray(verification.limitations, "verification.limitations", validation, { invalidCode: "INVALID_LIMITATION" }),
      notes: normalizeString(verification.notes, "verification.notes", validation),
    })),
    provenance: normalizeNested(observation.provenance, "provenance", validation, (provenance) => ({
      recordedBy: normalizeReference(provenance.recordedBy, "provenance.recordedBy", validation),
      recordedAt: normalizeDate(provenance.recordedAt, "provenance.recordedAt", validation),
      createdBy: normalizeReference(provenance.createdBy, "provenance.createdBy", validation),
      createdAt: normalizeDate(provenance.createdAt, "provenance.createdAt", validation),
      updatedBy: normalizeReference(provenance.updatedBy, "provenance.updatedBy", validation),
      updatedAt: normalizeDate(provenance.updatedAt, "provenance.updatedAt", validation),
    })),
    metadata: normalizeNested(observation.metadata, "metadata", validation, (metadata) => ({
      tags: normalizeScalarArray(metadata.tags, "metadata.tags", validation, { invalidCode: "INVALID_TAG" }),
      externalRefs: normalizeScalarArray(metadata.externalRefs, "metadata.externalRefs", validation),
      relatedObservationRefs: normalizeScalarArray(metadata.relatedObservationRefs, "metadata.relatedObservationRefs", validation),
      notes: normalizeString(metadata.notes, "metadata.notes", validation),
    })),
    validation: null,
  };

  compareDates(normalized.temporal.startedAt, normalized.temporal.endedAt, "temporal", validation);
  const mediaStart = mediaSeconds(normalized.spatial.mediaLocator.timestampStart);
  const mediaEnd = mediaSeconds(normalized.spatial.mediaLocator.timestampEnd);
  if (mediaStart !== null && mediaEnd !== null && mediaStart > mediaEnd) {
    addError(validation, "INVALID_MEDIA_TIMESTAMP_ORDER", "spatial.mediaLocator", "Media timestamp start must not be after end.");
  }
  if (normalized.spatial.mediaLocator.frameStart !== null &&
      normalized.spatial.mediaLocator.frameEnd !== null &&
      normalized.spatial.mediaLocator.frameStart > normalized.spatial.mediaLocator.frameEnd) {
    addError(validation, "INVALID_FRAME_ORDER", "spatial.mediaLocator", "Frame start must not exceed frame end.");
  }
  if (normalized.measurement.minimum !== null && normalized.measurement.maximum !== null &&
      normalized.measurement.minimum > normalized.measurement.maximum) {
    addError(validation, "INVALID_MEASUREMENT_RANGE", "measurement", "Measurement minimum must not exceed maximum.");
  }

  if (normalized.sourceRefs.length === 0 && !(normalized.sessionRef && normalized.provenance.recordedBy)) {
    addError(validation, "OBSERVATION_REFERENCE_REQUIRED", "sourceRefs", "An observation requires a source reference or a session reference with provenance.recordedBy.");
  }
  const verifiedStates = [
    RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED,
    RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
  ];
  if (verifiedStates.includes(normalized.verification.state)) {
    if (normalized.sourceRefs.length === 0) addError(validation, "VERIFIED_SOURCE_REQUIRED", "sourceRefs", "Verified observations require a source reference.");
    if (!normalized.verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", "Verified observations require verification.verifiedBy.");
    if (!normalized.verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", "Verified observations require verification.verifiedAt.");
  }
  if (normalized.verification.state === RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS &&
      normalized.verification.limitations.length === 0 && !normalized.verification.notes) {
    addError(validation, "VERIFICATION_LIMITATIONS_REQUIRED", "verification.limitations", "Verified-with-limitations observations require limitations or notes.");
  }

  const temporal = normalized.temporal;
  if (temporal.type === RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT && !temporal.occurredAt) {
    addError(validation, "INSTANT_OCCURRED_AT_REQUIRED", "temporal.occurredAt", "INSTANT requires occurredAt.");
  }
  if (temporal.type === RECORDED_OBSERVATION_TEMPORAL_TYPES.INTERVAL && (!temporal.startedAt || !temporal.endedAt)) {
    addError(validation, "INTERVAL_DATES_REQUIRED", "temporal", "INTERVAL requires startedAt and endedAt.");
  }
  if (temporal.type === RECORDED_OBSERVATION_TEMPORAL_TYPES.DATE_ONLY && !temporal.occurredAt && !temporal.dateLabel) {
    addError(validation, "DATE_ONLY_LOCATOR_REQUIRED", "temporal", "DATE_ONLY requires occurredAt or dateLabel.");
  }
  if (temporal.type === RECORDED_OBSERVATION_TEMPORAL_TYPES.SEASON_OR_PERIOD && !temporal.dateLabel) {
    addError(validation, "PERIOD_LABEL_REQUIRED", "temporal.dateLabel", "SEASON_OR_PERIOD requires dateLabel.");
  }

  const type = normalized.observationType;
  if (type === RECORDED_OBSERVATION_TYPES.EVENT) {
    if (!normalized.description) addError(validation, "EVENT_DESCRIPTION_REQUIRED", "description", "EVENT requires a description.");
    if (temporal.type !== RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN && !hasTemporal(temporal)) {
      addError(validation, "EVENT_TEMPORAL_LOCATOR_REQUIRED", "temporal", "EVENT requires temporal information unless time is unknown.");
    }
    if (normalized.subjects.length === 0) addWarning(validation, "EVENT_SUBJECT_MISSING", "subjects", "EVENT normally includes a subject.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.MEASUREMENT) {
    if (!normalized.measurement.name) addError(validation, "MEASUREMENT_NAME_REQUIRED", "measurement.name", "MEASUREMENT requires a name.");
    if (!hasValue(normalized.measurement.value) && !normalized.measurement.valueText &&
        !(hasValue(normalized.measurement.minimum) && hasValue(normalized.measurement.maximum))) {
      addError(validation, "MEASUREMENT_VALUE_REQUIRED", "measurement", "MEASUREMENT requires a value, valueText, or range.");
    }
  }
  if (type === RECORDED_OBSERVATION_TYPES.STATEMENT) {
    if (!normalized.statement.text) addError(validation, "STATEMENT_TEXT_REQUIRED", "statement.text", "STATEMENT requires text.");
    if (!normalized.statement.speakerRef && !normalized.statement.speakerLabel) addError(validation, "STATEMENT_SPEAKER_REQUIRED", "statement", "STATEMENT requires a speaker reference or label.");
    if (normalized.statement.isDirectQuote === true && normalized.sourceRefs.length === 0) addError(validation, "DIRECT_QUOTE_SOURCE_REQUIRED", "sourceRefs", "A direct quote requires a source reference.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT) {
    if (!normalized.record.field) addError(validation, "RECORD_FIELD_REQUIRED", "record.field", "DOCUMENTED_FACT requires record.field.");
    if (!hasValue(normalized.record.value) && !normalized.record.valueText) addError(validation, "RECORD_VALUE_REQUIRED", "record", "DOCUMENTED_FACT requires record.value or valueText.");
    if (normalized.sourceRefs.length === 0) addError(validation, "DOCUMENTED_FACT_SOURCE_REQUIRED", "sourceRefs", "DOCUMENTED_FACT requires a source reference.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.DATA_POINT && !hasMeasurement(normalized.measurement) && !hasRecord(normalized.record)) {
    addError(validation, "DATA_POINT_CONTENT_REQUIRED", "measurement", "DATA_POINT requires sufficient measurement or record data.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.MEDIA_RECORD) {
    if (!normalized.media.mediaType) addError(validation, "MEDIA_TYPE_REQUIRED", "media.mediaType", "MEDIA_RECORD requires media.mediaType.");
    if (!normalized.media.mediaRef && normalized.sourceRefs.length === 0) addError(validation, "MEDIA_REFERENCE_REQUIRED", "media.mediaRef", "MEDIA_RECORD requires media.mediaRef or a source reference.");
    if (!hasMediaLocator(normalized.spatial.mediaLocator)) addWarning(validation, "MEDIA_LOCATOR_MISSING", "spatial.mediaLocator", "MEDIA_RECORD has no media locator.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.TRANSACTION) {
    if (!normalized.record.field && !normalized.description) addError(validation, "TRANSACTION_CONTENT_REQUIRED", "record.field", "TRANSACTION requires record.field or description.");
    if (temporal.type !== RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN && !hasTemporal(temporal)) addError(validation, "TRANSACTION_TEMPORAL_REQUIRED", "temporal", "TRANSACTION requires temporal information unless time is unknown.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.STATUS) {
    if (!normalized.record.field) addError(validation, "STATUS_FIELD_REQUIRED", "record.field", "STATUS requires record.field.");
    if (!hasValue(normalized.record.value) && !normalized.record.valueText && !normalized.description) addError(validation, "STATUS_CONTENT_REQUIRED", "record", "STATUS requires a record value or description.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.RELATIONSHIP_EVENT) {
    if (normalized.subjects.length < 2) addError(validation, "RELATIONSHIP_SUBJECTS_REQUIRED", "subjects", "RELATIONSHIP_EVENT requires at least two subjects.");
    if (!normalized.description) addError(validation, "RELATIONSHIP_DESCRIPTION_REQUIRED", "description", "RELATIONSHIP_EVENT requires a description.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.OTHER && !normalized.description) {
    addError(validation, "OTHER_DESCRIPTION_REQUIRED", "description", "OTHER requires a description.");
  }
  if (type === RECORDED_OBSERVATION_TYPES.UNKNOWN) {
    addWarning(validation, "UNKNOWN_OBSERVATION_TYPE", "observationType", "Observation type is explicitly unknown.");
  }
  if (normalized.spatial.type === RECORDED_OBSERVATION_SPATIAL_TYPES.DOCUMENT_LOCATION &&
      !hasDocumentLocator(normalized.spatial.documentLocator)) {
    addWarning(validation, "DOCUMENT_LOCATOR_MISSING", "spatial.documentLocator", "DOCUMENT_LOCATION has no document locator.");
  }
  if (normalized.spatial.type === RECORDED_OBSERVATION_SPATIAL_TYPES.MEDIA_LOCATION && !hasMediaLocator(normalized.spatial.mediaLocator)) {
    addWarning(validation, "SPATIAL_MEDIA_LOCATOR_MISSING", "spatial.mediaLocator", "MEDIA_LOCATION has no media locator.");
  }

  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

export function createRecordedObservation(input = {}, { checkedAt = null } = {}) {
  return normalizeObservation(input, checkedAt);
}

export function createUnavailableRecordedObservation(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {};
  const reason = optionalString(supplied.reason);
  const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeObservation({
    ...supplied,
    verification: {},
    metadata: { ...metadata, notes: metadata.notes ?? reason },
  }, checkedAt);
  const unavailable = createValidation(checkedAt);
  addError(unavailable, "RECORDED_OBSERVATION_UNAVAILABLE", "", reason || "No usable recorded observation is available.");
  result.validation = mergeValidation(result.validation, unavailable);
  return result;
}

export function validateRecordedObservation(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizeObservation(value, checkedAt).validation;
}

export function isRecordedObservation(value) {
  return Boolean(
    isObject(value) &&
      value.contract === RECORDED_OBSERVATION_CONTRACT_NAME &&
      value.contractVersion === RECORDED_OBSERVATION_CONTRACT_VERSION &&
      value.schemaVersion === RECORDED_OBSERVATION_SCHEMA_VERSION &&
      Array.isArray(value.sourceRefs) && Array.isArray(value.subjects) &&
      isObject(value.temporal) && isObject(value.spatial) &&
      isObject(value.measurement) && isObject(value.statement) &&
      isObject(value.record) && isObject(value.media) &&
      isObject(value.verification) && isObject(value.provenance) &&
      isObject(value.metadata) && isObject(value.validation)
  );
}

export function isVerifiedRecordedObservation(value) {
  const states = [
    RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED,
    RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
  ];
  return Boolean(isRecordedObservation(value) && states.includes(value.verification.state) && validateRecordedObservation(value).valid);
}

export function isMeasurementObservation(value) {
  return Boolean(isRecordedObservation(value) && value.observationType === RECORDED_OBSERVATION_TYPES.MEASUREMENT && validateRecordedObservation(value).valid);
}

export function isStatementObservation(value) {
  return Boolean(isRecordedObservation(value) && value.observationType === RECORDED_OBSERVATION_TYPES.STATEMENT && validateRecordedObservation(value).valid);
}

export default Object.freeze({
  RECORDED_OBSERVATION_CONTRACT_NAME,
  RECORDED_OBSERVATION_CONTRACT_VERSION,
  RECORDED_OBSERVATION_SCHEMA_VERSION,
  createRecordedObservation,
  createUnavailableRecordedObservation,
  validateRecordedObservation,
  isRecordedObservation,
  isVerifiedRecordedObservation,
  isMeasurementObservation,
  isStatementObservation,
});
