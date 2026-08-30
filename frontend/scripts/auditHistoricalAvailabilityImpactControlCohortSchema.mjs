import generatedNFLHistoricalDecisionDataset
  from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";

const rows = generatedNFLHistoricalDecisionDataset;

const sample = rows[0] ?? {};

function keys(value) {
  return value && typeof value === "object"
    ? Object.keys(value)
    : [];
}

const bySeason = {};

for (const row of rows) {
  const season =
    row?.season ??
    row?.identity?.season ??
    row?.game?.season ??
    null;

  if (season == null) continue;

  bySeason[season] = (bySeason[season] ?? 0) + 1;
}

console.log(JSON.stringify({
  mode: "READ_ONLY_CONTROL_COHORT_SCHEMA_AUDIT",

  totalCanonicalDecisionRecords: rows.length,

  topLevelKeys: keys(sample),

  pregameKeys: keys(
    sample?.pregame ??
    sample?.features
  ),

  outcomeKeys: keys(
    sample?.outcome ??
    sample?.result
  ),

  gameKeys: keys(sample?.game),

  sample,

  recordsBySeason: bySeason,

  governance: {
    controlCohortConstructed: false,
    causalTargetDefined: false,
    fittingAuthorized: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
    teamStrengthMutated: false,
    pickemScoringMutated: false
  }
}, null, 2));

