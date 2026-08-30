import {
  evaluateNFLDecisionCalibration,
} from "./NFLDecisionCalibrationMetrics.js";

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

export function evaluateNFLDecisionModel({
  historicalRecords = [],
  predict = null,
  modelName = "UNNAMED_CANDIDATE",
  modelVersion = "0.0.0",
} = {}) {
  if (typeof predict !== "function") {
    throw new Error(
      "Decision Model Evaluation requires a predict(record) function."
    );
  }

  const probabilitySamples = [];
  const marginSamples = [];
  const predictions = [];

  for (const record of historicalRecords) {
    const outcome =
      record?.outcome || {};

    if (
      !finite(outcome.homeMargin) ||
      outcome.tie === true
    ) {
      continue;
    }

    const prediction =
      predict(record);

    if (!prediction) continue;

    const homeWinProbability =
      prediction.homeWinProbability;

    const expectedHomeMargin =
      prediction.expectedHomeMargin;

    if (
      finite(homeWinProbability)
    ) {
      probabilitySamples.push({
        probability:
          homeWinProbability,
        outcome:
          outcome.homeWin,
      });
    }

    if (
      finite(expectedHomeMargin)
    ) {
      marginSamples.push({
        predictedMargin:
          expectedHomeMargin,
        observedMargin:
          outcome.homeMargin,
      });
    }

    predictions.push({
      gameId:
        record?.game?.gameId || null,
      homeWinProbability:
        finite(homeWinProbability)
          ? homeWinProbability
          : null,
      expectedHomeMargin:
        finite(expectedHomeMargin)
          ? expectedHomeMargin
          : null,
      observedHomeWin:
        outcome.homeWin,
      observedHomeMargin:
        outcome.homeMargin,
    });
  }

  return {
    contract:
      "NFLDecisionModelEvaluation",
    version:
      "NFL-DECISION-MODEL-EVALUATION-1.0.0",

    model: {
      name: modelName,
      version: modelVersion,
    },

    evaluatedGames:
      predictions.length,

    metrics:
      evaluateNFLDecisionCalibration({
        probabilitySamples,
        marginSamples,
      }),

    predictions,

    promoted: false,
    promotionState:
      "RESEARCH_ONLY",
  };
}

export default {
  evaluateNFLDecisionModel,
};
