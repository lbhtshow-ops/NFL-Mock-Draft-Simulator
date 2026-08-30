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

export const peterWoodsProspectFootballEntityRevision1 = deepFreeze(createFootballEntity({
  entityId: "prospect:peter-woods",
  entityType: FOOTBALL_ENTITY_TYPES.PROSPECT,
  status: FOOTBALL_ENTITY_STATUSES.ACTIVE,
  identity: {
    canonicalName: "Peter Woods",
    displayName: "Peter Woods",
  },
  aliases: [],
  externalIdentifiers: [],
  references: {
    researchSourceRefs: ["research-source:rsp-0003:chiefs-peter-woods-selection"],
    researchSessionRefs: ["research-session:rsp-0003:official-draft-selection"],
    recordedObservationRefs: ["recorded-observation:rsp-0003:identity"],
    analyticalObservationRefs: [],
    evidenceArtifactRefs: ["evidence-artifact:rsp-0003:official-draft-selection"],
    otherRefs: [
      "evidence-review:rsp-0003:observation-1",
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
      "This record establishes the canonical FID identity of Peter Woods as a PROSPECT.",
      "This record does not establish a ProspectProfile or PlayerProfile.",
      "Position, school, measurements, statistics, rankings, evaluation, eligibility, and biographical facts are not established.",
      "This record does not establish a DraftSelection.",
      "This record does not migrate or replace legacy identity references and creates no Population linkage.",
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
    changeReason: "Initial canonical Prospect identity revision supported by approved RSP-0003.",
  },
}));

export default peterWoodsProspectFootballEntityRevision1;
