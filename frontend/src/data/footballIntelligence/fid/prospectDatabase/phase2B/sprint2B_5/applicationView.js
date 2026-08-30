import { DRAFT_RESULT_VIEW_VERSION, clone, deepFreeze } from "./constants.js";
import { validateDraftResultSnapshot } from "./DraftResultSnapshot.js";

export function buildDraftResultApplicationView(snapshot) {
  const validation = validateDraftResultSnapshot(snapshot);
  if (!validation.valid) return deepFreeze({ contract: "DraftResultApplicationView", contractVersion: DRAFT_RESULT_VIEW_VERSION, status: "INVALID_RESULT", errors: validation.errors, recovery: "Return to the Draft Room fixture preview." });
  return deepFreeze({
    contract: "DraftResultApplicationView",
    contractVersion: DRAFT_RESULT_VIEW_VERSION,
    status: "READY",
    header: {
      title: "Draft Results Center",
      draftYear: snapshot.draftYear,
      resultStatus: snapshot.resultStatus,
      userTeamRef: snapshot.userTeamRef,
      totalSelections: snapshot.totalSelections,
      userSelections: snapshot.userSelectionCount,
      fixtureOnly: true,
      savedStatus: "NOT_SAVED",
      shareStatus: "NOT_SHAREABLE",
      sourceDraftRoomVersion: snapshot.draftRoomVersionRef,
    },
    userDraftClass: clone(snapshot.userDraftClass),
    history: clone(snapshot.completeHistory),
    teamSummaries: clone(snapshot.teamSummaries),
    distributions: clone(snapshot.distributions),
    warningSummary: clone(snapshot.warningSummary),
    tradeSummary: clone(snapshot.tradeSummary),
    futureIntelligence: clone(snapshot.futureIntelligence),
    limitations: clone(snapshot.limitations),
    actions: [
      { id: "RETURN_TO_DRAFT_ROOM", label: "Return to Draft Room Preview", enabled: true },
      { id: "START_NEW_FIXTURE", label: "Start New Fixture Draft", enabled: true },
    ],
  });
}
