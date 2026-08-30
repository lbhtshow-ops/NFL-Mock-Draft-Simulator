import {
  PLAYER_CALIBER_SUBJECT_KINDS,
  createCanonicalPlayerCaliberResult,
} from "../playerEvaluation/caliber/CanonicalPlayerCaliberContract.js";
import {
  createPlayerAvailabilityEvidence,
  PLAYER_AVAILABILITY_STATUSES,
  AVAILABILITY_FRESHNESS_STATES,
} from "../playerAvailability/contracts/PlayerAvailabilityEvidenceContract.js";
import {
  PLAYER_ROLE_LEVELS,
  REPLACEMENT_QUALITY_LEVELS,
  TEAM_DEPENDENCY_LEVELS,
  POSITION_IMPORTANCE_LEVELS,
} from "../playerAvailability/contracts/PlayerAvailabilityImpactContextContract.js";
import {
  PLAYER_IMPACT_MODEL_STATES,
  validateCanonicalPlayerAvailabilityImpactResult,
} from "../playerAvailability/contracts/CanonicalPlayerAvailabilityImpactContract.js";
import {
  getCanonicalPlayerAvailabilityImpact,
} from "../playerAvailability/CanonicalPlayerAvailabilityImpactService.js";

const checks = {};
const failures = [];
const check = (name, condition) => {
  checks[name] = Boolean(condition);
  if (!condition) failures.push(name);
};

const caliber = createCanonicalPlayerCaliberResult({
  subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
  playerId: "nfl:example:qbx",
  displayName: "Example Quarterback",
  position: "QB",
  available: true,
  caliberGrade: 94,
  confidence: 0.91,
  evidenceLevel: "STRONG",
  readiness: "AVAILABLE",
  provenance: { contributors: [{ source: "CanonicalNFLPlayerEvaluationService" }] },
  sourceEvaluation: { engine: "CanonicalNFLPlayerEvaluationService", sourceField: "playerQuality" },
  versions: { evaluator: "NFL-EVAL-HARDENING-1.0.0", model: "QB-MODEL" },
});

const evidence = createPlayerAvailabilityEvidence({
  playerId: "nfl:example:qbx",
  status: PLAYER_AVAILABILITY_STATUSES.QUESTIONABLE,
  reason: "Ankle",
  confidence: 0.95,
  evidenceLevel: "STRONG",
  dataState: "AVAILABLE",
  freshness: AVAILABILITY_FRESHNESS_STATES.FRESH,
  observedAt: "2026-08-12T00:00:00Z",
  sourceRefs: ["source:official-injury-report"],
  evidenceRefs: ["evidence:availability:1"],
  provenance: { contributors: [{ source: "SportsKnowledgeRepository" }] },
  repository: { adapter: "GovernedRepositoryAdapter", snapshotId: "availability:1" },
});

const result = getCanonicalPlayerAvailabilityImpact({
  player: { id: "nfl:example:qbx", name: "Example Quarterback", position: "QB" },
  canonicalCaliber: caliber,
  availabilityEvidence: evidence,
  impactContext: {
    role: PLAYER_ROLE_LEVELS.PRIMARY,
    replacementQuality: REPLACEMENT_QUALITY_LEVELS.AVERAGE,
    teamDependency: TEAM_DEPENDENCY_LEVELS.VERY_HIGH,
    positionImportance: POSITION_IMPORTANCE_LEVELS.VERY_HIGH,
    offensiveSnapShare: 0.98,
    depthChartPosition: "QB1",
    evidenceRefs: ["evidence:depth-chart:1"],
  },
});

const validation = validateCanonicalPlayerAvailabilityImpactResult(result);
check("canonical_result_contract_valid", validation.valid);
check("availability_status_preserved", result.availability.status === "QUESTIONABLE");
check("availability_reason_preserved", result.availability.reason === "Ankle");
check("availability_confidence_preserved", result.availability.confidence === 0.95);
check("availability_freshness_preserved", result.availability.freshness === "FRESH");
check("availability_provenance_preserved", result.provenance.availability?.contributors?.length === 1);
check("canonical_caliber_consumed_without_regrading", result.caliber?.caliberGrade === 94);
check("caliber_confidence_preserved", result.caliber?.confidence === 0.91);
check("role_is_independent_input", result.impactContext?.role === "PRIMARY");
check("replacement_quality_is_independent_input", result.impactContext?.replacementQuality === "AVERAGE");
check("team_dependency_is_independent_input", result.impactContext?.teamDependency === "VERY_HIGH");
check("position_importance_is_independent_input", result.impactContext?.positionImportance === "VERY_HIGH");
check("snap_share_preserved", result.impactContext?.offensiveSnapShare === 0.98);
check("impact_scoring_explicitly_unmodeled", result.impact.modelState === PLAYER_IMPACT_MODEL_STATES.UNMODELED);
check("unmodeled_overall_impact_is_null", result.impact.overallImpact === null);
check("unmodeled_component_impacts_are_null", result.impact.offensiveImpact === null && result.impact.defensiveImpact === null && result.impact.specialTeamsImpact === null);
check("impact_confidence_not_fabricated", result.impact.confidence === 0);
check("complete_architecture_inputs_can_be_ready", result.readiness === "AVAILABLE");

const unknown = getCanonicalPlayerAvailabilityImpact({
  player: { id: "nfl:example:wrx", name: "Example Receiver", position: "WR" },
  subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
});
check("missing_availability_remains_unknown", unknown.availability.status === "UNKNOWN");
check("missing_caliber_remains_unavailable", unknown.caliber?.available === false);
check("missing_inputs_reported_not_fabricated", unknown.missingEvidence.includes("availability.status") && unknown.missingEvidence.includes("player.caliber"));
check("missing_availability_readiness_unavailable", unknown.readiness === "UNAVAILABLE");
check("engine_has_no_repository_mutation_output", !("database" in result) && !("persistence" in result));
check("repository_adapter_metadata_is_input_provenance_only", evidence.repository.adapter === "GovernedRepositoryAdapter");

const output = {
  suite: "Player Availability & Impact Architecture",
  contractVersion: "FIE-PLAYER-AVAILABILITY-IMPACT-SPRINT1-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
  sample: {
    status: result.availability.status,
    caliberGrade: result.caliber?.caliberGrade,
    impactModelState: result.impact.modelState,
    overallImpact: result.impact.overallImpact,
    readiness: result.readiness,
  },
};

console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exitCode = 1;
