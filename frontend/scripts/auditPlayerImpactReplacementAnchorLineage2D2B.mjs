#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/calibration/historical/v1");
const EXPANSION = path.resolve("data/calibration/historical/expansion-2020-2021");

const paths = {
  legacyReplacementIdentities:
    `${ROOT}/expected-replacement-identities-v1.jsonl`,
  legacyPregameAnchorQualification:
    `${ROOT}/historical-pregame-temporal-anchor-qualification.json`,
  legacyPregameAnchorAudit:
    `${ROOT}/historical-pregame-temporal-anchor-audit.json`,
  legacyDepthQualification:
    `${ROOT}/historical-depth-charts-qualification.json`,
  expansionDepthManifest:
    `${EXPANSION}/depth-charts/historical-depth-charts-manifest.json`,
  expansionAvailabilityQualification:
    `${ROOT}/audits/2d1c-availability-qualification-2020-2021.json`,
};

function exists(file) {
  return fs.existsSync(file);
}

function readJson(file) {
  return exists(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : null;
}

function readJsonl(file) {
  if (!exists(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const replacements = readJsonl(paths.legacyReplacementIdentities);
const anchorQualification = readJson(paths.legacyPregameAnchorQualification);
const anchorAudit = readJson(paths.legacyPregameAnchorAudit);
const depthQualification = readJson(paths.legacyDepthQualification);
const expansionDepth = readJson(paths.expansionDepthManifest);
const expansionAvailability = readJson(paths.expansionAvailabilityQualification);

const replacementSummary = {
  rows: replacements.length,
  rowsClaimingPregameAnchorQualified:
    replacements.filter((r) => r?.pregameOfficialAnchorQualified === true).length,
  rowsClaimingPregameAnchorFalse:
    replacements.filter((r) => r?.pregameOfficialAnchorQualified === false).length,
  rowsWithNullPregameAnchorClaim:
    replacements.filter((r) => r?.pregameOfficialAnchorQualified == null).length,
  resolvedRows:
    replacements.filter((r) => r?.replacementPlayerId).length,
  explicitDepthChartRows:
    replacements.filter((r) => r?.evidenceType === "EXPLICIT_DEPTH_CHART").length,
  postgameSnapDefinedRows:
    replacements.filter((r) => r?.postgameSnapDefinedReplacement === true).length,
  inferredFromRosterOrderRows:
    replacements.filter((r) => r?.inferredFromRosterOrder === true).length,
  seasons: [...new Set(
    replacements.map((r) => Number(r?.season)).filter(Number.isFinite)
  )].sort(),
};

const legacyQualification = {
  qualifiedForPregameDepthChartTemporalEvidence:
    anchorQualification?.qualifiedForPregameDepthChartTemporalEvidence ?? null,
  qualifiedForPregameReplacementMapping:
    anchorQualification?.qualifiedForPregameReplacementMapping ?? null,
  directDepthTimestampQualified:
    anchorQualification?.directDepthTimestampQualified ?? null,
  sourcePublicationMetadataQualified:
    anchorQualification?.sourcePublicationMetadataQualified ?? null,
  explicitStarterAnnouncementQualified:
    anchorQualification?.explicitStarterAnnouncementQualified ?? null,
  depthChartTimestampCoverageRate:
    anchorAudit?.depthChart?.timestampCoverageRate ??
    depthQualification?.timestampCoverageRate ??
    null,
  weekScopeAcceptedAsPregameProof:
    anchorQualification?.weekScopeAcceptedAsPregameProof ??
    anchorAudit?.weekScopeAcceptedAsTemporalProof ??
    null,
  injuryTimestampAcceptedAsDepthTimestamp:
    anchorQualification?.injuryTimestampAcceptedAsDepthTimestamp ??
    anchorAudit?.injuryTimestampReusedAsDepthTimestamp ??
    null,
};

const legacyClaimMismatch =
  replacementSummary.rowsClaimingPregameAnchorQualified > 0 &&
  legacyQualification.qualifiedForPregameReplacementMapping === false;

const expansionQualification = {
  depthChartTimestampCoverageRate:
    expansionDepth?.timestampCoverageRate ?? null,
  depthChartCanonicalIdentityCoverageRate:
    expansionDepth?.canonicalIdentityCoverageRate ?? null,
  depthChartCandidateForRoleEvidence:
    expansionDepth?.candidateForDepthRoleEvidence ?? null,
  pregameTemporalSafetyVerified:
    expansionDepth?.pregameTemporalSafetyVerified ?? null,
  availabilityQualifiedSeasons:
    expansionAvailability?.qualifiedSeasons ?? [],
  availabilityPregameQualified:
    Array.isArray(expansionAvailability?.results) &&
    expansionAvailability.results.length === 2 &&
    expansionAvailability.results.every(
      (r) => r?.qualifiedForJoin === true && r?.temporalQualified === true
    ),
};

const expansionDepthCannotProvePregameReplacement =
  expansionQualification.pregameTemporalSafetyVerified === false &&
  Number(expansionQualification.depthChartTimestampCoverageRate) === 0;

const checks = {
  legacyReplacementArtifactPresent: exists(paths.legacyReplacementIdentities),
  legacyReplacementRowsPresent: replacements.length > 0,
  legacyAnchorQualificationPresent:
    exists(paths.legacyPregameAnchorQualification),
  legacyDepthQualificationPresent:
    exists(paths.legacyDepthQualification),
  legacyQualificationExplicitlyBlocksPregameReplacement:
    legacyQualification.qualifiedForPregameReplacementMapping === false,
  legacyDepthTimestampCoverageZero:
    Number(legacyQualification.depthChartTimestampCoverageRate) === 0,
  legacyRowsClaimPregameAnchorQualified:
    replacementSummary.rowsClaimingPregameAnchorQualified > 0,
  legacyRowsDoNotUseRosterOrder:
    replacementSummary.inferredFromRosterOrderRows === 0,
  legacyRowsDoNotUsePostgameSnapAsReplacement:
    replacementSummary.postgameSnapDefinedRows === 0,
  expansionDepthManifestPresent: exists(paths.expansionDepthManifest),
  expansionAvailabilityQualificationPresent:
    exists(paths.expansionAvailabilityQualification),
  expansionAvailabilityPregameQualified:
    expansionQualification.availabilityPregameQualified === true,
  expansionDepthNotPregameQualified:
    expansionQualification.pregameTemporalSafetyVerified === false,
  expansionDepthTimestampCoverageZero:
    Number(expansionQualification.depthChartTimestampCoverageRate) === 0,
};

const missingInputs = Object.entries(paths)
  .filter(([, file]) => !exists(file))
  .map(([key, file]) => ({ key, file }));

let decision;

if (missingInputs.length) {
  decision = "REPLACEMENT_ANCHOR_LINEAGE_AUDIT_INPUTS_MISSING";
} else if (legacyClaimMismatch) {
  decision =
    "LEGACY_REPLACEMENT_ANCHOR_CLAIM_REQUIRES_LINEAGE_REMEDIATION_BEFORE_FIVE_SEASON_EXTENSION";
} else if (expansionDepthCannotProvePregameReplacement) {
  decision =
    "LEGACY_LINEAGE_ACCEPTABLE_BUT_2020_2021_REPLACEMENT_TEMPORAL_ANCHOR_NOT_YET_QUALIFIED";
} else {
  decision =
    "REPLACEMENT_ANCHOR_LINEAGE_QUALIFIED_FOR_FIVE_SEASON_EXTENSION_REVIEW";
}

const report = {
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-REPLACEMENT-ANCHOR-LINEAGE-AUDIT-2D2B-1.0.0",
  sprint: "2D.2B",
  mode: "READ_ONLY",
  decision,
  replacementSummary,
  legacyQualification,
  expansionQualification,
  lineageAssessment: {
    legacyClaimMismatch,
    explanation: legacyClaimMismatch
      ? "Legacy replacement rows assert pregameOfficialAnchorQualified=true while the canonical temporal qualification artifact explicitly has qualifiedForPregameReplacementMapping=false."
      : null,
    expansionAvailabilityTimestampMayStandInForDepthChartPublicationTime: false,
    weekScopedDepthChartMayStandInForPregamePublicationTime: false,
    priorOrTargetWeekPostgameSnapsMayDefineExpectedReplacement: false,
    fiveSeasonReplacementExtensionAuthorized: false,
  },
  checks,
  missingInputs,
  requiredRemediationIfMismatch: [
    "TRACE_EXACT_LEGACY_ARTIFACT_OR_SOURCE_THAT_SET_PREGAME_OFFICIAL_ANCHOR_QUALIFIED",
    "PROVE_THAT_SOURCE_WAS_AVAILABLE_BEFORE_TARGET_GAME_KICKOFF",
    "DO_NOT_REINTERPRET_INJURY_REPORT_TIMESTAMP_AS_DEPTH_CHART_PUBLICATION_TIMESTAMP",
    "DO_NOT_USE_WEEK_SCOPE_ALONE_AS_PREGAME_PROOF",
    "DO_NOT_USE_POSTGAME_SNAP_COUNTS_TO_DEFINE_EXPECTED_REPLACEMENT",
    "ONLY_AFTER_LINEAGE_IS_VALIDATED_APPLY_THE_SAME_RULE_TO_2020_2021",
  ],
  pickemSprint2BImpact: {
    expectedReplacement:
      legacyClaimMismatch
        ? "BLOCKED_PENDING_CANONICAL_LINEAGE_REMEDIATION"
        : "UNDER_REVIEW",
    replacementCaliber:
      legacyClaimMismatch
        ? "BLOCKED_BECAUSE_REPLACEMENT_IDENTITY_LINEAGE_IS_NOT_YET_DEFENSIBLE"
        : "UNDER_REVIEW",
    availabilityImpact:
      "PREGAME_AVAILABILITY_SOURCE_QUALIFIED_2020_2021",
    dependencyUsage:
      "POSTGAME_DEPENDENCY_SOURCE_QUALIFIED_2020_2021",
    productionPlayerImpactToTeamStrength:
      "SHADOW_ONLY",
  },
  safeguards: {
    replacementArtifactMutated: false,
    depthChartArtifactMutated: false,
    availabilityArtifactMutated: false,
    weekScopeAcceptedAsPregameProof: false,
    injuryTimestampReusedAsDepthTimestamp: false,
    postgameSnapDefinedReplacement: false,
    rosterOrderHeuristicUsed: false,
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
