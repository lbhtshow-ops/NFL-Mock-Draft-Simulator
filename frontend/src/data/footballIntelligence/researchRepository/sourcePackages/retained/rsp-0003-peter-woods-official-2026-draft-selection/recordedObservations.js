import researchRepository from "../../../../../researchRepository/index.js";
import { researchSource } from "./sourceIntake.js";

export const subjectRef = "2026-peter-woods";
export const cycleRef = "draft-cycle:2026";
export const sessionRef = "research-session:rsp-0003:official-draft-selection";
function observation(id, title, field, valueText, locator) {
  return researchRepository.createRecordedObservation({ observationId: `recorded-observation:rsp-0003:${id}`, sessionRef, sourceRefs: [researchSource.sourceId], observationType: researchRepository.RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT, origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.OFFICIAL_RECORD, title, description: valueText, subjects: [{ subjectRef, subjectType: "PROSPECT", role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY }], temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN }, spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.DOCUMENT_LOCATION, documentLocator: { section: "Article opening paragraph", notes: locator } }, record: { field, valueText, recordType: "OFFICIAL_DRAFT_SELECTION_FACT" }, verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.PENDING }, provenance: { recordedBy: null, recordedAt: "2026-07-18" }, metadata: { tags: ["draft-selection", field] } });
}
export const recordedObservations = Object.freeze([
  observation("identity", "Selected player identity", "identity", "Peter Woods", "Subject named in the opening selection statement."),
  observation("draft-cycle", "Published draft cycle", "draftCycle", "2026 NFL Draft", "Draft cycle named in the opening selection statement."),
  observation("selecting-organization", "Selecting organization", "selectingOrganization", "Kansas City Chiefs", "Organization named as actor in the opening selection statement."),
  observation("round", "Published selection round", "round", "First round", "Article context and official selection caption identify the 1st Round."),
  observation("overall-pick", "Published overall selection number", "overallPick", "29", "Opening selection statement identifies No. 29 overall."),
  observation("selection-event", "Published selection event", "selectionEvent", "Kansas City Chiefs selected Peter Woods", "Opening paragraph directly states the Chiefs selected Peter Woods."),
]);
export const recordedObservationRefs = Object.freeze(recordedObservations.map((entry) => entry.observationId));
export const observationByField = Object.freeze(Object.fromEntries(recordedObservations.map((entry) => [entry.record.field, entry])));
export default recordedObservations;
