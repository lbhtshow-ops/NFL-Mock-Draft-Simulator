import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as selectionApi from "../draftSelection/index.js";
import * as referenceApi from "../contracts/FootballEntityReferencePolicy.js";
import * as ownershipApi from "../records/index.js";
import { peterWoods2026Overall29DraftSelectionRevision1 as record } from "../records/draftSelection/2026-overall-29/index.js";
import { peterWoodsProspectFootballEntityRevision1 as prospect } from "../records/footballEntity/peter-woods/index.js";
import { kansasCityChiefsFootballEntityRevision1 as organization } from "../records/footballEntity/kansas-city-chiefs/index.js";
import { nflDraft2026FootballEntityRevision1 as draftCycle } from "../records/footballEntity/2026-nfl-draft/index.js";
import { researchSource } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/evidenceReview.js";
import { packageManifest } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/packageManifest.js";
import { runRSP0003Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/runRSP0003Diagnostics.js";
import { runDraftSelectionCanonicalReferencePolicyDiagnostics } from "./runDraftSelectionCanonicalReferencePolicyDiagnostics.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECORD_DIR = resolve(ROOT, "records/draftSelection/2026-overall-29");
const MODULE_PATH = "src/data/footballIntelligence/fid/records/draftSelection/2026-overall-29/revision-0001.js";
const EXPECTED_HASHES = Object.freeze({ peterWoods: "B2217935B5AC762652F6E156F022E6D730991FEE25ECA8958CEFE8E7EAD488B9", kansasCity: "BBCE3E478EA19FA4A8EC0F71AC0FA47BC17830D7FC97AEE0B5C95E85606E07B3", draftCycle: "7158BF7BB5D1D27125BC44D213397F53A6B2D81395C374AE42DF62B827AB3BA6", retainedContent: "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6", recordedObservations: "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B" });
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const deeplyFrozen = (value) => !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen));
const ownership = (domain, value, slug, modulePath) => ownershipApi.assessSourceControlledCanonicalRecord({ domain, record: value, recordSlug: slug, modulePath, blockers: [] });

