import { draftRoomFixture } from "../sprint2B_2/fixture.js";
import { reduceDraftRoomState } from "../sprint2B_2/transitions.js";
import { buildDraftResultSnapshot } from "./DraftResultSnapshot.js";
import { buildDraftResultApplicationView } from "./applicationView.js";
import { deepFreeze } from "./constants.js";

function finalizeOnePickFixture() {
  const initial = draftRoomFixture.initialState;
  const prospectRef = initial.prospects[0].prospectRef;
  let state = reduceDraftRoomState(initial, { type: "PROSPECT_OPENED", prospectRef });
  if (state.prospects[0].warnings.some(({ category }) => category === "ELIGIBILITY_UNRESOLVED")) state = reduceDraftRoomState(state, { type: "WARNING_ACKNOWLEDGED" });
  state = reduceDraftRoomState(state, { type: "FIXTURE_SELECTION_PROPOSED", prospectRef });
  state = reduceDraftRoomState(state, { type: "FIXTURE_SELECTION_CONFIRMED", prospectRef });
  const snapshot = buildDraftResultSnapshot({ state, sourceProspects: draftRoomFixture.prospects.all, suppliedCompletedAtRef: "fixture-step:2" });
  return deepFreeze({ snapshot, view: buildDraftResultApplicationView(snapshot), finalizedState: state });
}

export const draftResultsFixture = finalizeOnePickFixture();
