import {
  NFL_HISTORICAL_VALIDATION_SCHEMA_RECONCILIATION_GOVERNANCE,
  getNFLHistoricalValidationSchemaReconciliationGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalValidationSchemaReconciliationGovernance.js";

const g = getNFLHistoricalValidationSchemaReconciliationGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_HISTORICAL_VALIDATION_SCHEMA_RECONCILIATION_GOVERNANCE,
  matchedEffectFieldExact:
    g.matchedEffectField === "effect.treatedMinusControlResidual",
  descriptiveATTOnly:
    g.matchedEffectSemantics === "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
  rawMarginBlocked:
    g.rawPointMarginMayRepresentObservedPlayerImpact === false,
  calibrationIdentityExact:
    g.calibrationIdentityField === "identity",
  caliberDeltaExact:
    g.caliberDeltaField === "pregame.expectedReplacementDelta",
  observedUsageExact:
    g.observedUsageField === "usageEvidence.selectedSnapPct",
  dependencyExact:
    g.canonicalDependencyField === "teamDependencyEvidence.dependencyIndex",
  noDependencySynthesis:
    g.unavailableDependencyMayBeSynthesized === false,
  noSilentFiveSeasonPass:
    g.missingFiveSeasonMatchedEffectsMayBeSilentlyPassed === false,
  noSilentPerformanceWindowPass:
    g.missingPerformanceWindowValidationMayBeSilentlyPassed === false,
  noSilentOpponentAdjustmentPass:
    g.missingOpponentAdjustmentValidationMayBeSilentlyPassed === false,
  noProductionWeightFit:
    g.productionWeightFitAuthorized === false,
  shadowOnly:
    g.playerImpactTeamStrengthMode === "SHADOW_ONLY",
  teamStrengthBlocked:
    g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked:
    g.decisionModelMutationAuthorized === false,
  pickemBlocked:
    g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Historical Validation Schema Reconciliation Governance",
  contractVersion:
    "FIE-NFL-HISTORICAL-VALIDATION-SCHEMA-RECONCILIATION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
