import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as footballEntityApi from "../contracts/FootballEntityContract.js";
import * as referenceApi from "../contracts/FootballEntityReferencePolicy.js";
import * as ownershipApi from "../records/index.js";
import { kansasCityChiefsFootballEntityRevision1 as record } from "../records/footballEntity/kansas-city-chiefs/index.js";
import { researchSource } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/evidenceReview.js";
import { packageManifest } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/packageManifest.js";
import { runRSP0003Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/runRSP0003Diagnostics.js";
import { runCanonicalRecordOwnershipPolicyDiagnostics } from "./runCanonicalRecordOwnershipPolicyDiagnostics.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runFidOrganizationTeamFoundationDiagnostics } from "./runFidOrganizationTeamFoundationDiagnostics.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECORD_DIR = resolve(ROOT, "records/footballEntity/kansas-city-chiefs");
const MODULE_PATH = "src/data/footballIntelligence/fid/records/footballEntity/kansas-city-chiefs/revision-0001.js";
const EXPECTED_RETAINED_HASH = "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6";
const EXPECTED_OBSERVATION_HASH = "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B";
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const deeplyFrozen = (value) => !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen));
const assessment = () => ownershipApi.assessSourceControlledCanonicalRecord({ domain: "footballEntity", record, recordSlug: "kansas-city-chiefs", modulePath: MODULE_PATH, blockers: [] });

