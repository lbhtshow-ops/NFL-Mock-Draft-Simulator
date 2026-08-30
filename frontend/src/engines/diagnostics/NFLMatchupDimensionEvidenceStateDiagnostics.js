import assert from "node:assert/strict";

import {
  NFL_MATCHUP_DIMENSION_EVIDENCE_STATES,
  isNFLMatchupDimensionEvidenceObserved,
  isNFLMatchupDimensionEvidenceUsable,
  doesNFLMatchupDimensionEvidenceCountTowardQuality,
} from "../matchupIntelligence/NFLMatchupDimensionEvidenceStateContract.js";

import {
  resolveNFLMatchupDimensionEvidenceState,
} from "../matchupIntelligence/NFLMatchupDimensionEvidenceResolver.js";

const tests = [];

function test(name, fn) {
  try {
    fn();
    tests.push({
      name,
      passed: true,
      error: null,
    });
  }
  catch (error) {
    tests.push({
      name,
      passed: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

test(
  "placeholder-zero-without-observed-evidence-is-unavailable",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "protectionPressure",
        score: 0,
        evidenceObserved: false,
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE
    );

    assert.equal(result.scoringAuthority, false);
    assert.equal(result.qualityAuthority, false);
  }
);

test(
  "observed-zero-is-neutral-and-authorized",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "protectionPressure",
        score: 0,
        evidenceObserved: true,
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_NEUTRAL
    );

    assert.equal(result.scoringAuthority, true);
    assert.equal(result.qualityAuthority, true);
  }
);

test(
  "positive-observation-is-directional",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "explosivePlay",
        score: 12.5,
        evidenceObserved: true,
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_DIRECTIONAL
    );
  }
);

test(
  "negative-observation-is-directional",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "redZone",
        score: -8.25,
        evidenceObserved: true,
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_DIRECTIONAL
    );
  }
);

test(
  "null-score-is-unavailable",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "redZone",
        score: null,
        evidenceObserved: true,
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE
    );
  }
);

test(
  "insufficient-sample-is-not-authorized",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "protectionPressure",
        score: 7,
        evidenceObserved: true,
        sampleSize: 2,
        minimumSampleSize: 4,
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.INSUFFICIENT_SAMPLE
    );

    assert.equal(result.scoringAuthority, false);
    assert.equal(result.qualityAuthority, false);
  }
);

test(
  "stale-observation-is-not-authorized",
  () => {
    const result =
      resolveNFLMatchupDimensionEvidenceState({
        dimension: "protectionPressure",
        score: -5,
        evidenceObserved: true,
        sampleSize: 8,
        minimumSampleSize: 4,
        freshness: "STALE",
      });

    assert.equal(
      result.state,
      NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.STALE
    );

    assert.equal(result.scoringAuthority, false);
    assert.equal(result.qualityAuthority, false);
  }
);

test(
  "observed-state-helpers-preserve-authority-boundary",
  () => {
    assert.equal(
      isNFLMatchupDimensionEvidenceObserved(
        NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_NEUTRAL
      ),
      true
    );

    assert.equal(
      isNFLMatchupDimensionEvidenceUsable(
        NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.OBSERVED_DIRECTIONAL
      ),
      true
    );

    assert.equal(
      doesNFLMatchupDimensionEvidenceCountTowardQuality(
        NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.UNAVAILABLE
      ),
      false
    );

    assert.equal(
      doesNFLMatchupDimensionEvidenceCountTowardQuality(
        NFL_MATCHUP_DIMENSION_EVIDENCE_STATES.STALE
      ),
      false
    );
  }
);

const passed =
  tests.filter(test => test.passed).length;

const failed =
  tests.length - passed;

const result = {
  suite:
    "NFL Matchup Dimension Evidence State Diagnostics",
  contract:
    "NFLMatchupDimensionEvidenceState",
  version:
    "GI-V2-EVIDENCE-STATE-1.0.0-RC1",
  shadowOnly: true,
  productionScoringChanged: false,
  evidenceQualityChanged: false,
  tests,
  passed,
  failed,
};

console.log(
  JSON.stringify(result, null, 2)
);

if (failed > 0) {
  process.exitCode = 1;
}
