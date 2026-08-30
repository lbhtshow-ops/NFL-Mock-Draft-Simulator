export const prospectIdentifierConventionSnapshots = Object.freeze({
  existingCanonicalIdentityReuse: Object.freeze({ status: "CONVENTION_SATISFIED", canonicalReferencesToReuse: ["person:existing-person"], mayGenerateIdentifier: false }),
  newIdentityConventionSatisfied: Object.freeze({ status: "CONVENTION_SATISFIED", eligibleForFutureIssuanceRequest: true, mayIssueIdentifier: false }),
  draftCycleConflict: Object.freeze({ status: "CONVENTION_REVIEW_REQUIRED", stablePersonIdentityPreserved: true, mayReclassifyDraftCycle: false }),
  legacySimulatorRejected: Object.freeze({ status: "CONVENTION_BLOCKED", prohibitedLayerConflation: ["LEGACY_OR_APPLICATION_IDENTIFIER_AS_CANONICAL_IDENTITY"] }),
  persistenceSeparated: Object.freeze({ status: "CONVENTION_SATISFIED", storageKeyIsPublicIdentity: false, mayPersist: false }),
  crossRequestCollision: Object.freeze({ status: "CONVENTION_BLOCKED", collisionCount: 2, inputOrderSelectsWinner: false }),
  deprecatedIdentifier: Object.freeze({ status: "CONVENTION_SATISFIED", deprecatedIdentifierReference: "person:deprecated", survivingCanonicalReference: "person:survivor", mayDeprecateIdentifier: false }),
  firstCohortBatch: Object.freeze({ status: "CONVENTION_BLOCKED", assessmentCount: 4, eligibleCount: 0, executionAuthorized: false }),
});
export default prospectIdentifierConventionSnapshots;
