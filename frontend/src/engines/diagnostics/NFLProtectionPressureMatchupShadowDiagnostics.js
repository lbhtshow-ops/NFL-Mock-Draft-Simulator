import {
  generatedNFLHistoricalDecisionDataset as dataset,
} from "../../data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";

import {
  generatedNFLHistoricalPregameSnapshots as snapshots,
} from "../../data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js";

import {
  buildNFLProtectionPressureHistoricalEvidenceIndex,
} from "../teamIntelligence/performance/protectionPressure/NFLHistoricalProtectionPressureSnapshotAdapter.js";

import {
  integrateNFLProtectionPressureMatchupShadow,
  buildNFLProtectionPressureSackOnlyRaw,
} from "../matchupIntelligence/integration/NFLProtectionPressureMatchupShadowIntegration.js";

import {
  validateNFLProtectionPressureMatchupShadowResult,
} from "../matchupIntelligence/integration/NFLProtectionPressureMatchupShadowContract.js";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function percentile(sorted, p) {
  if (!sorted.length) return null;

  const position =
    (sorted.length - 1) * p;

  const lower =
    Math.floor(position);

  const upper =
    Math.ceil(position);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight =
    position - lower;

  return (
    sorted[lower] * (1 - weight) +
    sorted[upper] * weight
  );
}

function assert(name, condition, details = null) {
  if (!condition) {
    throw new Error(
      `${name}${details ? `: ${details}` : ""}`
    );
  }

  return {
    name,
    passed: true,
  };
}

const tests = [];

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Protection/Pressure Matchup Shadow Diagnostics",

      gate:
        "GI-V2-SPRINT-3-GATE-2B.6C",

      mode:
        "SHADOW_ONLY",
    },
    null,
    2
  )
);

assert(
  "historical-dataset-available",
  Array.isArray(dataset) &&
    dataset.length > 0
);

assert(
  "historical-snapshots-available",
  Array.isArray(snapshots) &&
    snapshots.length > 0
);

const evidenceRecords =
  buildNFLProtectionPressureHistoricalEvidenceIndex(
    snapshots
  );

assert(
  "historical-evidence-available",
  Array.isArray(evidenceRecords) &&
    evidenceRecords.length > 0
);

const evidenceLookup =
  new Map();

for (const evidence of evidenceRecords) {
  if (
    typeof evidence?.team === "string" &&
    finite(evidence?.season) &&
    finite(evidence?.throughWeek)
  ) {
    evidenceLookup.set(
      `${evidence.season}|${evidence.throughWeek}|${evidence.team}`,
      evidence
    );
  }
}

const rawCandidates = [];
const gameContext = new Map();

for (const snapshot of snapshots) {
  const game =
    snapshot?.game || snapshot;

  const season =
    game?.season;

  const week =
    game?.week;

  const homeTeam =
    game?.homeTeam;

  const awayTeam =
    game?.awayTeam;

  if (
    !finite(season) ||
    !finite(week) ||
    typeof homeTeam !== "string" ||
    typeof awayTeam !== "string"
  ) {
    continue;
  }

  const throughWeek =
    Math.max(0, week - 1);

  const homeEvidence =
    evidenceLookup.get(
      `${season}|${throughWeek}|${homeTeam}`
    );

  const awayEvidence =
    evidenceLookup.get(
      `${season}|${throughWeek}|${awayTeam}`
    );

  if (!homeEvidence || !awayEvidence) {
    continue;
  }

  const raw =
    buildNFLProtectionPressureSackOnlyRaw({
      homeEvidence,
      awayEvidence,
    });

  if (!finite(raw)) {
    continue;
  }

  rawCandidates.push(
    Math.abs(raw)
  );

  if (
    typeof game?.gameId === "string"
  ) {
    gameContext.set(
      game.gameId,
      {
        homeEvidence,
        awayEvidence,
      }
    );
  }
}

rawCandidates.sort(
  (a, b) => a - b
);

const p95AbsScale =
  percentile(
    rawCandidates,
    0.95
  );

assert(
  "p95-scale-is-finite-positive",
  finite(p95AbsScale) &&
    p95AbsScale > 0
);

const matched =
  dataset.filter(
    (record) =>
      typeof record?.game?.gameId === "string" &&
      gameContext.has(
        record.game.gameId
      )
  );

assert(
  "matched-historical-coverage-present",
  matched.length > 2000,
  `matched=${matched.length}`
);

const first =
  matched[0];

assert(
  "matched-record-present",
  Boolean(first)
);

const context =
  gameContext.get(
    first.game.gameId
  );

const canonicalMatchup = {
  matchupEdge:
    first?.pregame?.matchupEdge ?? null,

  dimensions:
    first?.pregame?.dimensions || {},

  context:
    first?.pregame?.context || {},

  evidenceQuality:
    first?.pregame?.evidenceQuality ?? null,
};

const canonicalClone =
  JSON.stringify(
    canonicalMatchup
  );

const result =
  integrateNFLProtectionPressureMatchupShadow({
    canonicalMatchup,
    homeEvidence:
      context.homeEvidence,
    awayEvidence:
      context.awayEvidence,
    p95AbsScale,
    advancedWeightMultiplier: 1,
  });

