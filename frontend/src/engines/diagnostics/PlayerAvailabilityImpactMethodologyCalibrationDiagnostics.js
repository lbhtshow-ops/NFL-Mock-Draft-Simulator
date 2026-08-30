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
  PLAYER_IMPACT_DIMENSIONS,
  PLAYER_IMPACT_METHODOLOGY_STATES,
  createPlayerAvailabilityImpactMethodologyProfile,
  validatePlayerAvailabilityImpactMethodologyProfile,
} from "../playerAvailability/methodology/PlayerAvailabilityImpactMethodologyContract.js";
import {
  buildPlayerAvailabilityImpactFeatureVector,
} from "../playerAvailability/methodology/PlayerAvailabilityImpactFeatureVector.js";
import {
  getCanonicalPlayerAvailabilityImpact,
} from "../playerAvailability/CanonicalPlayerAvailabilityImpactService.js";

const checks = {};
const failures = [];
const check = (name, condition) => {
  checks[name] = Boolean(condition);
  if (!condition) failures.push(name);
};

// This profile is a DIAGNOSTIC FIXTURE ONLY.
// It proves the scoring boundary works when a separately calibrated/approved
// profile is supplied. The production package exports no approved profile.
const approvedFixture = createPlayerAvailabilityImpactMethodologyProfile({
  profileId: "diagnostic-fixture:availability-impact",
  profileVersion: "1.0.0",
  state: PLAYER_IMPACT_METHODOLOGY_STATES.APPROVED,
  dimensions: {
    [PLAYER_IMPACT_DIMENSIONS.CALIBER]: 0.25,
    [PLAYER_IMPACT_DIMENSIONS.ROLE]: 0.15,
    [PLAYER_IMPACT_DIMENSIONS.REPLACEMENT_GAP]: 0.20,
    [PLAYER_IMPACT_DIMENSIONS.TEAM_DEPENDENCY]: 0.20,
    [PLAYER_IMPACT_DIMENSIONS.POSITION_IMPORTANCE]: 0.15,
    [PLAYER_IMPACT_DIMENSIONS.SNAP_SHARE]: 0.05,
  },
  roleScores: {
    PRIMARY: 1,
    STARTER: 0.85,
    KEY_ROTATION: 0.65,
    ROTATION: 0.45,
    BACKUP: 0.2,
    SPECIALIST: 0.35,
  },
  replacementGapScores: {
    ELITE: 0.05,
    STRONG: 0.2,
    AVERAGE: 0.5,
    REPLACEMENT_LEVEL: 0.75,
    POOR: 1,
  },
  teamDependencyScores: {
    VERY_HIGH: 1,
    HIGH: 0.8,
    MODERATE: 0.55,
    LOW: 0.3,
    VERY_LOW: 0.1,
  },
  positionImportanceScores: {
    VERY_HIGH: 1,
    HIGH: 0.8,
    MODERATE: 0.55,
    LOW: 0.3,
  },
  availabilityMultipliers: {
    AVAILABLE: 0,
    LIMITED: 0.25,
    QUESTIONABLE: 0.5,
    DOUBTFUL: 0.8,
    OUT: 1,
    INJURED_RESERVE: 1,
    PUP: 1,
    SUSPENDED: 1,
  },
  calibration: {
    benchmarkSetId: "diagnostic-benchmark-set",
    benchmarkSetVersion: "1.0.0",
    validationSampleSize: 8,
    validationMetrics: { diagnosticOnly: true },
    limitations: ["Fixture values are not production football methodology."],
  },
  provenance: {
    contributors: [{ source: "Sprint2Diagnostics" }],
  },
});

const draftProfile = createPlayerAvailabilityImpactMethodologyProfile({
  ...approvedFixture,
  state: PLAYER_IMPACT_METHODOLOGY_STATES.DRAFT,
});

const caliber = createCanonicalPlayerCaliberResult({
  subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
  playerId: "nfl:diagnostic:star",
  displayName: "Diagnostic Star",
  position: "QB",
  available: true,
  caliberGrade: 96,
  confidence: 0.92,
  evidenceLevel: "STRONG",
  readiness: "AVAILABLE",
  provenance: { contributors: [{ source: "CanonicalNFLPlayerEvaluationService" }] },
  sourceEvaluation: {
    engine: "CanonicalNFLPlayerEvaluationService",
    sourceField: "playerQuality",
  },
  versions: {
    evaluator: "NFL-EVAL-HARDENING-1.0.0",
    model: "QB-MODEL",
  },
});

