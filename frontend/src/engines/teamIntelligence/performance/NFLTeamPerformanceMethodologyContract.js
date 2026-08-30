export const NFL_TEAM_PERFORMANCE_METHODOLOGY_CONTRACT =
  "NFLTeamPerformanceMethodology";
export const NFL_TEAM_PERFORMANCE_METHODOLOGY_VERSION =
  "NFL-TEAM-PERFORMANCE-METHODOLOGY-1.0.0";

const DEFAULT_METHODOLOGY = Object.freeze({
  contract: NFL_TEAM_PERFORMANCE_METHODOLOGY_CONTRACT,
  version: NFL_TEAM_PERFORMANCE_METHODOLOGY_VERSION,
  snapshot: Object.freeze({
    granularity: "TEAM_SEASON_THROUGH_WEEK",
    throughWeekInclusive: true,
    regularSeasonOnlyByDefault: true,
    futureGamesExcluded: true,
  }),
  plays: Object.freeze({
    excludeNoPlay: true,
    excludeQbKneels: true,
    excludeQbSpikes: true,
    requireFiniteEpaForEpaMetrics: true,
    requireExplicitSuccessForSuccessRate: true,
  }),
  garbageTime: Object.freeze({
    policy: "NO_GARBAGE_TIME_FILTER_V1",
    status: "DECLARED_NOT_MODELED",
    note: "Sprint 2A does not invent a win-probability or score-margin garbage-time threshold.",
  }),
  recentForm: Object.freeze({
    windowGames: 4,
    weighting: "EQUAL_WEIGHT_V1",
    decay: "NOT_APPLIED_IN_SPRINT_2A",
  }),
  opponentAdjustment: Object.freeze({
    policy: "EXTERNAL_INPUT_ONLY_V1",
    status: "NOT_DERIVED_FROM_SINGLE_TEAM_PBP",
  }),
  driveEfficiency: Object.freeze({
    policy: "EXTERNAL_OR_GOVERNED_DRIVE_DATA_ONLY_V1",
    status: "NOT_DERIVED_FROM_UNVERIFIED_PBP_DRIVE_BOUNDARIES",
  }),
  scoring: Object.freeze({
    status: "UNAUTHORIZED",
    note: "Performance evidence may be computed; team-strength scoring remains a separate governed sprint.",
  }),
});

export function createNFLTeamPerformanceMethodology(overrides = {}) {
  return Object.freeze({
    ...DEFAULT_METHODOLOGY,
    ...overrides,
    snapshot: Object.freeze({ ...DEFAULT_METHODOLOGY.snapshot, ...(overrides.snapshot || {}) }),
    plays: Object.freeze({ ...DEFAULT_METHODOLOGY.plays, ...(overrides.plays || {}) }),
    garbageTime: Object.freeze({ ...DEFAULT_METHODOLOGY.garbageTime, ...(overrides.garbageTime || {}) }),
    recentForm: Object.freeze({ ...DEFAULT_METHODOLOGY.recentForm, ...(overrides.recentForm || {}) }),
    opponentAdjustment: Object.freeze({ ...DEFAULT_METHODOLOGY.opponentAdjustment, ...(overrides.opponentAdjustment || {}) }),
    driveEfficiency: Object.freeze({ ...DEFAULT_METHODOLOGY.driveEfficiency, ...(overrides.driveEfficiency || {}) }),
    scoring: Object.freeze({ ...DEFAULT_METHODOLOGY.scoring, ...(overrides.scoring || {}) }),
  });
}

export const defaultNFLTeamPerformanceMethodology =
  createNFLTeamPerformanceMethodology();

export default {
  NFL_TEAM_PERFORMANCE_METHODOLOGY_CONTRACT,
  NFL_TEAM_PERFORMANCE_METHODOLOGY_VERSION,
  createNFLTeamPerformanceMethodology,
  defaultNFLTeamPerformanceMethodology,
};