export async function runPeterWoodsDraftSelectionOperation010RDiagnostics({ throwOnFailure = false } = {}) {
  const sprint49 = await runDraftSelectionCanonicalReferencePolicyDiagnostics();
  const rsp0003 = await runRSP0003Diagnostics();
  const observations = Object.fromEntries(recordedObservations.map((value) => [value.record.field, value]));
  const source = readFileSync(resolve(RECORD_DIR, "revision-0001.js"), "utf8");
  const recordIndex = readFileSync(resolve(RECORD_DIR, "index.js"), "utf8");
  const domainIndex = readFileSync(resolve(ROOT, "records/draftSelection/index.js"), "utf8");
  const fidIndex = readFileSync(resolve(ROOT, "index.js"), "utf8");
  const assessment = ownership("draftSelection", record, "2026-overall-29", MODULE_PATH);
  const cases = [
    check("exactly-one-revision", () => assert(readdirSync(RECORD_DIR).filter((name) => /^revision-\d{4}\.js$/.test(name)).length === 1, "Expected one production revision.")),
    check("contract-valid", () => assert(selectionApi.isDraftSelection(record), "DraftSelection contract rejected record.")),
    check("contract-version", () => assert(record.contractVersion === "FID-DRAFT-SELECTION-CONTRACT-1.0.0", "Contract version mismatch.")),
    check("schema-version", () => assert(record.schemaVersion === "1.0.0", "Schema version mismatch.")),
    check("canonical-selection-ref", () => assert(record.selectionRef === "draft-selection:2026:overall-29", "Selection reference mismatch.")),
    check("canonical-reference-valid", () => assert(selectionApi.validateDraftSelectionCanonicalReference(record.selectionRef).canonical, "Canonical reference invalid.")),
    check("identity-consistent", () => assert(selectionApi.validateDraftSelectionIdentityConsistency(record).valid, "Selection identity inconsistent.")),
    check("issuance-eligible", () => assert(selectionApi.assessDraftSelectionCanonicalIssuance(record).eligible, "Production issuance failed.")),
    check("revision-one", () => assert(record.selectionRevision === 1, "Revision mismatch.")),
    check("deep-freeze", () => assert(deeplyFrozen(record), "Record is not deeply frozen.")),
    check("stable-serialization", () => assert(JSON.stringify(record) === JSON.stringify(record), "Serialization unstable.")),
    check("factory-deterministic", () => assert(JSON.stringify(selectionApi.createDraftSelection(record)) === JSON.stringify(selectionApi.createDraftSelection(record)), "Factory nondeterministic.")),
    check("factory-input-immutable", () => { const input = { selectionRef: record.selectionRef, selectionRevision: 1, prospectRef: record.prospectRef, selectingOrganizationRef: record.selectingOrganizationRef, draftCycleRef: record.draftCycleRef, round: 1, overallPick: 29, selectionType: "UNKNOWN" }; const before = JSON.stringify(input); selectionApi.createDraftSelection(input); assert(JSON.stringify(input) === before, "Factory mutated input."); }),
    check("prospect-ref", () => assert(record.prospectRef === "prospect:peter-woods", "Prospect reference mismatch.")),
    check("prospect-canonical", () => assert(referenceApi.validateFootballEntityCanonicalReference(record.prospectRef, { entityType: "PROSPECT" }).valid, "Prospect reference invalid.")),
    check("prospect-resolves", () => assert(prospect.entityId === record.prospectRef && prospect.entityType === "PROSPECT", "Prospect reference unresolved.")),
    check("prospect-eligible", () => assert(ownership("footballEntity", prospect, "peter-woods", "src/data/footballIntelligence/fid/records/footballEntity/peter-woods/revision-0001.js").eligible, "Prospect ineligible.")),
    check("organization-ref", () => assert(record.selectingOrganizationRef === "organization:kansas-city-chiefs", "Organization reference mismatch.")),
    check("organization-canonical", () => assert(referenceApi.validateFootballEntityCanonicalReference(record.selectingOrganizationRef, { entityType: "ORGANIZATION" }).valid, "Organization reference invalid.")),
    check("organization-resolves", () => assert(organization.entityId === record.selectingOrganizationRef && organization.entityType === "ORGANIZATION", "Organization unresolved.")),
    check("organization-eligible", () => assert(ownership("footballEntity", organization, "kansas-city-chiefs", "src/data/footballIntelligence/fid/records/footballEntity/kansas-city-chiefs/revision-0001.js").eligible, "Organization ineligible.")),
    check("draft-cycle-ref", () => assert(record.draftCycleRef === "draft-cycle:2026", "Draft-cycle reference mismatch.")),
    check("draft-cycle-canonical", () => assert(referenceApi.validateFootballEntityCanonicalReference(record.draftCycleRef, { entityType: "DRAFT_CYCLE" }).valid, "Draft-cycle reference invalid.")),
    check("draft-cycle-resolves", () => assert(draftCycle.entityId === record.draftCycleRef && draftCycle.entityType === "DRAFT_CYCLE", "Draft cycle unresolved.")),
    check("draft-cycle-eligible", () => assert(ownership("footballEntity", draftCycle, "2026-nfl-draft", "src/data/footballIntelligence/fid/records/footballEntity/2026-nfl-draft/revision-0001.js").eligible, "Draft cycle ineligible.")),
    check("legacy-id-excluded", () => assert(!JSON.stringify(record).includes("2026-peter-woods"), "Legacy identifier used.")),
    check("round", () => assert(record.round === 1 && Number.isInteger(record.round), "Round mismatch.")),
    check("overall-pick", () => assert(record.overallPick === 29 && Number.isInteger(record.overallPick), "Overall pick mismatch.")),
    check("selection-date-null", () => assert(record.selectionDate === null, "Unsupported selection date present.")),
    check("active-lifecycle", () => assert(record.lifecycle.state === "ACTIVE", "Lifecycle mismatch.")),
    check("verified-with-limitations", () => assert(record.verification.state === "VERIFIED_WITH_LIMITATIONS", "Verification mismatch.")),
    check("selection-type-unknown", () => assert(record.selectionType === "UNKNOWN", "Unsupported selection classification present.")),
    check("no-trade-fact", () => assert(!/trade origin|traded from/i.test(JSON.stringify(record)), "Trade fact introduced.")),
    check("no-profile-facts", () => assert(!["position", "school", "height", "weight", "rosterStatus", "contractDetails"].some((key) => Object.hasOwn(record, key)), "Profile fact introduced.")),
    check("no-predecessor", () => assert(record.versioning.predecessorSelectionRef === null, "Predecessor present.")),
    check("no-replacement", () => assert(record.versioning.replacementSelectionRef === null, "Replacement present.")),
    check("ownership-eligible", () => assert(assessment.eligible && assessment.errors.length === 0, "Source-controlled eligibility failed.", assessment)),
    check("no-persistence-metadata", () => assert(!Object.hasOwn(record, "persistenceId") && record.versioning.requestId === null && record.versioning.operationId === null && record.versioning.batchId === null, "Persistence metadata present.")),
    check("source-ref", () => assert(JSON.stringify(record.sourceRefs) === JSON.stringify([researchSource.sourceId]) && researchSource.status === "APPROVED", "Source traceability invalid.")),
    check("session-ref", () => assert(record.extensions.researchTraceability.researchSessionRef === researchSession.sessionId && researchSession.verification.state === "VERIFIED", "Session traceability invalid.")),
    check("all-six-observations", () => assert(JSON.stringify(record.extensions.researchTraceability.recordedObservationRefs) === JSON.stringify(recordedObservations.map((value) => value.observationId)), "Observation traceability invalid.")),
    check("identity-observation", () => assert(observations.identity.record.valueText === "Peter Woods" && observations.identity.verification.state === "VERIFIED", "Identity evidence invalid.")),
    check("cycle-observation", () => assert(observations.draftCycle.record.valueText === "2026 NFL Draft" && observations.draftCycle.verification.state === "VERIFIED", "Cycle evidence invalid.")),
    check("organization-observation", () => assert(observations.selectingOrganization.record.valueText === "Kansas City Chiefs" && observations.selectingOrganization.verification.state === "VERIFIED", "Organization evidence invalid.")),
    check("round-observation", () => assert(observations.round.record.valueText === "First round" && observations.round.verification.state === "VERIFIED", "Round evidence invalid.")),
    check("pick-observation", () => assert(observations.overallPick.record.valueText === "29" && observations.overallPick.verification.state === "VERIFIED", "Pick evidence invalid.")),
    check("selection-event-observation", () => assert(observations.selectionEvent.record.valueText === "Kansas City Chiefs selected Peter Woods" && observations.selectionEvent.verification.state === "VERIFIED", "Selection event evidence invalid.")),
    check("artifact-ref", () => assert(JSON.stringify(record.evidenceArtifactRefs) === JSON.stringify([evidenceArtifact.evidenceId]) && evidenceArtifact.state === "ACTIVE" && evidenceArtifact.verification.state === "VERIFIED", "Artifact traceability invalid.")),
    check("review-refs", () => assert(JSON.stringify(record.reviewRefs) === JSON.stringify(evidenceReviewDecisions.map((value) => value.reviewId)) && evidenceReviewDecisions.every((value) => value.decision === "APPROVE"), "Review traceability invalid.")),
    check("package-ref", () => assert(record.extensions.researchTraceability.researchPackageRef === packageManifest.packageId && packageManifest.status === "APPROVED", "Package traceability invalid.")),
    check("zero-analysis", () => assert(record.extensions.researchTraceability.analyticalObservationRefs.length === 0 && packageManifest.analyticalObservationRefs.length === 0, "Analytical observation introduced.")),
    check("no-duplicate-selection", () => assert(selectionApi.assessDraftSelectionIdentifierUniqueness([record]).unique && readdirSync(resolve(ROOT, "records/draftSelection")).filter((name) => !["README.md", "index.js"].includes(name)).length === 1, "Duplicate production selection exists.")),
    check("governed-path", () => assert(assessment.modulePath === MODULE_PATH, "Storage path invalid.")),
    check("record-export", () => assert(recordIndex.includes("peterWoods2026Overall29DraftSelectionRevision1"), "Record export missing.")),
    check("domain-export", () => assert(domainIndex.includes("peterWoods2026Overall29DraftSelectionRevision1") && !domainIndex.includes("export *"), "Domain export invalid.")),
    check("root-not-exported", () => assert(!fidIndex.includes("peterWoods2026Overall29DraftSelectionRevision1") && !fidIndex.includes("records/draftSelection/index.js"), "Root exported production instance.")),
    check("no-external-effects", () => assert(!/(createClient|supabase|fetch\(|INSERT|UPDATE|runtimeRegistry|simulator|resolver)/i.test(source), "External effect introduced.")),
    check("no-relationship", () => assert(!/FootballRelationship|SELECTED_BY/.test(source), "Relationship introduced.")),
    check("no-population", () => assert(!/PopulationWorkflow|populationLink/.test(source), "Population linkage introduced.")),
    check("sprint49", () => assert(sprint49.failed === 0, "Sprint 49 failed.", sprint49)),
    check("rsp0003", () => assert(rsp0003.failed === 0 && rsp0003.governance.package === "APPROVED", "RSP-0003 failed.")),
    check("peter-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/peter-woods/revision-0001.js")) === EXPECTED_HASHES.peterWoods, "Peter Woods changed.")),
    check("chiefs-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/kansas-city-chiefs/revision-0001.js")) === EXPECTED_HASHES.kansasCity, "Kansas City changed.")),
    check("cycle-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/2026-nfl-draft/revision-0001.js")) === EXPECTED_HASHES.draftCycle, "Draft cycle changed.")),
    check("rsp-hashes", () => assert(rsp0003.hashes.retainedContent === EXPECTED_HASHES.retainedContent && rsp0003.hashes.recordedObservations === EXPECTED_HASHES.recordedObservations, "RSP-0003 hashes changed.")),
  ];
  const passed = cases.filter((value) => value.passed).length; const failed = cases.length - passed;
  const summary = { suite: "PeterWoodsDraftSelectionOperation010RDiagnostics", total: cases.length, passed, failed, cases, record: { selectionRef: record.selectionRef, prospectRef: record.prospectRef, selectingOrganizationRef: record.selectingOrganizationRef, draftCycleRef: record.draftCycleRef, round: record.round, overallPick: record.overallPick, selectionDate: record.selectionDate, selectionType: record.selectionType, lifecycle: record.lifecycle.state, verification: record.verification.state, revision: record.selectionRevision, issuanceEligible: selectionApi.assessDraftSelectionCanonicalIssuance(record).eligible, sourceControlledEligible: assessment.eligible }, hashes: { ...EXPECTED_HASHES, draftSelection: hash(resolve(RECORD_DIR, "revision-0001.js")) }, regressions: sprint49.regressions };
  if (throwOnFailure && failed) throw new Error(`${summary.suite} failed ${failed} of ${summary.total}.`);
  return summary;
}

export default Object.freeze({ runPeterWoodsDraftSelectionOperation010RDiagnostics });
