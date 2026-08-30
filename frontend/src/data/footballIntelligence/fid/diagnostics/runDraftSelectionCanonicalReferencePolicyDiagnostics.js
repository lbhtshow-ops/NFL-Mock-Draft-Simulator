import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import draftSelectionApi, * as namedDraftSelectionApi from "../draftSelection/index.js";
import { runPeterWoodsProspectFootballEntityDiagnostics } from "./runPeterWoodsProspectFootballEntityDiagnostics.js";
import { run2026NflDraftFootballEntityDiagnostics } from "./run2026NflDraftFootballEntityDiagnostics.js";
import { runKansasCityChiefsFootballEntityDiagnostics } from "./runKansasCityChiefsFootballEntityDiagnostics.js";
import { runCanonicalRecordOwnershipPolicyDiagnostics } from "./runCanonicalRecordOwnershipPolicyDiagnostics.js";
import { runFootballEntityCanonicalReferencePolicyDiagnostics } from "./runFootballEntityCanonicalReferencePolicyDiagnostics.js";
import { runDraftSelectionContractDiagnostics } from "./runDraftSelectionContractDiagnostics.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POLICY_SOURCE = readFileSync(resolve(ROOT, "draftSelection/DraftSelectionReferencePolicy.js"), "utf8");
const CONTRACT_SOURCE = readFileSync(resolve(ROOT, "draftSelection/DraftSelectionContract.js"), "utf8");
const DOC_SOURCE = readFileSync(resolve(ROOT, "docs/DraftSelectionCanonicalReferencePolicy.md"), "utf8");
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const has = (result, code) => result.errors.some((entry) => entry.code === code);
const create = (overrides = {}) => fidApi.createDraftSelection({ selectionRef: "draft-selection:2026:overall-29", selectionRevision: 1, prospectRef: "prospect:peter-woods", selectingOrganizationRef: "organization:kansas-city-chiefs", draftCycleRef: "draft-cycle:2026", round: 1, overallPick: 29, selectionType: "STANDARD", ...overrides });

