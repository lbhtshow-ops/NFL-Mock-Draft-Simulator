import { ApplicationResolverBoundary } from "../sprint2B_1/ApplicationResolverBoundary.js";
import { fixtureProspectReferences } from "../sprint2B_1/FixtureResolver.js";
import { FIXTURE_DECLARATION, deepFreeze } from "./constants.js";
import { buildReferenceView, createInitialState, groupProspectsByPosition } from "./contracts.js";

export function assembleDraftRoomFixture() {
  const resolutions = ApplicationResolverBoundary.resolveProspects(fixtureProspectReferences);
  const views = resolutions.map((resolution, index) => buildReferenceView(resolution, index));
  const cards = views.map(({ card }) => card).filter(Boolean);
  const details = Object.fromEntries(views.filter(({ detail }) => detail).map(({ detail }) => [detail.prospectRef, detail]));
  const session = { draftSessionRef: "fixture-draft-session:2027:2b2:v1", draftYear: 2027, mode: "REPOSITORY_FIXTURE", userTeamRef: "fixture-team:alpha", totalRounds: 1, currentRound: 1, currentPick: 1, overallPick: 1, currentTeamRef: "fixture-team:alpha", status: "ACTIVE_FIXTURE", startedAtRef: "fixture-step:1", updatedAtRef: "fixture-step:1", boardVersionRef: "NO_GOVERNED_BOARD", fixtureVersionRef: "FID-DRAFT-ROOM-FIXTURE-1.0.0", selectionCount: 0, remainingPickCount: 2, fixtureSelectionAllowed: true, limitations: FIXTURE_DECLARATION.limitations };
  const pickContext = { pickRef: "fixture-pick:2027:1:1", round: 1, pickInRound: 1, overallPick: 1, originalTeamRef: "fixture-team:alpha", currentTeamRef: "fixture-team:alpha", ownershipChanged: false, tradeReference: null, userControlled: true, onTheClock: true, selectionStatus: "OPEN_FIXTURE", selectionReference: null, priorPickContext: null, nextPickContext: { pickRef: "fixture-pick:2027:1:2", round: 1, pickInRound: 2, overallPick: 2 }, limitations: ["Synthetic order; no live ownership or clock."] };
  const teamContext = { teamRef: "fixture-team:alpha", displayName: "Fixture Team Alpha", abbreviation: "FTA", currentPickRef: pickContext.pickRef, needs: [{ position: "OT", priority: "PLACEHOLDER_HIGH" }, { position: "CB", priority: "PLACEHOLDER_MEDIUM" }], needsDeclaration: "SYNTHETIC_FIXTURE_ONLY", schemeAvailability: "UNAVAILABLE", teamContextAvailability: "PLACEHOLDER", philosophyAvailability: "UNAVAILABLE", rosterContextAvailability: "UNAVAILABLE", limitations: ["Needs are synthetic and must not be presented as real 2027 team needs."] };
  const tradeState = { featureAvailability: "REFERENCE_ONLY_UNAVAILABLE", pendingTradeOfferRefs: [], acceptedTradeRef: null, currentPickOwnershipDeclaration: "UNCHANGED_FIXTURE_OWNER", tradeHistoryRefs: [], limitations: ["No trade engine, values, acceptance, or pick mutation."] };
  const initialState = createInitialState({ prospects: cards, session, pickContext, teamContext, tradeState });
  return deepFreeze({ contract: "DraftRoomFixturePackage", contractVersion: "FID-DRAFT-ROOM-FIXTURE-1.0.0", declaration: FIXTURE_DECLARATION, resolutions, session, pickContext, teamContext, tradeState, prospects: { all: cards, details, positionGroups: groupProspectsByPosition(cards), orderingDeclaration: "SOURCE_FIXTURE_ORDER_NON_RANKING" }, initialState });
}

export const draftRoomFixture = assembleDraftRoomFixture();
