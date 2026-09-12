// INT-2B.2A — 2026 primary-source Team Identity enrichment, wave 1.
// Teams: ARI, ATL, BAL, BUF, CAR, CHI, CIN.
// Evidence only. No scoring, strength, prediction, or draft adjustment authority.

const VERIFIED_AT = "2026-09-06T00:00:00Z";

const obs = ({ domain, subject, value, classification = "FACT", tags = [], sourceId, sourceLabel, sourceUri, effectiveFrom = "2026-01-01", notes = null, confidence = 1 }) => Object.freeze({
  domain,
  subject,
  value,
  classification,
  tags: Object.freeze([...tags]),
  sourceId,
  sourceType: "OFFICIAL_CLUB",
  sourceLabel,
  sourceUri,
  observedAt: VERIFIED_AT,
  verifiedAt: VERIFIED_AT,
  effectiveFrom,
  effectiveTo: null,
  confidence,
  notes,
});

const record = (team, observations) => Object.freeze({
  team,
  season: 2026,
  asOf: "2026-09-06",
  observations: Object.freeze(observations),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_VERSION =
  "FIE-NFL-TEAM-IDENTITY-PRIMARY-SOURCE-ENRICHMENT-2026-W1-1.0.0";

export const nflTeamIdentityPrimarySourceEnrichment2026Wave1 = Object.freeze({
  ARI: record("ARI", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Mike LaFleur", offensiveCoordinator: "Nathaniel Hackett", defensiveCoordinator: "Nick Rallis", retainedDefensiveCoordinator: true, retainedCoachesFrom2025: 10 }),
      sourceId: "cardinals-2026-coaching-staff", sourceLabel: "Cardinals Announce Coaching Staff Under Mike LaFleur",
      sourceUri: "https://www.azcardinals.com/news/cardinals-announce-coaching-staff-under-mike-lafleur-2025",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"],
      notes: "Official club announcement says 10 coaches were retained from the previous staff and Nick Rallis remained defensive coordinator."
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "NEW_HEAD_COACH_AND_OFFENSIVE_COORDINATOR", defense: "DEFENSIVE_COORDINATOR_RETAINED" }),
      sourceId: "cardinals-2026-coordinators", sourceLabel: "Cardinals Retain Nick Rallis, Announce Nathaniel Hackett",
      sourceUri: "https://www.azcardinals.com/news/cardinals-retain-nick-rallis-as-defensive-coordinator-nathaniel-hackett",
      tags: ["2026_SYSTEM_CONTINUITY"],
    }),
  ]),

  ATL: record("ATL", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Kevin Stefanski", offensiveCoordinator: "Tommy Rees", defensiveCoordinator: "Jeff Ulbrich", defensiveCoordinatorRetainedFrom2025: true }),
      sourceId: "falcons-2026-coaching-staff", sourceLabel: "Atlanta Falcons finalize 2026 coaching staff",
      sourceUri: "https://www.atlantafalcons.com/news/atlanta-falcons-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Tommy Rees" }),
      sourceId: "falcons-rees-playcaller-2026", sourceLabel: "Kevin Stefanski 'very comfortable' with Tommy Rees calling plays",
      sourceUri: "https://www.atlantafalcons.com/news/tommy-rees-offensive-play-caller-kevin-stefanski",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "NEW_HEAD_COACH_AND_OFFENSIVE_COORDINATOR", defense: "DEFENSIVE_COORDINATOR_RETAINED" }),
      sourceId: "falcons-2026-coaching-staff", sourceLabel: "Atlanta Falcons finalize 2026 coaching staff",
      sourceUri: "https://www.atlantafalcons.com/news/atlanta-falcons-2026-coaching-staff",
      tags: ["2026_SYSTEM_CONTINUITY"]
    }),
  ]),

  BAL: record("BAL", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Jesse Minter", offensiveCoordinator: "Declan Doyle", defensiveCoordinator: "Anthony Weaver", runGameCoordinator: "Dwayne Ledford", passGameCoordinator: "Marcus Brady" }),
      sourceId: "ravens-2026-coaching-staff", sourceLabel: "Ravens Announce 2026 Coaching Staff",
      sourceUri: "https://www.baltimoreravens.com/news/ravens-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Declan Doyle", location: "COACHES_BOOTH" }),
      sourceId: "ravens-doyle-playcalling-2026", sourceLabel: "Declan Doyle Explains Why He Will Call Plays From the Booth This Season",
      sourceUri: "https://www.baltimoreravens.com/news/declan-doyle-will-call-plays-from-booth-anthony-weaver-jesse-minter-sharing-sideline-duties",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "OFFENSE", subject: "RUN_GAME_IDENTITY",
      value: Object.freeze({ featureBack: "Derrick Henry", expectedRole: "IMMENSE", expectedWorkload: "LARGE" }),
      classification: "OBSERVATION",
      sourceId: "ravens-doyle-henry-role-2026", sourceLabel: "Ravens Press Conference Transcript — Aug. 12, 2026",
      sourceUri: "https://www.baltimoreravens.com/news/transcript-press-conferences-8-12-26",
      tags: ["2026_RUN_GAME", "COACH_STATED"], confidence: 0.95,
      notes: "Doyle described Henry's role as immense and said he would have a pretty large workload; this does not infer the full run scheme."
    }),
  ]),

  BUF: record("BUF", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Joe Brady", offensiveCoordinator: "Pete Carmichael", defensiveCoordinator: "Jim Leonhard", runGameCoordinator: "Rob Boras", passGameSpecialist: "Mark Lubick" }),
      sourceId: "bills-2026-coaching-staff", sourceLabel: "Buffalo Bills announce 2026 assistant coaching staff additions",
      sourceUri: "https://www.buffalobills.com/news/buffalo-bills-announce-2026-assistant-coaching-staff-additions",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Joe Brady", fieldLocation: "SIDELINE" }),
      sourceId: "bills-brady-playcaller-2026", sourceLabel: "What we learned from Joe Brady's first day as Bills head coach",
      sourceUri: "https://www.buffalobills.com/news/what-we-learned-from-joe-brady-s-first-day-as-the-buffalo-bills-head-coach-josh-allen-interview",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "DEFENSE", subject: "DEFENSIVE_SYSTEM",
      value: Object.freeze({ baseAlignment: "3-4", changeFromPriorBase: "4-3" }),
      sourceId: "bills-leonhard-defense-2026", sourceLabel: "How the Bills can be 'an attacking defense' under Jim Leonhard",
      sourceUri: "https://www.buffalobills.com/news/how-the-bills-can-be-an-attacking-defense-under-new-defensive-coordinator-jim-leonhard",
      tags: ["2026_DEFENSIVE_SYSTEM"]
    }),
    obs({
      domain: "DEFENSE", subject: "PRESSURE_IDENTITY",
      value: Object.freeze({ style: "ATTACKING" }),
      classification: "OBSERVATION",
      sourceId: "bills-leonhard-defense-2026", sourceLabel: "How the Bills can be 'an attacking defense' under Jim Leonhard",
      sourceUri: "https://www.buffalobills.com/news/how-the-bills-can-be-an-attacking-defense-under-new-defensive-coordinator-jim-leonhard",
      tags: ["2026_DEFENSIVE_IDENTITY"], confidence: 0.95,
      notes: "Official club coverage describes Leonhard's intended defensive identity as attacking."
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ emphasis: "STRETCH_FIELD_MORE" }),
      classification: "OBSERVATION",
      sourceId: "bills-brady-playcaller-2026", sourceLabel: "What we learned from Joe Brady's first day as Bills head coach",
      sourceUri: "https://www.buffalobills.com/news/what-we-learned-from-joe-brady-s-first-day-as-the-buffalo-bills-head-coach-josh-allen-interview",
      tags: ["2026_PASS_GAME"], confidence: 0.9,
      notes: "Brady explicitly identified stretching the field as an offensive element that must improve in 2026."
    }),
  ]),

  CAR: record("CAR", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Dave Canales", offensiveCoordinator: "Brad Idzik", defensiveCoordinator: "Ejiro Evero", runGameCoordinator: "Harold Goodwin", offensivePassingGameCoordinator: "Mike Bercovici", defensivePassGameCoordinator: "Jonathan Cooley" }),
      sourceId: "panthers-2026-coaching-staff", sourceLabel: "Panthers announce 2026 coaching staff",
      sourceUri: "https://www.panthers.com/news/panthers-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Brad Idzik", previousCaller: "Dave Canales" }),
      sourceId: "panthers-idzik-playcaller-2026", sourceLabel: "Dave Canales: Brad Idzik to call plays in 2026",
      sourceUri: "https://www.panthers.com/news/dave-canales-offensive-coordinator-brad-idzik-to-call-plays-in-2026",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ emphasis: "RUN_PASS_BALANCE" }),
      classification: "OBSERVATION",
      sourceId: "panthers-idzik-bio-2026", sourceLabel: "Brad Idzik — Panthers coaching biography",
      sourceUri: "https://www.panthers.com/team/coaches-roster/brad-idzik",
      tags: ["2026_OFFENSIVE_IDENTITY"], confidence: 0.9,
      notes: "Official biography credits Idzik and Canales with creating balance across the passing and rushing attack; this is descriptive, not a scheme-family inference."
    }),
  ]),

  CHI: record("CHI", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Ben Johnson", offensiveCoordinator: "Press Taylor", defensiveCoordinator: "Dennis Allen", offensiveCoordinatorPromotedFromPassGameCoordinator: true }),
      sourceId: "bears-2026-coaching-staff", sourceLabel: "Chicago Bears announce coaching staff promotion and additions",
      sourceUri: "https://www.chicagobears.com/news/chicago-bears-announce-coaching-staff-promotion-and-additions",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "SECOND_SEASON_BEN_JOHNSON_SYSTEM", quarterbackConceptContinuity: true }),
      sourceId: "bears-williams-johnson-continuity-2026", sourceLabel: "Under Ben Johnson's guidance, Caleb Williams looks to raise game to next level",
      sourceUri: "https://www.chicagobears.com/news/under-ben-johnson-s-guidance-caleb-williams-looks-to-raise-game-to-next-level",
      tags: ["2026_SYSTEM_CONTINUITY"]
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ emphasis: Object.freeze(["PRIMARY_RECEIVER_ACCESS", "ROUTE_DETAIL", "EXTENDED_PLAY_EFFICIENCY"]) }),
      classification: "OBSERVATION",
      sourceId: "bears-offense-emphasis-2026", sourceLabel: "Bears coach Ben Johnson IDs areas of emphasis for 2026 season",
      sourceUri: "https://www.chicagobears.com/news/bears-coach-ben-johnson-ids-areas-of-emphasis-for-2026-season-offense-caleb-williams-receivers",
      tags: ["2026_PASS_GAME"], confidence: 0.95
    }),
  ]),

  CIN: record("CIN", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Zac Taylor", offensiveCoordinator: "Dan Pitcher", defensiveCoordinator: "Al Golden", runGameCoordinator: "James Casey", passGameCoordinator: "Justin Rascati" }),
      sourceId: "bengals-2026-coaching-staff", sourceLabel: "Bengals Finalize 2026 Coaching Staff",
      sourceUri: "https://www.bengals.com/news/bengals-finalize-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ headCoachTenureSeason: 8, offensiveCoordinatorTenureSeason: 3, offense: "CONTINUING_TAYLOR_PITCHER_SYSTEM" }),
      sourceId: "bengals-zac-taylor-2026", sourceLabel: "Zac Taylor — Bengals coaching biography",
      sourceUri: "https://www.bengals.com/team/coaches-roster/zac-taylor",
      tags: ["2026_SYSTEM_CONTINUITY"]
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ recentProfile: "HIGH_PASSING_PRODUCTION", netPassingYardsPerGameRank2025: 6 }),
      classification: "OBSERVATION",
      sourceId: "bengals-dan-pitcher-2026", sourceLabel: "Dan Pitcher — Bengals coaching biography",
      sourceUri: "https://www.bengals.com/team/coaches-roster/dan-pitcher",
      tags: ["2026_PASS_GAME", "HISTORICAL_CONTEXT"], confidence: 0.9,
      notes: "Uses 2025 output as context for the continuing 2026 staff; not a prediction or quality score."
    }),
  ]),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_TEAMS = Object.freeze(Object.keys(nflTeamIdentityPrimarySourceEnrichment2026Wave1));

export function getNFLTeamIdentityPrimarySourceEnrichment2026Wave1(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return nflTeamIdentityPrimarySourceEnrichment2026Wave1[key] || null;
}

export default nflTeamIdentityPrimarySourceEnrichment2026Wave1;
