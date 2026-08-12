import { createIntelligenceResult, DATA_STATES, EVIDENCE_LEVELS } from "../../contracts/IntelligenceResultContract.js";
import { assessConfidence } from "../../shared/confidenceUtils.js";
import { RECOGNITION_COMPLETENESS, isRecognitionInput } from "./RecognitionInputProjection.js";

const MODEL_NAME = "PlayerRecognitionEngine";
const MODEL_VERSION = "2.0.0";
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.values(value).forEach(deepFreeze); return Object.freeze(value); }
function metadataCoverage(records) { if (!records.length) return 0; return records.reduce((sum, record) => sum + [record.sourceRefs?.length, record.evidenceRefs?.length, record.verification, record.provenance, record.issuingOrganizationRef].filter(Boolean).length, 0) / (records.length * 5); }
/* Provisional, not empirically calibrated: COMPLETE=.65, PARTIAL=.40,
 * UNKNOWN supplied=.25; metadata contributes <=.25; unresolved seasons and
 * declared limitations each subtract .10. Count and award identity add zero. */
function confidenceFor(input) {
  if (input.evidenceState !== DATA_STATES.AVAILABLE) return assessConfidence(null);
  const base = input.completeness.status === RECOGNITION_COMPLETENESS.COMPLETE ? .65 : input.completeness.status === RECOGNITION_COMPLETENESS.PARTIAL ? .4 : .25;
  return assessConfidence(base + metadataCoverage(input.records) * .25 - (input.records.some((record) => record.season === null) ? .1 : 0) - (input.limitations.length || input.completeness.limitations.length ? .1 : 0));
}
function unavailable(input, reason) {
  const context = isRecognitionInput(input) ? input.playerContext : null;
  return deepFreeze(createIntelligenceResult({ domain: "recognition", available: false, dataState: DATA_STATES.UNKNOWN, score: null, confidence: 0, evidenceLevel: EVIDENCE_LEVELS.NONE, playerId: context?.playerId || null, competitionLevel: context?.competition?.level || null, careerStage: context?.careerStage || null, summary: reason, explanation: { positiveFactors: [], limitingFactors: [reason], contextualFactors: ["Unknown confidence is normalized to numeric zero by IntelligenceResultContract."] }, missingEvidence: ["recognitionInput"], value: { model: MODEL_NAME, modelVersion: MODEL_VERSION, confidenceKnown: false, unavailableReason: reason, recognitions: null }, rawData: { validation: input?.validation || null }, frameworkVersion: "1.0.0", modelVersion: MODEL_VERSION }));
}
export function getPlayerRecognitionIntelligenceResult(input) {
  if (!isRecognitionInput(input)) return unavailable(input, "A valid RecognitionInputProjection is required.");
  if (input.evidenceState !== DATA_STATES.AVAILABLE) return unavailable(input, "Recognition evidence is missing or unknown; no no-awards conclusion was produced.");
  const records = input.records;
  const confidence = confidenceFor(input);
  const recognitionTypes = [...new Set(records.map((record) => record.type))].sort((a, b) => a.localeCompare(b));
  const representedSeasons = [...new Set(records.map((record) => record.season).filter(Number.isInteger))].sort((a, b) => a - b);
  const unresolvedMetadata = ["sourceRefs", "evidenceRefs", "verification", "provenance", "issuingOrganizationRef"].filter((field) => records.some((record) => record[field] === null || (Array.isArray(record[field]) && !record[field].length)));
  const completeEmpty = input.completeness.status === RECOGNITION_COMPLETENESS.COMPLETE && records.length === 0;
  const limitations = [...input.limitations, ...input.completeness.limitations];
  if (input.completeness.status !== RECOGNITION_COMPLETENESS.COMPLETE) limitations.push("Recognition evidence coverage is not declared complete.");
  if (unresolvedMetadata.length) limitations.push(`Unresolved metadata: ${unresolvedMetadata.join(", ")}.`);
  const value = { model: MODEL_NAME, modelVersion: MODEL_VERSION, position: input.playerContext.position || null, recognitions: records, recognitionCount: records.length, representedSeasons, recognitionTypes, completeness: input.completeness.status, scope: input.completeness.scope, completeEmpty, metadataCoverage: metadataCoverage(records), unresolvedMetadata, limitations, confidenceKnown: confidence.known };
  const summary = completeEmpty ? `The caller declared complete coverage with zero Recognition records for ${input.completeness.scope}.` : `${records.length} structurally valid Recognition record(s) were supplied with ${input.completeness.status.toLowerCase()} coverage.`;
  return deepFreeze(createIntelligenceResult({ domain: "recognition", available: true, dataState: DATA_STATES.AVAILABLE, score: null, value, confidence: confidence.confidence, evidenceLevel: confidence.evidenceLevel, playerId: input.playerContext.playerId, competitionLevel: input.playerContext.competition.level, careerStage: input.playerContext.careerStage, summary, explanation: { positiveFactors: [`${records.length} documented Recognition record(s) supplied.`], limitingFactors: limitations, contextualFactors: [`Declared completeness: ${input.completeness.status}.`, `Evidence scope: ${input.completeness.scope || "unknown"}.`, `Confidence reflects completeness and metadata coverage (${confidence.confidence}); award prestige and player quality were not assessed.`] }, evidence: records, missingEvidence: unresolvedMetadata, sources: [], rawData: { model: MODEL_NAME, validation: input.validation, confidenceAssessment: confidence }, frameworkVersion: "1.0.0", modelVersion: MODEL_VERSION }));
}
export default { getPlayerRecognitionIntelligenceResult };
