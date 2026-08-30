import { DEFAULT_FILTERS, DRAFT_ROOM_CONTRACT_VERSION, READINESS, RESOLUTION_STATUSES, SELECTION_STATUSES, SORT_MODES, WARNING_CATEGORIES, clone, deepFreeze } from "./constants.js";

const warning = (category, severity, message) => Object.freeze({ category, severity, message });
const text = (value, fallback = "Unavailable") => typeof value === "string" && value.trim() ? value.trim() : fallback;

export function buildWarnings(prospect) {
  const warnings = [];
  const eligibility = `${prospect.eligibility?.status ?? ""}`;
  const declaration = `${prospect.eligibility?.declarationStatus ?? ""}`;
  const program = `${prospect.program?.status ?? ""}`;
  if (/UNRESOLVED|REVIEW|PROVISIONAL|REQUIRED/i.test(eligibility)) warnings.push(warning(WARNING_CATEGORIES.ELIGIBILITY, "CAUTION", "Draft eligibility remains under review."));
  if (!declaration || /UNRESOLVED|UNKNOWN|NOT_CONFIRMED|REQUIRED/i.test(declaration)) warnings.push(warning(WARNING_CATEGORIES.DECLARATION, "CAUTION", "Draft declaration status is unresolved."));
  if (/CONTRADICT/i.test(program)) warnings.push(warning(WARNING_CATEGORIES.PROGRAM_CONTRADICTORY, "CAUTION", "Program information contains an unresolved contradiction."));
  else if (/PROVISIONAL|UNRESOLVED|REQUIRED/i.test(program)) warnings.push(warning(WARNING_CATEGORIES.PROGRAM_PROVISIONAL, "INFO", "Program reference is provisional."));
  if (!prospect.testingStatus || /UNAVAILABLE|NOT_AVAILABLE|NONE/i.test(`${prospect.testingStatus.status}`)) warnings.push(warning(WARNING_CATEGORIES.TESTING, "INFO", "Verified testing data is unavailable."));
  if (!prospect.productionSummary || /LIMITED|PARTIAL|INCOMPLETE/i.test(`${prospect.productionSummary.completeness}`)) warnings.push(warning(WARNING_CATEGORIES.PRODUCTION, "INFO", "Production data is limited."));
  if (/INCOMPLETE|PARTIAL|LIMITED/i.test(`${prospect.evidenceSummary?.scoutingCompleteness ?? prospect.reviewStatus}`)) warnings.push(warning(WARNING_CATEGORIES.REVIEW, "INFO", "Scouting review is incomplete."));
  if (prospect.limitations?.length) warnings.push(warning(WARNING_CATEGORIES.DATA, "INFO", "Additional data limitations apply."));
  return deepFreeze(warnings);
}

export function deriveReadiness(prospect, warnings = buildWarnings(prospect)) {
  if (!prospect) return READINESS.UNKNOWN;
  if (warnings.some(({ severity }) => severity === "BLOCKING")) return READINESS.NOT_SELECTABLE;
  return warnings.length || /LIMITATION/i.test(`${prospect.draftRoomReadiness}`) ? READINESS.LIMITED : READINESS.READY;
}

export function buildProspectViews(prospect, fixtureOrder) {
  const warnings = buildWarnings(prospect);
  const readiness = deriveReadiness(prospect, warnings);
  const measurements = Object.freeze({ height: prospect.height ?? null, weight: prospect.weight ?? null });
  const presentation = Object.freeze({ compact: Object.freeze(["displayName", "officialPosition", "program", "measurements", "productionSummary", "warningCount"]), expanded: Object.freeze(["measurements", "productionSummary", "testingStatus", "strengths", "concerns", "evidenceSummary", "limitations"]) });
  const common = { prospectRef: prospect.reference, displayName: prospect.displayName, program: clone(prospect.program), officialPosition: prospect.officialPosition, projectedRole: prospect.projectedRole, measurements, productionSummary: clone(prospect.productionSummary), testingStatus: clone(prospect.testingStatus), eligibility: clone(prospect.eligibility), reviewStatus: prospect.reviewStatus, evidenceSummary: clone(prospect.evidenceSummary), limitations: clone(prospect.limitations), warnings, warningCount: warnings.length, readiness, fixtureOrder, orderingDeclaration: "SOURCE_FIXTURE_ORDER_NON_RANKING", presentation };
  return deepFreeze({
    card: { contract: "DraftRoomProspectCardView", contractVersion: DRAFT_ROOM_CONTRACT_VERSION, ...common, strengthSummary: prospect.strengths?.[0]?.statement ?? "Unavailable", concernSummary: prospect.concerns?.[0]?.statement ?? "Unavailable", drafted: false, selectable: true, selected: false, watched: false },
    detail: { contract: "DraftRoomProspectDetailView", contractVersion: DRAFT_ROOM_CONTRACT_VERSION, ...common, strengths: clone(prospect.strengths ?? []), concerns: clone(prospect.concerns ?? []), availability: { measurements: Boolean(prospect.height || prospect.weight), production: Boolean(prospect.productionSummary), testing: Boolean(prospect.testingStatus), scouting: Boolean(prospect.strengths?.length || prospect.concerns?.length) }, futureIntelligence: "NOT_CALCULATED" }
  });
}

