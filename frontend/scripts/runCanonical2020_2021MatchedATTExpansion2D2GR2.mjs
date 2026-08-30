import fs from "node:fs";
import path from "node:path";

import {
  loadCanonicalDecisionDataset,
  indexDecisionRecords,
  resolveDecisionRecord,
  constructBaselineResidual,
} from "./buildHistoricalAvailabilityImpactBaselineResiduals.mjs";

import {
  buildHistoricalAvailabilityControlCohort,
} from "./buildHistoricalAvailabilityControlCohort.mjs";

import {
  buildHistoricalAvailabilityMatchedCohort,
} from "./buildHistoricalAvailabilityMatchedCohort.mjs";

import {
  buildHistoricalAvailabilityMatchedOutcomeJoin,
} from "./buildHistoricalAvailabilityMatchedOutcomeJoin.mjs";

import {
  buildHistoricalAvailabilityMatchedATTEffect,
} from "./buildHistoricalAvailabilityMatchedATTEffect.mjs";

import {
  getNFLCanonicalGameDecisionModelConfig,
} from "../src/engines/gameDecisionSupport/canonical/NFLGameDecisionModelV1.js";

const ROOT = process.cwd();

const TARGET_SEASONS = new Set([2020, 2021]);
const FROZEN_CALIPER = 0.7117676224413696;

const PATHS = Object.freeze({
  sourceObservations:
    "data/calibration/historical/expansion-2020-2021/player-impact/caliber/five-season-evidence/five-season-observations.jsonl",
  shadowCorpus:
    "data/calibration/historical/expansion-2020-2021/player-impact/five-season-shadow-replacement-corpus-v1.jsonl",
  legacyMatchedEffects:
    "data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl",
  outputRoot:
    "data/calibration/historical/expansion-2020-2021/player-impact/matched-att",
});

const OUTPUTS = Object.freeze({
  calibrationObservations:
    `${PATHS.outputRoot}/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl`,
  baselineResiduals:
    `${PATHS.outputRoot}/historical-availability-impact-baseline-residuals-2020-2021-v1.jsonl`,
  baselineResidualRejects:
    `${PATHS.outputRoot}/historical-availability-impact-baseline-residual-rejects-2020-2021-v1.jsonl`,
  controlCohort:
    `${PATHS.outputRoot}/historical-availability-control-cohort-2020-2021-v1.jsonl`,
  matchedCohort:
    `${PATHS.outputRoot}/historical-availability-matched-cohort-2020-2021-v1.jsonl`,
  matchedOutcome:
    `${PATHS.outputRoot}/historical-availability-matched-outcomes-2020-2021-v1.jsonl`,
  matchedEffects:
    `${PATHS.outputRoot}/historical-availability-matched-att-effects-2020-2021-v1.jsonl`,
  report:
    `${PATHS.outputRoot}/canonical-2020-2021-matched-att-expansion-report.json`,
});

function abs(rel) {
  return path.resolve(ROOT, rel);
}

function readJsonl(rel) {
  const file = abs(rel);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJsonl(rel, rows) {
  const file = abs(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""),
    "utf8"
  );
}

