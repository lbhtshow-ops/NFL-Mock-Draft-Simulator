import fs from "node:fs";
import path from "node:path";
import {
  buildNFLHistoricalSportradarGsisCrosswalk,
  resolveNFLHistoricalSportradarPlayerIdentity,
} from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ""; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).filter(r => r.some(v => v !== "")).map(values =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]))
  );
}

const seasons = [2022, 2023, 2024, 2025];
const base = path.resolve("data/calibration/historical/v1/raw");
const rows = [];
const seasonStats = {};

for (const season of seasons) {
  const file = path.join(base, `roster_weekly_${season}.csv`);
  if (!fs.existsSync(file)) {
    seasonStats[season] = { sourceAvailable: false };
    continue;
  }
  const parsed = parseCsv(fs.readFileSync(file, "utf8"));
  const usable = parsed.filter((r) => r.gsis_id && r.sportradar_id);
  rows.push(...usable);
  seasonStats[season] = {
    sourceAvailable: true,
    rowCount: parsed.length,
    crosswalkRowCount: usable.length,
    crosswalkCoverageRate: parsed.length ? usable.length / parsed.length : 0,
  };
}

const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk(rows);
const resolvedGsisToProvider = new Map();
for (const [providerId, gsisId] of Object.entries(crosswalk.resolved)) {
  if (!resolvedGsisToProvider.has(gsisId)) resolvedGsisToProvider.set(gsisId, []);
  resolvedGsisToProvider.get(gsisId).push(providerId);
}
const reverseMultiplicity = [...resolvedGsisToProvider.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([gsisId, ids]) => ({ gsisId, sportradarIds: ids.sort() }));

const sample = Object.entries(crosswalk.resolved).slice(0, 5).map(([providerPlayerId, gsisId]) => ({
  providerPlayerId,
  gsisId,
  resolution: resolveNFLHistoricalSportradarPlayerIdentity(providerPlayerId, crosswalk).status,
}));

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-HISTORICAL-SPORTRADAR-GSIS-CROSSWALK-AUDIT-1.0.0",
  mode: "READ_ONLY",
  seasons,
  seasonStats,
  sourceRowsWithBothIds: rows.length,
  uniqueSportradarIds: crosswalk.resolvedCount + crosswalk.conflictCount,
  exactResolvedSportradarIds: crosswalk.resolvedCount,
  providerToGsisConflictCount: crosswalk.conflictCount,
  reverseGsisToMultipleProviderIdCount: reverseMultiplicity.length,
  reverseMultiplicity: reverseMultiplicity.slice(0, 20),
  sample,
  checks: {
    exactProviderIdentityOnly: true,
    nameFallbackUsed: false,
    fuzzyMatchingUsed: false,
    teamPositionGuessUsed: false,
    repositoryFilesMutated: false,
    historicalNormalizationPerformed: false,
    treatmentConstructionPerformed: false,
    matchingPerformed: false,
    attRecomputed: false,
    calibrationPerformed: false,
    teamStrengthMutated: false,
    databaseMutated: false,
  },
  decision: crosswalk.conflictCount === 0 && crosswalk.resolvedCount > 0
    ? "EXACT_PROVIDER_TO_GSIS_CROSSWALK_AVAILABLE_FOR_GOVERNED_2025_NORMALIZATION"
    : "CROSSWALK_NOT_READY_FOR_NORMALIZATION",
}, null, 2));