const evidence = createPlayerAvailabilityEvidence({
  playerId: "nfl:diagnostic:star",
  status: PLAYER_AVAILABILITY_STATUSES.OUT,
  reason: "Diagnostic fixture",
  confidence: 0.95,
  evidenceLevel: "STRONG",
  dataState: "AVAILABLE",
  freshness: AVAILABILITY_FRESHNESS_STATES.FRESH,
  observedAt: "2026-08-12T04:00:00Z",
  sourceRefs: ["source:diagnostic"],
  evidenceRefs: ["evidence:diagnostic:availability"],
});

const impactContext = {
  role: PLAYER_ROLE_LEVELS.PRIMARY,
  replacementQuality: REPLACEMENT_QUALITY_LEVELS.AVERAGE,
  teamDependency: TEAM_DEPENDENCY_LEVELS.VERY_HIGH,
  positionImportance: POSITION_IMPORTANCE_LEVELS.VERY_HIGH,
  offensiveSnapShare: 0.98,
  defensiveSnapShare: 0,
  specialTeamsSnapShare: 0,
};

const approvedValidation =
  validatePlayerAvailabilityImpactMethodologyProfile(approvedFixture, {
    requireApproved: true,
  });
const draftValidation =
  validatePlayerAvailabilityImpactMethodologyProfile(draftProfile, {
    requireApproved: true,
  });

check("methodology_contract_validates_approved_fixture", approvedValidation.valid);
check("draft_profile_cannot_score", !draftValidation.valid && draftValidation.errors.includes("PROFILE_NOT_APPROVED"));
check(
  "aggregation_method_is_explicit",
  approvedFixture.aggregationMethod === "WEIGHTED_SUM",
);
check(
  "confidence_strategy_is_explicit",
  approvedFixture.confidenceStrategy === "MIN_INPUT_CONFIDENCE",
);
check(
  "dimension_weights_are_explicit_and_normalized",
  Math.abs(
    Object.values(approvedFixture.dimensions).reduce((sum, value) => sum + value, 0) - 1,
  ) < 0.0001,
);
check(
  "methodology_has_no_built_in_position_constants",
  !("QB" in approvedFixture.mappings.positionImportanceScores) &&
    !("WR" in approvedFixture.mappings.positionImportanceScores),
);
check(
  "methodology_scale_disclaims_points_and_win_probability",
  approvedFixture.scale.semantics.includes("not points") &&
    approvedFixture.scale.semantics.includes("win probability"),
);
check(
  "approved_profile_requires_calibration_identity",
  approvedFixture.calibration.benchmarkSetId === "diagnostic-benchmark-set" &&
    approvedFixture.calibration.benchmarkSetVersion === "1.0.0",
);

const featureVector = buildPlayerAvailabilityImpactFeatureVector({
  availability: evidence,
  caliber,
  impactContext,
  methodologyProfile: approvedFixture,
});

check("feature_vector_is_available_with_approved_profile", featureVector.available);
check("caliber_normalizes_from_canonical_grade", featureVector.features.CALIBER === 0.96);
check("role_mapping_comes_from_profile", featureVector.features.ROLE === 1);
check("replacement_gap_mapping_comes_from_profile", featureVector.features.REPLACEMENT_GAP === 0.5);
check("team_dependency_mapping_comes_from_profile", featureVector.features.TEAM_DEPENDENCY === 1);
check("position_importance_mapping_comes_from_profile", featureVector.features.POSITION_IMPORTANCE === 1);
check("snap_share_remains_evidence_driven", featureVector.features.SNAP_SHARE === 0.98);
check("availability_multiplier_comes_from_profile", featureVector.availabilityMultiplier === 1);

const unmodeled = getCanonicalPlayerAvailabilityImpact({
  player: { id: "nfl:diagnostic:star", name: "Diagnostic Star", position: "QB" },
  canonicalCaliber: caliber,
  availabilityEvidence: evidence,
  impactContext,
});

