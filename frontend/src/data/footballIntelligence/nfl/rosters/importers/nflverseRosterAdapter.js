export function mapNFLVerseRosterRow(row = {}) {
  return {
    id:
      row.player_id ||
      row.gsis_id ||
      `${row.team}-${row.player_name || row.full_name}-${row.position}`
        .toLowerCase()
        .replaceAll(" ", "-"),

    name: row.player_name || row.full_name || row.name || null,
    position: row.position || null,
    team: row.team || row.recent_team || null,

    age: row.age || null,
    experience: row.years_exp ?? row.experience ?? null,

    status: row.status || "Active",
    rosterPhase: row.rosterPhase || null,
    depthChartRole: row.depth_chart_position || null,
    depthChartRank: row.depth_chart_rank || null,
    starter:
  row.depth_chart_rank == null
    ? null
    : row.depth_chart_rank === 1,
    rosterRole: row.roster_role || null,

    playerTier: row.playerTier || "unknown",
    rosterValue: row.rosterValue || null,
    replacementDifficulty: row.replacementDifficulty || null,
    developmentTrajectory: row.developmentTrajectory || null,

    source: "nflverse",
    confidence: 0.75,
    lastUpdated: row.lastUpdated || null,

    notes: "Imported from nflverse-style roster row.",
  };
}

export function nflverseRosterAdapter(nflverseRows = []) {
  return nflverseRows.map(mapNFLVerseRosterRow);
}

export default nflverseRosterAdapter;