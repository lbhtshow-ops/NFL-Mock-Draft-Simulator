import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";
import { createProspectIdentifierSpecification, isProspectIdentifierSpecification } from "./ProspectIdentifierSpecification.js";
import { CANONICAL_PROSPECT_IDENTIFIER_CONVENTION_ID, CANONICAL_PROSPECT_IDENTIFIER_CONVENTION_VERSION } from "./prospectIdentifierConventionConstants.js";

const spec = (identifierType, semanticOwner, namespace, overrides = {}) => createProspectIdentifierSpecification({ identifierType, semanticOwner, namespace, format: "<namespace>:<immutable-assigned-segment>", formatStatus: "APPROVED", issuer: "FID_DOMAIN_OWNER_WITH_SEPARATE_ISSUANCE_AUTHORITY", callerSuppliedAllowed: false, deterministic: false, opaque: false, immutable: true, revisionScoped: false, draftCycleScoped: false, persistenceScoped: false, globallyUnique: true, domainUnique: true, reuseRequired: true, mergeBehavior: "AUTHORIZED_MERGE_PRESERVES_SURVIVOR_AND_ALIAS_MAPPING", deprecationBehavior: "NON_DESTRUCTIVE_DEPRECATION_WITH_SUCCESSOR_REFERENCE", validationRule: "VALIDATE_NAMESPACE_TYPE_AND_EXISTING_ID_REUSE_WITHOUT_GENERATION", prohibitedInputs: ["NAME", "ALIAS", "SCHOOL", "TEAM", "POSITION", "DRAFT_CYCLE", "DECLARATION_STATUS", "RANKING", "SCOUTING_GRADE", "SIMULATOR_STATE", "PERSISTENCE_ID"], ...overrides });

