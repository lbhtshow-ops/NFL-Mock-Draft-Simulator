export function createAnalyticalObservationsTemplate(overrides = {}) {
  return Object.freeze({ analyses: [], authoringShape: { analysisId: "REPLACE_WITH_ANALYTICAL_OBSERVATION_ID", interpretation: null, recordedObservationRefs: [], limitations: [], review: { state: "PENDING", reviewedBy: null, reviewedAt: null }, provenance: { createdBy: null, createdAt: null } }, ...overrides });
}
export default Object.freeze({ createAnalyticalObservationsTemplate });
