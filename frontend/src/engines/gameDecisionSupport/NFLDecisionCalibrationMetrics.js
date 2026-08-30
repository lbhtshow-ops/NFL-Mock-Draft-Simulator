function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function clampProbability(value) {
  return Math.max(
    0.000001,
    Math.min(0.999999, value)
  );
}

function mean(values) {
  const valid = values.filter(finite);

  return valid.length
    ? valid.reduce(
        (sum, value) => sum + value,
        0
      ) / valid.length
    : null;
}

export function brierScore(samples = []) {
  const errors = samples
    .filter(
      (sample) =>
        finite(sample?.probability) &&
        finite(sample?.outcome)
    )
    .map((sample) => {
      const probability =
        clampProbability(sample.probability);

      return (
        probability - sample.outcome
      ) ** 2;
    });

  return mean(errors);
}

export function logLoss(samples = []) {
  const losses = samples
    .filter(
      (sample) =>
        finite(sample?.probability) &&
        finite(sample?.outcome)
    )
    .map((sample) => {
      const probability =
        clampProbability(sample.probability);

      return -(
        sample.outcome *
          Math.log(probability) +
        (1 - sample.outcome) *
          Math.log(1 - probability)
      );
    });

  return mean(losses);
}

export function marginMeanAbsoluteError(
  samples = []
) {
  const errors = samples
    .filter(
      (sample) =>
        finite(sample?.predictedMargin) &&
        finite(sample?.observedMargin)
    )
    .map(
      (sample) =>
        Math.abs(
          sample.predictedMargin -
          sample.observedMargin
        )
    );

  return mean(errors);
}

export function winnerAccuracy(samples = []) {
  const hits = samples
    .filter(
      (sample) =>
        finite(sample?.probability) &&
        finite(sample?.outcome)
    )
    .map(
      (sample) =>
        (
          sample.probability >= 0.5
            ? 1
            : 0
        ) === sample.outcome
          ? 1
          : 0
    );

  return mean(hits);
}

export function calibrationBins(
  samples = [],
  bins = 10
) {
  const valid = samples.filter(
    (sample) =>
      finite(sample?.probability) &&
      finite(sample?.outcome)
  );

  const result = [];

  for (let index = 0; index < bins; index += 1) {
    const lower = index / bins;
    const upper = (index + 1) / bins;

    const members =
      valid.filter((sample) => {
        const probability =
          sample.probability;

        return (
          probability >= lower &&
          (
            index === bins - 1
              ? probability <= upper
              : probability < upper
          )
        );
      });

    result.push({
      lower,
      upper,
      samples: members.length,
      meanPredicted:
        mean(
          members.map(
            (sample) =>
              sample.probability
          )
        ),
      observedRate:
        mean(
          members.map(
            (sample) =>
              sample.outcome
          )
        ),
    });
  }

  return result;
}

export function evaluateNFLDecisionCalibration({
  probabilitySamples = [],
  marginSamples = [],
} = {}) {
  return {
    contract:
      "NFLDecisionCalibrationReport",
    version:
      "NFL-DECISION-CALIBRATION-REPORT-1.0.0",

    probability: {
      samples:
        probabilitySamples.length,
      brierScore:
        brierScore(probabilitySamples),
      logLoss:
        logLoss(probabilitySamples),
      winnerAccuracy:
        winnerAccuracy(
          probabilitySamples
        ),
      bins:
        calibrationBins(
          probabilitySamples
        ),
    },

    margin: {
      samples:
        marginSamples.length,
      meanAbsoluteError:
        marginMeanAbsoluteError(
          marginSamples
        ),
    },

    calibrated: false,
    status:
      "MEASUREMENT_FOUNDATION_ONLY",
  };
}

export default {
  brierScore,
  logLoss,
  marginMeanAbsoluteError,
  winnerAccuracy,
  calibrationBins,
  evaluateNFLDecisionCalibration,
};
