import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import ownershipApi, * as namedOwnershipApi from "../records/index.js";
import { runFootballEntityCanonicalReferencePolicyDiagnostics } from "./runFootballEntityCanonicalReferencePolicyDiagnostics.js";
import { runDraftSelectionContractDiagnostics } from "./runDraftSelectionContractDiagnostics.js";
import { runProspectEligibilitySufficiencyPolicyDiagnostics } from "../population/runProspectEligibilitySufficiencyPolicyDiagnostics.js";
import { runRSP0003Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/runRSP0003Diagnostics.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECORDS = resolve(ROOT, "records");
const FID_INDEX = readFileSync(resolve(ROOT, "index.js"), "utf8");
const POLICY_SOURCE = readFileSync(resolve(RECORDS, "CanonicalRecordOwnershipPolicy.js"), "utf8");
const DOC_SOURCE = readFileSync(resolve(ROOT, "docs/SourceControlledCanonicalRecordOwnershipPolicy.md"), "utf8");
const FE_BARREL = readFileSync(resolve(RECORDS, "footballEntity/index.js"), "utf8");
const DS_BARREL = readFileSync(resolve(RECORDS, "draftSelection/index.js"), "utf8");
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const has = (assessment, code) => assessment.errors.some((entry) => entry.code === code);
const footballEntity = () => Object.freeze(fidApi.createFootballEntity({ entityId: "organization:synthetic-record-owner", entityType: "ORGANIZATION", status: "ACTIVE", identity: { canonicalName: "Synthetic Record Owner" }, references: { researchSourceRefs: ["research-source:synthetic"], evidenceArtifactRefs: ["evidence-artifact:synthetic"] }, verification: { state: "VERIFIED", identityConfidence: "HIGH", verifiedBy: "reviewer:synthetic", verifiedAt: "2026-07-18" }, provenance: { createdBy: "reviewer:synthetic", createdAt: "2026-07-18" }, versioning: { entityVersion: 1 } }));
const draftSelection = () => Object.freeze(fidApi.createDraftSelection({ selectionRef: "draft-selection:2027:overall-1", selectionRevision: 1, prospectRef: "prospect:synthetic", selectingOrganizationRef: "organization:synthetic", draftCycleRef: "draft-cycle:2027", round: 1, overallPick: 1, selectionType: "STANDARD", sourceRefs: ["research-source:synthetic"], evidenceArtifactRefs: ["evidence-artifact:synthetic"], reviewRefs: ["evidence-review:synthetic"], verification: { state: "VERIFIED", reviewerRefs: ["reviewer:synthetic"], verifiedAt: "2026-07-18" }, provenance: { createdBy: "reviewer:synthetic", createdAt: "2026-07-18" }, lifecycle: { state: "ACTIVE" } }));
const input = (domain, record, recordSlug, modulePath) => ({ domain, record, recordSlug, modulePath, blockers: [] });

export async function runCanonicalRecordOwnershipPolicyDiagnostics({ throwOnFailure = false } = {}) {
  const sprint48a = await runFootballEntityCanonicalReferencePolicyDiagnostics();
  const sprint47 = runDraftSelectionContractDiagnostics();
  const sprint46 = await runProspectEligibilitySufficiencyPolicyDiagnostics();
  const rsp0003 = await runRSP0003Diagnostics();
  const fe = footballEntity(); const ds = draftSelection();
  const fePath = fidApi.createCanonicalRecordRevisionPath({ domain: "footballEntity", recordSlug: "synthetic-record-owner", revision: 1 });
  const dsPath = fidApi.createCanonicalRecordRevisionPath({ domain: "draftSelection", recordSlug: "synthetic-record", revision: 1 });
  const cases = [
    check("policy-exports", () => Object.keys(namedOwnershipApi).filter((key) => key !== "default").forEach((key) => assert(namedOwnershipApi[key] === ownershipApi[key] && namedFidApi[key] === fidApi[key], `Export mismatch: ${key}.`))),
    check("policy-version", () => assert(fidApi.CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION.endsWith("1.0.0"), "Policy version changed.")),
    check("schema-version", () => assert(fidApi.CANONICAL_RECORD_OWNERSHIP_SCHEMA_VERSION === "1.0.0", "Schema version changed.")),
    check("football-entity-domain", () => assert(fidApi.CANONICAL_RECORD_DOMAINS.FOOTBALL_ENTITY === "footballEntity", "FootballEntity domain missing.")),
    check("draft-selection-domain", () => assert(fidApi.CANONICAL_RECORD_DOMAINS.DRAFT_SELECTION === "draftSelection", "DraftSelection domain missing.")),
    check("football-entity-path", () => assert(fePath.endsWith("records/footballEntity/synthetic-record-owner/revision-0001.js"), "FootballEntity path invalid.")),
    check("draft-selection-path", () => assert(dsPath.endsWith("records/draftSelection/synthetic-record/revision-0001.js"), "DraftSelection path invalid.")),
    check("revision-padding", () => assert(fidApi.createCanonicalRecordRevisionPath({ domain: "draftSelection", recordSlug: "test", revision: 12 }).endsWith("revision-0012.js"), "Revision padding changed.")),
    check("revision-starts-one", () => assert(fidApi.createCanonicalRecordRevisionPath({ domain: "draftSelection", recordSlug: "test", revision: 0 }) === null, "Revision zero accepted.")),
    check("invalid-domain", () => assert(fidApi.createCanonicalRecordRevisionPath({ domain: "universal", recordSlug: "test", revision: 1 }) === null, "Universal domain accepted.")),
    check("invalid-slug", () => assert(fidApi.createCanonicalRecordRevisionPath({ domain: "draftSelection", recordSlug: "Invalid Slug", revision: 1 }) === null, "Invalid slug accepted.")),
    check("path-validation", () => assert(fidApi.validateCanonicalRecordRevisionPath(dsPath, { domain: "draftSelection", recordSlug: "synthetic-record", revision: 1 }).valid, "Valid path rejected.")),
    check("path-mismatch", () => assert(!fidApi.validateCanonicalRecordRevisionPath(fePath, { domain: "draftSelection", recordSlug: "synthetic-record", revision: 1 }).valid, "Path mismatch accepted.")),
    check("fixtures-prohibited", () => assert(!fidApi.validateCanonicalRecordRevisionPath("src/data/footballIntelligence/fid/fixtures/draftSelection/test/revision-0001.js", { domain: "draftSelection", recordSlug: "test", revision: 1 }).valid, "Fixture path accepted.")),
    check("diagnostics-prohibited", () => assert(!fidApi.validateCanonicalRecordRevisionPath("src/data/footballIntelligence/fid/diagnostics/test/revision-0001.js", { domain: "draftSelection", recordSlug: "test", revision: 1 }).valid, "Diagnostic path accepted.")),
    check("research-repository-prohibited", () => assert(fidApi.CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS.includes("researchRepository"), "Research Repository boundary missing.")),
    check("simulator-prohibited", () => assert(fidApi.CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS.includes("simulator"), "Simulator boundary missing.")),
    check("persistence-prohibited", () => assert(fidApi.CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS.includes("persistence"), "Persistence path boundary missing.")),
    check("football-entity-eligible", () => assert(fidApi.assessSourceControlledCanonicalRecord(input("footballEntity", fe, "synthetic-record-owner", fePath)).eligible, "Valid FootballEntity record rejected.")),
    check("draft-selection-eligible", () => assert(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", ds, "synthetic-record", dsPath)).eligible, "Valid DraftSelection record rejected.")),
    check("contract-valid-required", () => assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", Object.freeze({}), "synthetic-record", dsPath)), "INVALID_PRODUCTION_CONTRACT_RECORD"), "Invalid contract accepted.")),
    check("canonical-id-required", () => { const record = Object.freeze({ ...ds, selectionRef: "selection-1" }); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "INVALID_CANONICAL_RECORD_IDENTIFIER"), "Legacy selection ID accepted."); }),
    check("revision-required", () => { const record = Object.freeze({ ...ds, selectionRevision: null }); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "INVALID_CANONICAL_RECORD_REVISION"), "Missing revision accepted."); }),
    check("verification-required", () => { const record = Object.freeze(fidApi.createDraftSelection({ ...ds, verification: { state: "UNVERIFIED" } })); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "CANONICAL_RECORD_NOT_VERIFIED"), "Unverified record accepted."); }),
    check("lifecycle-required", () => { const record = Object.freeze(fidApi.createDraftSelection({ ...ds, lifecycle: { state: "ARCHIVED" } })); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "CANONICAL_RECORD_LIFECYCLE_INELIGIBLE"), "Ineligible lifecycle accepted."); }),
    check("evidence-or-provenance-required", () => { const record = Object.freeze(fidApi.createDraftSelection({ ...ds, sourceRefs: [], evidenceArtifactRefs: [], reviewRefs: [], provenance: {} })); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "CANONICAL_RECORD_SUPPORT_REQUIRED"), "Unsupported record accepted."); }),
    check("blockers-prohibited", () => { const value = input("draftSelection", ds, "synthetic-record", dsPath); value.blockers = ["blocked"]; assert(has(fidApi.assessSourceControlledCanonicalRecord(value), "UNRESOLVED_CANONICAL_RECORD_BLOCKERS"), "Blocker accepted."); }),
    check("immutable-required", () => { const record = fidApi.createDraftSelection({ ...ds }); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "CANONICAL_RECORD_NOT_IMMUTABLE"), "Mutable record accepted."); }),
    check("persistence-id-prohibited", () => { const record = Object.freeze({ ...ds, persistenceId: "persistence:synthetic" }); assert(has(fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", record, "synthetic-record", dsPath)), "PERSISTENCE_METADATA_IN_SOURCE_RECORD"), "Persistence ID accepted."); }),
    check("no-persistence-effect", () => assert(!fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", ds, "synthetic-record", dsPath)).persistencePerformed, "Persistence effect reported.")),
    check("no-runtime-registration", () => assert(!fidApi.assessSourceControlledCanonicalRecord(input("draftSelection", ds, "synthetic-record", dsPath)).runtimeRegistrationPerformed, "Runtime registration reported.")),
    check("append-only-policy", () => assert(fidApi.CANONICAL_RECORD_REVISION_POLICY.appendOnly && !fidApi.CANONICAL_RECORD_REVISION_POLICY.overwritePriorRevisionAllowed, "Revision policy is mutable.")),
    check("persistence-id-not-required", () => assert(!fidApi.CANONICAL_RECORD_REVISION_POLICY.persistenceIdRequired, "Source records require persistence ID.")),
    check("root-no-instances", () => assert(!fidApi.CANONICAL_RECORD_EXPORT_POLICY.rootFidExportsInstances, "Root export policy exposes instances.")),
    check("explicit-domain-export", () => assert(fidApi.CANONICAL_RECORD_EXPORT_POLICY.domainRecordBarrelsMayExplicitlyExportApprovedInstances, "Domain record exports prohibited.")),
    check("wildcard-instances-prohibited", () => assert(!fidApi.CANONICAL_RECORD_EXPORT_POLICY.wildcardInstanceExportsAllowed, "Wildcard instance exports allowed.")),
    check("runtime-auto-registration-prohibited", () => assert(!fidApi.CANONICAL_RECORD_EXPORT_POLICY.runtimeAutoRegistrationAllowed, "Runtime registration allowed.")),
    check("football-entity-barrel-empty", () => assert(!/export\s+(?:const|let|var|function|class|\*)/.test(FE_BARREL), "FootballEntity instance barrel is not empty.")),
    check("draft-selection-barrel-empty", () => assert(!/export\s+(?:const|let|var|function|class|\*)/.test(DS_BARREL), "DraftSelection instance barrel is not empty.")),
    check("root-fid-policy-only", () => assert(FID_INDEX.includes("./records/index.js") && !FID_INDEX.includes("./records/footballEntity/index.js") && !FID_INDEX.includes("./records/draftSelection/index.js"), "Root FID exposes record instances.")),
    check("source-control-owns-domain-payload", () => assert(fidApi.CANONICAL_RECORD_PERSISTENCE_BOUNDARY.sourceControlledOwns.includes("contract payload"), "Domain payload ownership missing.")),
    check("persistence-owns-row-id", () => assert(fidApi.CANONICAL_RECORD_PERSISTENCE_BOUNDARY.persistenceOwns.includes("database row identity"), "Persistence row ownership missing.")),
    check("persistence-owns-request", () => assert(fidApi.CANONICAL_RECORD_PERSISTENCE_BOUNDARY.persistenceOwns.includes("database requestId"), "Persistence request ownership missing.")),
    check("policy-no-persistence-import", () => assert(!/from\s+["'][^"']*persistence/i.test(POLICY_SOURCE), "Policy imports persistence.")),
    check("policy-no-research-import", () => assert(!/from\s+["'][^"']*researchRepository/i.test(POLICY_SOURCE), "Policy imports Research Repository.")),
    check("domain-ownership-documented", () => assert(DOC_SOURCE.includes("owned by one FID domain"), "Domain ownership undocumented.")),
    check("revision-policy-documented", () => assert(DOC_SOURCE.includes("never overwritten"), "Immutable revision policy undocumented.")),
    check("export-policy-documented", () => assert(DOC_SOURCE.includes("exported explicitly—never by wildcard"), "Export policy undocumented.")),
    check("persistence-boundary-documented", () => assert(DOC_SOURCE.includes("Persistence separately owns"), "Persistence boundary undocumented.")),
    check("no-universal-record-contract", () => assert(!/UniversalRecordContract|CanonicalRecordContract/.test(POLICY_SOURCE + FID_INDEX), "Universal record contract introduced.")),
    check("no-record-catalog", () => assert(!/catalog|registry/i.test(POLICY_SOURCE), "Record registry introduced.")),
    check("domain-directories-exist", () => assert(["footballEntity", "draftSelection"].every((name) => readdirSync(RECORDS, { withFileTypes: true }).some((entry) => entry.isDirectory() && entry.name === name)), "Domain directories missing.")),
    check("governed-production-record-layout", () => {
      const footballEntityEntries = readdirSync(resolve(RECORDS, "footballEntity")).sort();
      const draftSelectionEntries = readdirSync(resolve(RECORDS, "draftSelection")).sort();
      assert(JSON.stringify(footballEntityEntries) === JSON.stringify(["2026-nfl-draft", "README.md", "index.js", "kansas-city-chiefs", "peter-woods"]), "FootballEntity record boundary contains an unexpected entry.");
      assert(JSON.stringify(draftSelectionEntries) === JSON.stringify(["2026-overall-29", "README.md", "index.js"]), "DraftSelection record boundary contains an unexpected entry.");
    }),
    check("sprint48a-regression", () => assert(sprint48a.failed === 0, "Sprint 48A failed.", sprint48a)),
    check("sprint47-regression", () => assert(sprint47.failed === 0, "Sprint 47 failed.", sprint47)),
    check("sprint46-regression", () => assert(sprint46.failed === 0, "Sprint 46 failed.", sprint46)),
    check("rsp0003-regression", () => assert(rsp0003.failed === 0 && rsp0003.governance.package === "APPROVED", "RSP-0003 failed.", rsp0003)),
    check("rsp0003-hashes", () => assert(rsp0003.hashes.retainedContent === "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6" && rsp0003.hashes.recordedObservations === "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B", "RSP-0003 hashes changed.")),
    check("population-regression", () => assert(sprint46.regressions.population.failed === 0, "Population baseline failed.")),
    check("prospect-profile-regression", () => assert(sprint46.regressions.prospectProfile.failed === 0, "ProspectProfile baseline failed.")),
    check("research-regression", () => assert(sprint46.regressions.researchRepository.failed === 0, "Research Repository baseline failed.")),
    check("rsp0001-regression", () => assert(sprint46.regressions.rsp0001.failed === 0, "RSP-0001 failed.")),
    check("rsp0002-regression", () => assert(sprint46.regressions.rsp0002.failed === 0, "RSP-0002 failed.")),
    check("no-external-effects", () => assert(!/(createClient|fetch\(|sql\s|INSERT|UPDATE|runtimeRegistry|simulator)/i.test(POLICY_SOURCE), "Policy contains an external effect.")),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: "CanonicalRecordOwnershipPolicyDiagnostics", policyVersion: fidApi.CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION, schemaVersion: fidApi.CANONICAL_RECORD_OWNERSHIP_SCHEMA_VERSION, total: cases.length, passed, failed, cases, productionInstancesCreatedBySprint48B: false, governedProductionInstancesPresent: 4, domainsPrepared: ["footballEntity", "draftSelection"], regressions: { sprint48a: { total: sprint48a.total, failed: sprint48a.failed }, sprint47: { total: sprint47.total, failed: sprint47.failed }, sprint46: { total: sprint46.total, failed: sprint46.failed }, rsp0003: { total: rsp0003.total, failed: rsp0003.failed }, population: sprint46.regressions.population, prospectProfile: sprint46.regressions.prospectProfile, researchRepository: sprint46.regressions.researchRepository, rsp0001: sprint46.regressions.rsp0001, rsp0002: sprint46.regressions.rsp0002 } };
  if (throwOnFailure && failed) throw new Error(`${summary.suite} failed ${failed} of ${summary.total} cases.`);
  return summary;
}

export default Object.freeze({ runCanonicalRecordOwnershipPolicyDiagnostics });
