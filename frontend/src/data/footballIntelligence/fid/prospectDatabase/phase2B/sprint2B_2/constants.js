export const DRAFT_ROOM_CONTRACT_VERSION = "FID-DRAFT-ROOM-APPLICATION-DATA-1.0.0";

export const RESOLUTION_STATUSES = Object.freeze({ RESOLVED: "RESOLVED", UNKNOWN: "UNKNOWN_REFERENCE", BLOCKED: "BLOCKED_REFERENCE" });
export const READINESS = Object.freeze({ READY: "READY_FOR_FIXTURE_PRESENTATION", LIMITED: "READY_WITH_LIMITATIONS", PRESENTATION_ONLY: "PRESENTATION_ONLY", NOT_SELECTABLE: "NOT_SELECTABLE", BLOCKED: "BLOCKED_REFERENCE", UNKNOWN: "UNKNOWN_REFERENCE" });
export const SELECTION_STATUSES = Object.freeze({ NONE: "NONE_SELECTED", VIEWING: "VIEWING", READY: "READY_TO_SELECT", BLOCKED: "SELECTION_BLOCKED", CONFIRMED: "SELECTION_CONFIRMED_FIXTURE", DRAFTED: "ALREADY_DRAFTED", UNAVAILABLE: "NOT_AVAILABLE" });
export const SORT_MODES = Object.freeze(["SOURCE_FIXTURE_ORDER", "NAME_ASC", "POSITION_THEN_NAME", "PROGRAM_THEN_NAME", "PRODUCTION_AVAILABILITY", "DATA_COMPLETENESS"]);
export const WARNING_CATEGORIES = Object.freeze({ ELIGIBILITY: "ELIGIBILITY_UNRESOLVED", DECLARATION: "DECLARATION_UNRESOLVED", PROGRAM_PROVISIONAL: "PROGRAM_REFERENCE_PROVISIONAL", PROGRAM_CONTRADICTORY: "PROGRAM_REFERENCE_CONTRADICTORY", TESTING: "TESTING_UNAVAILABLE", PRODUCTION: "PRODUCTION_LIMITED", REVIEW: "SCOUTING_REVIEW_INCOMPLETE", DATA: "DATA_LIMITED", SOURCE: "SOURCE_LIMITED", BLOCKED: "PROSPECT_BLOCKED", UNKNOWN: "REFERENCE_UNKNOWN" });
export const WARNING_SEVERITIES = Object.freeze(["INFO", "CAUTION", "BLOCKING"]);

export const DEFAULT_FILTERS = Object.freeze({ searchQuery: "", position: "ALL", program: "ALL", availability: "AVAILABLE", testingStatus: "ALL", eligibilityWarning: "ALL", readiness: "ALL", watchedOnly: false, sort: "SOURCE_FIXTURE_ORDER" });

export const FIXTURE_DECLARATION = Object.freeze({ fixtureOnly: true, rankingClaim: false, realDraftOrderClaim: false, persistentSessionClaim: false, productionSimulatorClaim: false, limitations: Object.freeze(["Synthetic session and team context for repository diagnostics only.", "Fixture order is cohort source order and is not a ranking.", "Team needs are synthetic placeholders, not current NFL intelligence."]) });

export function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

export const clone = (value) => structuredClone(value);