export const CANONICAL_PROSPECT_IDENTIFIER_CONVENTION = deepFreeze({
  conventionId: CANONICAL_PROSPECT_IDENTIFIER_CONVENTION_ID, conventionVersion: CANONICAL_PROSPECT_IDENTIFIER_CONVENTION_VERSION, domain: "PROSPECT_IDENTITY", status: "ACTIVE",
  conventionDecision: "HYBRID", decisionRationale: "Governed canonical references use stable namespaced identity; human-readable slugs, storage keys, and operational identifiers remain separate. The convention does not define or embed a generator.",
  identifierLayers: [
    spec("PERSON", "STABLE_HUMAN_IDENTITY", "person"),
    spec("PLAYER", "FOOTBALL_PARTICIPATION_ROLE_FOR_PERSON", "player"),
    spec("PROSPECT", "STABLE_DRAFT_PROSPECT_DOMAIN_ROLE", "prospect"),
    spec("PROSPECT_PROFILE", "PROSPECT_FACTUAL_AND_ANALYTICAL_PROFILE_CHAIN", "prospect-profile", { draftCycleScoped: true, revisionScoped: true }),
    spec("CANONICAL_RECORD", "VERSION_INDEPENDENT_SOURCE_CONTROLLED_RECORD_CHAIN", "record", { format: "records/<domain>/<record-slug>/revision-NNNN.js", globallyUnique: false, issuer: "FID_RECORD_OWNER" }),
    spec("PERSISTENCE", "STORAGE_ROW_REVISION", "persistence", { formatStatus: "EXTERNAL_CONTRACT", issuer: "PERSISTENCE_ADAPTER_OR_AUTHORIZED_CALLER", persistenceScoped: true, revisionScoped: true, deterministic: false, opaque: true, prohibitedInputs: ["PUBLIC_FOOTBALL_IDENTITY"] }),
    spec("RECORD_REVISION", "IMMUTABLE_RECORD_REVISION", "revision", { format: "POSITIVE_INTEGER_AND_REVISION_NNNN_SOURCE_PATH", issuer: "FID_RECORD_OWNER", revisionScoped: true, globallyUnique: false }),
    ...["SOURCE", "RESEARCH_ARTIFACT", "EVIDENCE", "RELATIONSHIP", "REQUEST", "OPERATION", "BATCH", "DECISION", "PROMOTION"].map((type) => spec(type, `${type}_RECORD_OR_OPERATION`, type.toLowerCase().replaceAll("_", "-"), { globallyUnique: false, issuer: type === "REQUEST" || type === "OPERATION" || type === "BATCH" ? "CALLER_OR_OWNING_OPERATION_CONTRACT" : "OWNING_DOMAIN_CONTRACT", callerSuppliedAllowed: true })),
    spec("SIMULATOR", "SIMULATOR_RUNTIME_ENTRY", "simulator", { formatStatus: "PROHIBITED_AS_CANONICAL", issuer: "SIMULATOR", globallyUnique: false, domainUnique: true, reuseRequired: false, prohibitedInputs: ["CANONICAL_AUTHORITY_CLAIM"] }),
    spec("UI_SLUG", "APPLICATION_ROUTE", "ui", { formatStatus: "PROHIBITED_AS_CANONICAL", issuer: "APPLICATION", globallyUnique: false, domainUnique: false, immutable: false, reuseRequired: false }),
    spec("LEGACY_FIXTURE", "LEGACY_OR_DEVELOPMENT_DATA", "legacy", { formatStatus: "LEGACY_ONLY", issuer: "LEGACY_SYSTEM", globallyUnique: false, domainUnique: false, immutable: false, reuseRequired: false }),
  ],
  namespaceRules: { canonicalEntityPattern: "<namespace>:<immutable-assigned-segment>", namespaceMustMatchIdentifierType: true, whitespaceProhibited: true, mutableClassificationInCanonicalSegmentProhibited: true },
  ownershipRules: { person: "FID_PERSON_DOMAIN", player: "FID_PLAYER_DOMAIN", prospect: "FID_PROSPECT_DOMAIN", prospectProfile: "FID_PROSPECT_PROFILE_DOMAIN", persistence: "FID_PERSISTENCE" },
  issuanceRules: { separateIssuanceRequestRequired: true, authorityDecisionRequired: "ISSUE_NEW_IDENTITY", conventionAssessmentRequired: "CONVENTION_SATISFIED", callerMayNotSelfIssueCanonicalIdentity: true, generationImplemented: false },
  reuseRules: { existingExactCanonicalIdentityMustBeReused: true, authorizedMergeSurvivorMustBeReused: true, nameAliasSchoolPositionCycleOrSimulatorMatchInsufficient: true },
  collisionRules: { exactIdentifier: "REUSE_OR_BLOCK", namespace: "BLOCK", semanticIdentity: "REVIEW", legacy: "REVIEW", persistence: "BLOCK", crossRequest: "BLOCK_ALL_NO_ORDERED_WINNER" },
  revisionRules: { canonicalIdentitySurvivesRevision: true, canonicalRecordChainSurvivesRevision: true, persistenceIdMayChangePerRevision: true, profileRevisionDoesNotReplacePerson: true },
  mergeRules: { authorityRequired: true, preserveSurvivor: true, preserveAliasMapping: true, preserveRelationships: true, destructiveDeletionProhibited: true, executionAuthorized: false },
  deprecationRules: { authorityRequired: true, successorReferenceRequired: true, auditTrailRequired: true, destructiveDeletionProhibited: true, executionAuthorized: false },
  draftCycleRules: { personScoped: false, playerScoped: false, prospectScoped: false, prospectProfileScoped: true, classificationMetadataAllowed: true, reclassificationAuthorized: false, conflictCreatesNewPerson: false },
  persistenceRules: { canonicalAndPersistenceDistinct: true, databasePrimaryKeyIsNotDomainIdentity: true, predecessorPersistenceReferenceIsRevisionAware: true, storageKeysPublicByDefault: false },
  simulatorRules: { establishesCanonicalIdentity: false, mayReferenceCanonicalIdentityLater: true, overridesFidIdentity: false },
  legacyRules: { operationalUseConfersCanonicalAuthority: false, migrationAuthorized: false, explicitReviewRequired: true },
  validationRules: ["TYPE_AND_NAMESPACE_MATCH", "NO_WHITESPACE", "NO_MUTABLE_CLASSIFICATION_INPUT", "NO_STORAGE_KEY_SUBSTITUTION", "NO_OPERATION_ID_SUBSTITUTION", "NO_SIMULATOR_OR_UI_SUBSTITUTION", "EXISTING_ID_REUSE", "COLLISION_REVIEW", "MERGE_AND_DEPRECATION_STATE_REVIEW"],
});

export function validateCanonicalProspectIdentifierConvention(value) { const errors = []; if (value?.conventionId !== CANONICAL_PROSPECT_IDENTIFIER_CONVENTION_ID) errors.push({ code: "CONVENTION_ID_MISMATCH", path: "conventionId" }); if (value?.conventionVersion !== CANONICAL_PROSPECT_IDENTIFIER_CONVENTION_VERSION || value?.status !== "ACTIVE" || value?.domain !== "PROSPECT_IDENTITY") errors.push({ code: "CONVENTION_SCOPE_INVALID", path: "conventionVersion" }); if (!Array.isArray(value?.identifierLayers) || value.identifierLayers.length !== 19 || value.identifierLayers.some((item) => !isProspectIdentifierSpecification(item))) errors.push({ code: "IDENTIFIER_LAYER_INVENTORY_INVALID", path: "identifierLayers" }); if (value?.issuanceRules?.generationImplemented !== false || value?.mergeRules?.executionAuthorized !== false) errors.push({ code: "EXECUTION_PROHIBITION_INVALID", path: "issuanceRules" }); return deepFreeze({ valid: errors.length === 0, errors, warnings: [] }); }
export default Object.freeze({ CANONICAL_PROSPECT_IDENTIFIER_CONVENTION, validateCanonicalProspectIdentifierConvention });
