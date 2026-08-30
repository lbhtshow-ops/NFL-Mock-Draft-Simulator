export function createRecordedObservationsTemplate(overrides = {}) {
  return Object.freeze({ observations: [], authoringShape: { observationId: "REPLACE_WITH_RECORDED_OBSERVATION_ID", subjectRef: "REPLACE_WITH_EXACT_SUBJECT_REFERENCE", sourceRefs: [], sessionRef: null, content: null, contentLocator: null, observationClassification: "UNKNOWN", evidenceCategory: "UNKNOWN", verification: { state: "PENDING", verifiedBy: null, verifiedAt: null }, provenance: { createdBy: null, createdAt: null } }, ...overrides });
}
export default Object.freeze({ createRecordedObservationsTemplate });
