import generatedNFLHistoricalDecisionDataset from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";
import { predictNFLCandidate } from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";
import generatedModel from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js";

const finite = (v) =>
  v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const n = (v) => Number(v);

function sideFor(game, team) {
  if (game?.homeTeam === team) return "HOME";
  if (game?.awayTeam === team) return "AWAY";
  return null;
}

function expectedTeamMargin(decision, side) {
  const edge = decision?.pregame?.matchupEdge;
  const quality = decision?.pregame?.evidenceQuality;

  if (!finite(edge) || !finite(quality) || !side) return null;

  const prediction = predictNFLCandidate(
    generatedModel.modelId,
    { pregame: { matchupEdge: edge, evidenceQuality: quality } },
    generatedModel.parameters
  );

  if (!finite(prediction?.expectedHomeMargin)) return null;

  return side === "HOME"
    ? n(prediction.expectedHomeMargin)
    : -n(prediction.expectedHomeMargin);
}

function actualTeamMargin(decision, side) {
  const homeMargin = decision?.outcome?.homeMargin;
  if (!finite(homeMargin) || !side) return null;

  return side === "HOME" ? n(homeMargin) : -n(homeMargin);
}

function buildOutcome(decision, team) {
  const side = sideFor(decision?.game, team);
  const expected = expectedTeamMargin(decision, side);
  const actual = actualTeamMargin(decision, side);

  if (!side || !finite(expected) || !finite(actual)) return null;

  return Object.freeze({
    gameId: decision?.game?.gameId ?? null,
    team,
    side,
    expectedTeamMargin: expected,
    actualTeamMargin: actual,
    gamePerformanceResidual: actual - expected,
    residualDefinition: "ACTUAL_TEAM_MARGIN_MINUS_CANONICAL_EXPECTED_TEAM_MARGIN",
    source: "generatedNFLHistoricalDecisionDataset.js",
    canonicalModelId: generatedModel?.modelId ?? null,
    canonicalModelVersion: generatedModel?.modelVersion ?? null,
  });
}

function teamGameKey(gameId, team) {
  return gameId && team ? `${gameId}:${team}` : null;
}

