import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as entityApi from "../contracts/FootballEntityContract.js";
import * as referenceApi from "../contracts/FootballEntityReferencePolicy.js";
import * as ownershipApi from "../records/index.js";
import { peterWoodsProspectFootballEntityRevision1 as record } from "../records/footballEntity/peter-woods/index.js";
import { researchSource } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/evidenceReview.js";
import { packageManifest } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/packageManifest.js";
import { runRSP0003Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/runRSP0003Diagnostics.js";
import { run2026NflDraftFootballEntityDiagnostics } from "./run2026NflDraftFootballEntityDiagnostics.js";
import { runKansasCityChiefsFootballEntityDiagnostics } from "./runKansasCityChiefsFootballEntityDiagnostics.js";
import { runCanonicalRecordOwnershipPolicyDiagnostics } from "./runCanonicalRecordOwnershipPolicyDiagnostics.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECORD_DIR = resolve(ROOT, "records/footballEntity/peter-woods");
const MODULE_PATH = "src/data/footballIntelligence/fid/records/footballEntity/peter-woods/revision-0001.js";
const CHIEFS_HASH = "BBCE3E478EA19FA4A8EC0F71AC0FA47BC17830D7FC97AEE0B5C95E85606E07B3";
const DRAFT_CYCLE_HASH = "7158BF7BB5D1D27125BC44D213397F53A6B2D81395C374AE42DF62B827AB3BA6";
const RETAINED_HASH = "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6";
const OBSERVATION_HASH = "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B";
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const deeplyFrozen = (value) => !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen));
const assess = () => ownershipApi.assessSourceControlledCanonicalRecord({ domain: "footballEntity", record, recordSlug: "peter-woods", modulePath: MODULE_PATH, blockers: [] });