export function buildReferenceView(resolution, fixtureOrder = -1) {
  if (resolution.status === RESOLUTION_STATUSES.RESOLVED) return buildProspectViews(resolution.prospect, fixtureOrder);
  const category = resolution.status === RESOLUTION_STATUSES.BLOCKED ? WARNING_CATEGORIES.BLOCKED : WARNING_CATEGORIES.UNKNOWN;
  const readiness = resolution.status === RESOLUTION_STATUSES.BLOCKED ? READINESS.BLOCKED : READINESS.UNKNOWN;
  return deepFreeze({ resolution: { prospectRef: resolution.reference, status: resolution.status, readiness, selectable: false, warnings: [warning(category, "BLOCKING", resolution.status === RESOLUTION_STATUSES.BLOCKED ? "This prospect is unavailable for fixture selection." : "This prospect reference is not recognized.")] } });
}

export function createInitialState({ prospects, session, pickContext, teamContext, tradeState }) {
  return deepFreeze({ contract: "DraftRoomSessionView", contractVersion: DRAFT_ROOM_CONTRACT_VERSION, session: clone(session), pickContext: clone(pickContext), teamContext: clone(teamContext), prospects: clone(prospects), filters: { ...DEFAULT_FILTERS }, selectedProspectRef: null, selection: { status: SELECTION_STATUSES.NONE, prospectRef: null, eligibilityWarningAcknowledged: false }, watchedProspectRefs: [], draftedProspectRefs: [], history: [], userDraftClass: { userTeamRef: session.userTeamRef, selectionCount: 0, selections: [], positionDistribution: {}, programDistribution: {}, unresolvedWarningCount: 0, dataCompletenessSummary: "NO_SELECTIONS", tradeReferenceCount: 0, fixtureOnly: true, limitations: ["Current fixture summary only; not a Draft Results contract."] }, tradeState: clone(tradeState), declaration: { fixtureOnly: true, persistent: false, simulatorConnected: false } });
}

export function selectProspects(state) {
  const query = state.filters.searchQuery.trim().toLocaleLowerCase();
  let items = state.prospects.filter((p) => !state.draftedProspectRefs.includes(p.prospectRef));
  if (query) items = items.filter((p) => `${p.displayName} ${p.program?.displayName ?? ""}`.toLocaleLowerCase().includes(query));
  if (state.filters.position !== "ALL") items = items.filter((p) => p.officialPosition === state.filters.position);
  if (state.filters.program !== "ALL") items = items.filter((p) => p.program?.displayName === state.filters.program);
  if (state.filters.testingStatus !== "ALL") items = items.filter((p) => p.testingStatus?.status === state.filters.testingStatus);
  if (state.filters.readiness !== "ALL") items = items.filter((p) => p.readiness === state.filters.readiness);
  if (state.filters.eligibilityWarning !== "ALL") items = items.filter((p) => p.warnings.some(({ category }) => category === WARNING_CATEGORIES.ELIGIBILITY));
  if (state.filters.watchedOnly) items = items.filter((p) => state.watchedProspectRefs.includes(p.prospectRef));
  const sort = SORT_MODES.includes(state.filters.sort) ? state.filters.sort : DEFAULT_FILTERS.sort;
  const compareName = (a, b) => a.displayName.localeCompare(b.displayName);
  const comparators = { NAME_ASC: compareName, POSITION_THEN_NAME: (a, b) => a.officialPosition.localeCompare(b.officialPosition) || compareName(a, b), PROGRAM_THEN_NAME: (a, b) => text(a.program?.displayName).localeCompare(text(b.program?.displayName)) || compareName(a, b), SOURCE_FIXTURE_ORDER: (a, b) => a.fixtureOrder - b.fixtureOrder, PRODUCTION_AVAILABILITY: (a, b) => Number(Boolean(b.productionSummary)) - Number(Boolean(a.productionSummary)) || compareName(a, b), DATA_COMPLETENESS: (a, b) => a.warningCount - b.warningCount || compareName(a, b) };
  return deepFreeze([...items].sort(comparators[sort]));
}

export function groupProspectsByPosition(prospects) {
  const groups = prospects.reduce((result, prospect) => { (result[prospect.officialPosition] ??= []).push(prospect); return result; }, {});
  return deepFreeze(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([position, items]) => ({ position, count: items.length, prospects: items })));
}
