import { DEFAULT_FILTERS, SELECTION_STATUSES, SORT_MODES, clone, deepFreeze } from "./constants.js";

const next = (state, changes) => deepFreeze({ ...clone(state), ...changes });
const find = (state, prospectRef) => state.prospects.find((prospect) => prospect.prospectRef === prospectRef);

export function reduceDraftRoomState(state, event) {
  switch (event.type) {
    case "SEARCH_CHANGED": return next(state, { filters: { ...state.filters, searchQuery: `${event.query ?? ""}` } });
    case "FILTER_CHANGED": return next(state, { filters: { ...state.filters, [event.filter]: event.value } });
    case "SORT_CHANGED": return SORT_MODES.includes(event.sort) ? next(state, { filters: { ...state.filters, sort: event.sort } }) : state;
    case "FILTERS_RESET": return next(state, { filters: { ...DEFAULT_FILTERS } });
    case "PROSPECT_OPENED": {
      const prospect = find(state, event.prospectRef);
      if (!prospect) return next(state, { selection: { status: SELECTION_STATUSES.UNAVAILABLE, prospectRef: event.prospectRef, eligibilityWarningAcknowledged: false } });
      return next(state, { selectedProspectRef: prospect.prospectRef, selection: { status: state.draftedProspectRefs.includes(prospect.prospectRef) ? SELECTION_STATUSES.DRAFTED : SELECTION_STATUSES.VIEWING, prospectRef: prospect.prospectRef, eligibilityWarningAcknowledged: false } });
    }
    case "PROSPECT_CLOSED": return next(state, { selectedProspectRef: null, selection: { status: SELECTION_STATUSES.NONE, prospectRef: null, eligibilityWarningAcknowledged: false } });
    case "PROSPECT_WATCHED": return state.watchedProspectRefs.includes(event.prospectRef) || !find(state, event.prospectRef) ? state : next(state, { watchedProspectRefs: [...state.watchedProspectRefs, event.prospectRef] });
    case "PROSPECT_UNWATCHED": return next(state, { watchedProspectRefs: state.watchedProspectRefs.filter((ref) => ref !== event.prospectRef) });
    case "WARNING_ACKNOWLEDGED": return next(state, { selection: { ...state.selection, eligibilityWarningAcknowledged: true } });
    case "FIXTURE_SELECTION_PROPOSED": {
      const prospect = find(state, event.prospectRef);
      const eligible = prospect && !state.draftedProspectRefs.includes(event.prospectRef) && state.session.status === "ACTIVE_FIXTURE" && state.pickContext.onTheClock && state.pickContext.userControlled && state.session.fixtureSelectionAllowed;
      const warningRequired = prospect?.warnings.some(({ category }) => category === "ELIGIBILITY_UNRESOLVED");
      return next(state, { selectedProspectRef: event.prospectRef, selection: { ...state.selection, prospectRef: event.prospectRef, status: eligible && (!warningRequired || state.selection.eligibilityWarningAcknowledged) ? SELECTION_STATUSES.READY : SELECTION_STATUSES.BLOCKED } });
    }
    case "FIXTURE_SELECTION_CONFIRMED": return confirmSelection(state, event.prospectRef);
    case "STATE_RESET": return deepFreeze(clone(event.initialState));
    default: return state;
  }
}

function confirmSelection(state, prospectRef) {
  if (state.selection.status !== SELECTION_STATUSES.READY || state.selection.prospectRef !== prospectRef) return state;
  const prospect = find(state, prospectRef);
  if (!prospect || state.draftedProspectRefs.includes(prospectRef)) return state;
  const selection = deepFreeze({ selectionRef: `fixture-selection:${state.pickContext.pickRef}:${prospectRef}`, pickRef: state.pickContext.pickRef, round: state.pickContext.round, overallPick: state.pickContext.overallPick, teamRef: state.pickContext.currentTeamRef, prospectRef, prospectDisplayNameSnapshot: prospect.displayName, positionSnapshot: prospect.officialPosition, programSnapshot: prospect.program?.displayName ?? "Unavailable", selectionType: "USER_FIXTURE", userOrCpuDeclaration: "USER", tradeReference: state.pickContext.tradeReference, fixtureOnly: true, limitations: ["Immutable fixture event; not durable draft history."] });
  const selections = [...state.userDraftClass.selections, selection];
  const distribution = (field) => selections.reduce((result, item) => ({ ...result, [item[field]]: (result[item[field]] ?? 0) + 1 }), {});
  return next(state, { draftedProspectRefs: [...state.draftedProspectRefs, prospectRef], history: [...state.history, selection], selection: { status: SELECTION_STATUSES.CONFIRMED, prospectRef, eligibilityWarningAcknowledged: state.selection.eligibilityWarningAcknowledged }, session: { ...state.session, selectionCount: state.session.selectionCount + 1, remainingPickCount: Math.max(0, state.session.remainingPickCount - 1), currentRound: 1, currentPick: 2, overallPick: state.session.overallPick + 1, updatedAtRef: "fixture-step:2" }, pickContext: { ...state.pickContext, onTheClock: false, selectionStatus: "SELECTED_FIXTURE", selectionReference: selection.selectionRef, nextPickContext: { pickRef: "fixture-pick:2027:1:2", round: 1, pickInRound: 2, overallPick: 2 } }, userDraftClass: { ...state.userDraftClass, selectionCount: selections.length, selections, positionDistribution: distribution("positionSnapshot"), programDistribution: distribution("programSnapshot"), unresolvedWarningCount: selections.reduce((count, item) => count + (find(state, item.prospectRef)?.warningCount ?? 0), 0), dataCompletenessSummary: "LIMITED_NORMALIZED_FIXTURE_DATA" } });
}
