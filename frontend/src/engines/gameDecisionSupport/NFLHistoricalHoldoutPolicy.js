export const NFL_HISTORICAL_HOLDOUT_POLICY_VERSION =
  "NFL-HISTORICAL-HOLDOUT-POLICY-1.0.0";

export function splitNFLHistoricalDataset({
  records = [],
  validationSeasons = [],
  testSeasons = [],
} = {}) {
  const validation = new Set(
    validationSeasons.map(Number)
  );
  const test = new Set(
    testSeasons.map(Number)
  );

  const overlap = [
    ...validation,
  ].filter(
    (season) => test.has(season)
  );

  if (overlap.length) {
    throw new Error(
      "Validation and test seasons must not overlap."
    );
  }

  const training = [];
  const validationSet = [];
  const testSet = [];

  for (const record of records) {
    const season =
      Number(record?.game?.season);

    if (test.has(season)) {
      testSet.push(record);
    } else if (validation.has(season)) {
      validationSet.push(record);
    } else {
      training.push(record);
    }
  }

  return {
    version:
      NFL_HISTORICAL_HOLDOUT_POLICY_VERSION,

    training,
    validation:
      validationSet,
    test:
      testSet,

    summary: {
      training:
        training.length,
      validation:
        validationSet.length,
      test:
        testSet.length,
    },
  };
}

export default {
  NFL_HISTORICAL_HOLDOUT_POLICY_VERSION,
  splitNFLHistoricalDataset,
};
