export const SOURCE_AUTHORITY = Object.freeze({
  PRIMARY: "PRIMARY",
  SUPPLEMENTAL: "SUPPLEMENTAL",
  DERIVED: "DERIVED",
});

export const SOURCE_DOMAINS = Object.freeze({
  SCHEDULES_RESULTS: "SCHEDULES_RESULTS",
  PLAY_BY_PLAY: "PLAY_BY_PLAY",
  TEAM_STATS: "TEAM_STATS",
  WEEKLY_ROSTERS: "WEEKLY_ROSTERS",
  INJURIES: "INJURIES",
  DEPTH_CHARTS: "DEPTH_CHARTS",
  SNAP_COUNTS: "SNAP_COUNTS",
  PLAYER_IDENTITY: "PLAYER_IDENTITY",
  COACHING: "COACHING",
  SCHEME: "SCHEME",
});

const source = (input) => Object.freeze({
  id: input.id,
  provider: input.provider,
  domain: input.domain,
  authority: input.authority,
  transport: input.transport,
  minimumSeason: input.minimumSeason ?? null,
  coverage: input.coverage ?? "DISCOVER_AT_ACQUISITION",
  acquisitionStatus: input.acquisitionStatus ?? "REGISTERED_NOT_FETCHED",
  productionDatabase: false,
  notes: input.notes ?? null,
});

export const NFL_HISTORICAL_CALIBRATION_SOURCE_REGISTRY = Object.freeze([
  source({id:"NFLVERSE_SCHEDULES",provider:"nflverse",domain:SOURCE_DOMAINS.SCHEDULES_RESULTS,authority:SOURCE_AUTHORITY.PRIMARY,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",coverage:"DISCOVER_AT_ACQUISITION"}),
  source({id:"NFLVERSE_PBP",provider:"nflverse/nflfastR",domain:SOURCE_DOMAINS.PLAY_BY_PLAY,authority:SOURCE_AUTHORITY.PRIMARY,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",minimumSeason:1999}),
  source({id:"NFLVERSE_TEAM_STATS",provider:"nflverse/nflreadr",domain:SOURCE_DOMAINS.TEAM_STATS,authority:SOURCE_AUTHORITY.DERIVED,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",minimumSeason:1999}),
  source({id:"NFLVERSE_WEEKLY_ROSTERS",provider:"nflverse/nflreadr",domain:SOURCE_DOMAINS.WEEKLY_ROSTERS,authority:SOURCE_AUTHORITY.PRIMARY,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",minimumSeason:2002}),
  source({id:"NFLVERSE_INJURIES",provider:"nflverse/nflreadr",domain:SOURCE_DOMAINS.INJURIES,authority:SOURCE_AUTHORITY.SUPPLEMENTAL,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",coverage:"DISCOVER_AT_ACQUISITION"}),
  source({id:"NFLVERSE_DEPTH_CHARTS",provider:"nflverse/nflreadr",domain:SOURCE_DOMAINS.DEPTH_CHARTS,authority:SOURCE_AUTHORITY.SUPPLEMENTAL,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",coverage:"DISCOVER_AT_ACQUISITION"}),
  source({id:"NFLVERSE_SNAP_COUNTS",provider:"nflverse/nflreadr",domain:SOURCE_DOMAINS.SNAP_COUNTS,authority:SOURCE_AUTHORITY.SUPPLEMENTAL,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",coverage:"DISCOVER_AT_ACQUISITION"}),
  source({id:"NFLVERSE_PLAYER_IDS",provider:"nflverse/nflreadr",domain:SOURCE_DOMAINS.PLAYER_IDENTITY,authority:SOURCE_AUTHORITY.SUPPLEMENTAL,transport:"NFLVERSE_DATA_RELEASE_OR_NFLREADR",coverage:"DISCOVER_AT_ACQUISITION"}),
  source({id:"GOVERNED_COACHING_EVIDENCE",provider:"LBHT Sports Intelligence Acquisition",domain:SOURCE_DOMAINS.COACHING,authority:SOURCE_AUTHORITY.SUPPLEMENTAL,transport:"SPORTS_KNOWLEDGE_REPOSITORY",coverage:"DOMAIN_SPECIFIC"}),
  source({id:"GOVERNED_SCHEME_EVIDENCE",provider:"LBHT Sports Intelligence Acquisition",domain:SOURCE_DOMAINS.SCHEME,authority:SOURCE_AUTHORITY.SUPPLEMENTAL,transport:"SPORTS_KNOWLEDGE_REPOSITORY",coverage:"DOMAIN_SPECIFIC"}),
]);

export function getNFLHistoricalCalibrationSourceRegistry() {
  return NFL_HISTORICAL_CALIBRATION_SOURCE_REGISTRY;
}

export function findNFLHistoricalCalibrationSourcesByDomain(domain) {
  return NFL_HISTORICAL_CALIBRATION_SOURCE_REGISTRY.filter((item) => item.domain === domain);
}
