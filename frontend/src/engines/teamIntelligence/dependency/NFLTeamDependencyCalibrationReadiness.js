export const NFL_TEAM_DEPENDENCY_CALIBRATION_READINESS_VERSION =
  "FIE-NFL-TEAM-DEPENDENCY-CALIBRATION-READINESS-1.0.0";

export const NFL_TEAM_DEPENDENCY_CALIBRATION_STATES = Object.freeze({
  BLOCKED: "BLOCKED",
  PILOT_READY: "PILOT_READY",
  PRODUCTION_DATASET_READY: "PRODUCTION_DATASET_READY",
});

const integer = (value) =>
  Number.isInteger(Number(value)) ? Number(value) : null;

export function assessNFLTeamDependencyCalibrationReadiness(
  replacementMappingReport = {}
) {
  const inputEvidenceCount =
    integer(replacementMappingReport?.inputEvidenceCount) ?? 0;
  const pregameSafeAnchors =
    integer(replacementMappingReport?.pregameSafeAnchors) ?? 0;
  const fullyMappedCount =
    integer(replacementMappingReport?.fullyMappedCount) ?? 0;
  const pendingCount =
    integer(
      replacementMappingReport?.pendingEvidenceBackedMappingCount
    ) ?? 0;

  const rosterOrderHeuristicUsed =
    replacementMappingReport?.rosterOrderHeuristicUsed === true;
  const futureLeakageDetected =
    replacementMappingReport?.futureLeakageDetected === true;
  const datasetMutated =
    replacementMappingReport?.datasetMutated === true;
  const calibrationExecuted =
    replacementMappingReport?.calibrationExecuted === true;

  const blockers = [];

  if (pregameSafeAnchors <= 0) {
    blockers.push("NO_PREGAME_SAFE_ANCHORS");
  }
  if (fullyMappedCount <= 0) {
    blockers.push("NO_EVIDENCE_BACKED_EXPECTED_REPLACEMENTS_MAPPED");
  }
  if (futureLeakageDetected) {
    blockers.push("FUTURE_LEAKAGE_DETECTED");
  }
  if (rosterOrderHeuristicUsed) {
    blockers.push("ROSTER_ORDER_HEURISTIC_USED");
  }

  const pilotReady =
    blockers.length === 0 &&
    fullyMappedCount > 0;

  const productionDatasetReady =
    pilotReady &&
    pendingCount === 0 &&
    fullyMappedCount === pregameSafeAnchors;

  return {
    contract: "NFLTeamDependencyCalibrationReadiness",
    version: NFL_TEAM_DEPENDENCY_CALIBRATION_READINESS_VERSION,
    state: productionDatasetReady
      ? NFL_TEAM_DEPENDENCY_CALIBRATION_STATES.PRODUCTION_DATASET_READY
      : pilotReady
        ? NFL_TEAM_DEPENDENCY_CALIBRATION_STATES.PILOT_READY
        : NFL_TEAM_DEPENDENCY_CALIBRATION_STATES.BLOCKED,
    pilotCalibrationReady: pilotReady,
    productionDatasetReady,
    productionPromotionAuthorized: false,
    blockers,
    mapping: {
      inputEvidenceCount,
      pregameSafeAnchors,
      fullyMappedCount,
      pendingEvidenceBackedMappingCount: pendingCount,
      mappedCoverage:
        pregameSafeAnchors > 0
          ? fullyMappedCount / pregameSafeAnchors
          : 0,
    },
    safeguards: {
      rosterOrderHeuristicUsed,
      futureLeakageDetected,
      datasetMutated,
      calibrationExecuted,
    },
    note:
      productionDatasetReady
        ? "Expected-replacement mapping coverage is complete, but production promotion still requires explicit calibration and validation authorization."
        : "Team Dependency remains PROVISIONAL. Historical expected-replacement evidence is not sufficiently mapped for production calibration.",
  };
}

export default {
  NFL_TEAM_DEPENDENCY_CALIBRATION_READINESS_VERSION,
  NFL_TEAM_DEPENDENCY_CALIBRATION_STATES,
  assessNFLTeamDependencyCalibrationReadiness,
};
