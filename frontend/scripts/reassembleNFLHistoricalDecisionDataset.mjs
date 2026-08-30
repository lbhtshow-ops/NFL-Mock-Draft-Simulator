import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const schedulePath =
  path.resolve(
    "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLScheduleOutcomesSource.js"
  );

const snapshotsPath =
  path.resolve(
    "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js"
  );

const outputPath =
  path.resolve(
    "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js"
  );

const auditPath =
  path.resolve(
    "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDatasetAudit.json"
  );

const {
  buildNFLHistoricalDecisionDataset,
} = await import(
  "../src/engines/gameDecisionSupport/NFLHistoricalDecisionDatasetBuilder.js"
);

async function loadDefault(filePath) {
  const module =
    await import(
      `${pathToFileURL(filePath).href}?t=${Date.now()}`
    );

  return module.default || [];
}

const scheduleGames =
  await loadDefault(schedulePath);

const replaySnapshots =
  await loadDefault(snapshotsPath);

/*
 * IMPORTANT:
 * The replay snapshot contract stores game identity inside snapshot.game,
 * while the 5A Decision Dataset builder accepts a flat pregame snapshot shape.
 * Normalize here exactly as NFLHistoricalReplayDatasetAssembler does.
 */
const pregameSnapshots =
  replaySnapshots.map(
    (snapshot) => ({
      gameId:
        snapshot?.game?.gameId,
      season:
        snapshot?.game?.season,
      week:
        snapshot?.game?.week,
      awayTeam:
        snapshot?.game?.awayTeam,
      homeTeam:
        snapshot?.game?.homeTeam,
      snapshotThroughWeek:
        snapshot?.snapshotThroughWeek,
      matchupEdge:
        snapshot?.matchup?.matchupEdge,
      evidenceQuality:
        snapshot?.matchup?.evidenceQuality,
      dimensions:
        snapshot?.matchup?.dimensions,
      context:
        snapshot?.matchup?.context,
      sourceVersion:
        snapshot?.matchup?.sourceVersion,
    })
  );

const generatedAt =
  new Date().toISOString();

const result =
  buildNFLHistoricalDecisionDataset({
    scheduleGames,
    pregameSnapshots,
    generatedAt,
  });

fs.writeFileSync(
  outputPath,
  `export const generatedNFLHistoricalDecisionDataset = ${JSON.stringify(
    result.records,
    null,
    2
  )};\n\nexport default generatedNFLHistoricalDecisionDataset;\n`,
  "utf8"
);

const snapshotIds =
  new Set(
    replaySnapshots.map(
      (snapshot) =>
        snapshot?.game?.gameId
    )
  );

const recordIds =
  new Set(
    result.records.map(
      (record) =>
        record?.game?.gameId
    )
  );

const omittedSnapshotIds =
  [...snapshotIds].filter(
    (gameId) =>
      gameId &&
      !recordIds.has(gameId)
  );

const audit = {
  contract:
    "NFLHistoricalDecisionDatasetReconciliationAudit",
  version:
    "NFL-HISTORICAL-DECISION-DATASET-RECONCILIATION-1.0.1",

  generatedAt,

  counts: {
    scheduleGames:
      scheduleGames.length,
    pregameSnapshots:
      replaySnapshots.length,
    normalizedPregameSnapshots:
      pregameSnapshots.length,
    decisionRecords:
      result.records.length,
    assemblerExclusions:
      result.exclusions.length,
    unexplainedSnapshotOmissions:
      omittedSnapshotIds.length,
  },

  assemblerSummary:
    result.summary,

  omittedSnapshotIds,
};

fs.writeFileSync(
  auditPath,
  JSON.stringify(
    audit,
    null,
    2
  ),
  "utf8"
);

console.log(
  `Schedule games: ${scheduleGames.length}`
);
console.log(
  `Pregame snapshots: ${replaySnapshots.length}`
);
console.log(
  `Normalized pregame snapshots: ${pregameSnapshots.length}`
);
console.log(
  `Decision records: ${result.records.length}`
);
console.log(
  `Assembler exclusions: ${result.exclusions.length}`
);
console.log(
  `Unsupported game types: ${result.summary.unsupportedGameTypes}`
);
console.log(
  `Unexplained snapshot omissions: ${omittedSnapshotIds.length}`
);

if (
  replaySnapshots.length !==
  result.records.length
) {
  console.error(
    "RECONCILIATION FAILED: snapshot and decision-record counts differ."
  );
  process.exitCode = 1;
} else if (
  result.exclusions.length !== 0 ||
  omittedSnapshotIds.length !== 0
) {
  console.error(
    "RECONCILIATION FAILED: exclusions or omitted snapshots remain."
  );
  process.exitCode = 1;
} else {
  console.log(
    "RECONCILIATION PASS: every historical pregame snapshot is represented by one decision record."
  );
}
