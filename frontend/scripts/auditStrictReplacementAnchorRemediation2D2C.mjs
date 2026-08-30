#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/calibration/historical/v1");

const files = {
  replacementIdentities:
    `${ROOT}/expected-replacement-identities-v1.jsonl`,
  officialPublicationsR3:
    `${ROOT}/official-team-pregame-publications-r3.jsonl`,
  officialPublicationsR3Report:
    `${ROOT}/official-team-pregame-publication-r3-report.json`,
  temporalQualification:
    `${ROOT}/historical-pregame-temporal-anchor-qualification.json`,
};

const readJson = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;

const readJsonl = (file) =>
  fs.existsSync(file)
    ? fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];

const replacements = readJsonl(files.replacementIdentities);
const publications = readJsonl(files.officialPublicationsR3);
const publicationReport = readJson(files.officialPublicationsR3Report);
const qualification = readJson(files.temporalQualification);

const missingInputs = Object.entries(files)
  .filter(([, file]) => !fs.existsSync(file))
  .map(([key, file]) => ({ key, file }));

const strictDepthPublicationRows = publications.filter((row) =>
  row?.publicationType === "DEPTH_CHART_RELEASE" &&
  row?.resolvedPregameSafe === true &&
  Number.isInteger(row?.resolvedWeek) &&
  row?.officialTeamDomain === true
);

const strictDepthTeamWeeks = new Map();

for (const row of strictDepthPublicationRows) {
  const key = `${row.season}|${row.resolvedWeek}|${row.team}`;
  if (!strictDepthTeamWeeks.has(key)) strictDepthTeamWeeks.set(key, []);
  strictDepthTeamWeeks.get(key).push(row);
}

const strictRows = [];
const excludedRows = [];

for (const row of replacements) {
  const key = `${row.season}|${row.week}|${row.team}`;
  const anchors = strictDepthTeamWeeks.get(key) ?? [];

  if (anchors.length) {
    strictRows.push({
      ...row,
      legacyPregameOfficialAnchorQualified:
        row?.pregameOfficialAnchorQualified ?? null,
      strictPregameDepthPublicationQualified: true,
      strictAnchorEvidence: anchors.map((anchor) => ({
        publicationType: anchor.publicationType,
        title: anchor.title ?? null,
        url: anchor.url ?? null,
        publishedAt: anchor.publishedAt ?? null,
        resolvedWeek: anchor.resolvedWeek,
        resolvedKickoffAt: anchor.resolvedKickoffAt ?? null,
        resolvedPregameSafe: anchor.resolvedPregameSafe,
        resolutionMethod: anchor.resolutionMethod ?? null,
        officialTeamDomain: anchor.officialTeamDomain === true,
      })),
    });
  } else {
    excludedRows.push(row);
  }
}

const resolvedStrictRows = strictRows.filter((r) => r?.replacementPlayerId);
const unresolvedStrictRows = strictRows.filter((r) => !r?.replacementPlayerId);

