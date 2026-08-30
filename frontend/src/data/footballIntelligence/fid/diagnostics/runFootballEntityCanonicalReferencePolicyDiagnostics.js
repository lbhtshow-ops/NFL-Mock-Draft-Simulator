import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import constants, * as namedConstants from "../constants/footballEntityReferenceConstants.js";
import policy, * as namedPolicy from "../contracts/FootballEntityReferencePolicy.js";
import { runFootballEntityContractDiagnostics } from "./runFootballEntityContractDiagnostics.js";
import { runOrganizationProfileContractDiagnostics } from "./runOrganizationProfileContractDiagnostics.js";
import { runTeamProfileContractDiagnostics } from "./runTeamProfileContractDiagnostics.js";
import { runFidPersonPlayerProspectFoundationDiagnostics } from "./runFidPersonPlayerProspectFoundationDiagnostics.js";
import { runDraftSelectionContractDiagnostics } from "./runDraftSelectionContractDiagnostics.js";
import { runProspectEligibilitySufficiencyPolicyDiagnostics } from "../population/runProspectEligibilitySufficiencyPolicyDiagnostics.js";
import { runRSP0003Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0003-peter-woods-official-2026-draft-selection/runRSP0003Diagnostics.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POLICY_SOURCE = readFileSync(resolve(ROOT, "contracts/FootballEntityReferencePolicy.js"), "utf8");
const DOC_SOURCE = readFileSync(resolve(ROOT, "docs/FootballEntityCanonicalReferencePolicy.md"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = (id, fn) => { try { fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const hasCode = (result, code, field = "errors") => result[field].some((entry) => entry.code === code);
const base = (overrides = {}) => fidApi.createFootballEntity({ entityId: "organization:diagnostic-franchise", entityType: "ORGANIZATION", status: "CANDIDATE", identity: { canonicalName: "Diagnostic Franchise" }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" }, ...overrides });

export async function runFootballEntityCanonicalReferencePolicyDiagnostics({ throwOnFailure = false } = {}) {
  const footballEntity = runFootballEntityContractDiagnostics();
  const organization = await runOrganizationProfileContractDiagnostics();
  const team = await runTeamProfileContractDiagnostics();
  const foundations = await runFidPersonPlayerProspectFoundationDiagnostics();
  const sprint47 = runDraftSelectionContractDiagnostics();
  const sprint46 = await runProspectEligibilitySufficiencyPolicyDiagnostics();
  const rsp0003 = await runRSP0003Diagnostics();
  const original = { value: " Organization:Diagnostic-Franchise " }; const snapshot = JSON.stringify(original);
  const normalized = fidApi.normalizeFootballEntityCanonicalReference(original.value);
  const canonical = base(); const legacy = base({ entityId: "legacy-entity-1" });
  const cases = [
    check("existing-contract-valid", () => assert(fidApi.isFootballEntity(canonical), "FootballEntity contract rejected canonical ID.")),
    check("existing-diagnostics", () => assert(footballEntity.failed === 0 && footballEntity.total === 120, "FootballEntity baseline failed.", footballEntity)),
    check("valid-reference", () => assert(fidApi.isCanonicalFootballEntityReference("organization:kansas-city-chiefs"), "Valid reference rejected.")),
    check("invalid-reference", () => assert(!fidApi.isCanonicalFootballEntityReference("organization/kansas-city-chiefs"), "Invalid reference accepted.")),
    check("uppercase-normalized", () => assert(fidApi.validateFootballEntityCanonicalReference("ORGANIZATION:KANSAS-CITY-CHIEFS").normalizedRef === "organization:kansas-city-chiefs", "Uppercase policy changed.")),
    check("outer-whitespace-normalized", () => assert(normalized === "organization:diagnostic-franchise", "Whitespace policy changed.")),
    check("internal-whitespace-rejected", () => assert(hasCode(fidApi.validateFootballEntityCanonicalReference("organization:kansas city"), "INVALID_CANONICAL_IDENTITY_SEGMENT"), "Internal whitespace accepted.")),
    check("invalid-separator", () => assert(hasCode(fidApi.validateFootballEntityCanonicalReference("organization::chiefs"), "INVALID_CANONICAL_REFERENCE_STRUCTURE"), "Multiple separator accepted.")),
    check("missing-namespace-not-canonical", () => assert(!fidApi.isCanonicalFootballEntityReference("legacy-entity-1"), "Legacy ID became canonical.")),
    check("empty-namespace", () => assert(hasCode(fidApi.validateFootballEntityCanonicalReference(":chiefs"), "CANONICAL_NAMESPACE_REQUIRED"), "Empty namespace accepted.")),
    check("empty-segment", () => assert(hasCode(fidApi.validateFootballEntityCanonicalReference("organization:"), "CANONICAL_IDENTITY_SEGMENT_REQUIRED"), "Empty identity accepted.")),
    check("deterministic-normalization", () => assert(fidApi.normalizeFootballEntityCanonicalReference(original.value) === normalized, "Normalization unstable.")),
    check("input-not-mutated", () => assert(JSON.stringify(original) === snapshot, "Policy mutated caller input.")),
    check("stable-constructed-reference", () => assert(fidApi.createFootballEntityCanonicalReference("ORGANIZATION", "diagnostic-franchise") === canonical.entityId, "Constructed reference unstable.")),
    check("legacy-compatible", () => assert(legacy.validation.valid && fidApi.isLegacyFootballEntityIdentifier(legacy.entityId), "Legacy ID rejected.")),
    check("invalid-legacy-empty", () => assert(!fidApi.isLegacyFootballEntityIdentifier(" "), "Empty legacy ID accepted.")),
    check("alias-conflict", () => assert(hasCode(fidApi.validateCanonicalFootballEntityIdentity(base({ aliases: [{ alias: "organization:diagnostic-franchise", aliasType: "OTHER" }] })), "CANONICAL_REFERENCE_ALIAS_CONFLICT"), "Canonical alias conflict accepted.")),
    check("duplicate-aliases-deterministic", () => { const entity = base({ aliases: [{ alias: "Chiefs", aliasType: "SHORT_NAME" }, { alias: "Chiefs", aliasType: "SHORT_NAME" }] }); assert(entity.aliases.length === 1, "Duplicate aliases retained."); }),
    check("abbreviation-remains-alias", () => { const entity = base({ aliases: [{ alias: "KC", aliasType: "ABBREVIATION" }] }); assert(entity.entityId !== entity.aliases[0].alias && entity.aliases[0].alias === "KC", "Abbreviation became canonical."); }),
    check("alias-does-not-issue-reference", () => assert(!fidApi.isCanonicalFootballEntityReference("Chiefs"), "Alias became canonical.")),
    check("external-id-separate", () => { const entity = base({ externalIdentifiers: [{ identifierType: "DATA_PROVIDER", provider: "diagnostic", value: "KC" }] }); assert(entity.externalIdentifiers[0].value === "KC" && entity.aliases.length === 0, "External ID entered aliases."); }),
    check("application-id-outside-policy", () => assert(!FID_INDEX_SOURCE.includes("teamLogos") && DOC_SOURCE.includes("simulator and UI codes remain outside"), "Application mapping entered identity exports.")),
    check("historical-name-noncanonical", () => { const entity = base({ aliases: [{ alias: "Historical Franchise Name", aliasType: "HISTORICAL_NAME" }] }); assert(!fidApi.isCanonicalFootballEntityReference(entity.aliases[0].alias), "Historical name became canonical."); }),
    check("organization-kind-compatible", () => assert(fidApi.validateFootballEntityCanonicalReference("organization:test", { entityType: "ORGANIZATION" }).valid, "Organization namespace rejected.")),
    check("team-kind-compatible", () => assert(fidApi.validateFootballEntityCanonicalReference("team:test", { entityType: "TEAM" }).valid, "Team namespace rejected.")),
    check("person-kind-compatible", () => assert(fidApi.validateFootballEntityCanonicalReference("person:test", { entityType: "PERSON" }).valid, "Person namespace rejected.")),
    check("prospect-kind-compatible", () => assert(fidApi.validateFootballEntityCanonicalReference("prospect:test", { entityType: "PROSPECT" }).valid, "Prospect namespace rejected.")),
    check("kind-mismatch", () => assert(hasCode(fidApi.validateFootballEntityCanonicalReference("team:test", { entityType: "ORGANIZATION" }), "CANONICAL_NAMESPACE_ENTITY_TYPE_MISMATCH"), "Namespace mismatch accepted.")),
    check("draft-class-preserved", () => assert(fidApi.FOOTBALL_ENTITY_TYPES.DRAFT_CLASS === "DRAFT_CLASS" && fidApi.FOOTBALL_ENTITY_CANONICAL_NAMESPACES.DRAFT_CLASS === "draft-class", "DRAFT_CLASS changed.")),
    check("draft-cycle-supported", () => assert(fidApi.FOOTBALL_ENTITY_TYPES.DRAFT_CYCLE === "DRAFT_CYCLE", "DRAFT_CYCLE missing.")),
    check("draft-cycle-reference", () => assert(fidApi.validateFootballEntityCanonicalReference("draft-cycle:2026", { entityType: "DRAFT_CYCLE" }).valid, "Draft-cycle reference rejected.")),
    check("draft-cycle-no-selection-facts", () => assert(!/(round|overallPick|selectionType|selectingOrganizationRef)/.test(POLICY_SOURCE), "Reference policy owns selection facts.")),
    check("no-draft-cycle-instance", () => assert(!/createFootballEntity\s*\(/.test(POLICY_SOURCE), "Policy created an entity instance.")),
    check("no-year-rules", () => assert(!/(numberOfRounds|roundCount|eligibilityRule|draftDate)/.test(POLICY_SOURCE + DOC_SOURCE), "Draft rules hardcoded.")),
    check("football-entity-owner", () => assert(DOC_SOURCE.includes("sole canonical identity owner"), "Identity ownership undocumented.")),
    check("organization-owner", () => assert(DOC_SOURCE.includes("Organization represents"), "Organization boundary undocumented.")),
    check("team-owner", () => assert(DOC_SOURCE.includes("Team represents"), "Team boundary undocumented.")),
    check("draft-selection-owner", () => assert(DOC_SOURCE.includes("DraftSelection continues to own"), "DraftSelection boundary undocumented.")),
    check("relationship-owner-preserved", () => assert(!/createFootballRelationship|SELECTED_BY/.test(POLICY_SOURCE), "Relationship ownership entered policy.")),
    check("research-owner-preserved", () => assert(!/researchRepository/i.test(POLICY_SOURCE), "Evidence ownership entered policy.")),
    check("persistence-owner-documented", () => assert(DOC_SOURCE.includes("persistence-operation metadata"), "Persistence ownership undocumented.")),
    check("no-competing-contract", () => assert(!/CanonicalIdentityContract/.test(POLICY_SOURCE + FID_INDEX_SOURCE), "Competing identity contract introduced.")),
    check("request-metadata-ownership", () => assert(fidApi.FOOTBALL_ENTITY_OPERATION_METADATA_OWNERSHIP.requestId === "PERSISTENCE_OPERATION", "requestId ownership changed.")),
    check("operation-metadata-ownership", () => assert(fidApi.FOOTBALL_ENTITY_OPERATION_METADATA_OWNERSHIP.operationId === "PERSISTENCE_OPERATION", "operationId ownership changed.")),
    check("batch-metadata-ownership", () => assert(fidApi.FOOTBALL_ENTITY_OPERATION_METADATA_OWNERSHIP.batchId === "PERSISTENCE_OPERATION", "batchId ownership changed.")),
    check("no-persistence-dependency", () => assert(!/persistence[/\\]|Supabase|sql/i.test(POLICY_SOURCE), "Policy gained persistence dependency.")),
    check("football-entity-shape-not-expanded", () => assert(!["requestId", "operationId", "batchId", "canonicalRef"].some((key) => Object.hasOwn(canonical, key)), "FootballEntity shape expanded.")),
    check("constants-export-identity", () => Object.keys(namedConstants).filter((key) => key !== "default").forEach((key) => assert(namedConstants[key] === constants[key] && fidApi[key] === constants[key], `Constant export mismatch: ${key}.`))),
    check("policy-export-identity", () => Object.keys(namedPolicy).filter((key) => key !== "default").forEach((key) => assert(namedPolicy[key] === policy[key] && namedFidApi[key] === policy[key], `Policy export mismatch: ${key}.`))),
    check("no-production-identity-export", () => assert(!Object.values(fidApi).some((value) => value?.contract === "FootballEntity"), "Production identity exported.")),
    check("organization-regression", () => assert(organization.failed === 0, "Organization diagnostics failed.", organization)),
    check("team-regression", () => assert(team.failed === 0, "Team diagnostics failed.", team)),
    check("foundation-regression", () => assert(foundations.failed === 0, "Person/Player/Prospect foundation failed.", foundations)),
    check("sprint47-regression", () => assert(sprint47.failed === 0, "Sprint 47 failed.", sprint47)),
    check("sprint46-regression", () => assert(sprint46.failed === 0, "Sprint 46 failed.", sprint46)),
    check("rsp0003-regression", () => assert(rsp0003.failed === 0 && rsp0003.governance.package === "APPROVED", "RSP-0003 failed.", rsp0003)),
    check("rsp0003-hashes", () => assert(rsp0003.hashes.retainedContent === "33F0D36F7C953E1192309488686EC0A66E8EEBC1D6E5BFEF48D0D9626A217BF6" && rsp0003.hashes.recordedObservations === "99A578FAE13C775A2C962893AC9DFBEEDDF2F5BBA71524B1014F6B87C7ADE19B", "RSP-0003 hashes changed.")),
    check("population-regression", () => assert(sprint46.regressions.population.failed === 0, "Population baseline failed.", sprint46.regressions.population)),
    check("prospect-profile-regression", () => assert(sprint46.regressions.prospectProfile.failed === 0, "ProspectProfile baseline failed.", sprint46.regressions.prospectProfile)),
    check("research-regression", () => assert(sprint46.regressions.researchRepository.failed === 0, "Research Repository baseline failed.", sprint46.regressions.researchRepository)),
    check("rsp0001-regression", () => assert(sprint46.regressions.rsp0001.failed === 0, "RSP-0001 failed.", sprint46.regressions.rsp0001)),
    check("rsp0002-regression", () => assert(sprint46.regressions.rsp0002.failed === 0, "RSP-0002 failed.", sprint46.regressions.rsp0002)),
    check("no-production-instances", () => assert(!/(kansas-city-chiefs|draft-cycle:2026|peter-woods)/.test(POLICY_SOURCE), "Production identity embedded in policy.")),
    check("no-runtime-resolution", () => assert(!/(resolver|registry|synchronization|fuzzy|fetch\(|supabase|simulator|components|pages)/i.test(POLICY_SOURCE), "Runtime behavior entered policy.")),
  ];
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: "FootballEntityCanonicalReferencePolicyDiagnostics", policyVersion: fidApi.FOOTBALL_ENTITY_CANONICAL_REFERENCE_POLICY_VERSION, schemaVersion: fidApi.FOOTBALL_ENTITY_CANONICAL_REFERENCE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, decisions: { entityIdIsCanonicalWhenPolicyValid: true, legacyIdsRemainContractValid: true, draftCycleEntityTypeSupported: true, operationMetadataOwner: "PERSISTENCE_OPERATION" }, productionInstancesCreated: false, regressions: { footballEntity, organization, team, foundations, sprint47, sprint46: { total: sprint46.total, failed: sprint46.failed }, rsp0003: { total: rsp0003.total, failed: rsp0003.failed }, population: sprint46.regressions.population, prospectProfile: sprint46.regressions.prospectProfile, researchRepository: sprint46.regressions.researchRepository, rsp0001: sprint46.regressions.rsp0001, rsp0002: sprint46.regressions.rsp0002 } };
  if (throwOnFailure && failed) throw new Error(`${summary.suite} failed ${failed} of ${summary.total} cases.`);
  return summary;
}

export default Object.freeze({ runFootballEntityCanonicalReferencePolicyDiagnostics });