export async function runKansasCityChiefsFootballEntityDiagnostics({ throwOnFailure = false } = {}) {
  const sprint48b = await runCanonicalRecordOwnershipPolicyDiagnostics();
  const footballEntity = runFootballEntityContractDiagnostics();
  const organizationTeam = await runFidOrganizationTeamFoundationDiagnostics();
  const rsp0003 = await runRSP0003Diagnostics();
  const orgObservation = recordedObservations.find((value) => value.record.field === "selectingOrganization");
  const reviewIds = evidenceReviewDecisions.map((value) => value.reviewId);
  const fidIndex = readFileSync(resolve(ROOT, "index.js"), "utf8");
  const domainIndex = readFileSync(resolve(ROOT, "records/footballEntity/index.js"), "utf8");
  const revisionSource = readFileSync(resolve(RECORD_DIR, "revision-0001.js"), "utf8");
  const cases = [
    check("exactly-one-revision", () => assert(readdirSync(RECORD_DIR).filter((name) => /^revision-\d{4}\.js$/.test(name)).length === 1, "Expected exactly one revision.")),
    check("contract-valid", () => assert(footballEntityApi.isFootballEntity(record), "FootballEntity contract rejected record.")),
    check("contract-version", () => assert(record.contractVersion === "FOOTBALL-ENTITY-CONTRACT-1.0.0", "Contract version mismatch.")),
    check("schema-version", () => assert(record.schemaVersion === "FOOTBALL-ENTITY-SCHEMA-1.0.0", "Schema version mismatch.")),
    check("canonical-id", () => assert(record.entityId === "organization:kansas-city-chiefs", "Canonical ID mismatch.")),
    check("canonical-reference-valid", () => assert(referenceApi.validateCanonicalFootballEntityIdentity(record).valid, "Canonical identity invalid.")),
    check("namespace-compatible", () => assert(referenceApi.validateFootballEntityCanonicalReference(record.entityId, { entityType: "ORGANIZATION" }).valid, "Namespace incompatible.")),
    check("organization-type", () => assert(record.entityType === "ORGANIZATION", "Entity type mismatch.")),
    check("canonical-name", () => assert(record.identity.canonicalName === "Kansas City Chiefs", "Canonical name mismatch.")),
    check("display-name", () => assert(record.identity.displayName === "Kansas City Chiefs", "Display name mismatch.")),
    check("short-name-absent", () => assert(record.identity.shortName === null, "Unsupported short name present.")),
    check("aliases-empty", () => assert(record.aliases.length === 0, "Unsupported alias present.")),
    check("kc-not-alias", () => assert(!record.aliases.some((value) => value.alias?.toLowerCase() === "kc"), "KC alias present.")),
    check("external-identifiers-empty", () => assert(record.externalIdentifiers.length === 0, "Unsupported external ID present.")),
    check("kc-not-id", () => assert(record.entityId !== "KC" && !JSON.stringify(record.externalIdentifiers).includes("KC"), "KC used as identifier.")),
    check("no-profile-facts", () => assert(!["city", "state", "stadium", "conference", "division", "league", "founded", "colors", "championships"].some((key) => Object.hasOwn(record, key) || Object.hasOwn(record.identity, key)), "OrganizationProfile fact present.")),
    check("active-state", () => assert(record.status === "ACTIVE", "Lifecycle is not active.")),
    check("verified-with-limitations", () => assert(record.verification.state === "VERIFIED_WITH_LIMITATIONS", "Verification state mismatch.")),
    check("authorized-verifier", () => assert(record.verification.verifiedBy === "reviewer:repository-owner" && record.verification.verifiedAt === "2026-07-18", "Verification metadata mismatch.")),
    check("limitations-narrow", () => assert(record.verification.limitations.length === 3 && record.verification.limitations.every((value) => /identity|League|KC/.test(value)), "Limitations changed.")),
    check("revision-one", () => assert(record.versioning.entityVersion === 1, "Revision mismatch.")),
    check("no-predecessor", () => assert(record.versioning.supersedesEntityRef === null, "Predecessor present.")),
    check("no-replacement", () => assert(record.versioning.supersededByEntityRef === null, "Replacement present.")),
    check("no-merger", () => assert(record.versioning.mergedIntoEntityRef === null, "Merger target present.")),
    check("deeply-frozen", () => assert(deeplyFrozen(record), "Record is not deeply frozen.")),
    check("stable-serialization", () => assert(JSON.stringify(record) === JSON.stringify(record), "Serialization is unstable.")),
    check("deterministic-construction", () => assert(JSON.stringify(footballEntityApi.createFootballEntity(record)) === JSON.stringify(footballEntityApi.createFootballEntity(record)), "Construction is not deterministic.")),
    check("input-not-mutated", () => { const input = { entityId: "organization:test", entityType: "ORGANIZATION", status: "ACTIVE", identity: { canonicalName: "Test" }, verification: { state: "VERIFIED", identityConfidence: "HIGH", verifiedBy: "reviewer:test", verifiedAt: "2026-07-18" } }; const before = JSON.stringify(input); footballEntityApi.createFootballEntity(input); assert(JSON.stringify(input) === before, "Factory mutated input."); }),
    check("ownership-eligible", () => assert(assessment().eligible, "Ownership assessment rejected record.", assessment())),
    check("no-blockers", () => assert(assessment().errors.length === 0, "Ownership blockers exist.", assessment())),
    check("source-approved", () => assert(researchSource.status === "APPROVED", "RSP-0003 source is not approved.")),
    check("source-ref", () => assert(JSON.stringify(record.references.researchSourceRefs) === JSON.stringify([researchSource.sourceId]), "Source reference mismatch.")),
    check("session-verified", () => assert(researchSession.verification.state === "VERIFIED", "Session is not verified.")),
    check("session-ref", () => assert(JSON.stringify(record.references.researchSessionRefs) === JSON.stringify([researchSession.sessionId]), "Session reference mismatch.")),
    check("organization-observation-verified", () => assert(orgObservation?.verification.state === "VERIFIED" && orgObservation.record.valueText === "Kansas City Chiefs", "Organization observation invalid.")),
    check("organization-observation-only", () => assert(JSON.stringify(record.references.recordedObservationRefs) === JSON.stringify([orgObservation.observationId]), "Unrelated observation referenced.")),
    check("zero-analysis", () => assert(record.references.analyticalObservationRefs.length === 0 && packageManifest.analyticalObservationRefs.length === 0, "Analytical observation introduced.")),
    check("artifact-active-verified", () => assert(evidenceArtifact.state === "ACTIVE" && evidenceArtifact.verification.state === "VERIFIED", "Artifact not active and verified.")),
    check("artifact-ref", () => assert(JSON.stringify(record.references.evidenceArtifactRefs) === JSON.stringify([evidenceArtifact.evidenceId]), "Artifact reference mismatch.")),
    check("observation-review-approved", () => assert(reviewIds.includes("evidence-review:rsp-0003:observation-3"), "Observation review missing.")),
    check("artifact-review-approved", () => assert(reviewIds.includes("evidence-review:rsp-0003:artifact"), "Artifact review missing.")),
    check("package-approved", () => assert(packageManifest.status === "APPROVED" && packageManifest.governance.authorized, "Package not approved.")),
    check("other-refs-exact", () => assert(JSON.stringify(record.references.otherRefs) === JSON.stringify(["evidence-review:rsp-0003:observation-3", "evidence-review:rsp-0003:artifact", "research-package:rsp-0003"]), "Review/package references changed.")),
    check("provenance-package", () => assert(record.provenance.originSystem === "Research Repository" && record.provenance.originRecordRef === packageManifest.packageId, "Package provenance mismatch.")),
    check("governed-path", () => assert(assessment().modulePath === MODULE_PATH, "Governed path mismatch.")),
    check("revision-filename", () => assert(readdirSync(RECORD_DIR).includes("revision-0001.js"), "Revision filename missing.")),
    check("record-index-present", () => assert(readdirSync(RECORD_DIR).includes("index.js"), "Record index missing.")),
    check("deliberate-domain-export", () => assert(domainIndex.includes("kansasCityChiefsFootballEntityRevision1") && !domainIndex.includes("export *"), "Domain export is not deliberate.")),
    check("root-does-not-export-instance", () => assert(!fidIndex.includes("kansasCityChiefsFootballEntityRevision1") && !fidIndex.includes("records/footballEntity/index.js"), "Root FID exports instance.")),
    check("no-persistence-metadata", () => assert(!["persistenceId", "requestId", "operationId", "batchId", "databaseRowId"].some((key) => Object.hasOwn(record, key)), "Persistence metadata present.")),
    check("no-external-effects", () => assert(!/(createClient|supabase|fetch\(|INSERT|UPDATE|simulator|runtimeRegistry)/i.test(revisionSource), "External effect introduced.")),
    check("no-organization-profile", () => assert(!/createOrganizationProfile|OrganizationProfileContract|organizationProfileRef/.test(revisionSource), "OrganizationProfile introduced.")),
    check("no-team-profile", () => assert(!/createTeamProfile|TeamProfileContract|teamProfileRef/.test(revisionSource), "TeamProfile introduced.")),
    check("no-draft-cycle", () => assert(!/DRAFT_CYCLE|draft-cycle/.test(revisionSource), "DraftCycle identity introduced.")),
    check("no-draft-selection", () => assert(!/createDraftSelection|selectionRef/.test(revisionSource), "DraftSelection introduced.")),
    check("no-relationship", () => assert(!/FootballRelationship|SELECTED_BY/.test(revisionSource), "Relationship introduced.")),
    check("rsp0003-approved", () => assert(rsp0003.failed === 0 && rsp0003.governance.package === "APPROVED", "RSP-0003 regression failed.", rsp0003)),
    check("retained-hash", () => assert(rsp0003.hashes.retainedContent === EXPECTED_RETAINED_HASH, "Retained-content hash changed.")),
    check("observation-hash", () => assert(rsp0003.hashes.recordedObservations === EXPECTED_OBSERVATION_HASH, "Observation hash changed.")),
    check("direct-hash-verification", () => { const packageRoot = resolve(ROOT, "../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection"); assert(sha256(resolve(packageRoot, "retained-content.md")) === EXPECTED_RETAINED_HASH && sha256(resolve(packageRoot, "recordedObservations.js")) === EXPECTED_OBSERVATION_HASH, "Direct preservation hash failed."); }),
    check("sprint48b-regression", () => assert(sprint48b.failed === 0, "Sprint 48B regression failed.", sprint48b)),
    check("sprint48a-regression", () => assert(sprint48b.regressions.sprint48a.failed === 0, "Sprint 48A regression failed.")),
    check("football-entity-regression", () => assert(footballEntity.failed === 0, "FootballEntity regression failed.", footballEntity)),
    check("organization-team-regression", () => assert(organizationTeam.failed === 0, "Organization/Team regression failed.", organizationTeam)),
    check("sprint47-regression", () => assert(sprint48b.regressions.sprint47.failed === 0, "Sprint 47 regression failed.")),
    check("sprint46-regression", () => assert(sprint48b.regressions.sprint46.failed === 0, "Sprint 46 regression failed.")),
    check("rsp0001-regression", () => assert(sprint48b.regressions.rsp0001.failed === 0, "RSP-0001 regression failed.")),
    check("rsp0002-regression", () => assert(sprint48b.regressions.rsp0002.failed === 0, "RSP-0002 regression failed.")),
    check("research-regression", () => assert(sprint48b.regressions.researchRepository.failed === 0, "Research Repository regression failed.")),
    check("population-regression", () => assert(sprint48b.regressions.population.failed === 0, "Population regression failed.")),
    check("prospect-profile-regression", () => assert(sprint48b.regressions.prospectProfile.failed === 0, "ProspectProfile/FID regression failed.")),
  ];
  const passed = cases.filter((value) => value.passed).length;
  const failed = cases.length - passed;
  const summary = { suite: "KansasCityChiefsCanonicalFootballEntityDiagnostics", total: cases.length, passed, failed, cases, record: { entityId: record.entityId, entityType: record.entityType, revision: record.versioning.entityVersion, eligible: assessment().eligible }, hashes: rsp0003.hashes, regressions: { sprint48b: { total: sprint48b.total, failed: sprint48b.failed }, sprint48a: sprint48b.regressions.sprint48a, footballEntity: { total: footballEntity.total, failed: footballEntity.failed }, organizationTeam: { total: organizationTeam.total, failed: organizationTeam.failed }, sprint47: sprint48b.regressions.sprint47, sprint46: sprint48b.regressions.sprint46, rsp0001: sprint48b.regressions.rsp0001, rsp0002: sprint48b.regressions.rsp0002, rsp0003: { total: rsp0003.total, failed: rsp0003.failed }, researchRepository: sprint48b.regressions.researchRepository, population: sprint48b.regressions.population, prospectProfile: sprint48b.regressions.prospectProfile } };
  if (throwOnFailure && failed) throw new Error(`${summary.suite} failed ${failed} of ${summary.total} cases.`);
  return summary;
}

export default Object.freeze({ runKansasCityChiefsFootballEntityDiagnostics });
