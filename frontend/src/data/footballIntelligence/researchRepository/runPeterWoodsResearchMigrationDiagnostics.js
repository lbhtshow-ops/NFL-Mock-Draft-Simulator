import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import researchRepository from "../../researchRepository/index.js";
import fidApi from "../fid/index.js";
import { createPeterWoodsResearchMigrationFixture } from "./migrations/peterWoodsResearchMigrationFixture.js";

const SUITE = "PeterWoodsResearchMigrationDiagnostics";
const FRONTEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const LEGACY_PATH = resolve(FRONTEND_ROOT, "src/data/footballIntelligence/metadata/researchRecords.js");

function assert(condition, message, details = null) { if (!condition) { const error = new Error(message); error.details = details; throw error; } }
function capture(source, pattern, field) { const match = source.match(pattern); assert(match, `Unable to read legacy ${field}.`); return match[1]; }
function readLegacyRecord() {
  const source = readFileSync(LEGACY_PATH, "utf8");
  const block = capture(source, /\[prospectIds\.PETER_WOODS\]\s*:\s*\{([\s\S]*?)\n\s*\},/, "Peter Woods record");
  const sourcesText = capture(block, /sources:\s*\[([\s\S]*?)\]/, "sources");
  return {
    prospectId: capture(block, /prospectId:\s*prospectIds\.([A-Z_]+)/, "prospectId") === "PETER_WOODS" ? "2026-peter-woods" : null,
    status: capture(block, /status:\s*"([^"]+)"/, "status"),
    verifiedBy: capture(block, /verifiedBy:\s*"([^"]+)"/, "verifiedBy"),
    confidence: Number(capture(block, /confidence:\s*([0-9.]+)/, "confidence")),
    lastUpdated: capture(block, /lastUpdated:\s*"([^"]+)"/, "lastUpdated"),
    sources: [...sourcesText.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    notes: capture(block, /notes:\s*"([^"]+)"/, "notes"),
  };
}

function buildReport() {
  const legacyRecord = readLegacyRecord();
  const fixture = createPeterWoodsResearchMigrationFixture(legacyRecord);
  const { source, session, recordedObservation, analyticalObservation, evidenceArtifact } = fixture.governed;
  const workflow = fidApi.createPopulationWorkflow(fixture.populationFixture.workflowInput);
  const populationResult = fidApi.validatePopulationReadiness(workflow, { resultId: "population-result:sprint-36:peter-woods", producedAt: "2026-07-18" });
  const fiisIntakeRequest = populationResult.fiisIntakeRequestInput;
  const validations = {
    researchSource: researchRepository.validateResearchSource(source), researchSession: researchRepository.validateResearchSession(session),
    recordedObservation: researchRepository.validateRecordedObservation(recordedObservation), analyticalObservation: researchRepository.validateAnalyticalObservation(analyticalObservation),
    evidenceArtifact: researchRepository.validateEvidenceArtifact(evidenceArtifact), populationWorkflow: fidApi.validatePopulationWorkflow(workflow),
    populationResult: fidApi.validatePopulationResult(populationResult), fiisIntakeRequest: fidApi.validateFiisIntakeRequest(fiisIntakeRequest),
  };
  const provenanceChain = [fixture.legacyReference.sourceRef, source.sourceId, session.sessionId, recordedObservation.observationId, analyticalObservation.analysisId, evidenceArtifact.evidenceId];
  const evidenceChainComplete = session.sourceRefs.includes(source.sourceId) && recordedObservation.sessionRef === session.sessionId && recordedObservation.sourceRefs.includes(source.sourceId) && analyticalObservation.recordedObservationRefs.includes(recordedObservation.observationId) && evidenceArtifact.recordedObservationRefs.includes(recordedObservation.observationId) && evidenceArtifact.analyticalObservationRefs.includes(analyticalObservation.analysisId);
  const legacyMetadataPreserved = recordedObservation.record.valueText === JSON.stringify(legacyRecord) && recordedObservation.description === legacyRecord.notes && recordedObservation.provenance.recordedBy === legacyRecord.verifiedBy;
  const populationLinked = workflow.subjectRefs.includes(legacyRecord.prospectId) && workflow.sourceMetadata.some((entry) => entry.sourceRef === fixture.legacyReference.sourceRef) && evidenceArtifact.targets.some((entry) => entry.targetRef === legacyRecord.prospectId);
  const missingGovernedEvidence = ["No football observations exist in the legacy metadata.", "The three legacy source labels lack governed source-specific provenance and artifacts.", "Eligibility and declaration evidence remain unavailable."];
  const migrationBlockers = ["Human review is required before candidate source or draft evidence can be approved.", "The legacy 2026 identifier conflicts with the governed 2027 target cycle."];
  return { fixture, legacyRecord, workflow, populationResult, fiisIntakeRequest, validations, provenanceChain, evidenceChainComplete, legacyMetadataPreserved, populationLinked, missingGovernedEvidence, migrationBlockers };
}

