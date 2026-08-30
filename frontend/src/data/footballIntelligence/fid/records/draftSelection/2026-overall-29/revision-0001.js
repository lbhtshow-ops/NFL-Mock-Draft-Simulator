import { createDraftSelection } from "../../../draftSelection/DraftSelectionContract.js";
import {
  DRAFT_SELECTION_LIFECYCLE_STATES,
  DRAFT_SELECTION_TYPES,
  DRAFT_SELECTION_VERIFICATION_STATES,
} from "../../../draftSelection/draftSelectionConstants.js";

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

export const peterWoods2026Overall29DraftSelectionRevision1 = deepFreeze(createDraftSelection({
  selectionRef: "draft-selection:2026:overall-29",
  selectionRevision: 1,
  prospectRef: "prospect:peter-woods",
  selectingOrganizationRef: "organization:kansas-city-chiefs",
  draftCycleRef: "draft-cycle:2026",
  leagueRef: null,
  round: 1,
  overallPick: 29,
  selectionType: DRAFT_SELECTION_TYPES.UNKNOWN,
  selectionDate: null,
  effectiveAt: null,
  sourceRefs: ["research-source:rsp-0003:chiefs-peter-woods-selection"],
  evidenceArtifactRefs: ["evidence-artifact:rsp-0003:official-draft-selection"],
  reviewRefs: [
    "evidence-review:rsp-0003:session",
    "evidence-review:rsp-0003:observation-1",
    "evidence-review:rsp-0003:observation-2",
    "evidence-review:rsp-0003:observation-3",
    "evidence-review:rsp-0003:observation-4",
    "evidence-review:rsp-0003:observation-5",
    "evidence-review:rsp-0003:observation-6",
    "evidence-review:rsp-0003:artifact",
  ],
  verification: {
    state: DRAFT_SELECTION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
    reviewerRefs: ["reviewer:repository-owner"],
    verifiedAt: "2026-07-18",
    notes: "Approved RSP-0003 verifies the six direct selection facts independently.",
  },
  provenance: {
    createdBy: "reviewer:repository-owner",
    createdAt: "2026-07-18",
  },
  lifecycle: {
    state: DRAFT_SELECTION_LIFECYCLE_STATES.ACTIVE,
  },
  versioning: {
    predecessorSelectionRef: null,
    replacementSelectionRef: null,
    requestId: null,
    operationId: null,
    batchId: null,
  },
  limitations: [
    "The selection date is not established.",
    "Selection type remains UNKNOWN; trade history and compensatory status are not established.",
    "This record does not establish a profile, roster status, employment relationship, or player transition.",
    "This record does not migrate legacy prospect identifiers or create Population or persistence linkage.",
  ],
  extensions: {
    researchTraceability: {
      researchSessionRef: "research-session:rsp-0003:official-draft-selection",
      recordedObservationRefs: [
        "recorded-observation:rsp-0003:identity",
        "recorded-observation:rsp-0003:draft-cycle",
        "recorded-observation:rsp-0003:selecting-organization",
        "recorded-observation:rsp-0003:round",
        "recorded-observation:rsp-0003:overall-pick",
        "recorded-observation:rsp-0003:selection-event",
      ],
      analyticalObservationRefs: [],
      researchPackageRef: "research-package:rsp-0003",
    },
  },
}));

export default peterWoods2026Overall29DraftSelectionRevision1;
