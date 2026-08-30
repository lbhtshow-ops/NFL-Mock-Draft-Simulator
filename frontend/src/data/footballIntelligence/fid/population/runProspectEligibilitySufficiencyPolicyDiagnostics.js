import fidApi from "../index.js";
import { firstProspectCohortFixtures } from "./fixtures/firstProspectCohortFixtures.js";
import { runPopulationWorkflowDiagnostics } from "./runPopulationWorkflowDiagnostics.js";
import { runProspectProfileContractDiagnostics } from "../diagnostics/runProspectProfileContractDiagnostics.js";
import { runRSP0001Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0001-peter-woods-sports-reference-production-statistics/runRSP0001Diagnostics.js";
import { runRSP0002Diagnostics } from "../../researchRepository/sourcePackages/retained/rsp-0002-peter-woods-clemson-official-biography/runRSP0002Diagnostics.js";
import { runArtifactScopedResearchSourcePackageDiagnostics } from "../../researchRepository/runArtifactScopedResearchSourcePackageDiagnostics.js";

const assert = (condition, message, details = null) => { if (!condition) throw Object.assign(new Error(message), { details }); };
const check = async (id, fn) => { try { await fn(); return { id, passed: true }; } catch (error) { return { id, passed: false, message: error.message, details: error.details ?? null }; } };
const evidence = (inputType = "DIRECT_RULING", overrides = {}) => ({ inputId: `input:${inputType.toLowerCase()}`, inputType, prospectRef: "2026-peter-woods", draftCycleRef: "draft-cycle:2027", sourceRef: "source:official", evidenceArtifactRef: "artifact:eligibility", recordedObservationRef: "observation:eligibility", approvedSource: true, verifiedEvidence: true, required: true, satisfied: true, conflicting: false, ...overrides });
const base = (overrides = {}) => ({ decisionId: "eligibility-decision:peter-woods:2027", decisionRevision: 1, prospectRef: "2026-peter-woods", draftCycleRef: "draft-cycle:2027", reviewedForTime: "2026-07-18", eligibilityState: "ELIGIBLE", basisType: "EARLY_ENTRY", evidencePathway: "DIRECT_OFFICIAL_RULING", sourceRefs: ["source:official"], evidenceArtifactRefs: ["artifact:eligibility"], recordedObservationRefs: ["observation:eligibility"], analyticalObservationRefs: [], rulingRef: "ruling:official", ruleRef: null, ruleEffectiveAt: null, requiredInputIds: ["input:direct_ruling"], evidenceInputs: [evidence()], declarationRefs: [], classYearRefs: [], conflictingInputRefs: [], limitations: [], decisionRationale: "The governed player- and cycle-specific ruling directly answers the eligibility proposition.", review: { reviewerRef: "reviewer:authorized", reviewerAuthorized: true, reviewedAt: "2026-07-18", decision: "APPROVE" }, ...overrides });
const evaluate = (overrides = {}) => fidApi.evaluateProspectEligibilitySufficiency(base(overrides));
const insufficient = (result) => !result.populationSufficient;
const peterFixture = firstProspectCohortFixtures.find((entry) => entry.subject.slug === "peter-woods");

export async function runProspectEligibilitySufficiencyPolicyDiagnostics({ throwOnFailure = false } = {}) {
  const population = runPopulationWorkflowDiagnostics(); const profile = await runProspectProfileContractDiagnostics(); const rsp1 = runRSP0001Diagnostics(); const rsp2 = runRSP0002Diagnostics(); const sprint45 = runArtifactScopedResearchSourcePackageDiagnostics();
  const ruleFacts = { evidencePathway: "RULE_PLUS_PLAYER_FACTS", rulingRef: null, ruleRef: "rule:nfl:eligibility", ruleEffectiveAt: "2026-01-01", requiredInputIds: ["input:general_rule", "input:player_fact"], evidenceInputs: [evidence("GENERAL_RULE", { inputId: "input:general_rule" }), evidence("PLAYER_FACT", { inputId: "input:player_fact" })], analyticalObservationRefs: ["analysis:rule-application"] };
  const unsupportedTypes = ["DECLARATION", "CLASS_YEAR", "AFFILIATION", "PROJECTION"];
  const definitions = [
    ["prospect-required", () => assert(insufficient(evaluate({ prospectRef: null })), "Unscoped prospect passed.")],
    ["draft-cycle-required", () => assert(insufficient(evaluate({ draftCycleRef: null })), "Unscoped cycle passed.")],
    ["review-time-required", () => assert(insufficient(evaluate({ reviewedForTime: null })), "Unscoped review time passed.")],
    ["canonical-proposition", () => assert(evaluate().proposition === fidApi.PROSPECT_ELIGIBILITY_PROPOSITION, "Proposition changed.")],
    ["direct-ruling-sufficient", () => assert(evaluate().populationSufficient, "Direct ruling failed.")],
    ["direct-ruling-player-scope", () => assert(insufficient(evaluate({ evidenceInputs: [evidence("DIRECT_RULING", { prospectRef: "prospect:other" })] })), "Player mismatch passed.")],
    ["direct-ruling-cycle-scope", () => assert(insufficient(evaluate({ evidenceInputs: [evidence("DIRECT_RULING", { draftCycleRef: "draft-cycle:2026" })] })), "Cycle mismatch passed.")],
    ["direct-ruling-reference", () => assert(insufficient(evaluate({ rulingRef: null })), "Missing ruling passed.")],
    ["general-rule-alone", () => assert(insufficient(evaluate({ ...ruleFacts, requiredInputIds: ["input:general_rule"], evidenceInputs: [ruleFacts.evidenceInputs[0]] })), "Rule alone passed.")],
    ["player-facts-alone", () => assert(insufficient(evaluate({ ...ruleFacts, ruleRef: null, ruleEffectiveAt: null, evidenceInputs: [ruleFacts.evidenceInputs[1]] })), "Facts alone passed.")],
    ["rule-plus-facts-sufficient", () => assert(evaluate(ruleFacts).populationSufficient, "Rule-plus-facts failed.")],
    ["rule-reference-required", () => assert(insufficient(evaluate({ ...ruleFacts, ruleRef: null })), "Missing rule passed.")],
    ["rule-effective-scope-required", () => assert(insufficient(evaluate({ ...ruleFacts, ruleEffectiveAt: null })), "Missing effective date passed.")],
    ["all-policy-inputs-required", () => assert(insufficient(evaluate({ ...ruleFacts, evidenceInputs: [ruleFacts.evidenceInputs[0]] })), "Missing player input passed.")],
    ["analysis-required", () => assert(insufficient(evaluate({ ...ruleFacts, analyticalObservationRefs: [] })), "Missing analysis passed.")],
    ["conflict-blocks", () => assert(insufficient(evaluate({ ...ruleFacts, conflictingInputRefs: ["input:player_fact"] })), "Conflict passed.")],
    ["pending-blocks", () => assert(evaluate({ eligibilityState: "PENDING" }).sufficiencyState === "PENDING", "PENDING passed.")],
    ["disputed-blocks", () => assert(evaluate({ eligibilityState: "DISPUTED" }).sufficiencyState === "DISPUTED", "DISPUTED passed.")],
    ["unknown-blocks", () => assert(insufficient(evaluate({ eligibilityState: "UNKNOWN" })), "UNKNOWN passed.")],
    ["not-eligible-supported", () => { const result = evaluate({ eligibilityState: "NOT_ELIGIBLE" }); assert(result.populationSufficient && result.eligibilityState === "NOT_ELIGIBLE", "NOT_ELIGIBLE was misrepresented."); }],
    ...unsupportedTypes.map((type) => [`${type.toLowerCase()}-alone-blocked`, () => assert(insufficient(evaluate({ evidencePathway: "UNSUPPORTED", requiredInputIds: [`input:${type.toLowerCase()}`], evidenceInputs: [evidence(type, { inputId: `input:${type.toLowerCase()}` })], rulingRef: null })), `${type} passed.`)]),
    ["unapproved-source-blocks", () => assert(insufficient(evaluate({ evidenceInputs: [evidence("DIRECT_RULING", { approvedSource: false })] })), "Unapproved source passed.")],
    ["unverified-artifact-blocks", () => assert(insufficient(evaluate({ evidenceInputs: [evidence("DIRECT_RULING", { verifiedEvidence: false })] })), "Unverified artifact passed.")],
    ["human-authorization-required", () => assert(insufficient(evaluate({ review: { reviewerRef: "reviewer", reviewerAuthorized: false, reviewedAt: "2026-07-18", decision: "APPROVE" } })), "Unauthorized review passed.")],
    ["rationale-required", () => assert(insufficient(evaluate({ decisionRationale: null })), "Missing rationale passed.")],
    ["special-ruling-pathway", () => assert(evaluate({ evidencePathway: "SPECIAL_RULING", basisType: "SPECIAL_RULING", evidenceInputs: [evidence("SPECIAL_RULING")], requiredInputIds: ["input:special_ruling"] }).populationSufficient, "Special ruling failed.")],
    ["automatic-status-pathway", () => assert(evaluate({ evidencePathway: "EXHAUSTED_OR_AUTOMATIC_STATUS", basisType: "EXHAUSTED_ELIGIBILITY", rulingRef: null, evidenceInputs: [evidence("AUTOMATIC_STATUS")], requiredInputIds: ["input:automatic_status"] }).populationSufficient, "Automatic status failed.")],
    ["population-requires-policy", () => { const workflow = fidApi.createPopulationWorkflow({ ...peterFixture.workflowInput, evidenceDeclarations: [...peterFixture.workflowInput.evidenceDeclarations, { evidenceId: "eligibility:claimed", category: "ELIGIBILITY", status: "SUFFICIENT", sourceRefs: ["source:official"], evidenceRefs: ["artifact:eligibility"], subjectRef: "2026-peter-woods" }] }); assert(fidApi.validatePopulationReadiness(workflow).blockers.some((entry) => entry.message.includes("ELIGIBILITY")), "Label bypassed policy."); }],
    ["population-consumes-matching-policy", () => { const workflow = fidApi.createPopulationWorkflow({ ...peterFixture.workflowInput, evidenceDeclarations: [...peterFixture.workflowInput.evidenceDeclarations, { evidenceId: "eligibility:claimed", category: "ELIGIBILITY", status: "SUFFICIENT", sourceRefs: ["source:official"], evidenceRefs: ["artifact:eligibility"], subjectRef: "2026-peter-woods" }] }); const result = fidApi.validatePopulationReadiness(workflow, { eligibilitySufficiencyResult: evaluate() }); assert(!result.blockers.some((entry) => entry.message === "ELIGIBILITY evidence is required."), "Matching policy was ignored."); }],
    ["declaration-remains-independent", () => { const workflow = fidApi.createPopulationWorkflow(peterFixture.workflowInput); const result = fidApi.validatePopulationReadiness(workflow, { eligibilitySufficiencyResult: evaluate() }); assert(result.blockers.some((entry) => entry.message.includes("DECLARATION")), "Declaration was bypassed."); }],
    ["peter-woods-remains-insufficient", () => { const result = fidApi.validatePopulationReadiness(fidApi.createPopulationWorkflow(peterFixture.workflowInput)); assert(result.blockers.some((entry) => entry.message.includes("ELIGIBILITY")) && result.blockers.some((entry) => entry.message.includes("DECLARATION")), "Peter Woods blockers changed."); }],
    ["cycle-conflict-preserved", () => { const entry = peterFixture.workflowInput.evidenceDeclarations.find((item) => item.category === "CLASS_YEAR"); assert(entry.status === "PARTIAL" && entry.limitations.some((value) => value.includes("2026") && value.includes("2027")), "Cycle conflict changed."); }],
    ["population-regression", () => assert(population.failed === 0, "Population regression failed.", population)],
    ["prospect-profile-regression", () => assert(profile.failed === 0, "ProspectProfile regression failed.", profile)],
    ["rsp-regressions", () => assert(rsp1.failed === 0 && rsp2.failed === 0, "RSP regression failed.", { rsp1, rsp2 })],
    ["sprint37-through45-regression", () => assert(sprint45.failed === 0 && Object.values(sprint45.regressions).every((entry) => entry.failed === 0), "Research regression failed.", sprint45)],
  ];
  const cases = []; for (const [id, fn] of definitions) cases.push(await check(id, fn));
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const result = { suite: "ProspectEligibilitySufficiencyPolicyDiagnostics", total: cases.length, passed, failed, cases, proposition: fidApi.PROSPECT_ELIGIBILITY_PROPOSITION, peterWoods: { eligibility: "INSUFFICIENT", declaration: "INSUFFICIENT", cycleConflict: "UNRESOLVED" }, regressions: { population: { total: population.total, failed: population.failed }, prospectProfile: { total: profile.total, failed: profile.failed }, rsp0001: { total: rsp1.total, failed: rsp1.failed }, rsp0002: { total: rsp2.total, failed: rsp2.failed }, sprint45: { total: sprint45.total, failed: sprint45.failed }, researchRepository: sprint45.regressions.researchRepository } };
  if (throwOnFailure && failed) throw new Error(`${result.suite} failed ${failed} of ${result.total} checks.`);
  return result;
}
export default Object.freeze({ runProspectEligibilitySufficiencyPolicyDiagnostics });
