#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/calibration/historical/v1");
const EXPANSION = path.resolve(
  "data/calibration/historical/expansion-2020-2021/official-publications-2d2d",
);

const files = {
  legacyR3: `${ROOT}/official-team-pregame-publications-r3.jsonl`,
  expansionResolved:
    `${EXPANSION}/official-team-pregame-publications-2020-2021-resolved.jsonl`,
  expansionDiscoveryReport:
    `${EXPANSION}/official-team-pregame-publication-discovery-report.json`,
  expansionResolutionReport:
    `${EXPANSION}/official-team-pregame-publication-week-resolution-report.json`,
};

function exists(file) {
  return fs.existsSync(file);
}

function readJson(file) {
  return exists(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function readJsonl(file) {
  return exists(file)
    ? fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
}

const legacy = readJsonl(files.legacyR3);
const expansion = readJsonl(files.expansionResolved);
const discoveryReport = readJson(files.expansionDiscoveryReport);
const resolutionReport = readJson(files.expansionResolutionReport);

const missingInputs = Object.entries(files)
  .filter(([, file]) => !exists(file))
  .map(([key, file]) => ({ key, file }));

function strictEligible(row) {
  const resolvedWeek =
    Number.isInteger(row?.resolvedWeek)
      ? row.resolvedWeek
      : Number.isInteger(row?.week)
        ? row.week
        : null;

  const safe =
    row?.resolvedPregameSafe === true ||
    (
      row?.resolvedPregameSafe == null &&
      row?.pregameSafe === true &&
      resolvedWeek != null
    );

  return (
    row?.publicationType === "DEPTH_CHART_RELEASE" &&
    row?.officialTeamDomain === true &&
    resolvedWeek != null &&
    safe === true
  );
}

function normalize(row, source) {
  return {
    season: Number(row.season),
    team: row.team,
    resolvedWeek:
      Number.isInteger(row?.resolvedWeek) ? row.resolvedWeek : row.week,
    publicationType: row.publicationType,
    title: row.title ?? null,
    url: row.url ?? null,
    publishedAt: row.publishedAt ?? null,
    resolvedKickoffAt: row.resolvedKickoffAt ?? row.kickoffAt ?? null,
    resolvedPregameSafe:
      row?.resolvedPregameSafe === true || row?.pregameSafe === true,
    officialTeamDomain: row.officialTeamDomain === true,
    resolutionMethod: row.resolutionMethod ?? null,
    source,
  };
}

const strictRows = [
  ...legacy.filter(strictEligible).map((r) => normalize(r, "LEGACY_R3_2022_2024")),
  ...expansion.filter(strictEligible).map((r) => normalize(r, "EXPANSION_2020_2021")),
];

const uniqueEvidence = new Map();
for (const row of strictRows) {
  const key = `${row.season}|${row.team}|${row.resolvedWeek}|${row.url ?? row.title ?? ""}`;
  if (!uniqueEvidence.has(key)) uniqueEvidence.set(key, row);
}
const deduped = [...uniqueEvidence.values()];

const teamWeeks = new Map();
for (const row of deduped) {
  const key = `${row.season}|${row.team}|${row.resolvedWeek}`;
  if (!teamWeeks.has(key)) teamWeeks.set(key, []);
  teamWeeks.get(key).push(row);
}

function countBy(rows, field) {
  const result = {};
  for (const row of rows) {
    const key = String(row?.[field] ?? "UNKNOWN");
    result[key] = (result[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  );
}

const teamWeekRows = [...teamWeeks.entries()].map(([key, evidence]) => {
  const [season, team, week] = key.split("|");
  return {
    season: Number(season),
    team,
    week: Number(week),
    evidenceCount: evidence.length,
  };
});

const bySeasonTeamWeeks = countBy(teamWeekRows, "season");
const byTeamTeamWeeks = countBy(teamWeekRows, "team");
const seasons = [...new Set(teamWeekRows.map((r) => r.season))].sort();
const teams = [...new Set(teamWeekRows.map((r) => r.team))].sort();

const largestTeamEntry = Object.entries(byTeamTeamWeeks)
  .sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

const largestTeamShare =
  teamWeekRows.length ? largestTeamEntry[1] / teamWeekRows.length : 0;

const thresholds = {
  // Season target comes directly from the Pick'em/FIE five-season program.
  minimumSeasonBreadth: 5,
  // Team/pregame-safe thresholds reuse the canonical publication resolver's
  // established source-scalability standard rather than inventing a new one.
  minimumTeamBreadth: 16,
  minimumStrictTeamWeeks: 100,
  // Additional anti-concentration guard for calibration readiness.
  maximumSingleTeamShare: 0.35,
};

const checks = {
  inputsPresent: missingInputs.length === 0,
  fiveSeasonsRepresented: seasons.length >= thresholds.minimumSeasonBreadth,
  teamBreadthSatisfied: teams.length >= thresholds.minimumTeamBreadth,
  strictTeamWeekBreadthSatisfied:
    teamWeekRows.length >= thresholds.minimumStrictTeamWeeks,
  concentrationGuardSatisfied:
    largestTeamShare <= thresholds.maximumSingleTeamShare,
  expansionDiscoveryCompleted:
    Number(discoveryReport?.processedTeamSeasons) === 64,
  expansionHasNoDatasetMutation:
    discoveryReport?.datasetMutated === false &&
    resolutionReport?.datasetMutated === false,
  noReplacementMappingsGenerated:
    discoveryReport?.replacementMappingsGenerated === false &&
    resolutionReport?.replacementMappingsGenerated === false,
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

let decision;
if (missingInputs.length) {
  decision = "STRICT_REPLACEMENT_EVIDENCE_EXPANSION_INPUTS_MISSING";
} else if (failures.length === 0) {
  decision =
    "FIVE_SEASON_STRICT_REPLACEMENT_SOURCE_COVERAGE_READY_FOR_SHADOW_CORPUS_CONSTRUCTION";
} else {
  decision = "STRICT_REPLACEMENT_EVIDENCE_BREADTH_INSUFFICIENT";
}

const report = {
  contractVersion:
    "FIE-NFL-FIVE-SEASON-STRICT-REPLACEMENT-EVIDENCE-COVERAGE-AUDIT-2D2D-1.0.0",
  sprint: "2D.2D",
  mode: "READ_ONLY_COMBINED_STRICT_SOURCE_COVERAGE",
  decision,
  sourceEvidence: {
    legacyRows: legacy.length,
    expansionRows: expansion.length,
    strictPublicationRowsBeforeDedup: strictRows.length,
    strictPublicationRowsAfterDedup: deduped.length,
    strictUniqueTeamWeeks: teamWeekRows.length,
  },
  breadth: {
    seasons,
    seasonCount: seasons.length,
    teams,
    teamCount: teams.length,
    bySeasonTeamWeeks,
    byTeamTeamWeeks,
    largestTeam: largestTeamEntry[0],
    largestTeamTeamWeeks: largestTeamEntry[1],
    largestTeamShare,
  },
  expansionAcquisition: {
    candidatePublicationCount:
      discoveryReport?.candidatePublicationCount ?? null,
    pregameSafeCount:
      discoveryReport?.pregameSafeCount ?? null,
    requestFailureCount:
      discoveryReport?.requestFailureCount ?? null,
    resolvedCount:
      resolutionReport?.resolvedCount ?? null,
    pregameSafeResolvedCount:
      resolutionReport?.pregameSafeCount ?? null,
    teamsWithPregameSafeEvidence:
      resolutionReport?.teamsWithPregameSafeEvidence ?? null,
    seasonsWithPregameSafeEvidence:
      resolutionReport?.seasonsWithPregameSafeEvidence ?? null,
  },
  thresholds,
  checks,
  failures,
  missingInputs,
  nextAction: {
    strictShadowReplacementCorpusConstructionAuthorized:
      failures.length === 0,
    replacementCaliberFitAuthorized: false,
    productionPlayerImpactFitAuthorized: false,
    productionPromotionAuthorized: false,
  },
  pickemSprint2BImpact: {
    expectedReplacement:
      failures.length === 0
        ? "STRICT_SOURCE_COVERAGE_READY_FOR_SHADOW_REBUILD"
        : "BLOCKED_BY_STRICT_SOURCE_BREADTH",
    replacementCaliber:
      "NOT_YET_AUTHORIZED",
    availabilityImpact:
      "SOURCE_QUALIFIED",
    dependencyUsage:
      "SOURCE_QUALIFIED",
    productionPlayerImpactToTeamStrength:
      "SHADOW_ONLY",
  },
  safeguards: {
    genericWeekScopeAcceptedAsPregameProof: false,
    injuryTimestampAcceptedAsDepthPublicationTime: false,
    postgameSnapDefinedReplacement: false,
    canonicalReplacementArtifactMutated: false,
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

console.log(JSON.stringify(report, null, 2));

if (missingInputs.length) process.exitCode = 2;