export async function runDraftSelectionCanonicalReferencePolicyDiagnostics({ throwOnFailure = false } = {}) {
  const operation013 = await runPeterWoodsProspectFootballEntityDiagnostics();
  const operation012 = await run2026NflDraftFootballEntityDiagnostics();
  const operation011 = await runKansasCityChiefsFootballEntityDiagnostics();
  const sprint48b = await runCanonicalRecordOwnershipPolicyDiagnostics();
  const sprint48a = await runFootballEntityCanonicalReferencePolicyDiagnostics();
  const sprint47 = runDraftSelectionContractDiagnostics();
  const footballEntity = runFootballEntityContractDiagnostics();
  const personPlayerProspect = await runFidPersonPlayerProspectFoundationDiagnostics();
  const canonical = "draft-selection:2026:overall-29";
  const reference = fidApi.validateDraftSelectionCanonicalReference(canonical);
  const base = create();
  const revision2 = create({ selectionRevision: 2, prospectRef: "prospect:corrected", versioning: { predecessorSelectionRef: "draft-selection-revision:2026:overall-29:1" } });
  const cases = [
    check("policy-version", () => assert(fidApi.DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION === "FID-DRAFT-SELECTION-CANONICAL-REFERENCE-POLICY-1.0.0", "Policy version mismatch.")),
    check("schema-version", () => assert(fidApi.DRAFT_SELECTION_CANONICAL_REFERENCE_SCHEMA_VERSION === "1.0.0", "Schema version mismatch.")),
    check("namespace", () => assert(fidApi.DRAFT_SELECTION_CANONICAL_NAMESPACE === "draft-selection", "Namespace mismatch.")),
    check("selection-ref-owner", () => assert(fidApi.DRAFT_SELECTION_IDENTITY_OWNERSHIP.includes("DraftSelection owns selectionRef"), "Ownership statement missing.")),
    check("identity-components", () => assert(JSON.stringify(fidApi.DRAFT_SELECTION_IDENTITY_COMPONENTS) === JSON.stringify(["draftCycleRef", "overallPick"]), "Identity components changed.")),
    check("prospect-excluded", () => assert(fidApi.DRAFT_SELECTION_EXCLUDED_IDENTITY_COMPONENTS.includes("prospectRef"), "Prospect entered identity.")),
    check("organization-excluded", () => assert(fidApi.DRAFT_SELECTION_EXCLUDED_IDENTITY_COMPONENTS.includes("selectingOrganizationRef"), "Organization entered identity.")),
    check("round-excluded", () => assert(fidApi.DRAFT_SELECTION_EXCLUDED_IDENTITY_COMPONENTS.includes("round"), "Round entered identity.")),
    check("revision-excluded", () => assert(fidApi.DRAFT_SELECTION_EXCLUDED_IDENTITY_COMPONENTS.includes("selectionRevision"), "Revision entered identity.")),
    check("persistence-excluded", () => assert(["persistenceId", "requestId", "operationId", "batchId"].every((key) => fidApi.DRAFT_SELECTION_EXCLUDED_IDENTITY_COMPONENTS.includes(key)), "Persistence metadata entered identity.")),
    check("canonical-generation", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 29 }) === canonical, "Canonical generation failed.")),
    check("deterministic-generation", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 29 }) === fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 29 }), "Generation unstable.")),
    check("input-not-mutated", () => { const input = { draftCycleRef: "draft-cycle:2026", overallPick: 29 }; const before = JSON.stringify(input); fidApi.createDraftSelectionCanonicalReference(input); assert(JSON.stringify(input) === before, "Generator mutated input."); }),
    check("lowercase-output", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: " DRAFT-CYCLE:2026 ", overallPick: 29 }) === canonical, "Canonical output not normalized.")),
    check("outer-whitespace-validation", () => assert(fidApi.validateDraftSelectionCanonicalReference(` ${canonical} `).canonical, "Outer whitespace not normalized.")),
    check("positive-pick", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 1 }) === "draft-selection:2026:overall-1", "Positive pick rejected.")),
    check("zero-rejected", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 0 }) === null, "Zero accepted.")),
    check("negative-rejected", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: -1 }) === null, "Negative accepted.")),
    check("decimal-rejected", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 1.5 }) === null, "Decimal accepted.")),
    check("numeric-string-rejected", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: "29" }) === null, "Numeric string accepted.")),
    check("leading-zero-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:2026:overall-029"), "Leading zero accepted.")),
    check("empty-cycle-rejected", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "", overallPick: 29 }) === null, "Empty cycle accepted.")),
    check("bare-cycle-rejected", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "2026", overallPick: 29 }) === null, "Bare cycle accepted.")),
    check("canonical-cycle-required", () => assert(fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-class:2026", overallPick: 29 }) === null, "Wrong cycle type accepted.")),
    check("canonical-valid", () => assert(reference.valid && reference.canonical, "Canonical reference rejected.")),
    check("namespace-parsed", () => assert(reference.namespace === "draft-selection", "Namespace parse failed.")),
    check("cycle-parsed", () => assert(reference.draftCycleSegment === "2026", "Cycle parse failed.")),
    check("pick-parsed", () => assert(reference.overallPick === 29, "Pick parse failed.")),
    check("separator-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection/2026/overall-29"), "Unsupported separator accepted.")),
    check("empty-segment-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection::overall-29"), "Empty segment accepted.")),
    check("internal-whitespace-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:2026:overall- 29"), "Internal whitespace accepted.")),
    check("prospect-form-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:peter-woods:2026:29"), "Prospect form accepted.")),
    check("organization-form-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:kc:2026:29"), "Organization form accepted.")),
    check("revision-form-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:2026:overall-29:revision-1"), "Revision form accepted.")),
    check("persistence-form-rejected", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:2026:overall-29:persistence-1"), "Persistence form accepted.")),
    check("selection-current-noncanonical", () => assert(!fidApi.isCanonicalDraftSelectionReference("selection:current"), "Legacy current accepted.")),
    check("selection-revision-noncanonical", () => assert(!fidApi.isCanonicalDraftSelectionReference("selection:revision:1"), "Legacy revision accepted.")),
    check("synthetic-noncanonical", () => assert(!fidApi.isCanonicalDraftSelectionReference("draft-selection:synthetic:2027:1"), "Synthetic reference accepted.")),
    check("identity-consistent", () => assert(fidApi.validateDraftSelectionIdentityConsistency(base).valid, "Consistent identity rejected.")),
    check("cycle-mismatch", () => assert(has(fidApi.validateDraftSelectionIdentityConsistency({ ...base, draftCycleRef: "draft-cycle:2027" }), "DRAFT_CYCLE_IDENTITY_MISMATCH"), "Cycle mismatch accepted.")),
    check("pick-mismatch", () => assert(has(fidApi.validateDraftSelectionIdentityConsistency({ ...base, overallPick: 30 }), "OVERALL_PICK_IDENTITY_MISMATCH"), "Pick mismatch accepted.")),
    check("round-nonidentity", () => assert(fidApi.validateDraftSelectionIdentityConsistency({ ...base, round: 2 }).valid, "Round changed identity.")),
    check("prospect-nonidentity", () => assert(fidApi.validateDraftSelectionIdentityConsistency({ ...base, prospectRef: "prospect:corrected" }).valid, "Prospect changed identity.")),
    check("organization-nonidentity", () => assert(fidApi.validateDraftSelectionIdentityConsistency({ ...base, selectingOrganizationRef: "organization:corrected" }).valid, "Organization changed identity.")),
    check("date-nonidentity", () => assert(fidApi.validateDraftSelectionIdentityConsistency({ ...base, selectionDate: "2026-04-23" }).valid, "Date changed identity.")),
    check("revision-shared-reference", () => assert(fidApi.validateDraftSelectionRevisionIdentityStability(base, revision2).valid, "Stable revision rejected.")),
    check("revision-ref-change-rejected", () => assert(has(fidApi.validateDraftSelectionRevisionIdentityStability(base, { ...revision2, selectionRef: "draft-selection:2026:overall-30" }), "SELECTION_REFERENCE_CHANGED"), "Revision reference change accepted.")),
    check("revision-cycle-change-rejected", () => assert(has(fidApi.validateDraftSelectionRevisionIdentityStability(base, { ...revision2, draftCycleRef: "draft-cycle:2027" }), "DRAFT_CYCLE_IDENTITY_CHANGED"), "Revision cycle change accepted.")),
    check("revision-pick-change-rejected", () => assert(has(fidApi.validateDraftSelectionRevisionIdentityStability(base, { ...revision2, overallPick: 30 }), "OVERALL_PICK_IDENTITY_CHANGED"), "Revision pick change accepted.")),
    check("revision-not-in-id", () => assert(!canonical.includes("revision"), "Revision embedded in ID.")),
    check("predecessor-nonidentity", () => assert(fidApi.validateDraftSelectionIdentityConsistency(revision2).valid, "Predecessor metadata changed identity.")),
    check("duplicate-revision-detected", () => assert(has(fidApi.assessDraftSelectionIdentifierUniqueness([base, { ...base }]), "DUPLICATE_SELECTION_REVISION"), "Duplicate revision missed.")),
    check("slot-collision-detected", () => assert(has(fidApi.assessDraftSelectionIdentifierUniqueness([base, { ...base, selectionRef: "draft-selection:2026:overall-30" }]), "DRAFT_SLOT_COLLISION"), "Slot collision missed.")),
    check("legitimate-revisions-permitted", () => assert(fidApi.assessDraftSelectionIdentifierUniqueness([base, revision2]).valid, "Legitimate revisions rejected.")),
    check("different-picks-distinct", () => assert(fidApi.assessDraftSelectionIdentifierUniqueness([base, create({ selectionRef: "draft-selection:2026:overall-30", overallPick: 30 })]).valid, "Different picks collided.")),
    check("different-cycles-distinct", () => assert(fidApi.assessDraftSelectionIdentifierUniqueness([base, create({ selectionRef: "draft-selection:2027:overall-29", draftCycleRef: "draft-cycle:2027" })]).valid, "Different cycles collided.")),
    check("different-prospect-same-slot-not-distinct", () => assert(has(fidApi.assessDraftSelectionIdentifierUniqueness([base, { ...base, prospectRef: "prospect:other" }]), "DUPLICATE_SELECTION_REVISION"), "Prospect created distinct slot.")),
    check("different-organization-same-slot-not-distinct", () => assert(has(fidApi.assessDraftSelectionIdentifierUniqueness([base, { ...base, selectingOrganizationRef: "organization:other" }]), "DUPLICATE_SELECTION_REVISION"), "Organization created distinct slot.")),
    check("no-runtime-registry", () => assert(!/registry|singleton|filesystem|readdir/i.test(POLICY_SOURCE), "Runtime registry introduced.")),
    check("synthetic-classified", () => assert(fidApi.isSyntheticDraftSelectionIdentifier("draft-selection:synthetic:2027:1") && fidApi.validateDraftSelectionCanonicalReference("draft-selection:synthetic:2027:1").classification === "SYNTHETIC", "Synthetic classification failed.")),
    check("legacy-classified", () => assert(fidApi.isLegacyDraftSelectionIdentifier("historical-selection-id"), "Legacy classification failed.")),
    check("legacy-contract-compatible", () => assert(fidApi.createDraftSelection({ ...base, selectionRef: "selection:current" }).validation.valid, "Contract backward compatibility changed.")),
    check("legacy-not-issuable", () => assert(!fidApi.assessDraftSelectionCanonicalIssuance(fidApi.createDraftSelection({ ...base, selectionRef: "selection:current" })).eligible, "Legacy ID became issuable.")),
    check("contract-unchanged", () => assert(!CONTRACT_SOURCE.includes("DraftSelectionReferencePolicy"), "Contract coupled to policy.")),
    check("ownership-delegates", () => assert(readFileSync(resolve(ROOT, "records/CanonicalRecordOwnershipPolicy.js"), "utf8").includes("validateDraftSelectionIdentityConsistency"), "Sprint 48B does not delegate.")),
    check("football-entity-eligibility-unchanged", () => assert(sprint48b.failed === 0 && sprint48a.failed === 0, "FootballEntity eligibility changed.")),
    check("record-path-policy-preserved", () => assert(fidApi.createCanonicalRecordRevisionPath({ domain: "draftSelection", recordSlug: "test", revision: 1 }).endsWith("records/draftSelection/test/revision-0001.js"), "Record path changed.")),
    check("operation-metadata-excluded", () => assert(["persistenceId", "requestId", "operationId", "batchId"].every((value) => DOC_SOURCE.includes(value)), "Persistence boundary undocumented.")),
    check("no-runtime-registration", () => assert(!/(runtimeRegistry|registerDraftSelection|createClient|fetch\()/i.test(POLICY_SOURCE), "Runtime effect introduced.")),
    check("no-contract-version-bump", () => assert(fidApi.DRAFT_SELECTION_CONTRACT_VERSION === "FID-DRAFT-SELECTION-CONTRACT-1.0.0", "Contract version changed.")),
    check("no-schema-version-bump", () => assert(fidApi.DRAFT_SELECTION_SCHEMA_VERSION === "1.0.0", "Schema version changed.")),
    check("no-universal-contract", () => assert(!/CanonicalIdentityContract|UniversalIdentity/.test(POLICY_SOURCE), "Universal identity contract introduced.")),
    check("no-persistence-adapter", () => assert(!/(PersistenceAdapter|Supabase|SQL|migration)/i.test(POLICY_SOURCE), "Persistence integration introduced.")),
    check("governed-production-record-export", () => { const source = readFileSync(resolve(ROOT, "records/draftSelection/index.js"), "utf8"); assert(source.includes("peterWoods2026Overall29DraftSelectionRevision1") && !source.includes("export *"), "Governed DraftSelection export is invalid."); }),
    check("public-exports", () => Object.keys(namedDraftSelectionApi).filter((key) => key !== "default").forEach((key) => assert(namedDraftSelectionApi[key] === draftSelectionApi[key] && namedFidApi[key] === fidApi[key], `Export mismatch: ${key}.`))),
    check("operation013", () => assert(operation013.failed === 0, "Operation 013 failed.", operation013)),
    check("operation012", () => assert(operation012.failed === 0, "Operation 012 failed.", operation012)),
    check("operation011", () => assert(operation011.failed === 0, "Operation 011 failed.", operation011)),
    check("sprint48b", () => assert(sprint48b.failed === 0, "Sprint 48B failed.", sprint48b)),
    check("sprint48a", () => assert(sprint48a.failed === 0, "Sprint 48A failed.", sprint48a)),
    check("sprint47", () => assert(sprint47.failed === 0, "Sprint 47 failed.", sprint47)),
    check("sprint46", () => assert(sprint48b.regressions.sprint46.failed === 0, "Sprint 46 failed.")),
    check("football-entity", () => assert(footballEntity.failed === 0, "FootballEntity failed.")),
    check("person-player-prospect", () => assert(personPlayerProspect.failed === 0, "Person/Player/Prospect failed.")),
    check("prospect-profile", () => assert(sprint48b.regressions.prospectProfile.failed === 0, "ProspectProfile/FID failed.")),
    check("rsp0001", () => assert(sprint48b.regressions.rsp0001.failed === 0, "RSP-0001 failed.")),
    check("rsp0002", () => assert(sprint48b.regressions.rsp0002.failed === 0, "RSP-0002 failed.")),
    check("rsp0003", () => assert(operation013.regressions.rsp0003.failed === 0, "RSP-0003 failed.")),
    check("research-repository", () => assert(sprint48b.regressions.researchRepository.failed === 0, "Research Repository failed.")),
    check("population", () => assert(sprint48b.regressions.population.failed === 0, "Population failed.")),
    check("peter-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/peter-woods/revision-0001.js")) === "B2217935B5AC762652F6E156F022E6D730991FEE25ECA8958CEFE8E7EAD488B9", "Peter Woods changed.")),
    check("chiefs-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/kansas-city-chiefs/revision-0001.js")) === "BBCE3E478EA19FA4A8EC0F71AC0FA47BC17830D7FC97AEE0B5C95E85606E07B3", "Kansas City changed.")),
    check("cycle-hash", () => assert(hash(resolve(ROOT, "records/footballEntity/2026-nfl-draft/revision-0001.js")) === "7158BF7BB5D1D27125BC44D213397F53A6B2D81395C374AE42DF62B827AB3BA6", "Draft cycle changed.")),
    check("rsp-hashes", () => assert(operation013.hashes.retainedContent === "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6" && operation013.hashes.recordedObservations === "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B", "RSP-0003 changed.")),
  ];
  const passed = cases.filter((value) => value.passed).length; const failed = cases.length - passed;
  const summary = { suite: "DraftSelectionCanonicalReferencePolicyDiagnostics", total: cases.length, passed, failed, cases, expectedPeterWoodsSelectionRef: fidApi.createDraftSelectionCanonicalReference({ draftCycleRef: "draft-cycle:2026", overallPick: 29 }), productionRecordsCreatedBySprint49: 0, governedProductionRecordsPresent: 1, hashes: { peterWoods: "B2217935B5AC762652F6E156F022E6D730991FEE25ECA8958CEFE8E7EAD488B9", kansasCity: "BBCE3E478EA19FA4A8EC0F71AC0FA47BC17830D7FC97AEE0B5C95E85606E07B3", draftCycle: "7158BF7BB5D1D27125BC44D213397F53A6B2D81395C374AE42DF62B827AB3BA6", retainedContent: operation013.hashes.retainedContent, recordedObservations: operation013.hashes.recordedObservations }, regressions: { operation013: { total: operation013.total, failed: operation013.failed }, operation012: { total: operation012.total, failed: operation012.failed }, operation011: { total: operation011.total, failed: operation011.failed }, sprint48b: { total: sprint48b.total, failed: sprint48b.failed }, sprint48a: { total: sprint48a.total, failed: sprint48a.failed }, sprint47: { total: sprint47.total, failed: sprint47.failed }, sprint46: sprint48b.regressions.sprint46, footballEntity: { total: footballEntity.total, failed: footballEntity.failed }, personPlayerProspect: { total: personPlayerProspect.total, failed: personPlayerProspect.failed }, prospectProfile: sprint48b.regressions.prospectProfile, rsp0001: sprint48b.regressions.rsp0001, rsp0002: sprint48b.regressions.rsp0002, rsp0003: operation013.regressions.rsp0003, researchRepository: sprint48b.regressions.researchRepository, population: sprint48b.regressions.population } };
  if (throwOnFailure && failed) throw new Error(`${summary.suite} failed ${failed} of ${summary.total}.`);
  return summary;
}

export default Object.freeze({ runDraftSelectionCanonicalReferencePolicyDiagnostics });
