#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/calibration/historical/v1");
const EXP = path.resolve("data/calibration/historical/expansion-2020-2021");

const files = [
  `${ROOT}/observations-availability.jsonl`,
  `${ROOT}/official-team-pregame-publications-r3.jsonl`,
  `${ROOT}/historical-depth-charts.jsonl`,
  `${ROOT}/expected-replacement-identities-v1.jsonl`,
  `${EXP}/depth-charts/historical-depth-charts.jsonl`,
  `${EXP}/official-publications-2d2d/official-team-pregame-publications-2020-2021-resolved.jsonl`,
];

const readJsonl = (file) =>
  fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((x) => {
        try { return JSON.parse(x); } catch { return null; }
      }).filter(Boolean)
    : [];

const clean = (v) => v == null ? null : (String(v).trim() || null);
const num = (v) => Number.isFinite(Number(v)) ? Number(v) : null;

function season(r) {
  return num(r?.season ?? r?.identity?.season ?? r?.scope?.season);
}
function week(r) {
  return num(r?.resolvedWeek ?? r?.week ?? r?.identity?.week ?? r?.scope?.week);
}
function team(r) {
  return clean(r?.team ?? r?.teamCode ?? r?.identity?.team ?? r?.scope?.team);
}
function observedAt(r) {
  return clean(
    r?.observedAt ?? r?.publishedAt ?? r?.date_modified ?? r?.dateModified ??
    r?.effectiveDate ?? r?.effective_date ?? r?.timestamp ??
    r?.provenance?.observedAt ?? r?.provenance?.modifiedAt
  );
}
function pregameSafe(r) {
  return r?.resolvedPregameSafe === true || r?.pregameSafe === true ||
    (r?.temporalQualified === true && !!observedAt(r)) ||
    (r?.qualifiedForJoin === true && !!observedAt(r));
}
function classes(r) {
  const out = new Set();
  if (r?.publicationType === "DEPTH_CHART_RELEASE") out.add("OFFICIAL_DEPTH_CHART_PUBLICATION");
  if (r?.publicationType === "EXPLICIT_STARTER_ANNOUNCEMENT") out.add("EXPLICIT_STARTER_ANNOUNCEMENT");

  if (clean(r?.report_status ?? r?.reportStatus ?? r?.availability?.unavailableStatus) ||
      clean(r?.practice_status ?? r?.practiceStatus) || r?.availability) {
    out.add("OFFICIAL_AVAILABILITY_DESIGNATION");
  }

  if (clean(r?.roster_status ?? r?.rosterStatus ?? r?.statusAfter ?? r?.status_after)) {
    out.add("ROSTER_STATUS");
  }

  if (clean(r?.transactionType ?? r?.transaction_type ?? r?.transactionCode ??
      r?.transaction_code ?? r?.transactionId ?? r?.transaction_id)) {
    out.add("TRANSACTION");
  }

  if (r?.depth_team != null || r?.depthTeam != null || r?.depthRank != null || r?.depth_rank != null) {
    out.add("WEEKLY_DEPTH_ROLE");
  }

  if (r?.replacementPlayerId || r?.expectedReplacementPlayerId || r?.replacement_player_id) {
    out.add("LEGACY_EXPECTED_REPLACEMENT");
  }
  return [...out];
}

const evidence = [];
const fileReports = [];

for (const file of files) {
  const rows = readJsonl(file);
  let classified = 0;
  for (const row of rows) {
    const cs = classes(row);
    if (!cs.length) continue;
    classified += 1;
    for (const signalClass of cs) {
      evidence.push({
        signalClass,
        season: season(row),
        week: week(row),
        team: team(row),
        observedAt: observedAt(row),
        pregameSafe: pregameSafe(row),
        sourceFile: file,
      });
    }
  }
  fileReports.push({
    file,
    exists: fs.existsSync(file),
    rows: rows.length,
    classifiedRows: classified,
  });
}

const names = [
  "OFFICIAL_AVAILABILITY_DESIGNATION",
  "ROSTER_STATUS",
  "TRANSACTION",
  "OFFICIAL_DEPTH_CHART_PUBLICATION",
  "EXPLICIT_STARTER_ANNOUNCEMENT",
  "WEEKLY_DEPTH_ROLE",
  "LEGACY_EXPECTED_REPLACEMENT",
];

