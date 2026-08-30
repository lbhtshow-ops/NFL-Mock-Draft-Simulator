import { createFootballEntity } from "../../../contracts/FootballEntityContract.js";
import {
  FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS,
  FOOTBALL_ENTITY_STATUSES,
  FOOTBALL_ENTITY_TYPES,
  FOOTBALL_ENTITY_VERIFICATION_STATES,
} from "../../../constants/footballEntityConstants.js";

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

export const nflDraft2026FootballEntityRevision1 = deepFreeze(createFootballEntity({
  entityId: "draft-cycle:2026",
  entityType: FOOTBALL_ENTITY_TYPES.DRAFT_CYCLE,
  status: FOOTBALL_ENTITY_STATUSES.ACTIVE,
  identity: {
    canonicalName: "2026 NFL Draft",
    displayName: "2026 NFL Draft",
  },
  aliases: [],
  externalIdentifiers: [],
  references: {
    researchSourceRefs: ["research-source:rsp-0003:chiefs-peter-woods-selection"],
    researchSessionRefs: ["research-session:rsp-0003:official-draft-selection"],
    recordedObservationRefs: ["recorded-observation:rsp-0003:draft-cycle"],
    analyticalObservationRefs: [],
    evidenceArtifactRefs: ["evidence-artifact:rsp-0003:official-draft-selection"],
    otherRefs: [
      "evidence-review:rsp-0003:observation-2",
      "evidence-review:rsp-0003:artifact",
      "research-package:rsp-0003",
    ],
  },
  verification: {
    state: FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
    identityConfidence: FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS.HIGH,
    verifiedBy: "reviewer:repository-owner",
    verifiedAt: "2026-07-18",
    limitations: [
      "This record establishes only the canonical identity of the 2026 NFL Draft cycle.",
      "Draft dates, venue, format, rules, rounds, order, participants, and completion status are not established.",
      "This record does not create a dedicated DraftCycle profile or domain.",
      "This record does not create or imply a DraftSelection record.",
    ],
  },
  provenance: {
    createdBy: "reviewer:repository-owner",
    createdAt: "2026-07-18",
    originSystem: "Research Repository",
    originRecordRef: "research-package:rsp-0003",
  },
  versioning: {
    entityVersion: 1,
    supersedesEntityRef: null,
    supersededByEntityRef: null,
    mergedIntoEntityRef: null,
    changeReason: "Initial canonical draft-cycle identity revision supported by approved RSP-0003.",
  },
}));

export default nflDraft2026FootballEntityRevision1;
