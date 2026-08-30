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

export const kansasCityChiefsFootballEntityRevision1 = deepFreeze(createFootballEntity({
  entityId: "organization:kansas-city-chiefs",
  entityType: FOOTBALL_ENTITY_TYPES.ORGANIZATION,
  status: FOOTBALL_ENTITY_STATUSES.ACTIVE,
  identity: {
    canonicalName: "Kansas City Chiefs",
    displayName: "Kansas City Chiefs",
  },
  aliases: [],
  externalIdentifiers: [],
  references: {
    researchSourceRefs: ["research-source:rsp-0003:chiefs-peter-woods-selection"],
    researchSessionRefs: ["research-session:rsp-0003:official-draft-selection"],
    recordedObservationRefs: ["recorded-observation:rsp-0003:selecting-organization"],
    analyticalObservationRefs: [],
    evidenceArtifactRefs: ["evidence-artifact:rsp-0003:official-draft-selection"],
    otherRefs: [
      "evidence-review:rsp-0003:observation-3",
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
      "This record establishes canonical identity only; it does not establish an OrganizationProfile.",
      "League, location, conference, division, branding, and historical facts are not established.",
      "KC is not accepted as a canonical FID identity, alias, external identifier, or application mapping.",
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
    changeReason: "Initial canonical identity revision supported by approved RSP-0003.",
  },
}));

export default kansasCityChiefsFootballEntityRevision1;
