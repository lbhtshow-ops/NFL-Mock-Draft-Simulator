import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildHistoricalAvailabilityMatchedCohort } from "./buildHistoricalAvailabilityMatchedCohort.mjs";
import { buildHistoricalAvailabilityMatchedOutcomeJoin } from "./buildHistoricalAvailabilityMatchedOutcomeJoin.mjs";
import { buildHistoricalAvailabilityMatchedATTEffect } from "./buildHistoricalAvailabilityMatchedATTEffect.mjs";

const ROOT = process.cwd();
const OUT_ROOT = path.join(
  ROOT,
  "data",
  "calibration",
  "historical",
  "expansion-2020-2021",
  "player-impact",
  "matched-att"
);

fs.mkdirSync(OUT_ROOT, { recursive: true });

const TARGET_SEASONS = new Set([2020, 2021]);
const EXPECTED_CALIPER = 0.7117676224413696;

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJsonl(file, rows) {
  fs.writeFileSync(
    file,
    rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""),
    "utf8"
  );
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

function firstExisting(paths) {
  for (const p of paths) {
    const full = path.resolve(ROOT, p);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function discoverJsonByPredicate(baseDir, predicate) {
  const files = listFilesRecursive(path.resolve(ROOT, baseDir))
    .filter((f) => /\.(json|jsonl)$/i.test(f));

  const hits = [];
  for (const file of files) {
    try {
      if (file.endsWith(".jsonl")) {
        const rows = readJsonl(file);
        if (rows.length && predicate({ kind: "jsonl", rows, value: rows[0], file })) {
          hits.push({ file, kind: "jsonl", rows });
        }
      } else {
        const value = readJson(file);
        if (predicate({ kind: "json", value, file })) {
          hits.push({ file, kind: "json", value });
        }
      }
    } catch {
      // unreadable/non-contract JSON is irrelevant to discovery
    }
  }
  return hits;
}

function decisionDatasetCoveragePreflight() {
  const datasetPath = path.resolve(
    ROOT,
    "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js"
  );
  return import(pathToFileURL(datasetPath).href).then(({ default: rows = [] }) => {
    const bySeason = {};
    const bySeasonWithOutcome = {};
    for (const row of rows) {
      const season = row?.game?.season;
      if (season == null) continue;
      bySeason[season] = (bySeason[season] ?? 0) + 1;
      if (
        row?.outcome?.homeMargin !== null &&
        row?.outcome?.homeMargin !== undefined &&
        Number.isFinite(Number(row.outcome.homeMargin))
      ) {
        bySeasonWithOutcome[season] = (bySeasonWithOutcome[season] ?? 0) + 1;
      }
    }
    return {
      totalRows: rows.length,
      bySeason,
      bySeasonWithOutcome,
      expansion2020Present: (bySeason[2020] ?? 0) > 0,
      expansion2021Present: (bySeason[2021] ?? 0) > 0,
      expansion2020OutcomePresent: (bySeasonWithOutcome[2020] ?? 0) > 0,
      expansion2021OutcomePresent: (bySeasonWithOutcome[2021] ?? 0) > 0,
    };
  });
}

function frozenSelectorReport() {
  return Object.freeze({
    contractVersion: "FIE-NFL-2D2G-R2-FROZEN-MATCHING-SELECTOR-BINDING-1.0.0",
    sprint: "2D.2G-R2",
    decision: "SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN",
    candidate: Object.freeze({
      specification: Object.freeze({
        mode: "SAME_SEASON",
        method: "NEAREST_WITH_REPLACEMENT",
        caliperLabel: "p75",
        caliper: EXPECTED_CALIPER,
      }),
    }),
    provenance: Object.freeze({
      source:
        "historical-availability-matched-att-effects-v1.jsonl",
      recoveredFrom131LegacyMatchedEffects: true,
      retuned: false,
    }),
  });
}

function frozenEstimandReport() {
  return Object.freeze({
    contractVersion: "FIE-NFL-2D2G-R2-FROZEN-ESTIMAND-BINDING-1.0.0",
    sprint: "2D.2G-R2",
    decision: "ESTIMAND_DEFINED_FOR_MATCHED_COHORT_CONSTRUCTION",
    estimand: Object.freeze({
      estimandId: "ATT:SUPPORTED_MATCHED_TREATED_TEAM_GAMES",
      estimandFamily: "ATT",
      effectScale: Object.freeze({
        orientation: "TREATED_MINUS_MATCHED_CONTROL",
      }),
      interpretationBoundary: "DESCRIPTIVE_POINT_ESTIMATE_ONLY",
    }),
    provenance: Object.freeze({
      source:
        "historical-availability-matched-att-effects-v1.jsonl",
      reconstructedOnlyFromFrozenLegacyContract: true,
      causalClaimCreated: false,
    }),
  });
}

function normalizeObservationToCohortRow(row) {
  const identity = row?.identity ?? {};
  const availability = row?.availability ?? row?.pregame ?? {};
  const season = identity?.season ?? row?.season;
  if (!TARGET_SEASONS.has(Number(season))) return null;

  // This adapter intentionally accepts classification only when the source
  // artifact already provides one. It does not infer treatment/control status.
  const classification =
    row?.classification ??
    row?.cohortClassification ??
    availability?.classification ??
    null;

  if (!["TREATED", "CONTROL_CANDIDATE"].includes(classification)) return null;

  return Object.freeze({
    ...row,
    identity: Object.freeze({
      ...identity,
      season: Number(season),
    }),
    classification,
  });
}

function discoverExpansionCohortRows() {
  const hits = discoverJsonByPredicate(
    "data/calibration/historical",
    ({ kind, rows, value, file }) => {
      if (kind !== "jsonl") return false;
      const sample = rows.slice(0, 50);
      return sample.some((r) => {
        const ident = r?.identity ?? {};
        const season = Number(ident?.season ?? r?.season);
        const classification =
          r?.classification ??
          r?.cohortClassification ??
          r?.availability?.classification;
        return (
          TARGET_SEASONS.has(season) &&
          ["TREATED", "CONTROL_CANDIDATE"].includes(classification)
        );
      });
    }
  );

  const candidates = hits
    .map(({ file, rows }) => {
      const normalized = rows
        .map(normalizeObservationToCohortRow)
        .filter(Boolean);
      return {
        file,
        rows: normalized,
        treated: normalized.filter((r) => r.classification === "TREATED").length,
        controls: normalized.filter((r) => r.classification === "CONTROL_CANDIDATE").length,
      };
    })
    .filter((x) => x.treated > 0 && x.controls > 0)
    .sort((a, b) => b.rows.length - a.rows.length);

  return candidates;
}

function discoverTreatedResidualRows() {
  const hits = discoverJsonByPredicate(
    "data/calibration/historical",
    ({ kind, rows }) => {
      if (kind !== "jsonl") return false;
      return rows.slice(0, 100).some((r) => {
        const ident = r?.identity ?? {};
        const season = Number(ident?.season ?? r?.season);
        return (
          TARGET_SEASONS.has(season) &&
          Number.isFinite(Number(r?.residual?.gamePerformanceResidual))
        );
      });
    }
  );

  const candidates = hits
    .map(({ file, rows }) => {
      const filtered = rows.filter((r) => {
        const ident = r?.identity ?? {};
        const season = Number(ident?.season ?? r?.season);
        return (
          TARGET_SEASONS.has(season) &&
          Number.isFinite(Number(r?.residual?.gamePerformanceResidual))
        );
      });
      return { file, rows: filtered };
    })
    .filter((x) => x.rows.length > 0)
    .sort((a, b) => b.rows.length - a.rows.length);

  return candidates;
}

function validateLegacyFrozenSpec() {
  const legacy = readJsonl(
    path.resolve(
      ROOT,
      "data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl"
    )
  );

  const methods = new Set();
  const modes = new Set();
  const calipers = new Set();
  const orientations = new Set();
  const semantics = new Set();

  for (const row of legacy) {
    methods.add(row?.matching?.method);
    modes.add(row?.matching?.mode);
    calipers.add(row?.matching?.caliper);
    orientations.add(row?.effect?.orientation);
    semantics.add(row?.effect?.causalInterpretation);
  }

  return {
    rows: legacy.length,
    methods: [...methods],
    modes: [...modes],
    calipers: [...calipers],
    orientations: [...orientations],
    semantics: [...semantics],
    exactFrozenSpec:
      legacy.length === 131 &&
      methods.size === 1 &&
      methods.has("NEAREST_WITH_REPLACEMENT") &&
      modes.size === 1 &&
      modes.has("SAME_SEASON") &&
      calipers.size === 1 &&
      calipers.has(EXPECTED_CALIPER) &&
      orientations.size === 1 &&
      orientations.has("TREATED_MINUS_MATCHED_CONTROL") &&
      semantics.size === 1 &&
      semantics.has("DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY"),
  };
}

async function main() {
  const decisionCoverage = await decisionDatasetCoveragePreflight();
  const frozenSpec = validateLegacyFrozenSpec();

  const cohortCandidates = discoverExpansionCohortRows();
  const residualCandidates = discoverTreatedResidualRows();

  const preflight = {
    contractVersion:
      "FIE-NFL-CANONICAL-MATCHED-ATT-CONSTRUCTION-BINDING-PREFLIGHT-2D2G-R2-1.0.0",
    sprint: "2D.2G-R2",
    decisionDatasetCoverage: decisionCoverage,
    frozenLegacySpec: frozenSpec,
    cohortCandidates: cohortCandidates.map((x) => ({
      file: x.file,
      rows: x.rows.length,
      treated: x.treated,
      controls: x.controls,
    })),
    treatedResidualCandidates: residualCandidates.map((x) => ({
      file: x.file,
      rows: x.rows.length,
    })),
  };

  const preflightPath = path.join(OUT_ROOT, "construction-binding-preflight.json");
  fs.writeFileSync(preflightPath, JSON.stringify(preflight, null, 2) + "\n");

  if (
    !decisionCoverage.expansion2020Present ||
    !decisionCoverage.expansion2021Present ||
    !decisionCoverage.expansion2020OutcomePresent ||
    !decisionCoverage.expansion2021OutcomePresent
  ) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_CANONICAL_DECISION_DATASET_COVERAGE",
    }, null, 2));
    process.exit(3);
  }

  if (!frozenSpec.exactFrozenSpec) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_FROZEN_LEGACY_MATCHING_SPEC_MISMATCH",
    }, null, 2));
    process.exit(4);
  }

  if (!cohortCandidates.length) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_NO_CANONICAL_2020_2021_COHORT_ARTIFACT_WITH_TREATED_AND_CONTROL_CLASSIFICATION",
      nextRequiredInput:
        "Use the existing canonical availability cohort/selector builder to materialize 2020-2021 TREATED and CONTROL_CANDIDATE rows. Do not infer classifications here.",
    }, null, 2));
    process.exit(5);
  }

  if (!residualCandidates.length) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_NO_CANONICAL_2020_2021_TREATED_RESIDUAL_ARTIFACT",
      nextRequiredInput:
        "Use the existing historical residual builder to materialize 2020-2021 residual.gamePerformanceResidual rows. Do not substitute raw point margin.",
    }, null, 2));
    process.exit(6);
  }

  const cohortSource = cohortCandidates[0];
  const residualSource = residualCandidates[0];

  const selectorReport = frozenSelectorReport();
  const estimandReport = frozenEstimandReport();

  const cohortResult = buildHistoricalAvailabilityMatchedCohort({
    cohortRows: cohortSource.rows,
    selectorReport,
    estimandReport,
  });

  const matchedPairs = cohortResult?.records ?? cohortResult?.pairs ?? [];
  const cohortReport = cohortResult?.report ?? null;

  if (!matchedPairs.length) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_CANONICAL_MATCHER_PRODUCED_ZERO_2020_2021_PAIRS",
      cohortReport,
    }, null, 2));
    process.exit(7);
  }

  const outcomeResult = buildHistoricalAvailabilityMatchedOutcomeJoin({
    matchedPairs,
    treatedResidualRows: residualSource.rows,
  });

  const outcomeRows = outcomeResult?.records ?? [];
  const outcomeReport = outcomeResult?.report ?? null;

  if (!outcomeRows.length) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_CANONICAL_OUTCOME_JOIN_PRODUCED_ZERO_ROWS",
      cohortReport,
      outcomeReport,
    }, null, 2));
    process.exit(8);
  }

  const effectResult = buildHistoricalAvailabilityMatchedATTEffect({
    outcomeRows,
  });

  const effectRows = effectResult?.records ?? [];
  const effectReport = effectResult?.report ?? null;

  if (!effectRows.length) {
    console.log(JSON.stringify({
      ...preflight,
      decision: "BLOCKED_CANONICAL_ATT_BUILDER_PRODUCED_ZERO_EFFECTS",
      cohortReport,
      outcomeReport,
      effectReport,
    }, null, 2));
    process.exit(9);
  }

  const bySeason = {};
  for (const row of effectRows) {
    const season = row?.treated?.season;
    bySeason[season] = (bySeason[season] ?? 0) + 1;
  }

  const outputPath = path.join(
    OUT_ROOT,
    "historical-availability-matched-att-effects-2020-2021-v1.jsonl"
  );
  writeJsonl(outputPath, effectRows);

  const finalReport = {
    contractVersion:
      "FIE-NFL-CANONICAL-MATCHED-ATT-CONSTRUCTION-BINDING-2D2G-R2-1.0.0",
    sprint: "2D.2G-R2",
    mode: "CANONICAL_BUILDER_REUSE_ISOLATED_RESEARCH_WRITE",
    decision: "CANONICAL_2020_2021_MATCHED_ATT_EFFECTS_CONSTRUCTED",
    sources: {
      cohort: cohortSource.file,
      treatedResiduals: residualSource.file,
    },
    construction: {
      matchedPairRows: matchedPairs.length,
      outcomeRows: outcomeRows.length,
      effectRows: effectRows.length,
      effectRowsBySeason: bySeason,
      output: outputPath,
    },
    canonicalReports: {
      matchedCohort: cohortReport,
      outcomeJoin: outcomeReport,
      matchedATT: effectReport,
    },
    safeguards: {
      canonicalMatchedCohortBuilderReused: true,
      canonicalMatchedOutcomeBuilderReused: true,
      canonicalMatchedATTBuilderReused: true,
      approximateMatcherUsed: false,
      matchingThresholdRetuned: false,
      newCovariatesAdded: false,
      rawPointMarginUsedAsObservedPlayerImpact: false,
      causalClaimCreated: false,
      legacyMatchedEffectsMutated: false,
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

  fs.writeFileSync(
    path.join(OUT_ROOT, "canonical-matched-att-construction-report.json"),
    JSON.stringify(finalReport, null, 2) + "\n",
    "utf8"
  );

  console.log(JSON.stringify(finalReport, null, 2));
}

main().catch((error) => {
  console.error(error?.stack ?? error);
  process.exit(1);
});
