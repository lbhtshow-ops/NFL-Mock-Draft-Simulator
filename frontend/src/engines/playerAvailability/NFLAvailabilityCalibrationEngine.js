export const NFL_AVAILABILITY_CALIBRATION_VERSION =
  "NFL-AVAILABILITY-CALIBRATION-V1.0.0";

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function mean(values) {
  const valid = values.filter(finite);

  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) /
      valid.length
    : null;
}

function mae(samples) {
  const errors =
    samples
      .filter(
        (sample) =>
          finite(sample?.predicted) &&
          finite(sample?.observed)
      )
      .map(
        (sample) =>
          Math.abs(
            sample.predicted -
            sample.observed
          )
      );

  return mean(errors);
}

export function evaluateAvailabilityCalibration(
  samples = []
) {
  const valid = samples.filter(
    (sample) =>
      finite(sample?.predicted) &&
      finite(sample?.observed)
  );

  const byPosition = {};

  for (const sample of valid) {
    const position =
      String(
        sample.position || "UNKNOWN"
      ).toUpperCase();

    if (!byPosition[position]) {
      byPosition[position] = [];
    }

    byPosition[position].push(sample);
  }

  const positionResults =
    Object.fromEntries(
      Object.entries(byPosition)
        .map(([position, rows]) => [
          position,
          {
            samples: rows.length,
            meanPredicted:
              mean(
                rows.map(
                  (row) => row.predicted
                )
              ),
            meanObserved:
              mean(
                rows.map(
                  (row) => row.observed
                )
              ),
            meanAbsoluteError:
              mae(rows),
          },
        ])
    );

  return {
    contract:
      "NFLAvailabilityCalibrationReport",
    version:
      NFL_AVAILABILITY_CALIBRATION_VERSION,

    samples: valid.length,
    meanAbsoluteError:
      mae(valid),

    byPosition:
      positionResults,

    calibrated:
      false,

    recommendation:
      valid.length >= 200
        ? "Sufficient sample volume for formal policy fitting."
        : "Continue collecting historical injury-impact samples before replacing V1 heuristic policy coefficients.",
  };
}

export default {
  NFL_AVAILABILITY_CALIBRATION_VERSION,
  evaluateAvailabilityCalibration,
};
