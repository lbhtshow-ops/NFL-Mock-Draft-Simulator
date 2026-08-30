import researchRepository from "../../researchRepository/index.js";
import { runResearchRepositoryFoundationDiagnostics } from "../../researchRepository/diagnostics/runResearchRepositoryFoundationDiagnostics.js";
import { runResearchMigrationFrameworkDiagnostics } from "./runResearchMigrationFrameworkDiagnostics.js";
import sourceIntake from "./sourceIntake/index.js";
import { createCompleteSourceCandidate } from "./sourceIntake/fixtures/researchSourceIntakeFixtures.js";

const SUITE = "ResearchSourceIntakeDiagnostics";
const assert = (condition, message, details = null) => { if (!condition) { const error = new Error(message); error.details = details; throw error; } };
const has = (result, type) => result.blockers.some((entry) => entry.blockerType === type);
const check = (id, fn) => { try { fn(); return { id, passed: true, message: `${id} passed.`, details: null }; } catch (error) { return { id, passed: false, message: error?.message ?? `${id} failed.`, details: error?.details ?? null }; } };
const review = (suffix, overrides = {}) => sourceIntake.reviewResearchSourceCandidate(createCompleteSourceCandidate({ intakeId: `source-intake:${suffix}`, candidateId: `research-source:candidate:${suffix}`, ...overrides }));

export function runResearchSourceIntakeDiagnostics({ throwOnFailure = false } = {}) {
  const foundation = runResearchRepositoryFoundationDiagnostics(); const migration = runResearchMigrationFrameworkDiagnostics();
  const ready = review("ready");
  const approved = review("approved", { reviewerId: "authorized-reviewer", reviewerAuthorized: true, reviewDate: "2026-07-18", reviewDecision: "APPROVE", reviewNotes: "Explicit human approval." });
  const rejected = review("rejected", { reviewerId: "authorized-reviewer", reviewerAuthorized: true, reviewDate: "2026-07-18", reviewDecision: "REJECT", rejectionReason: "Declared provenance cannot be verified." });
  const missingArtifact = review("missing-artifact", { artifactIdentityType: "UNKNOWN", artifactIdentity: null });
  const missingAuthor = review("missing-author", { author: null }); const unknownPublication = review("unknown-publication", { publicationDate: null }); const missingAccess = review("missing-access", { accessDate: null });
  const duplicate = review("duplicate", { duplicateCandidateRefs: ["research-source:candidate:prior"] });
  const conflict = review("conflict", { conflictingDeclarations: [{ field: "publisher", values: ["Publisher A", "Publisher B"] }, { field: "author", values: ["Author A", "Author B"] }] });
  const restricted = review("restricted", { usageRestrictions: { derivedFactsAllowed: false, attributionRequired: true, notes: "Use restricted by declaration." } });
  const prohibited = review("prohibited", { prohibitedRoles: [researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE] });
  const unauthorized = review("unauthorized", { reviewerId: "unverified-reviewer", reviewerAuthorized: false, reviewDate: "2026-07-18", reviewDecision: "APPROVE" });
  const labelOnly = review("label-only", { publisher: null, author: null, publicationDate: null, accessDate: null, artifactIdentityType: "UNKNOWN", artifactIdentity: null });
  const all = [ready, approved, rejected, missingArtifact, missingAuthor, unknownPublication, missingAccess, duplicate, conflict, restricted, prohibited, unauthorized, labelOnly];
  const cases = [
    check("complete-candidate-ready-for-human-review", () => assert(ready.declaration.validation.valid && ready.source.validation.valid && ready.outcome === "READY_FOR_HUMAN_REVIEW" && !ready.approved, "Complete candidate readiness failed.", ready)),
    check("explicit-human-approval", () => assert(approved.outcome === "APPROVED" && approved.approved && researchRepository.isApprovedResearchSource(approved.source), "Authorized approval failed.", approved)),
    check("explicit-rejection", () => assert(rejected.outcome === "REJECTED" && rejected.source.status === "CANDIDATE" && rejected.declaration.rejectionReason, "Rejection was not preserved.", rejected)),
    check("missing-artifact-identity", () => assert(has(missingArtifact, "MISSING_ARTIFACT_IDENTITY") && missingArtifact.outcome === "BLOCKED", "Missing artifact was accepted.", missingArtifact)),
    check("missing-author", () => assert(has(missingAuthor, "MISSING_AUTHOR"), "Missing author was not reported.", missingAuthor)),
    check("unknown-publication-date", () => assert(has(unknownPublication, "UNKNOWN_PUBLICATION_DATE") && unknownPublication.declaration.publicationDate === null, "Unknown publication date was inferred.", unknownPublication)),
    check("missing-access-date", () => assert(has(missingAccess, "MISSING_ACCESS_DATE"), "Missing access date was not reported.", missingAccess)),
    check("duplicate-candidate-submission", () => assert(has(duplicate, "DUPLICATE_CANDIDATE"), "Duplicate candidate was not detected.", duplicate)),
    check("conflicting-publisher-author", () => assert(has(conflict, "CONFLICTING_PROVENANCE") && conflict.declaration.conflictingDeclarations.length === 2, "Conflicting provenance was resolved.", conflict)),
    check("restricted-use-source", () => assert(has(restricted, "RESTRICTED_USE") && restricted.source.usageRestrictions.derivedFactsAllowed === false, "Use restriction was lost.", restricted)),
    check("prohibited-research-role", () => assert(has(prohibited, "PROHIBITED_ROLE") && prohibited.source.prohibitedRoles.includes(researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE), "Prohibited role was lost.", prohibited)),
    check("unauthorized-approval-attempt", () => assert(has(unauthorized, "UNAUTHORIZED_REVIEWER") && !unauthorized.approved && unauthorized.source === null, "Unauthorized approval succeeded.", unauthorized)),
    check("validation-without-approval", () => assert(ready.declaration.validation.valid && ready.source.validation.valid && ready.source.status === "CANDIDATE" && !researchRepository.isApprovedResearchSource(ready.source), "Validity implied approval.", ready)),
    check("source-label-alone-blocked", () => assert(has(labelOnly, "SOURCE_LABEL_ONLY") && labelOnly.outcome === "BLOCKED", "Source label alone entered review.", labelOnly)),
    check("zero-external-effects", () => assert(all.every((entry) => ["legacyMetadataModified", "persistencePerformed", "promotionPerformed", "canonicalRecordCreated", "runtimeIntegrationPerformed"].every((key) => entry[key] === false)), "An external effect occurred.", all)),
    check("research-repository-regression", () => assert(foundation.total === 60 && foundation.failed === 0, "Research Repository baseline failed.", foundation)),
    check("sprint-37-migration-regression", () => assert(migration.total === 14 && migration.failed === 0, "Sprint 37 migration baseline failed.", migration)),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, examples: { approved: { outcome: approved.outcome, sourceId: approved.source?.sourceId, status: approved.source?.status, reviewedBy: approved.source?.review.reviewedBy }, blocked: { outcome: missingArtifact.outcome, sourceId: missingArtifact.source?.sourceId, status: missingArtifact.source?.status, blockers: missingArtifact.blockers } }, regressions: { researchRepository: { total: foundation.total, passed: foundation.passed, failed: foundation.failed }, sprint37: { total: migration.total, passed: migration.passed, failed: migration.failed } } };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`); return result;
}
export default Object.freeze({ runResearchSourceIntakeDiagnostics });
