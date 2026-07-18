import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import prospectIntakeApi, * as namedProspectIntakeApi from "../prospectIntake/index.js";
import sprint20Constants, * as namedSprint20Constants from "../prospectIntake/prospectWatchlistConstants.js";
import sprint20WatchlistApi, * as namedSprint20WatchlistApi from "../prospectIntake/ProspectWatchlistContract.js";
import sprint20IdentityApi, * as namedSprint20IdentityApi from "../prospectIntake/ProspectIdentityIntakeContract.js";
import { runProspectIntakeArchitectureDiagnostics } from "./runProspectIntakeArchitectureDiagnostics.js";

const SUITE = "ProspectWatchlistIdentityIntakeDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONSTANTS_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/prospectWatchlistConstants.js"), "utf8");
const WATCHLIST_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectWatchlistContract.js"), "utf8");
const IDENTITY_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/ProspectIdentityIntakeContract.js"), "utf8");
const INTAKE_INDEX_SOURCE = readFileSync(resolve(ROOT, "prospectIntake/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const PRODUCTION_SOURCE = [CONSTANTS_SOURCE, WATCHLIST_SOURCE, IDENTITY_SOURCE, INTAKE_INDEX_SOURCE].join("\n");

const GROUPS = Object.freeze([
  "identities-versions", "frozen-vocabularies", "watchlist-minimal-full", "unavailable-invalid-input",
  "mutation-stability-null", "watchlist-type-status", "entry-status-priority", "discovery-submitted-claims",
  "identity-minimal-full", "claim-independence-status", "identity-conflicts", "duplicate-concerns",
  "proposed-matches", "review-final-outcome", "multiple-watchlists-removal", "revision-boundaries",
  "fictional-2027-compatibility", "architectural-boundaries", "extension-safety", "export-compatibility",
  "prior-diagnostic-integration", "no-generated-evaluation-output",
]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from({ length: 20 }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function watchlistEntry(variant, overrides = {}) {
  const numericVariant = Number.parseInt(String(variant).replaceAll(/\D/g, ""), 10) || 1;
  return {
    entryId: `entry-${variant}`, intakeCandidateRef: `intake-candidate-${variant}`, submittedLabel: `Fictional Candidate ${variant}`,
    submittedSchool: `Fictional School ${variant}`, submittedPosition: variant % 2 ? "POSITION-A" : "POSITION-B",
    submittedClassYear: variant % 3 ? "UNRESOLVED" : null, submittedRosterNumber: variant % 4 ? String(variant) : null,
    providerIdentifiers: { fictionalProvider: `provider-${variant}` }, discoveryOrigin: "MANUAL_RESEARCH",
    discoveryContext: { declaredReason: "Generic diagnostics-only submission" }, entryStatus: "SUBMITTED", priority: "STANDARD",
    revision: 1, addedAt: `2026-08-${String((numericVariant % 20) + 1).padStart(2, "0")}T12:00:00Z`, removedAt: null,
    removalReason: null, sourceRefs: [`research-source-${variant}`], evidenceRefs: [`evidence-${variant}`], reviewRefs: [], blockerRefs: [],
    notes: "Submitted fields remain unverified intake claims.", extensions: { workflow: { queueLabel: `queue-${variant}` } }, ...overrides,
  };
}

function minimalWatchlist(variant, overrides = {}) {
  return { watchlistId: `watchlist-${variant}`, cycleRef: "cycle:fictional:2027", watchlistType: "PRESEASON", status: "DRAFT", ...overrides };
}

function fullWatchlist(variant, overrides = {}) {
  return {
    ...minimalWatchlist(variant), label: `Fictional 2027 Watchlist ${variant}`, description: "Diagnostics-only watchlist.", revision: 2,
    candidateEntries: [watchlistEntry(variant)], sourceRefs: [`source-${variant}`], evidenceRefs: [`artifact-${variant}`],
    reviewRefs: [`review-${variant}`], workflowRefs: [`workflow-${variant}`],
    verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-08-21T12:00:00Z", notes: null },
    provenance: { createdBy: `author-${variant}`, createdAt: "2026-08-01T12:00:00Z", updatedBy: `author-${variant}`, updatedAt: "2026-08-22T12:00:00Z" },
    lifecycle: { state: "OPEN", createdAt: "2026-08-01T12:00:00Z", closedAt: null, archivedAt: null, supersedesWatchlistRef: null, supersededByWatchlistRef: null },
    notes: "Watchlist inclusion is only an intake decision.", extensions: { workflow: { researchQueue: "identity" } }, ...overrides,
  };
}

function identityClaim(variant, suffix = "name", overrides = {}) {
  return {
    claimId: `claim-${variant}-${suffix}`, claimType: suffix === "school" ? "SCHOOL" : "NAME", claimedValue: `Fictional ${suffix} ${variant}`,
    normalizedDisplayValue: `Fictional ${suffix} ${variant}`, subjectScope: "INTAKE_CANDIDATE", status: "SUPPORTED",
    sourceRefs: [`source-${variant}-${suffix}`], evidenceRefs: [`evidence-${variant}-${suffix}`], reviewerRefs: [`reviewer-${variant}`],
    confidenceDeclaration: "HUMAN_DECLARATION_ONLY", limitations: ["Not a canonical fact"], notes: null,
    verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-08-20T12:00:00Z", notes: null }, ...overrides,
  };
}

function minimalIdentity(variant, overrides = {}) {
  return { identityIntakeId: `identity-intake-${variant}`, intakeCandidateRef: `intake-candidate-${variant}`, cycleRef: "cycle:fictional:2027", ...overrides };
}

function fullIdentity(variant, overrides = {}) {
  return {
    ...minimalIdentity(variant), submittedIdentity: {
      submittedName: `Fictional Candidate ${variant}`, aliases: [], submittedSchool: `Fictional School ${variant}`,
      submittedPosition: "POSITION-A", submittedClassYear: null, submittedRosterNumber: String(variant), submittedDateOfBirth: null,
      providerIdentifiers: { fictionalProvider: `provider-${variant}` }, submittedTeamRef: `team-submission-${variant}`,
      submittedOrganizationRef: `organization-submission-${variant}`, sourceRefs: [`source-${variant}`], evidenceRefs: [`evidence-${variant}`], notes: "Unverified submission",
    },
    identityClaims: [identityClaim(variant), identityClaim(variant, "school", { status: "CONFLICTED" })],
    identityConflicts: [{ conflictId: `conflict-${variant}`, conflictType: "SCHOOL_CONFLICT", claimRefs: [`claim-${variant}-school`], candidateRefs: [`intake-candidate-${variant}`, `other-candidate-${variant}`], description: "Conflicting submitted schools", status: "OPEN", severity: "MODERATE", sourceRefs: [], evidenceRefs: [], reviewRefs: [], resolutionDeclaration: null, resolvedAt: null, notes: null }],
    duplicateConcerns: [{ concernId: `duplicate-${variant}`, relatedCandidateRefs: [`other-candidate-${variant}`], matchingFields: ["submittedName"], differingFields: ["submittedSchool"], evidenceRefs: [], reviewerRefs: [], status: "POSSIBLE_DUPLICATE", resolutionDeclaration: null, notes: null }],
    proposedMatches: [{ proposedMatchId: `match-${variant}`, candidateRef: `intake-candidate-${variant}`, proposedEntityRef: `proposed-entity-${variant}`, proposedPersonProfileRef: `proposed-person-${variant}`, matchBasis: ["Reviewed identity claims"], sourceRefs: [], evidenceRefs: [], reviewerRef: `reviewer-${variant}`, reviewStatus: "UNDER_REVIEW", limitations: ["No canonical modification"], notes: null }],
    identityReviews: [{ reviewId: `identity-review-${variant}`, outcome: "MATCH_CONFIRMED_FOR_INTAKE", reviewerRef: `reviewer-${variant}`, reviewedAt: "2026-08-25T12:00:00Z", claimRefs: [`claim-${variant}-name`], conflictRefs: [`conflict-${variant}`], proposedMatchRefs: [`match-${variant}`], sourceRefs: [], evidenceRefs: [], rationale: "Accepted only for future promotion review", limitations: ["Does not create canonical identity"], notes: null, verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-08-25T12:00:00Z", notes: null } }],
    finalDeclaredOutcome: null, proposedEntityRef: `proposed-entity-${variant}`, proposedPersonProfileRef: `proposed-person-${variant}`,
    sourceRefs: [`source-${variant}`], evidenceRefs: [`evidence-${variant}`], reviewRefs: [], blockerRefs: [], workflowRefs: [],
    verification: { state: "REVIEWED", reviewedBy: `reviewer-${variant}`, reviewedAt: "2026-08-25T12:00:00Z", notes: null },
    provenance: { createdBy: `author-${variant}`, createdAt: "2026-08-01T12:00:00Z", updatedBy: `author-${variant}`, updatedAt: "2026-08-25T12:00:00Z" },
    lifecycle: { state: "OPEN", openedAt: "2026-08-01T12:00:00Z", closedAt: null, archivedAt: null, replacesIdentityIntakeRef: null, replacedByIdentityIntakeRef: null },
    revision: 2, workflowRevision: 3, notes: "Identity Intake remains workflow-local.", extensions: { workflow: { reviewLane: "identity" } }, ...overrides,
  };
}

function identityVersionChecks(variant) {
  const watchlist = fidApi.createProspectWatchlist(minimalWatchlist(variant)); const identity = fidApi.createProspectIdentityIntake(minimalIdentity(variant));
  assert(watchlist.contract === fidApi.PROSPECT_WATCHLIST_CONTRACT_NAME && watchlist.contractVersion === fidApi.PROSPECT_WATCHLIST_CONTRACT_VERSION && watchlist.schemaVersion === fidApi.PROSPECT_WATCHLIST_SCHEMA_VERSION, "Watchlist identity/version mismatch.");
  assert(identity.contract === fidApi.PROSPECT_IDENTITY_INTAKE_CONTRACT_NAME && identity.contractVersion === fidApi.PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION && identity.schemaVersion === fidApi.PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION, "Identity Intake identity/version mismatch.");
  assert(fidApi.isProspectWatchlist(watchlist) && fidApi.isProspectIdentityIntake(identity), "Sprint 20 type guard rejected a valid result.");
}

function frozenVocabularyChecks() {
  const vocabularies = [fidApi.PROSPECT_WATCHLIST_TYPES, fidApi.PROSPECT_WATCHLIST_STATUSES, fidApi.PROSPECT_WATCHLIST_ENTRY_STATUSES, fidApi.PROSPECT_WATCHLIST_PRIORITIES, fidApi.PROSPECT_IDENTITY_CLAIM_TYPES, fidApi.PROSPECT_IDENTITY_CLAIM_STATUSES, fidApi.PROSPECT_IDENTITY_CONFLICT_TYPES, fidApi.PROSPECT_IDENTITY_CONFLICT_STATUSES, fidApi.PROSPECT_IDENTITY_CONFLICT_SEVERITIES, fidApi.PROSPECT_IDENTITY_DUPLICATE_CONCERN_STATUSES, fidApi.PROSPECT_IDENTITY_MATCH_REVIEW_STATUSES, fidApi.PROSPECT_IDENTITY_REVIEW_OUTCOMES, fidApi.PROSPECT_WATCHLIST_VERIFICATION_STATES, fidApi.PROSPECT_WATCHLIST_LIFECYCLE_STATES];
  assert(vocabularies.every((value) => Object.isFrozen(value) && Object.keys(value).length > 0 && new Set(Object.values(value)).size === Object.values(value).length), "A Sprint 20 vocabulary is not frozen or unique.");
}

function watchlistMinimalFullChecks(variant) {
  const minimal = fidApi.createProspectWatchlist(minimalWatchlist(variant)); const full = fidApi.createProspectWatchlist(fullWatchlist(variant));
  assert(minimal.validation.valid && full.validation.valid && minimal.candidateEntries.length === 0 && full.candidateEntries.length === 1, "Minimal/full Watchlist normalization failed.");
  assert(!Object.hasOwn(full.candidateEntries[0], "eligibility") && !Object.hasOwn(full.candidateEntries[0], "declaration") && !Object.hasOwn(full, "ranking"), "Watchlist created an excluded conclusion.");
}

function unavailableInvalidChecks(variant) {
  const invalidInputs = [null, [], `invalid-${variant}`, variant, true];
  invalidInputs.forEach((input) => { assert(!fidApi.validateProspectWatchlist(input).valid && !fidApi.validateProspectIdentityIntake(input).valid, "Validator accepted invalid ordinary input."); });
  assert(!fidApi.createUnavailableProspectWatchlist({ reason: "Unavailable" }).validation.valid && !fidApi.createUnavailableProspectIdentityIntake({ reason: "Unavailable" }).validation.valid, "Unavailable factory did not declare unavailability.");
}

function mutationStabilityNullChecks(variant) {
  const watchlistInput = fullWatchlist(variant, { description: null }); const identityInput = fullIdentity(variant, { finalDeclaredOutcome: null });
  const watchlistBefore = clone(watchlistInput); const identityBefore = clone(identityInput); const watchlist = fidApi.createProspectWatchlist(watchlistInput); const identity = fidApi.createProspectIdentityIntake(identityInput);
  assert(JSON.stringify(watchlistInput) === JSON.stringify(watchlistBefore) && JSON.stringify(identityInput) === JSON.stringify(identityBefore), "Factory mutated input.");
  assert(JSON.stringify(fidApi.createProspectWatchlist(watchlist)) === JSON.stringify(watchlist) && JSON.stringify(fidApi.createProspectIdentityIntake(identity)) === JSON.stringify(identity), "Repeated normalization is unstable.");
  assert(watchlist.description === null && identity.finalDeclaredOutcome === null && identity.submittedIdentity.submittedDateOfBirth === null, "Explicit null was not preserved.");
}

function watchlistTypeStatusChecks(variant) {
  const first = fidApi.createProspectWatchlist(minimalWatchlist(variant, { watchlistType: "PRESEASON", status: "FROZEN" })); const second = fidApi.createProspectWatchlist(minimalWatchlist(`${variant}-b`, { watchlistType: "FINAL_CLASS", status: "DRAFT" }));
  assert(first.watchlistType === "PRESEASON" && first.status === "FROZEN" && second.watchlistType === "FINAL_CLASS" && second.status === "DRAFT", "Watchlist type/status were coupled or calculated.");
}

function entryStatusPriorityChecks(variant) {
  const entry = fidApi.createProspectWatchlistEntry(watchlistEntry(variant, { entryStatus: "DEFERRED", priority: "CRITICAL" }));
  assert(entry.validation.valid && entry.entryStatus === "DEFERRED" && entry.priority === "CRITICAL" && !Object.hasOwn(entry, "rank") && !Object.hasOwn(entry, "grade"), "Entry status/priority boundary failed.");
  assert(!fidApi.validateProspectWatchlistEntry(watchlistEntry(variant, { priority: 1 })).valid, "Numeric ranking was accepted as intake priority.");
}

function discoverySubmittedClaimsChecks(variant) {
  const entryInput = watchlistEntry(variant); const submittedInput = fullIdentity(variant).submittedIdentity;
  const entry = fidApi.createProspectWatchlistEntry(entryInput); const submitted = fidApi.createProspectSubmittedIdentity(submittedInput);
  assert(entry.submittedSchool === entryInput.submittedSchool && entry.submittedPosition === entryInput.submittedPosition && submitted.submittedSchool === submittedInput.submittedSchool && submitted.submittedPosition === submittedInput.submittedPosition, "Submitted fields were not preserved.");
  assert(!Object.hasOwn(entry, "canonicalSchool") && !Object.hasOwn(submitted, "canonicalPosition") && !Object.hasOwn(submitted, "eligibility"), "Submitted claims became canonical or eligibility facts.");
  assert(submitted.providerIdentifiers.fictionalProvider === `provider-${variant}`, "Provider identifier was not preserved as a submitted claim.");
}

function identityMinimalFullChecks(variant) {
  const minimal = fidApi.createProspectIdentityIntake(minimalIdentity(variant)); const full = fidApi.createProspectIdentityIntake(fullIdentity(variant));
  assert(minimal.validation.valid && full.validation.valid && minimal.identityClaims.length === 0 && full.identityClaims.length === 2, "Minimal/full Identity Intake normalization failed.");
  assert(!Object.hasOwn(full, "footballEntity") && !Object.hasOwn(full, "personProfile"), "Identity Intake embedded a canonical FID record.");
}

function claimIndependenceChecks(variant) {
  const result = fidApi.createProspectIdentityIntake(fullIdentity(variant)); const [nameClaim, schoolClaim] = result.identityClaims;
  assert(nameClaim.status === "SUPPORTED" && schoolClaim.status === "CONFLICTED", "One claim status affected another claim.");
  assert(nameClaim.verification.state === "REVIEWED" && schoolClaim.verification.state === "REVIEWED" && result.finalDeclaredOutcome === null, "Claim review calculated final authority.");
  assert(!fidApi.validateProspectIdentityClaim(identityClaim(variant, "name", { status: "CALCULATED" })).valid, "Unknown claim status was accepted.");
}

function conflictChecks(variant) {
  const conflict = fidApi.createProspectIdentityConflict(fullIdentity(variant).identityConflicts[0]);
  assert(conflict.validation.valid && conflict.status === "OPEN" && conflict.candidateRefs.length === 2, "Identity conflict normalization failed.");
  assert(!Object.hasOwn(conflict, "winnerRef") && !Object.hasOwn(conflict, "mergedCandidateRef") && !Object.hasOwn(conflict, "canonicalIdentityRef"), "Conflict selected or merged an identity.");
}

function duplicateConcernChecks(variant) {
  const concern = fidApi.createProspectDuplicateConcern(fullIdentity(variant).duplicateConcerns[0]);
  assert(concern.validation.valid && concern.status === "POSSIBLE_DUPLICATE" && concern.relatedCandidateRefs.length === 1, "Duplicate concern normalization failed.");
  assert(!Object.hasOwn(concern, "merge") && !Object.hasOwn(concern, "closedCandidateRef") && !Object.hasOwn(concern, "winnerRef"), "Duplicate concern performed a merge or closure.");
}

function proposedMatchChecks(variant) {
  const match = fidApi.createProspectProposedIdentityMatch(fullIdentity(variant).proposedMatches[0]);
  assert(match.validation.valid && match.proposedEntityRef === `proposed-entity-${variant}` && match.proposedPersonProfileRef === `proposed-person-${variant}`, "Proposed match normalization failed.");
  assert(!Object.hasOwn(match, "entity") && !Object.hasOwn(match, "personProfile") && !Object.hasOwn(match, "canonicalIdentity"), "Proposed match created or embedded a canonical record.");
}

function reviewFinalOutcomeChecks(variant) {
  const result = fidApi.createProspectIdentityIntake(fullIdentity(variant)); const review = result.identityReviews[0];
  assert(review.outcome === "MATCH_CONFIRMED_FOR_INTAKE" && result.finalDeclaredOutcome === null, "Review incorrectly calculated the final outcome.");
  const conflicting = fidApi.createProspectIdentityIntake(fullIdentity(variant, { identityReviews: [fullIdentity(variant).identityReviews[0], { ...fullIdentity(variant).identityReviews[0], reviewId: `review-two-${variant}`, outcome: "CONFLICTED" }] }));
  assert(conflicting.validation.valid && conflicting.identityReviews.length === 2 && conflicting.finalDeclaredOutcome === null, "Conflicting reviews could not coexist independently.");
}

function multipleWatchlistsRemovalChecks(variant) {
  const first = fidApi.createProspectWatchlist(fullWatchlist(variant, { candidateEntries: [watchlistEntry(variant, { entryStatus: "REMOVED", priority: "LOW", removedAt: "2026-09-01T12:00:00Z", removalReason: "Watchlist-local removal" })] }));
  const second = fidApi.createProspectWatchlist(fullWatchlist(`${variant}-other`, { candidateEntries: [watchlistEntry(`${variant}-other`, { intakeCandidateRef: `intake-candidate-${variant}`, entryStatus: "ACTIVE", priority: "HIGH" })] }));
  assert(first.validation.valid && second.validation.valid && first.candidateEntries[0].entryStatus === "REMOVED" && second.candidateEntries[0].entryStatus === "ACTIVE", "Multiple Watchlists did not retain independent entry state.");
  assert(first.candidateEntries[0].intakeCandidateRef === second.candidateEntries[0].intakeCandidateRef && !Object.hasOwn(first, "deletedRecords"), "Watchlist-local removal affected shared intake identity or deleted records.");
}

function revisionBoundaryChecks(variant) {
  const watchlist = fidApi.createProspectWatchlist(fullWatchlist(variant)); const identity = fidApi.createProspectIdentityIntake(fullIdentity(variant));
  assert(watchlist.contractVersion !== String(watchlist.revision) && watchlist.candidateEntries[0].revision === 1 && identity.revision === 2 && identity.workflowRevision === 3, "Revision concepts were collapsed.");
  assert(!fidApi.validateProspectWatchlist(fullWatchlist(variant, { lifecycle: { supersedesWatchlistRef: `watchlist-${variant}` } })).valid, "Self-referencing watchlist revision was accepted.");
  assert(!fidApi.validateProspectIdentityIntake(fullIdentity(variant, { lifecycle: { replacesIdentityIntakeRef: `identity-intake-${variant}` } })).valid, "Self-referencing Identity Intake revision was accepted.");
}

function fictional2027Checks(variant) {
  const scenarios = ["preseason", "same-name", "transfer", "position-change", "uncertain-class", "roster-conflict", "missing-birth-date", "multiple-provider-ids", "return-to-school", "eligibility-later", "deferred", "breakout", "partial-identity"];
  const results = scenarios.map((scenario, index) => fidApi.createProspectWatchlist(fullWatchlist(`${variant}-${index}`, { label: `Fictional ${scenario}`, candidateEntries: [watchlistEntry(`${variant}-${index}`, { submittedClassYear: null, notes: scenario })] })));
  assert(results.every((entry) => entry.validation.valid && entry.cycleRef === "cycle:fictional:2027"), "Fictional 2027 compatibility scenario failed.");
  assert(!/\b(?:Arch|Manning|Sellers|Nussmeier|Allar)\b/i.test(JSON.stringify(results)), "A real prospect fixture entered Sprint 20 diagnostics.");
}

function architecturalBoundaryChecks() {
  const imports = [...PRODUCTION_SOURCE.matchAll(/(?:import|export)\s+[\s\S]*?from\s+["']([^"']+)["']/g)].map((match) => match[1]);
  assert(imports.every((entry) => entry.startsWith("./") && !/researchRepository|contracts[/\\]|persistence|repository|supabase|database|registry|resolver|engine|draft|components|pages|router|routes/i.test(entry)), "Sprint 20 production file has a prohibited dependency.");
  assert(!/\b(?:fetch|XMLHttpRequest|axios|createVersion|queryRecords|getLatestByRecordId)\s*\(/.test(PRODUCTION_SOURCE), "External-source or repository operation entered Sprint 20 production.");
  assert(!/runProspectWatchlistIdentityIntakeDiagnostics/.test(INTAKE_INDEX_SOURCE + FID_INDEX_SOURCE), "Sprint 20 diagnostic runner entered production exports.");
}

function extensionSafetyChecks(variant) {
  const prohibited = ["fuzzyMatchFunction", "identityResolutionFunction", "mergeFunction", "scraperFunction", "apiClient", "databaseClient", "repositoryOperations", "hydration", "synchronization", "graphTraversal", "grades", "rankings", "projections", "recommendations", "predictions", "decisions", "simulatorReady"];
  prohibited.forEach((key) => {
    const watchlist = fidApi.createProspectWatchlist(minimalWatchlist(`${variant}-${key}`, { extensions: { nested: { [key]: "prohibited", descriptiveLabel: "Safe" } } }));
    const identity = fidApi.createProspectIdentityIntake(minimalIdentity(`${variant}-${key}`, { extensions: { nested: { [key]: "prohibited", descriptiveLabel: "Safe" } } }));
    assert(!watchlist.validation.valid && !identity.validation.valid && !Object.hasOwn(watchlist.extensions.nested, key) && !Object.hasOwn(identity.extensions.nested, key), `Prohibited extension retained: ${key}.`);
  });
  const safe = fidApi.createProspectWatchlist(minimalWatchlist(variant, { extensions: { workflow: { descriptiveLabel: "A ranking source label is harmless prose" } } }));
  assert(safe.validation.valid && safe.extensions.workflow.descriptiveLabel.includes("harmless"), "Harmless workflow metadata was rejected.");
}

function exportCompatibilityChecks() {
  const modules = [[namedSprint20Constants, sprint20Constants], [namedSprint20WatchlistApi, sprint20WatchlistApi], [namedSprint20IdentityApi, sprint20IdentityApi]];
  const sprint20Names = modules.flatMap(([namedApi]) => Object.keys(namedApi).filter((name) => name !== "default"));
  const intakeNamed = Object.keys(namedProspectIntakeApi).filter((name) => name !== "default"); const intakeDefaults = Object.keys(prospectIntakeApi);
  const fidNamed = Object.keys(namedFidApi).filter((name) => name !== "default"); const fidDefaults = Object.keys(fidApi);
  assert(sprint20Names.length === 42 && new Set(sprint20Names).size === sprint20Names.length && modules.every(([namedApi, defaultApi]) => Object.keys(namedApi).filter((name) => name !== "default").every((name) => namedApi[name] === defaultApi[name])), "Sprint 20 source exports disagree or collide.");
  assert(sprint20Names.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name] && namedFidApi[name] === fidApi[name] && fidApi[name] === prospectIntakeApi[name]), "Sprint 20 export is missing or reference-incompatible.");
  assert(intakeNamed.length >= 50 + sprint20Names.length && intakeDefaults.length >= 50 + sprint20Names.length && new Set(intakeNamed).size === intakeNamed.length && new Set(intakeDefaults).size === intakeDefaults.length && intakeNamed.every((name) => namedProspectIntakeApi[name] === prospectIntakeApi[name]), "Prospect Intake additive API is invalid.");
  assert(fidNamed.length >= 321 + sprint20Names.length && fidDefaults.length >= 321 + sprint20Names.length && new Set(fidNamed).size === fidNamed.length && new Set(fidDefaults).size === fidDefaults.length && fidNamed.every((name) => namedFidApi[name] === fidApi[name]), "FID additive API is invalid.");
  assert(!fidDefaults.some((name) => /^run.*Diagnostics$/.test(name)) && !/\.length\s*===\s*(?:363|92)\b/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")), "Diagnostic export or exact public export ceiling was introduced.");
}

function priorDiagnosticIntegrationChecks(context) {
  const summary = context.suiteSummaries.prospectIntakeArchitecture;
  assert(summary?.total === 400 && summary.passed === 400 && summary.failed === 0, "Prospect Intake Architecture baseline failed.");
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, coachProfile: 280, personCoachFoundation: 254, executiveProfile: 391, executiveProfileFoundation: 352, scoutProfile: 320, personnelSpecializationFoundation: 340, footballRelationship: 300, relationshipProfileBoundary: 240, persistenceArchitecture: 340, inMemoryRepository: 400, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name]?.total === total && context.suiteSummaries[name]?.failed === 0, `${name} prior diagnostics failed.`));
}

function noGeneratedEvaluationChecks(variant) {
  const emptyEntry = fidApi.createProspectWatchlistEntry({ entryId: `empty-entry-${variant}` }); const emptySubmitted = fidApi.createProspectSubmittedIdentity({});
  const minimalWatch = fidApi.createProspectWatchlist(minimalWatchlist(variant)); const minimalIntake = fidApi.createProspectIdentityIntake(minimalIdentity(variant));
  assert(emptyEntry.addedAt === null && emptyEntry.removedAt === null && emptyEntry.revision === null && emptyEntry.priority === null && emptyEntry.entryStatus === null, "Entry factory generated workflow declarations.");
  assert(emptySubmitted.submittedName === null && Object.keys(emptySubmitted.providerIdentifiers).length === 0, "Submitted Identity factory generated identity claims.");
  assert(minimalWatch.candidateEntries.length === 0 && minimalWatch.revision === null && minimalIntake.identityClaims.length === 0 && minimalIntake.identityConflicts.length === 0 && minimalIntake.finalDeclaredOutcome === null && minimalIntake.proposedEntityRef === null && minimalIntake.proposedPersonProfileRef === null, "Factory generated claims, conflicts, revisions, outcomes, or canonical references.");
  const excluded = ["score", "grade", "rating", "ranking", "consensusRank", "positionalRank", "draftProjection", "expectedRound", "draftRange", "teamFit", "schemeFit", "playerQuality", "prospectQuality", "recommendation", "prediction", "decision", "simulatorReadiness"];
  assert(excluded.every((key) => !Object.hasOwn(minimalWatch, key) && !Object.hasOwn(minimalIntake, key)), "Evaluation or simulator output entered Sprint 20 result shapes.");
}

const CHECKS = Object.freeze([
  identityVersionChecks, frozenVocabularyChecks, watchlistMinimalFullChecks, unavailableInvalidChecks,
  mutationStabilityNullChecks, watchlistTypeStatusChecks, entryStatusPriorityChecks, discoverySubmittedClaimsChecks,
  identityMinimalFullChecks, claimIndependenceChecks, conflictChecks, duplicateConcernChecks,
  proposedMatchChecks, reviewFinalOutcomeChecks, multipleWatchlistsRemovalChecks, revisionBoundaryChecks,
  fictional2027Checks, architecturalBoundaryChecks, extensionSafetyChecks, exportCompatibilityChecks,
  priorDiagnosticIntegrationChecks, noGeneratedEvaluationChecks,
]);

async function buildContext() {
  const prospectIntakeArchitecture = await runProspectIntakeArchitectureDiagnostics();
  return { suiteSummaries: { ...prospectIntakeArchitecture.suiteSummaries, prospectIntakeArchitecture } };
}

export async function runProspectWatchlistIdentityIntakeDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  CASE_NAMES.forEach((id, index) => {
    const groupIndex = Math.floor(index / 20); const variant = (index % 20) + 1;
    try { CHECKS[groupIndex](groupIndex === 20 ? context : variant); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); }
    catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); }
  });
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersions: { watchlist: fidApi.PROSPECT_WATCHLIST_CONTRACT_VERSION, identityIntake: fidApi.PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION },
    schemaVersions: { watchlist: fidApi.PROSPECT_WATCHLIST_SCHEMA_VERSION, identityIntake: fidApi.PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION },
    total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runProspectWatchlistIdentityIntakeDiagnostics });