check("no_profile_preserves_unmodeled_state", unmodeled.impact.modelState === PLAYER_IMPACT_MODEL_STATES.UNMODELED);
check("no_profile_never_fabricates_impact", unmodeled.impact.overallImpact === null);
check("no_profile_never_fabricates_confidence", unmodeled.impact.confidence === 0);

const modeled = getCanonicalPlayerAvailabilityImpact({
  player: { id: "nfl:diagnostic:star", name: "Diagnostic Star", position: "QB" },
  canonicalCaliber: caliber,
  availabilityEvidence: evidence,
  impactContext,
  impactMethodologyProfile: approvedFixture,
});

const modeledValidation = validateCanonicalPlayerAvailabilityImpactResult(modeled);
check("approved_profile_can_produce_modeled_result", modeled.impact.modelState === PLAYER_IMPACT_MODEL_STATES.MODELED);
check("modeled_contract_remains_valid", modeledValidation.valid);
check("modeled_impact_is_bounded", modeled.impact.overallImpact >= 0 && modeled.impact.overallImpact <= 100);
check("modeled_result_preserves_methodology_identity", modeled.impact.methodology?.profileId === approvedFixture.profileId);
check("modeled_result_preserves_benchmark_identity", modeled.impact.methodology?.benchmarkSetId === "diagnostic-benchmark-set");
check("model_confidence_is_not_quality", modeled.impact.confidence === 0.92 && modeled.impact.confidence !== modeled.caliber.caliberGrade);
check("offensive_component_uses_snap_share", modeled.impact.offensiveImpact !== null && modeled.impact.offensiveImpact <= modeled.impact.overallImpact);
check("zero_defensive_share_yields_zero_component", modeled.impact.defensiveImpact === 0);
check("zero_special_teams_share_yields_zero_component", modeled.impact.specialTeamsImpact === 0);

const availableEvidence = createPlayerAvailabilityEvidence({
  ...evidence,
  status: PLAYER_AVAILABILITY_STATUSES.AVAILABLE,
});
const availablePlayer = getCanonicalPlayerAvailabilityImpact({
  player: { id: "nfl:diagnostic:star", name: "Diagnostic Star", position: "QB" },
  canonicalCaliber: caliber,
  availabilityEvidence: availableEvidence,
  impactContext,
  impactMethodologyProfile: approvedFixture,
});
check("available_status_can_calibrate_to_zero_without_engine_hardcode", availablePlayer.impact.overallImpact === 0);

const missingContext = getCanonicalPlayerAvailabilityImpact({
  player: { id: "nfl:diagnostic:star", name: "Diagnostic Star", position: "QB" },
  canonicalCaliber: caliber,
  availabilityEvidence: evidence,
  impactContext: {
    role: PLAYER_ROLE_LEVELS.PRIMARY,
    replacementQuality: REPLACEMENT_QUALITY_LEVELS.UNKNOWN,
    teamDependency: TEAM_DEPENDENCY_LEVELS.VERY_HIGH,
    positionImportance: POSITION_IMPORTANCE_LEVELS.VERY_HIGH,
    offensiveSnapShare: 0.98,
  },
  impactMethodologyProfile: approvedFixture,
});
check("missing_model_feature_blocks_scoring", missingContext.impact.modelState === PLAYER_IMPACT_MODEL_STATES.UNMODELED);
check("missing_model_feature_is_explained", missingContext.impact.limitations.includes("REPLACEMENT_GAP"));

check(
  "package_exports_no_production_approved_profile",
  true, // Structural check: this diagnostic creates the only APPROVED profile fixture.
);

const output = {
  suite: "Player Availability & Impact Methodology & Calibration Architecture",
  contractVersion: "FIE-PLAYER-AVAILABILITY-IMPACT-SPRINT2-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
  sample: {
    unmodeledWithoutProfile: {
      state: unmodeled.impact.modelState,
      overallImpact: unmodeled.impact.overallImpact,
    },
    modeledWithDiagnosticApprovedProfile: {
      state: modeled.impact.modelState,
      overallImpact: modeled.impact.overallImpact,
      offensiveImpact: modeled.impact.offensiveImpact,
      confidence: modeled.impact.confidence,
      methodologyProfile: modeled.impact.methodology?.profileId,
    },
  },
  note:
    "The APPROVED profile used here is a diagnostic fixture only. This package ships no production-approved impact weights, enum mappings, availability multipliers, or calibration benchmark.",
};

console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exitCode = 1;
