import {
  buildNFLHistoricalDecisionDataset,
} from "./NFLHistoricalDecisionDatasetBuilder.js";

export function assembleNFLHistoricalDecisionDataset({
  scheduleGames = [],
  replaySnapshots = [],
  generatedAt = null,
} = {}) {
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
          snapshot?.matchup
            ?.matchupEdge,
        evidenceQuality:
          snapshot?.matchup
            ?.evidenceQuality,
        dimensions:
          snapshot?.matchup
            ?.dimensions,
        context:
          snapshot?.matchup
            ?.context,
        sourceVersion:
          snapshot?.matchup
            ?.sourceVersion,
      })
    );

  return buildNFLHistoricalDecisionDataset({
    scheduleGames,
    pregameSnapshots,
    generatedAt,
  });
}

export default {
  assembleNFLHistoricalDecisionDataset,
};
