import {
  createNFLTeamStrengthCalibrationObservation,
  validateNFLTeamStrengthCalibrationObservation,
} from "./NFLTeamStrengthCalibrationDatasetContract.js";

export function buildNFLTeamStrengthCalibrationDataset(inputs = [], metadata = {}) {
  const observations = inputs.map(createNFLTeamStrengthCalibrationObservation);
  const validations = observations.map(validateNFLTeamStrengthCalibrationObservation);
  const valid = observations.filter((_, index) => validations[index].valid);
  const rejected = observations
    .map((observation, index) => ({ observation, validation: validations[index] }))
    .filter((item) => !item.validation.valid);

  const splitCounts = valid.reduce((acc, item) => {
    acc[item.split] = (acc[item.split] ?? 0) + 1;
    return acc;
  }, {});

  return Object.freeze({
    datasetVersion: metadata.datasetVersion ?? "UNVERSIONED",
    contractVersion: "FIE-NFL-TEAM-STRENGTH-CALIBRATION-DATASET-1.0.0",
    status: rejected.length ? "PARTIAL_REJECTED_OBSERVATIONS" : "VALID",
    observations: Object.freeze(valid),
    rejected: Object.freeze(rejected),
    splitCounts: Object.freeze(splitCounts),
    learnedWeights: null,
    teamStrengthScores: null,
  });
}
