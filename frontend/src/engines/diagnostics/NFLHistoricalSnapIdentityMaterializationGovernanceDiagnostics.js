import {
  NFL_HISTORICAL_SNAP_IDENTITY_MATERIALIZATION_GOVERNANCE,
  getNFLHistoricalSnapIdentityMaterializationGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalSnapIdentityMaterializationGovernance.js";

const governance = getNFLHistoricalSnapIdentityMaterializationGovernance();

const checks = Object.freeze({
  contractExported:
    governance ===
    NFL_HISTORICAL_SNAP_IDENTITY_MATERIALIZATION_GOVERNANCE,
  exactIdentityOnly: governance.exactPfrToGsisOnly === true,
  canonicalField: governance.canonicalIdentityField === "gsis_id",
  canonicalFlag:
    governance.canonicalIdentityResolvedField ===
    "canonical_identity_resolved",
  noNameMatching: governance.nameMatchingAllowed === false,
  noFuzzyMatching: governance.fuzzyMatchingAllowed === false,
  quarantineRequired: governance.unresolvedRowsMustBeQuarantined === true,
  rowReconciliationRequired: governance.rowReconciliationRequired === true,
  coverageGate:
    governance.minimumCanonicalIdentityCoverageRate === 0.95,
  postgameOnly: governance.evidenceTiming === "POSTGAME_PARTICIPATION",
  pregameBlocked:
    governance.pregameReplacementDeterminationAuthorized === false,
  canonicalMutationBlocked:
    governance.canonicalV1DatasetMutationAuthorized === false,
  calibrationBlocked: governance.calibrationAuthorized === false,
  teamStrengthBlocked:
    governance.teamStrengthMutationAuthorized === false,
  decisionModelBlocked:
    governance.decisionModelMutationAuthorized === false,
  pickemBlocked: governance.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(
  JSON.stringify(
    {
      suite: "NFL Historical Snap Identity Materialization Governance",
      contractVersion:
        "FIE-NFL-HISTORICAL-SNAP-IDENTITY-MATERIALIZATION-GOVERNANCE-DIAGNOSTIC-1.0.0",
      status: failures.length ? "FAIL" : "PASS",
      passed: Object.keys(checks).length - failures.length,
      failed: failures.length,
      checks,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) {
  process.exitCode = 1;
}
