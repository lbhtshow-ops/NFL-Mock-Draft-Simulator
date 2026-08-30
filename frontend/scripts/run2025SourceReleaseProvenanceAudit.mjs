#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const SPRINT = "2.18.23-RC15";
const SEASON = 2025;
const RELEASE_API = "https://api.github.com/repos/nflverse/nflverse-data/releases/tags/injuries";
const PRIMARY_ASSET = "injuries_2025.csv";
const FALLBACK_ASSET = "injuries_2025.csv.gz";
const executeProvenanceFetch = process.argv.includes("--execute-provenance-fetch");

const scheduleCandidates = [
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js",
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js",
  "data/calibration/historical/v1/observations.jsonl"
];

function requestJson(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("Too many redirects"));
    const req = https.get(url, {
      headers: {
        "User-Agent": "LBHT-FIE-Provenance-Audit/1.0",
        "Accept": "application/vnd.github+json"
      }
    }, res => {
      const status = res.statusCode ?? 0;
      if ([301,302,303,307,308].includes(status) && res.headers.location) {
        res.resume();
        resolve(requestJson(new URL(res.headers.location, url).toString(), redirects + 1));
        return;
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (!(status >= 200 && status < 300)) {
          reject(new Error(`HTTP ${status}: ${body.slice(0, 500)}`));
          return;
        }
        try {
          resolve({ status, headers: res.headers, json: JSON.parse(body), finalUrl: url });
        } catch (error) {
          reject(new Error(`Invalid JSON from provenance endpoint: ${error.message}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("Request timeout")));
  });
}

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fileText(rel) {
  const p = path.resolve(rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function findScheduleEvidence() {
  const results = [];
  for (const rel of scheduleCandidates) {
    const text = fileText(rel);
    if (!text) continue;
    const seasonHits = (text.match(/\b2025\b/g) || []).length;
    const temporalHits = (text.match(/kickoff|gameday|gameDate|game_date|date/gi) || []).length;
    const weekHits = (text.match(/\bweek\b/gi) || []).length;
    const teamHits = (text.match(/homeTeam|awayTeam|team/gi) || []).length;
    results.push({
      file: rel,
      exists: true,
      season2025Hits: seasonHits,
      temporalTokenHits: temporalHits,
      weekTokenHits: weekHits,
      teamTokenHits: teamHits,
      capableOfSupportingGameCutoffAudit:
        seasonHits > 0 && temporalHits > 0 && weekHits > 0 && teamHits > 0
    });
  }
  return results;
}

function summarizeRelease(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const out = {};
  for (const name of [PRIMARY_ASSET, FALLBACK_ASSET]) {
    const a = assets.find(x => x?.name === name) ?? null;
    out[name] = a ? {
      id: a.id ?? null,
      name: a.name ?? null,
      size: a.size ?? null,
      createdAt: a.created_at ?? null,
      updatedAt: a.updated_at ?? null,
      browserDownloadUrl: a.browser_download_url ?? null,
      digest: a.digest ?? null
    } : null;
  }
  return {
    id: release?.id ?? null,
    tagName: release?.tag_name ?? null,
    publishedAt: release?.published_at ?? null,
    createdAt: release?.created_at ?? null,
    updatedAt: release?.updated_at ?? null,
    assets: out
  };
}

function assessTemporalProvenance(summary) {
  const candidates = [];
  const published = parseDate(summary?.publishedAt);
  if (published) {
    candidates.push({
      type: "RELEASE_PUBLISHED_AT",
      timestamp: published.toISOString(),
      authoritativeForPerWeekSnapshot: false
    });
  }
  for (const [asset, meta] of Object.entries(summary?.assets ?? {})) {
    if (!meta) continue;
    const created = parseDate(meta.createdAt);
    const updated = parseDate(meta.updatedAt);
    if (created) candidates.push({
      type: "ASSET_CREATED_AT",
      asset,
      timestamp: created.toISOString(),
      authoritativeForPerWeekSnapshot: false
    });
    if (updated) candidates.push({
      type: "ASSET_UPDATED_AT",
      asset,
      timestamp: updated.toISOString(),
      authoritativeForPerWeekSnapshot: false
    });
  }
  return {
    candidateTimestamps: candidates,
    perWeekReleaseTimestampPresent: false,
    perTeamWeekReleaseTimestampPresent: false,
    wholeSeasonAssetMetadataOnly: candidates.length > 0,
    temporalQualificationSufficientForHistoricalPregameUse: false,
    reason: candidates.length
      ? "Whole-season release/asset timestamps do not prove when each team-week snapshot became available relative to kickoff."
      : "No authoritative release timestamp metadata was found."
  };
}

const scheduleEvidence = findScheduleEvidence();

const base = {
  contractVersion: "FIE-NFL-2025-SOURCE-RELEASE-PROVENANCE-AUDIT-1.0.0",
  sprint: SPRINT,
  mode: executeProvenanceFetch ? "EXECUTE_PROVENANCE_FETCH" : "DRY_RUN",
  scope: {
    season: SEASON,
    provider: "nflverse",
    dataset: "injuries",
    releaseApi: RELEASE_API,
    targetAssets: [PRIMARY_ASSET, FALLBACK_ASSET]
  },
  scheduleEvidence,
  authorizationBoundary: {
    provenanceNetworkFetchAuthorizedByExplicitFlag: executeProvenanceFetch,
    temporalQualificationAuthorized: false,
    rawAvailabilityAcquisitionAuthorized: false,
    normalizationAuthorized: false,
    treatmentConstructionAuthorized: false,
    treatmentControlRebuildAuthorized: false,
    matchingAuthorized: false,
    attEstimationAuthorized: false,
    uncertaintyEstimationAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
    databaseWriteAuthorized: false
  }
};

if (!executeProvenanceFetch) {
  console.log(JSON.stringify({
    ...base,
    decision: "DRY_RUN_PROVENANCE_FETCH_NOT_EXECUTED",
    safeguards: {
      externalNetworkInvoked: false,
      repositoryFilesMutated: false,
      sourceDataMutated: false,
      normalizationExecuted: false,
      matchingExecuted: false,
      attEstimated: false,
      calibrationExecuted: false,
      pickemScoringMutated: false,
      databaseMutated: false
    }
  }, null, 2));
  process.exit(0);
}

try {
  const response = await requestJson(RELEASE_API);
  const release = summarizeRelease(response.json);
  const temporalAssessment = assessTemporalProvenance(release);
  const assetPresent = Boolean(release.assets[PRIMARY_ASSET] || release.assets[FALLBACK_ASSET]);
  const scheduleCutoffCapabilityPresent = scheduleEvidence.some(x => x.capableOfSupportingGameCutoffAudit);

  let decision = "AUTHORITATIVE_2025_RELEASE_PROVENANCE_NOT_ESTABLISHED";
  if (assetPresent && temporalAssessment.wholeSeasonAssetMetadataOnly) {
    decision = "RELEASE_ASSET_PROVENANCE_FOUND_BUT_PER_GAME_TEMPORAL_PROOF_NOT_ESTABLISHED";
  }

  console.log(JSON.stringify({
    ...base,
    decision,
    provenance: {
      httpStatus: response.status,
      release,
      temporalAssessment,
      responseMetadata: {
        etag: response.headers?.etag ?? null,
        lastModified: response.headers?.["last-modified"] ?? null,
        githubRequestId: response.headers?.["x-github-request-id"] ?? null
      }
    },
    checks: {
      releaseApiHttpSuccess: response.status >= 200 && response.status < 300,
      releaseTagMatches: response.json?.tag_name === "injuries",
      canonical2025AssetPresent: assetPresent,
      scheduleCutoffCapabilityPresent,
      perWeekReleaseTimestampPresent: temporalAssessment.perWeekReleaseTimestampPresent,
      perTeamWeekReleaseTimestampPresent: temporalAssessment.perTeamWeekReleaseTimestampPresent,
      acquisitionTimeSubstitutionUsed: false,
      weekNumberOnlyUsedAsProof: false,
      temporalQualificationClaimed: false
    },
    interpretation: {
      wholeSeasonReleaseTimestampCanReplacePerRecordDateModified: false,
      assetUpdatedAtCanProveEveryWeekPregame: false,
      releasePublishedAtCanProveEveryWeekPregame: false,
      safe2025TemporalQualificationEstablished: false
    },
    readiness: {
      provenanceAuditComplete: true,
      alternateTemporalSourceAuditMayAdvance: true,
      temporalQualificationDesignMayAdvance: false,
      normalizationAuthorized: false,
      treatmentConstructionAuthorized: false,
      matchingAuthorized: false,
      attRecomputationAuthorized: false,
      uncertaintyRecomputationAuthorized: false,
      productionCalibrationAuthorized: false,
      pickemMutationAuthorized: false
    },
    nextStep: "AUDIT_ALTERNATE_CANONICAL_2025_PRE_GAME_TEMPORAL_SOURCE_OR_RESTRICT_2025_FROM_CAUSAL_COHORT",
    safeguards: {
      externalNetworkInvoked: true,
      sourceDataDownloaded: false,
      sourceDataMutated: false,
      repositoryFilesMutated: false,
      dateModifiedFabricated: false,
      acquisitionTimeSubstituted: false,
      weekNumberUsedAsProofOfPregameAvailability: false,
      normalizationExecuted: false,
      treatmentConstructionExecuted: false,
      matchingExecuted: false,
      attEstimated: false,
      uncertaintyEstimated: false,
      calibrationExecuted: false,
      teamStrengthMutated: false,
      decisionModelMutated: false,
      pickemScoringMutated: false,
      databaseMutated: false
    }
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ...base,
    decision: "PROVENANCE_AUDIT_REJECTED_FAIL_CLOSED",
    error: String(error?.message ?? error),
    safeguards: {
      sourceDataDownloaded: false,
      normalizationExecuted: false,
      matchingExecuted: false,
      attEstimated: false,
      calibrationExecuted: false,
      pickemScoringMutated: false,
      databaseMutated: false
    }
  }, null, 2));
  process.exitCode = 1;
}