export function buildHistoricalAvailabilityMatchedOutcomeJoin({
  matchedPairs = [],
  treatedResidualRows = [],
} = {}) {
  const decisionByGame = new Map();
  for (const row of generatedNFLHistoricalDecisionDataset) {
    if (row?.game?.gameId) decisionByGame.set(row.game.gameId, row);
  }

  const treatedResidualsByKey = new Map();
  for (const row of treatedResidualRows) {
    const key = teamGameKey(row?.identity?.gameId, row?.identity?.team);
    if (!key) continue;

    if (!treatedResidualsByKey.has(key)) treatedResidualsByKey.set(key, []);
    treatedResidualsByKey.get(key).push(row);
  }

  const joined = [];

  let missingTreatedDecisionCount = 0;
  let missingControlDecisionCount = 0;
  let invalidTreatedOutcomeCount = 0;
  let invalidControlOutcomeCount = 0;
  let missingTreatedResidualSourceCount = 0;
  let ambiguousTreatedResidualSourceCount = 0;
  let treatedResidualMismatchCount = 0;
  let pairIdentityMismatchCount = 0;

  const TOLERANCE = 1e-9;

  for (const pair of matchedPairs) {
    const treatedKey = pair?.treated?.key ?? null;
    const controlKey = pair?.control?.key ?? null;

    const expectedTreatedKey = teamGameKey(
      pair?.treated?.gameId,
      pair?.treated?.team
    );
    const expectedControlKey = teamGameKey(
      pair?.control?.gameId,
      pair?.control?.team
    );

    if (
      treatedKey !== expectedTreatedKey ||
      controlKey !== expectedControlKey
    ) {
      pairIdentityMismatchCount++;
      continue;
    }

    const treatedDecision = decisionByGame.get(pair.treated.gameId);
    const controlDecision = decisionByGame.get(pair.control.gameId);

    if (!treatedDecision) {
      missingTreatedDecisionCount++;
      continue;
    }

    if (!controlDecision) {
      missingControlDecisionCount++;
      continue;
    }

    const treatedOutcome = buildOutcome(
      treatedDecision,
      pair.treated.team
    );

    const controlOutcome = buildOutcome(
      controlDecision,
      pair.control.team
    );

    if (!treatedOutcome) {
      invalidTreatedOutcomeCount++;
      continue;
    }

    if (!controlOutcome) {
      invalidControlOutcomeCount++;
      continue;
    }

    const sourceRows = treatedResidualsByKey.get(treatedKey) ?? [];

    if (!sourceRows.length) {
      missingTreatedResidualSourceCount++;
      continue;
    }

    const sourceResiduals = [
      ...new Set(
        sourceRows
          .map((row) => row?.residual?.gamePerformanceResidual)
          .filter(finite)
          .map(n)
      ),
    ];

    if (sourceResiduals.length !== 1) {
      ambiguousTreatedResidualSourceCount++;
      continue;
    }

    const sourceResidual = sourceResiduals[0];

    if (
      Math.abs(
        sourceResidual - treatedOutcome.gamePerformanceResidual
      ) > TOLERANCE
    ) {
      treatedResidualMismatchCount++;
      continue;
    }

    joined.push(
      Object.freeze({
        contract: "NFLHistoricalAvailabilityMatchedOutcomeRecord",
        contractVersion:
          "FIE-NFL-HISTORICAL-AVAILABILITY-MATCHED-OUTCOME-1.0.0",

        pairId: pair?.pairId ?? null,
        pairWeight: pair?.pairWeight ?? null,

        treated: Object.freeze({
          key: pair.treated.key,
          gameId: pair.treated.gameId,
          team: pair.treated.team,
          season: pair.treated.season,
          week: pair.treated.week,
          side: pair.treated.side,
          outcome: treatedOutcome,
          reconciliation: Object.freeze({
            historicalResidualSourceCount: sourceRows.length,
            historicalResidualSourceValue: sourceResidual,
            recomputedResidualMatchesSource: true,
          }),
        }),

        control: Object.freeze({
          key: pair.control.key,
          gameId: pair.control.gameId,
          team: pair.control.team,
          season: pair.control.season,
          week: pair.control.week,
          side: pair.control.side,
          outcome: controlOutcome,
        }),

        matching: pair?.matching ?? null,
        estimand: pair?.estimand ?? null,

        effect: Object.freeze({
          pairDifferenceComputed: false,
          treatedMinusControlResidual: null,
          causalEffectEstimated: false,
        }),

        safeguards: Object.freeze({
          matchingSpecificationMutated: false,
          outcomesUsedForPriorMatchSelection: false,
          pairDifferenceComputed: false,
          causalEffectEstimated: false,
          inferentialClaimsCreated: false,
          learnedWeightsCreated: false,
          calibrationExecuted: false,
          teamStrengthMutated: false,
          decisionModelMutated: false,
          pickemScoringMutated: false,
          databaseMutated: false,
        }),
      })
    );
  }

  const pairIds = joined.map((row) => row.pairId);
  const uniquePairCount = new Set(pairIds).size;

  const controlReuse = new Map();
  for (const row of joined) {
    controlReuse.set(
      row.control.key,
      (controlReuse.get(row.control.key) ?? 0) + 1
    );
  }

  const maximumControlReuse = controlReuse.size
    ? Math.max(...controlReuse.values())
    : 0;

  const report = Object.freeze({
    contractVersion:
      "FIE-NFL-HISTORICAL-AVAILABILITY-OUTCOME-JOIN-REPORT-1.0.0",
    sprint: "2.18.17-RC1",

    canonicalModel: Object.freeze({
      modelId: generatedModel?.modelId ?? null,
      modelVersion: generatedModel?.modelVersion ?? null,
      parameters: generatedModel?.parameters ?? null,
    }),

    source: Object.freeze({
      matchedPairCount: matchedPairs.length,
      treatedResidualObservationCount: treatedResidualRows.length,
      canonicalDecisionRecordCount:
        generatedNFLHistoricalDecisionDataset.length,
    }),

    outcomeJoin: Object.freeze({
      joinedPairCount: joined.length,
      uniquePairCount,
      uniqueControlsUsed: controlReuse.size,
      maximumControlReuse,

      missingTreatedDecisionCount,
      missingControlDecisionCount,
      invalidTreatedOutcomeCount,
      invalidControlOutcomeCount,
      missingTreatedResidualSourceCount,
      ambiguousTreatedResidualSourceCount,
      treatedResidualMismatchCount,
      pairIdentityMismatchCount,
    }),

    expectedReconciliation: Object.freeze({
      expectedMatchedPairs: 131,
      expectedUniqueControls: 76,
      expectedMaximumControlReuse: 7,
    }),

    reconciliation: Object.freeze({
      joinedPairCountMatches: joined.length === 131,
      pairIdsUnique:
        uniquePairCount === joined.length,
      uniqueControlsMatch:
        controlReuse.size === 76,
      maximumControlReuseMatches:
        maximumControlReuse === 7,
      allTreatedResidualsReconcile:
        treatedResidualMismatchCount === 0 &&
        missingTreatedResidualSourceCount === 0 &&
        ambiguousTreatedResidualSourceCount === 0,
      allCanonicalOutcomesAvailable:
        missingTreatedDecisionCount === 0 &&
        missingControlDecisionCount === 0 &&
        invalidTreatedOutcomeCount === 0 &&
        invalidControlOutcomeCount === 0,
      pairIdentityIntegrity:
        pairIdentityMismatchCount === 0,
      pairDifferenceStillAbsent:
        joined.every(
          (row) =>
            row?.effect?.pairDifferenceComputed === false &&
            row?.effect?.treatedMinusControlResidual === null
        ),
    }),

    readiness: Object.freeze({
      outcomeJoinedCohortConstructible:
        joined.length === 131 &&
        uniquePairCount === joined.length &&
        controlReuse.size === 76 &&
        maximumControlReuse === 7 &&
        missingTreatedDecisionCount === 0 &&
        missingControlDecisionCount === 0 &&
        invalidTreatedOutcomeCount === 0 &&
        invalidControlOutcomeCount === 0 &&
        missingTreatedResidualSourceCount === 0 &&
        ambiguousTreatedResidualSourceCount === 0 &&
        treatedResidualMismatchCount === 0 &&
        pairIdentityMismatchCount === 0,

      causalEffectEstimationAuthorized: false,
      uncertaintyEstimationAuthorized: false,
      inferentialClaimsAuthorized: false,
      calibrationAuthorized: false,
    }),

    safeguards: Object.freeze({
      outcomeJoinChangesMatching: false,
      outcomeJoinChangesEstimand: false,
      pairDifferenceComputed: false,
      causalEffectEstimated: false,
      learnedWeightsCreated: false,
      calibrationExecuted: false,
      teamStrengthMutated: false,
      decisionModelMutated: false,
      pickemScoringMutated: false,
      databaseMutated: false,
    }),
  });

  return Object.freeze({
    records: Object.freeze(joined),
    report,
  });
}