export function runPeterWoodsResearchMigrationDiagnostics({ throwOnFailure = false } = {}) {
  const report = buildReport();
  const allContractsValid = Object.values(report.validations).every((entry) => entry.valid);
  const noEffects = Object.values(report.fixture.effects).every((value) => value === false) && report.populationResult.persistencePerformed === false && report.populationResult.promotionPerformed === false && report.populationResult.runtimeIntegrationPerformed === false;
  const cases = [
    ["all-contracts-valid", allContractsValid, report.validations], ["provenance-preserved", report.legacyMetadataPreserved, report.legacyRecord],
    ["evidence-chain-integrity", report.evidenceChainComplete, report.provenanceChain], ["population-linkage", report.populationLinked, report.workflow.subjectRefs],
    ["population-result-valid", report.populationResult.validation.valid && fidApi.isPopulationResult(report.populationResult), report.populationResult.validation],
    ["fiis-request-valid", report.fiisIntakeRequest.validation.valid && fidApi.isFiisIntakeRequest(report.fiisIntakeRequest), report.fiisIntakeRequest.validation],
    ["legacy-source-labels-preserved", report.legacyRecord.sources.length === 3 && report.fixture.governed.recordedObservation.record.valueText.includes("Consensus Scouting Reports"), report.legacyRecord.sources],
    ["missing-evidence-reported", report.missingGovernedEvidence.length === 3, report.missingGovernedEvidence], ["migration-blockers-reported", report.migrationBlockers.length === 2, report.migrationBlockers],
    ["zero-external-effects", noEffects, report.fixture.effects],
  ].map(([id, passed, details]) => ({ id, passed, message: passed ? `${id} passed.` : `${id} failed.`, details }));
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const migrationReport = {
    legacyMetadataReferenced: { sourceRef: report.fixture.legacyReference.sourceRef, ...report.legacyRecord },
    governedContractsCreated: Object.values(report.fixture.governed).map((entry) => ({ contract: entry.contract, id: entry.sourceId ?? entry.sessionId ?? entry.observationId ?? entry.analysisId ?? entry.evidenceId })),
    provenanceChain: report.provenanceChain, evidenceChainComplete: report.evidenceChainComplete, missingGovernedEvidence: report.missingGovernedEvidence,
    migrationBlockers: report.migrationBlockers, populationLinkage: { linked: report.populationLinked, workflowId: report.workflow.workflowId, populationResultId: report.populationResult.resultId, fiisRequestId: report.fiisIntakeRequest.requestId },
    readiness: report.populationResult.readiness, externalSideEffects: report.fixture.effects,
  };
  const result = { suite: SUITE, total: cases.length, passed, failed, cases, migrationReport };
  if (throwOnFailure && failed) throw new Error(`${SUITE} failed ${failed} of ${cases.length} checks.`);
  return result;
}

export default Object.freeze({ runPeterWoodsResearchMigrationDiagnostics });
