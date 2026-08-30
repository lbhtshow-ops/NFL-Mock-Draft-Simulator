import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateProspectByPosition,
  listSupportedProspectPositions,
} from "../playerEvaluation/prospectModels/registry/ProspectModelRegistry.js";
import {
  evaluateCanonicalProspect,
  CANONICAL_PROSPECT_EVALUATION_SERVICE_VERSION,
} from "../playerEvaluation/prospect/CanonicalProspectEvaluationService.js";
import {
  PLAYER_CALIBER_SUBJECT_KINDS,
  resolveCanonicalPlayerCaliber,
} from "../playerEvaluation/caliber/index.js";

const checks = {};
const failures = [];
function check(name, condition) {
  checks[name] = Boolean(condition);
  if (!condition) failures.push(name);
}

const qb = {
  id: "2026-arch-manning",
  name: "Arch Manning",
  position: "QB",
  school: "Texas",
  draftClass: 2027,
};
const wr = {
  id: "diagnostic-wr",
  name: "Diagnostic WR",
  position: "WR",
  school: "Diagnostic",
  draftClass: 2027,
};

const positions = listSupportedProspectPositions();
const qbDescriptor = positions.find((item) => item.position === "QB");
const wrDescriptor = positions.find((item) => item.position === "WR");
check("production_registry_registers_qb", qbDescriptor?.implemented === true && qbDescriptor?.modelName === "QuarterbackProspectModel");
check("unimplemented_positions_remain_explicit", wrDescriptor?.implemented === false && wrDescriptor?.modelName === null);

const qbRuntime = evaluateCanonicalProspect({ player: qb });
check("canonical_service_version_present", qbRuntime?.versions?.service === CANONICAL_PROSPECT_EVALUATION_SERVICE_VERSION);
check("qb_runtime_routes_through_registry", qbRuntime?.available === true && qbRuntime?.modelResult?.model === "QuarterbackProspectModel");
check("qb_runtime_produces_governed_grade", typeof qbRuntime?.modelResult?.overallGrade === "number" && qbRuntime.modelResult.overallGrade >= 0 && qbRuntime.modelResult.overallGrade <= 100);
check("qb_runtime_preserves_confidence", qbRuntime?.modelResult?.confidence > 0 && qbRuntime.modelResult.confidence <= 1);
check("qb_runtime_preserves_versions", Boolean(qbRuntime?.modelResult?.versions?.model) && Boolean(qbRuntime?.modelResult?.versions?.weights));
check("qb_runtime_preserves_missing_evidence", Array.isArray(qbRuntime?.modelResult?.missingEvidence));
check("qb_runtime_preserves_provenance", Array.isArray(qbRuntime?.modelResult?.provenance?.contributors));

const scoutingCalibration = { projection: { overallGrade: 10 }, source: "DIAGNOSTIC_CALIBRATION_ONLY" };
const qbWithCalibration = evaluateCanonicalProspect({ player: qb, scoutingProfile: scoutingCalibration });
check("stored_scouting_grade_does_not_replace_model_grade", qbWithCalibration?.modelResult?.overallGrade === qbRuntime?.modelResult?.overallGrade);
check("stored_scouting_is_preserved_as_calibration_context", qbWithCalibration?.calibrationEvidence === scoutingCalibration);

const wrRuntime = evaluateCanonicalProspect({ player: wr, scoutingProfile: { projection: { overallGrade: 99 } } });
check("unsupported_runtime_never_fabricates_grade", wrRuntime?.available === false && wrRuntime?.modelResult?.overallGrade === null);
check("unsupported_runtime_reports_model_not_registered", wrRuntime?.error === "MODEL_NOT_REGISTERED");

const caliber = resolveCanonicalPlayerCaliber({
  subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.PROSPECT,
  player: qb,
  prospectModelResult: qbRuntime.modelResult,
});
check("canonical_caliber_uses_runtime_model_grade", caliber?.available === true && caliber?.caliberGrade === qbRuntime?.modelResult?.overallGrade);
check("canonical_caliber_preserves_runtime_confidence", Math.abs((caliber?.confidence ?? 0) - (qbRuntime?.modelResult?.confidence ?? 0)) < 0.0001);
check("canonical_caliber_preserves_model_version", caliber?.versions?.model === qbRuntime?.modelResult?.versions?.model);

const directUnsupported = evaluateProspectByPosition({
  position: "WR",
  player: wr,
  playerId: wr.id,
  context: { playerId: wr.id, position: "WR" },
  intelligence: {},
});
check("registry_unsupported_path_is_governed", directUnsupported?.available === false && directUnsupported?.overallGrade === null && directUnsupported?.validation?.errors?.some((e) => e.code === "MODEL_NOT_REGISTERED"));

const here = path.dirname(fileURLToPath(import.meta.url));
const playerEvaluationSource = fs.readFileSync(path.resolve(here, "../PlayerEvaluationEngine.js"), "utf8");
const standardizedStart = playerEvaluationSource.indexOf("export function getPlayerEvaluationIntelligenceResult");
const standardizedEnd = playerEvaluationSource.indexOf("export function getCanonicalProspectCaliberResult", standardizedStart);
const standardizedBody = playerEvaluationSource.slice(standardizedStart, standardizedEnd);
check("player_evaluation_engine_calls_canonical_prospect_service", standardizedBody.includes("evaluateCanonicalProspect({"));
check("player_evaluation_engine_does_not_use_rank_fallback", !standardizedBody.includes("getEstimatedPlayerGrade(") && !standardizedBody.includes("getDraftProjection("));
check("player_evaluation_engine_preserves_calibration_only_role", standardizedBody.includes("CALIBRATION_OR_FALLBACK_EVIDENCE_ONLY"));
check("player_evaluation_engine_exposes_model_result_for_caliber", playerEvaluationSource.includes("prospectModelResult: modelResult") && playerEvaluationSource.includes("getCanonicalProspectCaliberResult"));

const result = {
  suite: "Prospect Evaluation Runtime Integration",
  contractVersion: "FIE-EVALUATION-INTEGRITY-SPRINT3-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
  sample: {
    quarterback: {
      grade: qbRuntime?.modelResult?.overallGrade ?? null,
      confidence: qbRuntime?.modelResult?.confidence ?? null,
      model: qbRuntime?.modelResult?.model ?? null,
      modelVersion: qbRuntime?.modelResult?.versions?.model ?? null,
      weightVersion: qbRuntime?.modelResult?.versions?.weights ?? null,
    },
    unsupportedPosition: {
      position: wrRuntime?.position ?? null,
      error: wrRuntime?.error ?? null,
      grade: wrRuntime?.modelResult?.overallGrade ?? null,
    },
  },
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
