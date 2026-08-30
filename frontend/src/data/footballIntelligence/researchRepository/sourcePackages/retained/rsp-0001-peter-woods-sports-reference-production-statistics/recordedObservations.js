import researchRepository from "../../../../../researchRepository/index.js";
import { researchSource } from "./sourceIntake.js";

export const subjectRef = "2026-peter-woods";
export const sessionRef = "research-session:rsp-0001:production-statistics";
const observedAt = "2026-07-18";

function observation(id, title, season, table, row, valueText) {
  return researchRepository.createRecordedObservation({ observationId: `recorded-observation:rsp-0001:${id}`, sessionRef, sourceRefs: [researchSource.sourceId], observationType: researchRepository.RECORDED_OBSERVATION_TYPES.DATA_POINT, origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.SOURCE_REPORTED, title, description: valueText, subjects: [{ subjectRef, subjectType: "PROSPECT", role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY }], temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.SEASON_OR_PERIOD, dateLabel: season }, spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.DOCUMENT_LOCATION, documentLocator: { section: table, table, notes: `Row: ${row}` } }, record: { field: "productionStatistics", valueText, recordType: "SPORTS_REFERENCE_TABLE_ROW" }, verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.PENDING }, provenance: { recordedBy: null, recordedAt: observedAt }, metadata: { tags: ["production", "sports-reference", season] } });
}

export const recordedObservations = Object.freeze([
  observation("defense-2023", "Peter Woods 2023 defense production row", "2023", "Defense & Fumbles", "2023", "12 games; 13 solo tackles; 13 assisted tackles; 26 combined tackles; 2.5 tackles for loss; 0.0 sacks; 1 forced fumble."),
  observation("defense-2024", "Peter Woods 2024 defense production row", "2024", "Defense & Fumbles", "2024", "11 games; 18 solo tackles; 10 assisted tackles; 28 combined tackles; 8.5 tackles for loss; 3.0 sacks; 1 forced fumble."),
  observation("defense-2025", "Peter Woods 2025 defense production row", "2025", "Defense & Fumbles", "2025", "12 games; 10 solo tackles; 20 assisted tackles; 30 combined tackles; 3.5 tackles for loss; 2.0 sacks; 1 pass defended."),
  observation("defense-career", "Peter Woods career defense production row", "Career through 2025", "Defense & Fumbles", "Career", "35 games; 41 solo tackles; 43 assisted tackles; 84 combined tackles; 14.5 tackles for loss; 5.0 sacks; 1 pass defended; 2 forced fumbles."),
  observation("rushing-career", "Peter Woods career rushing production row", "Career through 2025", "Rushing & Receiving", "Career", "8 rushing attempts; 15 rushing yards; 1.9 yards per attempt; 2 rushing touchdowns."),
]);

export const recordedObservationRefs = Object.freeze(recordedObservations.map((entry) => entry.observationId));
export default recordedObservations;