function summarize(name) {
  const rows = evidence.filter((r) => r.signalClass === name);
  const safe = rows.filter((r) => r.pregameSafe && r.observedAt);
  const seasons = [...new Set(safe.map((r) => r.season).filter(Number.isFinite))].sort();
  const teams = [...new Set(safe.map((r) => r.team).filter(Boolean))].sort();
  const teamWeeks = new Set(
    safe.filter((r) => Number.isFinite(r.season) && Number.isFinite(r.week) && r.team)
      .map((r) => `${r.season}|${r.week}|${r.team}`)
  );
  return {
    rowCount: rows.length,
    timestampedRows: rows.filter((r) => r.observedAt).length,
    pregameSafeTimestampedRows: safe.length,
    seasons,
    seasonCount: seasons.length,
    teams,
    teamCount: teams.length,
    teamWeekCount: teamWeeks.size,
  };
}

const summaries = Object.fromEntries(names.map((n) => [n, summarize(n)]));

const roleAnchorClasses = new Set([
  "OFFICIAL_DEPTH_CHART_PUBLICATION",
  "EXPLICIT_STARTER_ANNOUNCEMENT",
  "ROSTER_STATUS",
  "TRANSACTION",
]);

const roleRows = evidence.filter((r) =>
  roleAnchorClasses.has(r.signalClass) &&
  r.pregameSafe &&
  r.observedAt &&
  Number.isFinite(r.season) &&
  Number.isFinite(r.week) &&
  r.team
);

const diversifiedSeasons = [...new Set(roleRows.map((r) => r.season))].sort();
const diversifiedTeams = [...new Set(roleRows.map((r) => r.team))].sort();
const diversifiedTeamWeeks = new Set(roleRows.map((r) => `${r.season}|${r.week}|${r.team}`));

const decision =
  diversifiedSeasons.length >= 5 &&
  diversifiedTeams.length >= 16 &&
  diversifiedTeamWeeks.size >= 100
    ? "DIVERSIFIED_PREGAME_ROLE_EVIDENCE_BREADTH_READY_FOR_STRICT_REPLACEMENT_RESOLVER_DESIGN"
    : "DIVERSIFIED_PREGAME_ROLE_EVIDENCE_STILL_INSUFFICIENT_OR_REQUIRES_ADDITIONAL_HISTORICAL_SOURCE";

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-REPLACEMENT-ANCHOR-EVIDENCE-DIVERSIFICATION-AUDIT-2D2D-R2-1.0.0",
  sprint: "2D.2D-R2",
  mode: "READ_ONLY",
  decision,
  fileReports,
  signalSummaries: summaries,
  diversifiedRoleAnchorCoverage: {
    candidateRows: roleRows.length,
    seasons: diversifiedSeasons,
    seasonCount: diversifiedSeasons.length,
    teams: diversifiedTeams,
    teamCount: diversifiedTeams.length,
    uniqueTeamWeeks: diversifiedTeamWeeks.size,
  },
  semantics: {
    OFFICIAL_AVAILABILITY_DESIGNATION: "TREATMENT_ONLY_NOT_REPLACEMENT_IDENTITY",
    ROSTER_STATUS: "CONTEXT_ONLY_UNLESS_PAIRED_WITH_EXPLICIT_PREGAME_ROLE_EVIDENCE",
    TRANSACTION: "CONTEXT_ONLY_UNLESS_PAIRED_WITH_EXPLICIT_PREGAME_ROLE_EVIDENCE",
    OFFICIAL_DEPTH_CHART_PUBLICATION: "MAY_SUPPORT_ROLE_SUCCESSION_IF_TARGET_WEEK_AND_PREGAME_SAFE",
    EXPLICIT_STARTER_ANNOUNCEMENT: "MAY_SUPPORT_ROLE_SUCCESSION_IF_TARGET_GAME_ROLE_IS_EXPLICIT",
    WEEKLY_DEPTH_ROLE: "ROLE_CONTEXT_ONLY_WITHOUT_INDEPENDENT_PREGAME_TIMESTAMP",
  },
  safeguards: {
    postgameSnapUsedAsReplacementIdentity: false,
    availabilityDesignationUsedAsReplacementIdentity: false,
    rosterStatusAloneUsedAsReplacementIdentity: false,
    transactionAloneUsedAsReplacementIdentity: false,
    untimestampedDepthRoleUsedAsPregameProof: false,
    fuzzyMatchingUsed: false,
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
}, null, 2));
