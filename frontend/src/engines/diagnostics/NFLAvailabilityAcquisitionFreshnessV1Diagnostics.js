import {
  createNFLAvailabilityAcquisitionPlan,
  createNFLAvailabilityAcquisitionManifest,
  assessNFLAvailabilityRuntime,
  isNFLAvailabilityAcquisitionManifest,
} from "../../data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.js";

import {
  adaptNFLVerseInjuryRows,
} from "../../data/footballIntelligence/nfl/availability/NFLVerseInjuryReportAdapter.js";

const tests = [];

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(message);
  }
}

async function check(
  name,
  fn
) {
  try {
    await fn();
    tests.push({
      name,
      passed: true,
    });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error:
        error.message,
    });
  }
}

const plan =
  createNFLAvailabilityAcquisitionPlan(
    2026
  );

await check(
  "canonical-nflverse-url-is-declared",
  async () => {
    assert(
      plan.candidates[0] ===
        "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2026.csv",
      "Unexpected canonical nflverse injuries URL."
    );
  }
);

const manifest =
  createNFLAvailabilityAcquisitionManifest({
    season: 2026,
    status: "READY",
    sourceUrl:
      plan.candidates[0],
    checkedAt:
      "2026-09-09T12:00:00.000Z",
    fetchedAt:
      "2026-09-09T12:00:00.000Z",
    recordCount:
      1,
    latestWeek:
      1,
    latestModifiedAt:
      "2026-09-09T10:00:00.000Z",
  });

await check(
  "manifest-contract-validates",
  async () => {
    assert(
      isNFLAvailabilityAcquisitionManifest(
        manifest
      ),
      "Manifest failed validation."
    );
  }
);

const rows = [
  {
    season: "2026",
    week: "1",
    game_type:
      "REG",
    team: "BAL",
    gsis_id:
      "00-0000001",
    full_name:
      "Example Quarterback",
    position:
      "QB",
    report_status:
      "Questionable",
    practice_status:
      "Limited",
    date_modified:
      "2026-09-09T10:00:00.000Z",
  },
];

const evidence =
  adaptNFLVerseInjuryRows(
    rows,
    {
      source:
        "nflverse-injury-reports",
      sourceUrl:
        plan.candidates[0],
    }
  );

await check(
  "adapter-preserves-provenance",
  async () => {
    assert(
      evidence[0]
        ?.provenance
        ?.source ===
        "nflverse-injury-reports",
      "Source provenance was not preserved."
    );

    assert(
      evidence[0]
        ?.provenance
        ?.sourceUrl ===
        plan.candidates[0],
      "Source URL was not preserved."
    );
  }
);

await check(
  "fresh-current-week-is-ready",
  async () => {
    const runtime =
      assessNFLAvailabilityRuntime({
        records:
          evidence,
        manifest,
        season:
          2026,
        week:
          1,
        now:
          "2026-09-10T00:00:00.000Z",
      });

    assert(
      runtime.state ===
        "READY",
      `Expected READY, received ${runtime.state}.`
    );

    assert(
      runtime.freshness ===
        "FRESH",
      `Expected FRESH, received ${runtime.freshness}.`
    );
  }
);

await check(
  "aging-evidence-is-explicit",
  async () => {
    const runtime =
      assessNFLAvailabilityRuntime({
        records:
          evidence,
        manifest,
        season:
          2026,
        week:
          1,
        now:
          "2026-09-11T22:00:00.000Z",
      });

    assert(
      runtime.freshness ===
        "AGING",
      `Expected AGING, received ${runtime.freshness}.`
    );
  }
);

await check(
  "stale-evidence-is-explicit",
  async () => {
    const runtime =
      assessNFLAvailabilityRuntime({
        records:
          evidence,
        manifest,
        season:
          2026,
        week:
          1,
        now:
          "2026-09-13T22:00:00.000Z",
      });

    assert(
      runtime.state ===
        "STALE",
      `Expected STALE, received ${runtime.state}.`
    );
  }
);

await check(
  "missing-week-does-not-fall-back-silently",
  async () => {
    const runtime =
      assessNFLAvailabilityRuntime({
        records:
          evidence,
        manifest,
        season:
          2026,
        week:
          2,
        now:
          "2026-09-10T00:00:00.000Z",
      });

    assert(
      runtime.state ===
        "MISSING_REQUESTED_WEEK",
      `Expected MISSING_REQUESTED_WEEK, received ${runtime.state}.`
    );
  }
);

await check(
  "no-records-remains-unavailable",
  async () => {
    const runtime =
      assessNFLAvailabilityRuntime({
        records:
          [],
        manifest:
          createNFLAvailabilityAcquisitionManifest({
            season:
              2026,
            status:
              "SOURCE_UNAVAILABLE",
            checkedAt:
              "2026-08-12T04:00:00.000Z",
          }),
        season:
          2026,
        week:
          1,
        now:
          "2026-08-12T05:00:00.000Z",
      });

    assert(
      runtime.state ===
        "UNAVAILABLE",
      `Expected UNAVAILABLE, received ${runtime.state}.`
    );
  }
);

const failed =
  tests.filter(
    (test) =>
      !test.passed
  );

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Availability Acquisition & Freshness Runtime V1 Diagnostics",
      passed:
        tests.length -
        failed.length,
      failed:
        failed.length,
      tests,
    },
    null,
    2
  )
);

if (failed.length) {
  process.exitCode = 1;
}