export async function runPeterWoodsProspectFootballEntityDiagnostics({ throwOnFailure = false } = {}) {
  const operation012 = await run2026NflDraftFootballEntityDiagnostics();
  const operation011 = await runKansasCityChiefsFootballEntityDiagnostics();
  const sprint48b = await runCanonicalRecordOwnershipPolicyDiagnostics();
  const footballEntity = runFootballEntityContractDiagnostics();
  const personPlayerProspect = await runFidPersonPlayerProspectFoundationDiagnostics();
  const rsp0003 = await runRSP0003Diagnostics();
  const identityObservation = recordedObservations.find((value) => value.record.field === "identity");
  const reviewIds = evidenceReviewDecisions.map((value) => value.reviewId);
  const revisionSource = readFileSync(resolve(RECORD_DIR, "revision-0001.js"), "utf8");
  const recordIndex = readFileSync(resolve(RECORD_DIR, "index.js"), "utf8");
  const domainIndex = readFileSync(resolve(ROOT, "records/footballEntity/index.js"), "utf8");
  const fidIndex = readFileSync(resolve(ROOT, "index.js"), "utf8");
  const cases = [
    check("exactly-one-revision", () => assert(readdirSync(RECORD_DIR).filter((name) => /^revision-\d{4}\.js$/.test(name)).length === 1, "Expected one revision.")),
    check("contract-valid", () => assert(entityApi.isFootballEntity(record), "Contract rejected record.")),
    check("contract-version", () => assert(record.contractVersion === "FOOTBALL-ENTITY-CONTRACT-1.0.0", "Contract version changed.")),
    check("schema-version", () => assert(record.schemaVersion === "FOOTBALL-ENTITY-SCHEMA-1.0.0", "Schema version changed.")),
    check("canonical-id", () => assert(record.entityId === "prospect:peter-woods", "Entity ID changed.")),
    check("canonical-valid", () => assert(referenceApi.validateCanonicalFootballEntityIdentity(record).valid, "Canonical identity invalid.")),
    check("namespace", () => assert(referenceApi.validateFootballEntityCanonicalReference(record.entityId).namespace === "prospect", "Namespace mismatch.")),
    check("prospect-compatible", () => assert(referenceApi.validateFootballEntityCanonicalReference(record.entityId, { entityType: "PROSPECT" }).valid, "PROSPECT namespace mismatch.")),
    check("prospect-type", () => assert(record.entityType === "PROSPECT", "Entity is not PROSPECT.")),
    check("not-person", () => assert(record.entityType !== "PERSON", "Entity classified as PERSON.")),
    check("not-player", () => assert(record.entityType !== "PLAYER", "Entity classified as PLAYER.")),
    check("canonical-name", () => assert(record.identity.canonicalName === "Peter Woods", "Canonical name mismatch.")),
    check("display-name", () => assert(record.identity.displayName === "Peter Woods", "Display name mismatch.")),
    check("short-name-absent", () => assert(record.identity.shortName === null, "Unsupported short name present.")),
    check("aliases-empty", () => assert(record.aliases.length === 0, "Unsupported alias present.")),
    check("external-ids-empty", () => assert(record.externalIdentifiers.length === 0, "Unsupported external ID present.")),
    check("legacy-not-canonical", () => assert(record.entityId !== "2026-peter-woods", "Legacy ID became canonical.")),
    check("legacy-not-alias", () => assert(!record.aliases.some((value) => value.alias === "2026-peter-woods"), "Legacy ID became alias.")),
    check("legacy-not-external-id", () => assert(!record.externalIdentifiers.some((value) => value.value === "2026-peter-woods"), "Legacy ID became external ID.")),
    check("no-profile-facts", () => assert(!["school", "position", "height", "weight", "classYear", "eligibility", "hometown", "birthDate", "statistics", "ranking", "grade"].some((key) => Object.hasOwn(record, key) || Object.hasOwn(record.identity, key)), "Profile fact present.")),
    check("no-selection-facts", () => assert(!["selectionRef", "selectingOrganizationRef", "draftCycleRef", "round", "overallPick"].some((key) => Object.hasOwn(record, key)), "DraftSelection fact present.")),
    check("active", () => assert(record.status === "ACTIVE", "Status is not ACTIVE.")),
    check("verified", () => assert(record.verification.state === "VERIFIED_WITH_LIMITATIONS", "Verification mismatch.")),
    check("confidence", () => assert(record.verification.identityConfidence === "HIGH", "Confidence mismatch.")),
    check("reviewer", () => assert(record.verification.verifiedBy === "reviewer:repository-owner" && record.verification.verifiedAt === "2026-07-18", "Reviewer metadata mismatch.")),
    check("limitations", () => assert(record.verification.limitations.length === 5, "Limitations changed.")),
    check("revision-one", () => assert(record.versioning.entityVersion === 1, "Revision mismatch.")),
    check("no-predecessor", () => assert(record.versioning.supersedesEntityRef === null, "Predecessor present.")),
    check("no-replacement", () => assert(record.versioning.supersededByEntityRef === null, "Replacement present.")),
    check("no-merger", () => assert(record.versioning.mergedIntoEntityRef === null, "Merger target present.")),
    check("deep-freeze", () => assert(deeplyFrozen(record), "Record not deeply frozen.")),
    check("stable-serialization", () => assert(JSON.stringify(record) === JSON.stringify(record), "Serialization unstable.")),
    check("deterministic", () => assert(JSON.stringify(entityApi.createFootballEntity(record)) === JSON.stringify(entityApi.createFootballEntity(record)), "Construction nondeterministic.")),
    check("input-not-mutated", () => { const value = { entityId: "prospect:test", entityType: "PROSPECT", status: "ACTIVE", identity: { canonicalName: "Test" }, verification: { state: "VERIFIED", identityConfidence: "HIGH", verifiedBy: "reviewer:test", verifiedAt: "2026-07-18" } }; const before = JSON.stringify(value); entityApi.createFootballEntity(value); assert(JSON.stringify(value) === before, "Input mutated."); }),
    check("ownership-eligible", () => assert(assess().eligible, "Ownership eligibility failed.", assess())),
    check("no-blockers", () => assert(assess().errors.length === 0, "Ownership blocker present.", assess())),
    check("source-approved", () => assert(researchSource.status === "APPROVED", "Source not approved.")),
    check("source-ref-only", () => assert(JSON.stringify(record.references.researchSourceRefs) === JSON.stringify([researchSource.sourceId]), "Source refs mismatch.")),
    check("session-verified", () => assert(researchSession.verification.state === "VERIFIED", "Session not verified.")),
    check("session-ref-only", () => assert(JSON.stringify(record.references.researchSessionRefs) === JSON.stringify([researchSession.sessionId]), "Session refs mismatch.")),
    check("identity-observation", () => assert(identityObservation?.record.valueText === "Peter Woods" && identityObservation.verification.state === "VERIFIED" && identityObservation.subjects.some((value) => value.subjectType === "PROSPECT"), "Prospect identity observation invalid.")),
    check("identity-observation-only", () => assert(JSON.stringify(record.references.recordedObservationRefs) === JSON.stringify([identityObservation.observationId]), "Unrelated observation referenced.")),
    check("artifact-active-verified", () => assert(evidenceArtifact.state === "ACTIVE" && evidenceArtifact.verification.state === "VERIFIED", "Artifact invalid.")),
    check("artifact-ref-only", () => assert(JSON.stringify(record.references.evidenceArtifactRefs) === JSON.stringify([evidenceArtifact.evidenceId]), "Artifact ref mismatch.")),
    check("identity-review", () => assert(reviewIds.includes("evidence-review:rsp-0003:observation-1"), "Identity review missing.")),
    check("artifact-review", () => assert(reviewIds.includes("evidence-review:rsp-0003:artifact"), "Artifact review missing.")),
    check("other-refs-exact", () => assert(JSON.stringify(record.references.otherRefs) === JSON.stringify(["evidence-review:rsp-0003:observation-1", "evidence-review:rsp-0003:artifact", "research-package:rsp-0003"]), "Review/package refs mismatch.")),
    check("package-approved", () => assert(packageManifest.status === "APPROVED" && packageManifest.governance.authorized, "Package not approved.")),
    check("package-provenance", () => assert(record.provenance.originSystem === "Research Repository" && record.provenance.originRecordRef === packageManifest.packageId, "Provenance mismatch.")),
    check("zero-analysis", () => assert(record.references.analyticalObservationRefs.length === 0 && packageManifest.analyticalObservationRefs.length === 0, "Analysis introduced.")),
    check("governed-path", () => assert(assess().modulePath === MODULE_PATH, "Path mismatch.")),
    check("revision-file", () => assert(readdirSync(RECORD_DIR).includes("revision-0001.js"), "Revision file missing.")),
    check("record-export", () => assert(recordIndex.includes("peterWoodsProspectFootballEntityRevision1"), "Record export missing.")),
    check("domain-export", () => assert(domainIndex.includes("peterWoodsProspectFootballEntityRevision1") && !domainIndex.includes("export *"), "Domain export invalid.")),
    check("root-not-exported", () => assert(!fidIndex.includes("peterWoodsProspectFootballEntityRevision1") && !fidIndex.includes("records/footballEntity/index.js"), "Root exported instance.")),
    check("legacy-fixture-remains", () => assert(readFileSync(resolve(ROOT, "population/fixtures/firstProspectCohortFixtures.js"), "utf8").includes('legacyProspectId: "2026-peter-woods"'), "Legacy fixture changed.")),
    check("no-legacy-migration", () => assert(!/migration|resolver|registry/i.test(revisionSource), "Identity migration infrastructure introduced.")),
    check("no-persistence-metadata", () => assert(!["persistenceId", "requestId", "operationId", "batchId", "databaseRowId"].some((key) => Object.hasOwn(record, key)), "Persistence metadata present.")),
    check("no-external-effects", () => assert(!/(createClient|supabase|fetch\(|INSERT|UPDATE|runtimeRegistry|simulator)/i.test(revisionSource), "External effect introduced.")),
    check("no-person-player-entity", () => assert(!/FOOTBALL_ENTITY_TYPES\.(?:PERSON|PLAYER)/.test(revisionSource), "Person or Player entity introduced.")),
    check("no-profiles", () => assert(!/create(?:Prospect|Player|Person|Organization|Team)Profile/.test(revisionSource), "Profile introduced.")),
    check("no-draft-selection", () => assert(!/createDraftSelection|selectionRef/.test(revisionSource), "DraftSelection introduced.")),
    check("no-relationship", () => assert(!/FootballRelationship|SELECTED_BY/.test(revisionSource), "Relationship introduced.")),
    check("operation012", () => assert(operation012.failed === 0, "Operation 012 failed.", operation012)),
    check("draft-cycle-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/2026-nfl-draft/revision-0001.js")) === DRAFT_CYCLE_HASH, "Draft-cycle revision changed.")),
    check("operation011", () => assert(operation011.failed === 0, "Operation 011 failed.", operation011)),
    check("chiefs-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/kansas-city-chiefs/revision-0001.js")) === CHIEFS_HASH, "Chiefs revision changed.")),
    check("sprint48b", () => assert(sprint48b.failed === 0, "Sprint 48B failed.", sprint48b)),
    check("sprint48a", () => assert(sprint48b.regressions.sprint48a.failed === 0, "Sprint 48A failed.")),
    check("football-entity", () => assert(footballEntity.failed === 0, "FootballEntity failed.")),
    check("person-player-prospect", () => assert(personPlayerProspect.failed === 0, "Person/Player/Prospect foundation failed.", personPlayerProspect)),
    check("prospect-profile", () => assert(sprint48b.regressions.prospectProfile.failed === 0, "ProspectProfile/FID failed.")),
    check("sprint47", () => assert(sprint48b.regressions.sprint47.failed === 0, "Sprint 47 failed.")),
    check("sprint46", () => assert(sprint48b.regressions.sprint46.failed === 0, "Sprint 46 failed.")),
    check("rsp0003", () => assert(rsp0003.failed === 0 && rsp0003.governance.package === "APPROVED", "RSP-0003 failed.")),
    check("retained-hash", () => assert(rsp0003.hashes.retainedContent === RETAINED_HASH, "Retained hash changed.")),
    check("observation-hash", () => assert(rsp0003.hashes.recordedObservations === OBSERVATION_HASH, "Observation hash changed.")),
    check("rsp0001", () => assert(sprint48b.regressions.rsp0001.failed === 0, "RSP-0001 failed.")),
    check("rsp0002", () => assert(sprint48b.regressions.rsp0002.failed === 0, "RSP-0002 failed.")),
    check("research-repository", () => assert(sprint48b.regressions.researchRepository.failed === 0, "Research Repository failed.")),
    check("population", () => assert(sprint48b.regressions.population.failed === 0, "Population failed.")),
  ];
  const passed = cases.filter((value) => value.passed).length;
  const failed = cases.length - passed;
  const summary = { suite: "PeterWoodsCanonicalProspectFootballEntityDiagnostics", total: cases.length, passed, failed, cases, record: { entityId: record.entityId, entityType: record.entityType, revision: record.versioning.entityVersion, eligible: assess().eligible }, hashes: { chiefs: CHIEFS_HASH, draftCycle: DRAFT_CYCLE_HASH, ...rsp0003.hashes }, regressions: { operation012: { total: operation012.total, failed: operation012.failed }, operation011: { total: operation011.total, failed: operation011.failed }, sprint48b: { total: sprint48b.total, failed: sprint48b.failed }, sprint48a: sprint48b.regressions.sprint48a, footballEntity: { total: footballEntity.total, failed: footballEntity.failed }, personPlayerProspect: { total: personPlayerProspect.total, failed: personPlayerProspect.failed }, prospectProfile: sprint48b.regressions.prospectProfile, sprint47: sprint48b.regressions.sprint47, sprint46: sprint48b.regressions.sprint46, rsp0001: sprint48b.regressions.rsp0001, rsp0002: sprint48b.regressions.rsp0002, rsp0003: { total: rsp0003.total, failed: rsp0003.failed }, researchRepository: sprint48b.regressions.researchRepository, population: sprint48b.regressions.population } };
  if (throwOnFailure && failed) throw new Error(`${summary.suite} failed ${failed} of ${summary.total}.`);
  return summary;
}

export default Object.freeze({ runPeterWoodsProspectFootballEntityDiagnostics });
