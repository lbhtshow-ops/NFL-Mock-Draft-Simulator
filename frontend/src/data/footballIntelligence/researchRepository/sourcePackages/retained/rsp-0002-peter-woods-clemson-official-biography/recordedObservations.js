import researchRepository from "../../../../../researchRepository/index.js";
import { researchSource } from "./sourceIntake.js";

export const subjectRef = "2026-peter-woods";
export const sessionRef = "research-session:rsp-0002:official-biography";
function observation(id, title, field, valueText, section, locator) { return researchRepository.createRecordedObservation({ observationId: `recorded-observation:rsp-0002:${id}`, sessionRef, sourceRefs: [researchSource.sourceId], observationType: researchRepository.RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT, origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.OFFICIAL_RECORD, title, description: valueText, subjects: [{ subjectRef, subjectType: "PROSPECT", role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY }], temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.TIME_UNKNOWN }, spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.DOCUMENT_LOCATION, documentLocator: { section, notes: locator } }, record: { field, valueText, recordType: "OFFICIAL_PLAYER_PROFILE_FIELD" }, verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.PENDING }, provenance: { recordedBy: null, recordedAt: "2026-07-18" }, metadata: { tags: ["official-profile", field] } }); }
export const recordedObservations = Object.freeze([
  observation("identity", "Published player name", "identity", "Peter Woods", "Player profile header", "Heading: #11 Peter Woods Season 2024-25"),
  observation("affiliation", "Published Clemson football roster affiliation", "affiliation", "Clemson Football roster profile, Season 2024-25", "Player profile header", "Heading: #11 Peter Woods Season 2024-25; page publisher: Clemson University Athletics"),
  observation("position", "Published football position", "position", "DL", "Player profile fields", "Field: Position"),
  observation("jersey-number", "Published jersey number", "jerseyNumber", "11", "Player profile header", "Heading prefix: #11"),
  observation("class-designation", "Published class designation", "classYear", "So.", "Player profile fields", "Field: Year"),
  observation("height", "Published height", "height", "6-3", "Player profile fields", "Field: Height"),
  observation("weight", "Published weight", "weight", "315 lbs", "Player profile fields", "Field: Weight"),
  observation("hometown", "Published hometown", "hometown", "Alabaster, Ala.", "Player profile fields", "Field: Hometown"),
]);
export const recordedObservationRefs = Object.freeze(recordedObservations.map((entry) => entry.observationId));
export const observationByField = Object.freeze(Object.fromEntries(recordedObservations.map((entry) => [entry.record.field, entry])));
export default recordedObservations;