function writeJson(rel, value) {
  const file = abs(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function clean(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function finite(v) {
  return v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
}

function num(v) {
  return finite(v) ? Number(v) : null;
}

function upper(v) {
  const x = clean(v);
  return x ? x.toUpperCase() : null;
}

function field(row, candidates) {
  for (const pathParts of candidates) {
    let cur = row;
    let ok = true;
    for (const part of pathParts) {
      if (cur && typeof cur === "object" && part in cur) {
        cur = cur[part];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur;
  }
  return null;
}

function gameTeamKey(row) {
  const gameId = field(row, [["gameId"], ["identity", "gameId"]]);
  const team = field(row, [["team"], ["identity", "team"]]);
  return clean(gameId) && upper(team) ? `${clean(gameId)}:${upper(team)}` : null;
}

function filterExpansionRows(rows) {
  return rows.filter((row) => {
    const season = Number(field(row, [["season"], ["identity", "season"]]));
    return TARGET_SEASONS.has(season);
  });
}

function validateFrozenLegacySpec() {
  const rows = readJsonl(PATHS.legacyMatchedEffects);

  const methods = new Set();
  const modes = new Set();
  const calipers = new Set();
  const orientations = new Set();
  const semantics = new Set();

  for (const row of rows) {
    methods.add(row?.matching?.method);
    modes.add(row?.matching?.mode);
    calipers.add(row?.matching?.caliper);
    orientations.add(row?.effect?.orientation);
    semantics.add(row?.effect?.causalInterpretation);
  }

  return {
    rowCount: rows.length,
    methods: [...methods],
    modes: [...modes],
    calipers: [...calipers],
    orientations: [...orientations],
    semantics: [...semantics],
    exactFrozenSpec:
      rows.length === 131 &&
      methods.size === 1 &&
      methods.has("NEAREST_WITH_REPLACEMENT") &&
      modes.size === 1 &&
      modes.has("SAME_SEASON") &&
      calipers.size === 1 &&
      calipers.has(FROZEN_CALIPER) &&
      orientations.size === 1 &&
      orientations.has("TREATED_MINUS_MATCHED_CONTROL") &&
      semantics.size === 1 &&
      semantics.has("DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY"),
  };
}

function indexSourceObservations(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = gameTeamKey(row);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function normalizeShadowTarget(row, sourceByGameTeam) {
  const season = Number(row?.season);
  const week = Number(row?.week);
  const team = upper(row?.team);
  const opponent = upper(row?.opponent);
  const gameId = clean(row?.gameId ?? row?.game_id);

  if (!TARGET_SEASONS.has(season) || !Number.isFinite(week) || !team) {
    return { status: "SKIP", reason: "MISSING_CORE_IDENTITY" };
  }

  const sourceCandidates = gameId
    ? (sourceByGameTeam.get(`${gameId}:${team}`) ?? [])
    : [];

  const source = sourceCandidates.length === 1 ? sourceCandidates[0] : null;

  const unavailablePlayerId = clean(
    row?.unavailablePlayerId ??
    row?.playerId ??
    row?.unavailable_player_id
  );
  const replacementPlayerId = clean(
    row?.replacementPlayerId ??
    row?.expectedReplacementPlayerId ??
    row?.replacement_player_id
  );

  const position = upper(row?.position);

  const unavailableStatus = upper(
    row?.availabilityStatus ??
    row?.unavailableStatus ??
    row?.pregame?.unavailableStatus
  );

  const playerCaliber = num(
    row?.unavailablePlayerCaliber ??
    row?.playerCaliber ??
    row?.pregame?.playerCaliber
  );

  const replacementCaliber = num(
    row?.replacementPlayerCaliber ??
    row?.replacementCaliber ??
    row?.pregame?.replacementCaliber
  );

  const expectedReplacementDelta = num(
    row?.replacementCaliberDelta ??
    row?.expectedReplacementDelta ??
    row?.pregame?.expectedReplacementDelta
  );

  const outcome = source?.outcome ?? {};

  const teamPoints = num(
    outcome?.teamPoints ??
    source?.teamPoints ??
    source?.pointsFor
  );
  const opponentPoints = num(
    outcome?.opponentPoints ??
    source?.opponentPoints ??
    source?.pointsAgainst
  );

  const pointMargin = num(
    outcome?.pointMargin ??
    source?.pointMargin ??
    (teamPoints !== null && opponentPoints !== null ? teamPoints - opponentPoints : null)
  );

  const resolvedGameId = gameId ?? clean(source?.gameId);

  const missing = [];
  for (const [name, value] of Object.entries({
    gameId: resolvedGameId,
    unavailablePlayerId,
    replacementPlayerId,
    position,
    unavailableStatus,
    playerCaliber,
    replacementCaliber,
    expectedReplacementDelta,
    pointMargin,
  })) {
    if (value === null || value === undefined) missing.push(name);
  }

  if (missing.length) {
    return {
      status: "SKIP",
      reason: "INSUFFICIENT_CANONICAL_TARGET_INPUTS",
      missing,
    };
  }

  const status = clean(outcome?.status) ?? "FINAL";

  return {
    status: "READY",
    record: Object.freeze({
      contract: "NFLHistoricalAvailabilityImpactCalibrationObservation",
      contractVersion:
        "FIE-NFL-HISTORICAL-AVAILABILITY-IMPACT-CALIBRATION-OBSERVATION-1.0.0",
      identity: Object.freeze({
        season,
        week,
        gameId: resolvedGameId,
        team,
        opponent: opponent ?? upper(source?.opponent),
        position,
        unavailablePlayerId,
        replacementPlayerId,
      }),
      pregame: Object.freeze({
        unavailableStatus,
        playerCaliber,
        playerCaliberConfidence: num(
          row?.unavailablePlayerCaliberConfidence ??
          row?.playerCaliberConfidence ??
          row?.pregame?.playerCaliberConfidence
        ),
        replacementCaliber,
        replacementCaliberConfidence: num(
          row?.replacementPlayerCaliberConfidence ??
          row?.replacementCaliberConfidence ??
          row?.pregame?.replacementCaliberConfidence
        ),
        expectedReplacementDelta,
        replacementEvidenceType:
          clean(row?.replacementEvidenceType) ??
          clean(row?.pregame?.replacementEvidenceType) ??
          "ROLE_FIRST_FIVE_SEASON_SHADOW_CORPUS",
      }),
      outcome: Object.freeze({
        status,
        teamPoints,
        opponentPoints,
        pointMargin,
        won:
          typeof outcome?.won === "boolean"
            ? outcome.won
            : pointMargin > 0,
        tied:
          typeof outcome?.tied === "boolean"
            ? outcome.tied
            : pointMargin === 0,
      }),
      calibration: Object.freeze({
        observedImpact: null,
        fittingAuthorized: false,
      }),
      provenance: Object.freeze({
        sourceShadowCorpus:
          "five-season-shadow-replacement-corpus-v1.jsonl",
        sourceGameObservation:
          "five-season-observations.jsonl",
        adapter:
          "2D.2G-R2_CANONICAL_INPUT_PRESERVING_ADAPTER",
      }),
      safeguards: Object.freeze({
        rawPointMarginIsNotObservedPlayerImpact: true,
        gamePerformanceResidualIsNotObservedPlayerImpact: true,
        futureEvidenceUsed: false,
        syntheticCaliberUsed: false,
        currentRatingBackfillUsed: false,
        calibrationExecuted: false,
        learnedWeightsCreated: false,
        teamStrengthMutated: false,
        decisionModelMutated: false,
        pickemScoringMutated: false,
      }),
    }),
  };
}

function buildCalibrationObservations(sourceObservations, shadowRows) {
  const sourceByGameTeam = indexSourceObservations(sourceObservations);
  const records = [];
  const rejects = [];
  const keys = new Set();

  for (const row of shadowRows) {
    const result = normalizeShadowTarget(row, sourceByGameTeam);
    if (result.status !== "READY") {
      rejects.push({
        season: row?.season ?? null,
        week: row?.week ?? null,
        team: row?.team ?? null,
        unavailablePlayerId: row?.unavailablePlayerId ?? null,
        replacementPlayerId: row?.replacementPlayerId ?? null,
        reason: result.reason,
        missing: result.missing ?? [],
      });
      continue;
    }

    const record = result.record;
    const key = [
      record.identity.season,
      record.identity.week,
      record.identity.gameId,
      record.identity.team,
      record.identity.unavailablePlayerId,
      record.identity.replacementPlayerId,
    ].join(":");

    if (keys.has(key)) continue;
    keys.add(key);
    records.push(record);
  }

  return { records, rejects };
}

function constructExpansionResiduals(observations, decisionRecords, config) {
  const idx = indexDecisionRecords(decisionRecords);
  const records = [];
  const rejects = [];

  for (const observation of observations) {
    const joined = resolveDecisionRecord(observation, idx);

    if (joined.status !== "JOINED") {
      rejects.push({
        reason:
          joined.status === "MISSING"
            ? "MISSING_DECISION_RECORD"
            : "AMBIGUOUS_DECISION_RECORD",
        observation,
      });
      continue;
    }

    const result = constructBaselineResidual(
      observation,
      joined.record,
      config
    );

    if (result.status !== "AVAILABLE") {
      rejects.push({
        reason: result.reason,
        observation,
        decision: {
          gameId: joined.record.gameId,
          season: joined.record.season,
          week: joined.record.week,
        },
      });
      continue;
    }

    records.push(result.record);
  }

  return { records, rejects };
}

function frozenSelectorReport() {
  return Object.freeze({
    contractVersion:
      "FIE-NFL-2D2G-R2-FROZEN-MATCHING-SELECTOR-BINDING-1.0.0",
    sprint: "2D.2G-R2",
    decision: "SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN",
    candidate: Object.freeze({
      specification: Object.freeze({
        mode: "SAME_SEASON",
        method: "NEAREST_WITH_REPLACEMENT",
        caliperLabel: "p75",
        caliper: FROZEN_CALIPER,
      }),
    }),
    provenance: Object.freeze({
      recoveredFromLegacyMatchedEffectRows: 131,
      retuned: false,
    }),
  });
}

function frozenEstimandReport() {
  return Object.freeze({
    contractVersion:
      "FIE-NFL-2D2G-R2-FROZEN-ESTIMAND-BINDING-1.0.0",
    sprint: "2D.2G-R2",
    decision: "ESTIMAND_DEFINED_FOR_MATCHED_COHORT_CONSTRUCTION",
    estimand: Object.freeze({
      estimandId: "ATT:SUPPORTED_MATCHED_TREATED_TEAM_GAMES",
      estimandFamily: "ATT",
      effectScale: Object.freeze({
        orientation: "TREATED_MINUS_MATCHED_CONTROL",
      }),
      interpretationBoundary:
        "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
    }),
    provenance: Object.freeze({
      reconstructedOnlyFromFrozenLegacyContract: true,
      causalClaimCreated: false,
    }),
  });
}

function recordsFrom(result) {
  return result?.records ?? result?.pairs ?? [];
}

function bySeason(rows, getter) {
  const counts = {};
  for (const row of rows) {
    const season = getter(row);
    if (season == null) continue;
    counts[season] = (counts[season] ?? 0) + 1;
  }
  return counts;
}

async function main() {
  const frozenSpec = validateFrozenLegacySpec();

  if (!frozenSpec.exactFrozenSpec) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_FROZEN_LEGACY_SPEC_MISMATCH",
      frozenSpec,
    }, null, 2));
    process.exit(3);
  }

  const sourceObservations = filterExpansionRows(
    readJsonl(PATHS.sourceObservations)
  );
  const shadowRows = filterExpansionRows(
    readJsonl(PATHS.shadowCorpus)
  );

  if (!sourceObservations.length || !shadowRows.length) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_EXPANSION_SOURCE_INPUTS_MISSING",
      sourceObservationRows: sourceObservations.length,
      shadowRows: shadowRows.length,
    }, null, 2));
    process.exit(4);
  }

  const calibrationBuild =
    buildCalibrationObservations(sourceObservations, shadowRows);

  if (!calibrationBuild.records.length) {
    writeJsonl(
      OUTPUTS.baselineResidualRejects,
      calibrationBuild.rejects
    );
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_NO_CANONICAL_CALIBRATION_OBSERVATIONS_CONSTRUCTED",
      candidateRows: shadowRows.length,
      rejectedRows: calibrationBuild.rejects.length,
      sampleRejects: calibrationBuild.rejects.slice(0, 10),
    }, null, 2));
    process.exit(5);
  }

  writeJsonl(
    OUTPUTS.calibrationObservations,
    calibrationBuild.records
  );

  const loadedDecisions = await loadCanonicalDecisionDataset();
  if (loadedDecisions.error) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_CANONICAL_DECISION_DATASET_LOAD_ERROR",
      error: loadedDecisions.error,
    }, null, 2));
    process.exit(6);
  }

  let modelConfig = null;
  try {
    modelConfig = getNFLCanonicalGameDecisionModelConfig();
  } catch (error) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_CANONICAL_MODEL_CONFIG_UNAVAILABLE",
      error: error?.message ?? String(error),
    }, null, 2));
    process.exit(7);
  }

  const residualBuild = constructExpansionResiduals(
    calibrationBuild.records,
    loadedDecisions.records,
    modelConfig
  );

  writeJsonl(OUTPUTS.baselineResiduals, residualBuild.records);
  writeJsonl(
    OUTPUTS.baselineResidualRejects,
    [
      ...calibrationBuild.rejects.map((x) => ({
        stage: "CALIBRATION_OBSERVATION_ADAPTER",
        ...x,
      })),
      ...residualBuild.rejects.map((x) => ({
        stage: "BASELINE_RESIDUAL_CONSTRUCTION",
        ...x,
      })),
    ]
  );

  if (!residualBuild.records.length) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_NO_CANONICAL_2020_2021_BASELINE_RESIDUALS",
      calibrationObservationRows: calibrationBuild.records.length,
      residualRejects: residualBuild.rejects.length,
    }, null, 2));
    process.exit(8);
  }

  const cohortResult =
    buildHistoricalAvailabilityControlCohort({
      sourceObservations,
      treatedResidualRows: residualBuild.records,
      allowedSeasons: [2020, 2021],
    });

  const cohortRows = recordsFrom(cohortResult);
  const cohortReport = cohortResult?.report ?? null;

  writeJsonl(OUTPUTS.controlCohort, cohortRows);

  const treatedCount = cohortRows.filter(
    (row) => row?.classification === "TREATED"
  ).length;
  const controlCount = cohortRows.filter(
    (row) => row?.classification === "CONTROL_CANDIDATE"
  ).length;

  const unsafeControlCount = cohortRows.filter(
    (row) =>
      row?.classification === "CONTROL_CANDIDATE" &&
      row?.identity?.leakageSafe !== true
  ).length;

  const exposedControlCount = cohortRows.filter(
    (row) =>
      row?.classification === "CONTROL_CANDIDATE" &&
      (row?.availability?.qualifyingTreatmentEventCount ?? 0) > 0
  ).length;

  if (
    treatedCount <= 0 ||
    controlCount <= 0 ||
    unsafeControlCount > 0 ||
    exposedControlCount > 0
  ) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_2020_2021_CONTROL_COHORT_NOT_VALID_FOR_MATCHING",
      cohortCounts: {
        treatedCount,
        controlCount,
        unsafeControlCount,
        exposedControlCount,
      },
      note:
        "Legacy control-cohort report reconciliation counts 187/286 are not used as expansion targets.",
      cohortReport,
    }, null, 2));
    process.exit(9);
  }

  const matchedResult =
    buildHistoricalAvailabilityMatchedCohort({
      cohortRows,
      selectorReport: frozenSelectorReport(),
      estimandReport: frozenEstimandReport(),
    });

  const matchedRows = recordsFrom(matchedResult);
  const matchedReport = matchedResult?.report ?? null;

  writeJsonl(OUTPUTS.matchedCohort, matchedRows);

  if (!matchedRows.length) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_CANONICAL_MATCHER_PRODUCED_ZERO_PAIRS",
      matchedReport,
    }, null, 2));
    process.exit(10);
  }

  const outcomeResult =
    buildHistoricalAvailabilityMatchedOutcomeJoin({
      matchedPairs: matchedRows,
      treatedResidualRows: residualBuild.records,
    });

  const outcomeRows = recordsFrom(outcomeResult);
  const outcomeReport = outcomeResult?.report ?? null;

  writeJsonl(OUTPUTS.matchedOutcome, outcomeRows);

  if (!outcomeRows.length) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_CANONICAL_OUTCOME_JOIN_PRODUCED_ZERO_ROWS",
      outcomeReport,
    }, null, 2));
    process.exit(11);
  }

  const effectResult =
    buildHistoricalAvailabilityMatchedATTEffect({
      outcomeRows,
    });

  const effectRows = recordsFrom(effectResult);
  const effectReport = effectResult?.report ?? null;

  writeJsonl(OUTPUTS.matchedEffects, effectRows);

  if (!effectRows.length) {
    console.log(JSON.stringify({
      contractVersion:
        "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
      sprint: "2D.2G-R2",
      decision: "BLOCKED_CANONICAL_ATT_BUILDER_PRODUCED_ZERO_ROWS",
      effectReport,
    }, null, 2));
    process.exit(12);
  }

  const effectSeasons = bySeason(
    effectRows,
    (row) => Number(row?.treated?.season)
  );

  const finalReport = {
    contractVersion:
      "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-2D2G-R2-1.0.1",
    sprint: "2D.2G-R2",
    mode: "ISOLATED_CANONICAL_BUILDER_REUSE",
    decision: "CANONICAL_2020_2021_MATCHED_ATT_EFFECTS_CONSTRUCTED",
    frozenLegacySpec: frozenSpec,
    sourceInputs: {
      sourceObservationRows: sourceObservations.length,
      shadowRows: shadowRows.length,
      decisionRows: loadedDecisions.records.length,
      canonicalModelId: modelConfig?.modelId ?? null,
      canonicalModelVersion: modelConfig?.modelVersion ?? null,
    },
    construction: {
      calibrationObservationRows:
        calibrationBuild.records.length,
      calibrationObservationRejects:
        calibrationBuild.rejects.length,
      baselineResidualRows:
        residualBuild.records.length,
      baselineResidualRejects:
        residualBuild.rejects.length,
      controlCohortRows:
        cohortRows.length,
      treatedTeamGames:
        treatedCount,
      controlCandidateTeamGames:
        controlCount,
      matchedPairRows:
        matchedRows.length,
      matchedOutcomeRows:
        outcomeRows.length,
      matchedEffectRows:
        effectRows.length,
      matchedEffectRowsBySeason:
        effectSeasons,
    },
    outputs: OUTPUTS,
    canonicalReports: {
      controlCohort: cohortReport,
      matchedCohort: matchedReport,
      matchedOutcome: outcomeReport,
      matchedATT: effectReport,
    },
    safeguards: {
      lowerLevelCanonicalResidualFunctionsReused: true,
      canonicalControlCohortBuilderReused: true,
      canonicalMatchedCohortBuilderReused: true,
      canonicalMatchedOutcomeBuilderReused: true,
      canonicalMatchedATTBuilderReused: true,
      legacyResidualRunnerExecuted: false,
      legacyV1ArtifactsOverwritten: false,
      legacyMatchingThresholdRetuned: false,
      newMatchingCovariatesAdded: false,
      treatmentControlClassificationInferredOutsideCanonicalBuilder: false,
      rawPointMarginUsedAsObservedPlayerImpact: false,
      gameResidualUsedAsObservedPlayerImpact: false,
      causalClaimCreated: false,
      calibrationExecuted: false,
      learnedWeightsCreated: false,
      playerImpactTeamStrengthMode: "SHADOW_ONLY",
      playerImpactTeamStrengthAuthorized: false,
      numericDelta: null,
      adjustedTeamStrength: null,
      teamStrengthMutated: false,
      decisionModelMutated: false,
      pickemMutated: false,
    },
  };

  writeJson(OUTPUTS.report, finalReport);
  console.log(JSON.stringify(finalReport, null, 2));
}

main().catch((error) => {
  console.error(error?.stack ?? error);
  process.exit(1);
});
