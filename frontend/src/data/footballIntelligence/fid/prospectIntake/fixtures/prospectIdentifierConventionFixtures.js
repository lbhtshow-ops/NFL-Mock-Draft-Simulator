import { evaluateCanonicalProspectIdentityAuthority } from "../CanonicalProspectIdentityAuthorityEvaluator.js";
import { firstCohortIdentityAuthorityFixtures } from "./prospectIdentityAuthorityFixtures.js";

export const createIdentifierContextFixture = (key, overrides = {}) => Object.freeze({ contextId: `identifier-context:${key}`, requestId: `identifier-request:${key}`, operationId: `identifier-operation:${key}`, batchId: null, requestedIdentifierLayers: ["PERSON", "PLAYER", "PROSPECT", "PROSPECT_PROFILE"], existingCanonicalReferences: [], existingPersistenceReferences: [], legacyIdentifierReferences: [], collisionClasses: [], namespaceApproved: true, collisionReviewComplete: true, mergeReviewComplete: true, draftCycleConflict: false, draftCycleSeparatedFromStableIdentity: true, persistenceSeparatedFromCanonicalIdentity: true, formatApprovalReference: "CANONICAL_PROSPECT_IDENTIFIER_CONVENTION:1.0.0", actorAuthorityReferences: ["authority:fid-domain-owner"], deprecatedIdentifierReference: null, survivingCanonicalReference: null, ...overrides });

export const firstCohortIdentifierConventionFixtures = Object.freeze(firstCohortIdentityAuthorityFixtures.map(({ dryRunPlan, authorityContext }, index) => {
  const authorityDecision = evaluateCanonicalProspectIdentityAuthority(dryRunPlan, authorityContext);
  const name = ["arch-manning", "caleb-downs", "peter-woods", "francis-mauigoa"][index];
  return Object.freeze({ name, authorityDecision, identifierContext: createIdentifierContextFixture(name, { requestId: authorityDecision.requestRef, operationId: authorityDecision.operationRef, existingCanonicalReferences: name === "peter-woods" ? ["prospect:peter-woods"] : [], legacyIdentifierReferences: [{ reference: `2026-${name}`, classification: "LEGACY_RUNTIME_IDENTIFIER" }], draftCycleConflict: true }) });
}));
export default Object.freeze({ createIdentifierContextFixture, firstCohortIdentifierConventionFixtures });
