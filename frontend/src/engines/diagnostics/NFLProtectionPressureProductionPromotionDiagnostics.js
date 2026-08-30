import {
  nflAdvancedMatchupEvidenceRecords,
} from "../../data/footballIntelligence/nfl/matchup/NFLAdvancedMatchupEvidenceRegistry.js";

import {
  buildNFLAdvancedMatchupDimensions,
} from "../matchupIntelligence/NFLAdvancedMatchupDimensionEngine.js";

import {
  buildNFLProtectionPressureProductionDimension,
  NFL_PROTECTION_PRESSURE_PRODUCTION_CANDIDATE,
  NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE,
  NFL_PROTECTION_PRESSURE_PRODUCTION_CAP,
  NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE,
} from "../matchupIntelligence/canonical/NFLProtectionPressureProductionMethodologyV1.js";

import {
  buildNFLProtectionPressureSackOnlyRaw,
  normalizeNFLProtectionPressureShadowDimension,
} from "../matchupIntelligence/integration/NFLProtectionPressureMatchupShadowIntegration.js";

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
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
        "NFL Protection/Pressure Production Promotion Diagnostics",
      gate:
        "GI-V2-SPRINT-4-GATE-4B",
      candidate:
        NFL_PROTECTION_PRESSURE_PRODUCTION_CANDIDATE,
      cap:
        NFL_PROTECTION_PRESSURE_PRODUCTION_CAP,
      p95AbsScale:
        NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE,
    },
    null,
    2
  )
);

tests.push(
  assert(
    "candidate-is-sackOnly",
    NFL_PROTECTION_PRESSURE_PRODUCTION_CANDIDATE ===
      "sackOnly"
  )
);

tests.push(
  assert(
    "cap-is-40",
    NFL_PROTECTION_PRESSURE_PRODUCTION_CAP === 40
  )
);

tests.push(
  assert(
    "governed-p95-scale-is-exact",
    NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE ===
      0.09468239032851022
  )
);

tests.push(
  assert(
    "production-authority-granted",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .productionAuthorityGranted === true
  )
);

tests.push(
  assert(
    "canonical-dimension-mutation-authorized",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .canonicalDimensionMutationAuthorized === true
  )
);

tests.push(
  assert(
    "weight-mutation-remains-unauthorized",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .weightMutationAuthorized === false
  )
);

tests.push(
  assert(
    "evidence-quality-mutation-remains-unauthorized",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .evidenceQualityMutationAuthorized === false
  )
);

tests.push(
  assert(
    "player-impact-mutation-remains-unauthorized",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .playerImpactMutationAuthorized === false
  )
);

tests.push(
  assert(
    "decision-api-schema-mutation-remains-unauthorized",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .decisionApiSchemaMutationAuthorized === false
  )
);

tests.push(
  assert(
    "pickem-mutation-remains-unauthorized",
    NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE
      .pickemMutationAuthorized === false
  )
);

tests.push(
  assert(
    "canonical-live-registry-has-32-teams",
    Array.isArray(nflAdvancedMatchupEvidenceRecords) &&
      nflAdvancedMatchupEvidenceRecords.length === 32
  )
);

let pairings = 0;
let productionFinite = 0;
let shadowFinite = 0;
let exactParity = 0;
let maxDelta = 0;

for (const home of nflAdvancedMatchupEvidenceRecords) {
  for (const away of nflAdvancedMatchupEvidenceRecords) {
    if (home.team === away.team) {
      continue;
    }

    pairings++;

    const raw =
      buildNFLProtectionPressureSackOnlyRaw({
        homeEvidence: home,
        awayEvidence: away,
      });

    const shadow =
      normalizeNFLProtectionPressureShadowDimension({
        rawValue: raw,
        p95AbsScale:
          NFL_PROTECTION_PRESSURE_PRODUCTION_P95_ABS_SCALE,
        cap:
          NFL_PROTECTION_PRESSURE_PRODUCTION_CAP,
      });

    const production =
      buildNFLProtectionPressureProductionDimension({
        homeEvidence: home,
        awayEvidence: away,
      });

    const engine =
      buildNFLAdvancedMatchupDimensions({
        homeEvidence: home,
        awayEvidence: away,
        weather: null,
      });

    if (finite(production)) productionFinite++;
    if (finite(shadow)) shadowFinite++;

    const delta =
      finite(production) && finite(shadow)
        ? Math.abs(production - shadow)
        : Infinity;

    if (delta === 0) {
      exactParity++;
    }

    if (finite(delta)) {
      maxDelta =
        Math.max(maxDelta, delta);
    }

    if (
      engine?.protectionPressure !==
      production
    ) {
      throw new Error(
        `production-engine-binding-mismatch: ${home.team}-${away.team}`
      );
    }
  }
}

tests.push(
  assert(
    "all-992-live-pairings-production-finite",
    pairings === 992 &&
      productionFinite === 992
  )
);

tests.push(
  assert(
    "all-992-live-pairings-shadow-finite",
    pairings === 992 &&
      shadowFinite === 992
  )
);

tests.push(
  assert(
    "production-exactly-reproduces-governed-shadow",
    exactParity === 992 &&
      maxDelta === 0,
    `exactParity=${exactParity}, maxDelta=${maxDelta}`
  )
);

const missingEvidence =
  buildNFLProtectionPressureProductionDimension({
    homeEvidence: null,
    awayEvidence:
      nflAdvancedMatchupEvidenceRecords[0],
  });

tests.push(
  assert(
    "missing-evidence-remains-unavailable",
    missingEvidence === null
  )
);

const sampleHome =
  nflAdvancedMatchupEvidenceRecords.find(
    (record) => record.team === "BAL"
  );

const sampleAway =
  nflAdvancedMatchupEvidenceRecords.find(
    (record) => record.team === "CIN"
  );

const sample =
  buildNFLAdvancedMatchupDimensions({
    homeEvidence: sampleHome,
    awayEvidence: sampleAway,
    weather: {
      windMph: 25,
      precipitation: true,
    },
  });

tests.push(
  assert(
    "non-protection-advanced-dimensions-remain-populated",
    finite(sample?.explosivePlay) &&
      finite(sample?.redZone) &&
      finite(sample?.weatherStyle)
  )
);

tests.push(
  assert(
    "tendencies-contract-remains-present",
    sample?.tendencies?.home ===
      sampleHome?.tendencies &&
      sample?.tendencies?.away ===
        sampleAway?.tendencies
  )
);

const failed = [];

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Protection/Pressure Production Promotion Diagnostics",
      gate:
        "GI-V2-SPRINT-4-GATE-4B",
      pairings,
      productionFinite,
      shadowFinite,
      exactParity,
      maxDelta,
      governance:
        NFL_PROTECTION_PRESSURE_PRODUCTION_GOVERNANCE,
      tests,
      passed:
        tests.length,
      failed:
        failed.length,
    },
    null,
    2
  )
);