const validation =
  validateNFLProtectionPressureMatchupShadowResult(
    result
  );

tests.push(
  assert(
    "shadow-contract-valid",
    validation.valid,
    validation.errors.join(",")
  )
);

tests.push(
  assert(
    "mode-remains-shadow-only",
    result.mode === "SHADOW_ONLY"
  )
);

tests.push(
  assert(
    "candidate-is-sack-only",
    result.governance.candidate ===
      "sackOnly"
  )
);

tests.push(
  assert(
    "cap-is-40",
    result.governance.cap === 40
  )
);

tests.push(
  assert(
    "production-authority-false",
    result.governance
      .productionAuthorityGranted === false
  )
);

tests.push(
  assert(
    "canonical-object-not-mutated",
    JSON.stringify(
      canonicalMatchup
    ) === canonicalClone
  )
);

tests.push(
  assert(
    "shadow-dimension-finite",
    finite(
      result.shadow
        .protectionPressure
    )
  )
);

tests.push(
  assert(
    "shadow-matchup-edge-finite",
    finite(
      result.shadow.matchupEdge
    )
  )
);

const second =
  integrateNFLProtectionPressureMatchupShadow({
    canonicalMatchup,
    homeEvidence:
      context.homeEvidence,
    awayEvidence:
      context.awayEvidence,
    p95AbsScale,
    advancedWeightMultiplier: 1,
  });

tests.push(
  assert(
    "deterministic-output",
    JSON.stringify(result) ===
      JSON.stringify(second)
  )
);

const unavailable =
  integrateNFLProtectionPressureMatchupShadow({
    canonicalMatchup,
    homeEvidence: null,
    awayEvidence:
      context.awayEvidence,
    p95AbsScale,
    advancedWeightMultiplier: 1,
  });

tests.push(
  assert(
    "missing-evidence-safe-unavailable",
    unavailable.state ===
      "UNAVAILABLE" &&
      unavailable.shadow
        .protectionPressure === null &&
      unavailable.shadow
        .matchupEdge === null
  )
);

tests.push(
  assert(
    "canonical-evidence-quality-preserved",
    result.canonical
      .evidenceQuality ===
      canonicalMatchup
        .evidenceQuality
  )
);

tests.push(
  assert(
    "decision-api-remains-unauthorized",
    result.governance
      .decisionApiMutationAuthorized === false
  )
);

tests.push(
  assert(
    "pickem-remains-unauthorized",
    result.governance
      .pickemMutationAuthorized === false
  )
);

let available = 0;
let unavailableCount = 0;
let finiteDimension = 0;
let finiteEdge = 0;

for (const record of matched) {
  const context =
    gameContext.get(
      record.game.gameId
    );

  const canonicalMatchup = {
    matchupEdge:
      record?.pregame?.matchupEdge ?? null,

    dimensions:
      record?.pregame?.dimensions || {},

    context:
      record?.pregame?.context || {},

    evidenceQuality:
      record?.pregame?.evidenceQuality ?? null,
  };

  const shadow =
    integrateNFLProtectionPressureMatchupShadow({
      canonicalMatchup,
      homeEvidence:
        context?.homeEvidence ?? null,
      awayEvidence:
        context?.awayEvidence ?? null,
      p95AbsScale,
      advancedWeightMultiplier: 1,
    });

  if (
    shadow.state === "AVAILABLE"
  ) {
    available++;

    if (
      finite(
        shadow.shadow
          .protectionPressure
      )
    ) {
      finiteDimension++;
    }

    if (
      finite(
        shadow.shadow
          .matchupEdge
      )
    ) {
      finiteEdge++;
    }
  } else {
    unavailableCount++;
  }
}

tests.push(
  assert(
    "historical-shadow-coverage-complete-on-matched-set",
    available === matched.length &&
      finiteDimension === matched.length &&
      finiteEdge === matched.length,
    `available=${available}, matched=${matched.length}`
  )
);

const report = {
  suite:
    "NFL Protection/Pressure Matchup Shadow Diagnostics",

  gate:
    "GI-V2-SPRINT-3-GATE-2B.6C",

  contract:
    result.contract,

  version:
    result.version,

  candidate:
    result.governance.candidate,

  cap:
    result.governance.cap,

  p95AbsScale,

  matchedGames:
    matched.length,

  available,

  unavailable:
    unavailableCount,

  productionAuthorityGranted:
    result.governance
      .productionAuthorityGranted,

  canonicalMutationAuthorized:
    result.governance
      .canonicalMutationAuthorized,

  evidenceQualityMutationAuthorized:
    result.governance
      .evidenceQualityMutationAuthorized,

  decisionApiMutationAuthorized:
    result.governance
      .decisionApiMutationAuthorized,

  pickemMutationAuthorized:
    result.governance
      .pickemMutationAuthorized,

  tests,
  passed:
    tests.length,
  failed:
    0,
};

console.log(
  JSON.stringify(
    report,
    null,
    2
  )
);