function countBy(rows, field) {
  const out = {};
  for (const row of rows) {
    const key = String(row?.[field] ?? "UNKNOWN");
    out[key] = (out[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(out).sort(([a], [b]) => a.localeCompare(b))
  );
}

const strictTeamWeekCount = new Set(
  strictRows.map((r) => `${r.season}|${r.week}|${r.team}`)
).size;

const legacyResolved = replacements.filter((r) => r?.replacementPlayerId);

const checks = {
  inputsPresent: missingInputs.length === 0,
  canonicalQualificationStillBlocksGenericPregameReplacement:
    qualification?.qualifiedForPregameReplacementMapping === false,
  r3PublicationExpansionScalable:
    publicationReport?.qualifiedAsScalableAnchorCandidate === true,
  strictEvidenceRequiresOfficialTeamDomain:
    strictDepthPublicationRows.every((r) => r?.officialTeamDomain === true),
  strictEvidenceRequiresDepthChartRelease:
    strictDepthPublicationRows.every(
      (r) => r?.publicationType === "DEPTH_CHART_RELEASE"
    ),
  strictEvidenceRequiresResolvedPregameSafe:
    strictDepthPublicationRows.every((r) => r?.resolvedPregameSafe === true),
  noWeekScopeOnlyRowsPromoted:
    strictRows.every((r) => Array.isArray(r.strictAnchorEvidence) &&
      r.strictAnchorEvidence.length > 0),
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

let decision;

if (missingInputs.length) {
  decision = "STRICT_REPLACEMENT_REMEDIATION_INPUTS_MISSING";
} else if (failures.length) {
  decision = "STRICT_REPLACEMENT_REMEDIATION_GOVERNANCE_FAILED";
} else if (strictRows.length === 0) {
  decision = "NO_LEGACY_REPLACEMENT_ROWS_HAVE_STRICT_PREGAME_DEPTH_PUBLICATION_SUPPORT";
} else if (strictRows.length < replacements.length) {
  decision =
    "LEGACY_REPLACEMENT_CORPUS_PARTIALLY_SALVAGEABLE_STRICT_REBUILD_REQUIRED";
} else {
  decision =
    "LEGACY_REPLACEMENT_CORPUS_FULLY_SUPPORTED_BY_STRICT_PREGAME_DEPTH_PUBLICATIONS";
}

const report = {
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-STRICT-REPLACEMENT-ANCHOR-REMEDIATION-AUDIT-2D2C-1.0.0",
  sprint: "2D.2C",
  mode: "READ_ONLY_STRICT_CANDIDATE_REBUILD",
  decision,
  canonicalLineageRootCause: {
    resolverBehavior:
      "Legacy resolver promoted team-week availability anchor safety into pregameOfficialAnchorQualified=true while selecting replacement identity from an independently untimestamped weekly depth-chart record.",
    genericPregameReplacementQualification:
      qualification?.qualifiedForPregameReplacementMapping ?? null,
    genericDepthChartTemporalQualification:
      qualification?.qualifiedForPregameDepthChartTemporalEvidence ?? null,
    remediationRule:
      "A replacement row is strict-anchor eligible only when the same season/team/week has an official-team-domain DEPTH_CHART_RELEASE with resolvedPregameSafe=true.",
  },
  legacyCorpus: {
    rows: replacements.length,
    resolvedReplacementRows: legacyResolved.length,
    rowsClaimingPregameOfficialAnchorQualified:
      replacements.filter((r) => r?.pregameOfficialAnchorQualified === true).length,
    seasons: [...new Set(replacements.map((r) => r?.season))].sort(),
  },
  strictOfficialDepthPublicationEvidence: {
    sourceRows: publications.length,
    strictDepthPublicationRows: strictDepthPublicationRows.length,
    strictUniqueTeamWeeks: strictDepthTeamWeeks.size,
    teams: [...new Set(strictDepthPublicationRows.map((r) => r.team))].sort(),
    seasons: [...new Set(strictDepthPublicationRows.map((r) => r.season))].sort(),
  },
  strictCandidateCorpus: {
    eligibleRows: strictRows.length,
    eligibleResolvedReplacementRows: resolvedStrictRows.length,
    eligibleUnresolvedReplacementRows: unresolvedStrictRows.length,
    eligibleUniqueTeamWeeks: strictTeamWeekCount,
    excludedLegacyRows: excludedRows.length,
    rowCoverageRate:
      replacements.length ? strictRows.length / replacements.length : 0,
    resolvedReplacementCoverageRate:
      legacyResolved.length ? resolvedStrictRows.length / legacyResolved.length : 0,
    bySeason: countBy(strictRows, "season"),
    resolvedBySeason: countBy(resolvedStrictRows, "season"),
    byTeam: countBy(strictRows, "team"),
  },
  checks,
  failures,
  missingInputs,
  nextAction: {
    legacyCanonicalArtifactMutationAuthorized: false,
    strictShadowCandidateArtifactRecommended: true,
    extendSameRuleTo2020And2021OnlyAfterSourceCoverageAudit: true,
    doNotFitReplacementCaliberOnOverbroadLegacyClaim: true,
    doNotFitProductionPlayerImpactWeights: true,
  },
  pickemSprint2BImpact: {
    expectedReplacement:
      "STRICT_LINEAGE_REMEDIATION_IN_PROGRESS",
    replacementCaliber:
      "BLOCKED_UNTIL_STRICT_REPLACEMENT_IDENTITY_CORPUS_IS_ESTABLISHED",
    availabilityImpact:
      "SOURCE_QUALIFIED",
    dependencyUsage:
      "SOURCE_QUALIFIED",
    productionPlayerImpactToTeamStrength:
      "SHADOW_ONLY",
  },
  safeguards: {
    legacyReplacementArtifactMutated: false,
    officialPublicationArtifactMutated: false,
    genericWeekScopeAcceptedAsPregameProof: false,
    genericInjuryTimestampAcceptedAsDepthPublicationTime: false,
    postgameSnapDefinedReplacement: false,
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
