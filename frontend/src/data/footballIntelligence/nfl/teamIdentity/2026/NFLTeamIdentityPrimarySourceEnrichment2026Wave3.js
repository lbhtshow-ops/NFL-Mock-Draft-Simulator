// INT-2B.2C — 2026 primary-source Team Identity enrichment, wave 3.
// Teams: JAX, KC, LAC, LAR, LV, MIA.
// Evidence only. No scoring, strength, prediction, or draft adjustment authority.

const VERIFIED_AT = "2026-09-06T05:00:00Z";

const obs = ({ domain, subject, value, classification = "FACT", tags = [], sourceId, sourceLabel, sourceUri, effectiveFrom = "2026-01-01", notes = null, confidence = 1 }) => Object.freeze({
  domain, subject, value, classification,
  tags: Object.freeze([...tags]),
  sourceId, sourceType: "OFFICIAL_CLUB", sourceLabel, sourceUri,
  observedAt: VERIFIED_AT, verifiedAt: VERIFIED_AT,
  effectiveFrom, effectiveTo: null, confidence, notes,
});

const record = (team, observations) => Object.freeze({
  team, season: 2026, asOf: "2026-09-06", observations: Object.freeze(observations),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_VERSION =
  "FIE-NFL-TEAM-IDENTITY-PRIMARY-SOURCE-ENRICHMENT-2026-W3-1.0.0";

export const nflTeamIdentityPrimarySourceEnrichment2026Wave3 = Object.freeze({
  JAX: record("JAX", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Liam Coen", offensiveCoordinator: "Grant Udinski", defensiveCoordinator: "Anthony Campanile", associateHeadCoachSpecialTeamsCoordinator: "Heath Farwell", assistantHeadCoachPassGameCoordinator: "Shane Waldron", runGameCoordinator: "Brian Picucci" }),
      sourceId: "jaguars-front-office-2026", sourceLabel: "Jaguars Front Office Roster — Coaching",
      sourceUri: "https://www.jaguars.com/team/front-office-roster/",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ coordinatorRole: "ASSISTANT_HEAD_COACH_PASS_GAME_COORDINATOR", coordinator: "Shane Waldron" }),
      sourceId: "jaguars-front-office-2026", sourceLabel: "Jaguars Front Office Roster — Coaching",
      sourceUri: "https://www.jaguars.com/team/front-office-roster/",
      tags: ["2026_PASS_GAME_STRUCTURE"], confidence: 0.95,
      notes: "Official club staff structure identifies a dedicated assistant head coach/pass game coordinator role; no broader pass-game scheme is inferred."
    }),
    obs({
      domain: "OFFENSE", subject: "RUN_GAME_IDENTITY",
      value: Object.freeze({ coordinatorRole: "RUN_GAME_COORDINATOR", coordinator: "Brian Picucci" }),
      sourceId: "jaguars-front-office-2026", sourceLabel: "Jaguars Front Office Roster — Coaching",
      sourceUri: "https://www.jaguars.com/team/front-office-roster/",
      tags: ["2026_RUN_GAME_STRUCTURE"], confidence: 0.95,
      notes: "Official club staff structure confirms a dedicated run game coordinator; no run-scheme family is inferred."
    }),
  ]),

  KC: record("KC", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Andy Reid", offensiveCoordinator: "Eric Bieniemy", defensiveCoordinator: "Steve Spagnuolo", assistantHeadCoachSpecialTeamsCoordinator: "Dave Toub", passGameCoordinator: "Joe Bleymaier" }),
      sourceId: "chiefs-coaches-2026", sourceLabel: "Kansas City Chiefs Coaches Roster",
      sourceUri: "https://www.chiefs.com/team/coaches-roster/",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ headCoach: "RETURNING_LONG_TENURE", defensiveCoordinator: "RETURNING", offensiveCoordinator: "RETURNING_TO_ROLE_2026" }),
      classification: "OBSERVATION",
      sourceId: "chiefs-coaches-2026", sourceLabel: "Kansas City Chiefs Coaches Roster",
      sourceUri: "https://www.chiefs.com/team/coaches-roster/",
      tags: ["2026_SYSTEM_CONTINUITY"], confidence: 0.95,
      notes: "Official club roster confirms Reid and Spagnuolo continuity and Bieniemy as 2026 offensive coordinator. This is continuity context, not a scheme inference."
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ coordinatorRole: "PASS_GAME_COORDINATOR", coordinator: "Joe Bleymaier" }),
      sourceId: "chiefs-coaches-2026", sourceLabel: "Kansas City Chiefs Coaches Roster",
      sourceUri: "https://www.chiefs.com/team/coaches-roster/",
      tags: ["2026_PASS_GAME_STRUCTURE"], confidence: 0.95
    }),
  ]),

  LAC: record("LAC", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Jim Harbaugh", offensiveCoordinator: "Mike McDaniel", defensiveCoordinator: "Chris O'Leary", offensivePassingGameCoordinatorQuarterbacks: "Shane Day", defensivePassingGameCoordinatorDefensiveBacks: "Steve Clinkscale", defensiveRunGameCoordinatorDefensiveLine: "Mike Elston" }),
      sourceId: "chargers-2026-staff", sourceLabel: "Los Angeles Chargers Announce Coaching Fellows and Promotions",
      sourceUri: "https://www.chargers.com/news/coaching-fellows-and-promotions-announcement-2026",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ coordinatorRole: "OFFENSIVE_PASSING_GAME_COORDINATOR_QUARTERBACKS", coordinator: "Shane Day", passingGameSpecialist: "Adam Gase" }),
      sourceId: "chargers-2026-staff", sourceLabel: "Los Angeles Chargers Announce Coaching Fellows and Promotions",
      sourceUri: "https://www.chargers.com/news/coaching-fellows-and-promotions-announcement-2026",
      tags: ["2026_PASS_GAME_STRUCTURE"], confidence: 0.95
    }),
    obs({
      domain: "DEFENSE", subject: "DEFENSIVE_FRONT",
      value: Object.freeze({ runGameCoordinatorDefensiveLine: "Mike Elston", runGameSpecialist: "Mike Hiestand" }),
      sourceId: "chargers-2026-staff", sourceLabel: "Los Angeles Chargers Announce Coaching Fellows and Promotions",
      sourceUri: "https://www.chargers.com/news/coaching-fellows-and-promotions-announcement-2026",
      tags: ["2026_DEFENSIVE_RUN_GAME_STRUCTURE"], confidence: 0.95,
      notes: "Official staff roles identify defensive run-game responsibility; no base-front family is inferred."
    }),
  ]),

  LAR: record("LAR", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Sean McVay", assistantHeadCoach: "Kliff Kingsbury", offensiveCoordinator: "Nate Scheelhaase", defensiveCoordinator: "Chris Shula" }),
      sourceId: "rams-2026-coaching-staff", sourceLabel: "Rams' 2026 coaching staff set",
      sourceUri: "https://www.therams.com/news/rams-2026-coaching-staff-set",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ headCoach: "RETURNING_TENTH_SEASON", staffProfile: "MIX_OF_RETURNEES_PROMOTIONS_AND_NEW_HIRES", returnees: 16, newHires: 8 }),
      classification: "OBSERVATION",
      sourceId: "rams-2026-coaching-staff", sourceLabel: "Rams' 2026 coaching staff set",
      sourceUri: "https://www.therams.com/news/rams-2026-coaching-staff-set",
      tags: ["2026_SYSTEM_CONTINUITY"], confidence: 0.95
    }),
    obs({
      domain: "TEAM_BUILDING", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ mix: "CONTINUITY_PLUS_NEW_IDEAS", assistantHeadCoachAddition: "Kliff Kingsbury" }),
      classification: "OBSERVATION",
      sourceId: "rams-2026-coaching-staff", sourceLabel: "Rams' 2026 coaching staff set",
      sourceUri: "https://www.therams.com/news/rams-2026-coaching-staff-set",
      tags: ["2026_STAFF_DESIGN"], confidence: 0.9
    }),
  ]),

  LV: record("LV", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Klint Kubiak", offensiveCoordinator: "Andrew Janocko", defensiveCoordinator: "Rob Leonard", offensivePassGameCoordinator: "Nick Holz", offensiveRunGameCoordinator: "Mario Jeberaeel", defensivePassGameCoordinatorDefensiveBacks: "Joe Woods" }),
      sourceId: "raiders-2026-coaching-staff", sourceLabel: "Raiders announce 2026 coaching staff",
      sourceUri: "https://www.raiders.com/news/raiders-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "OFFENSE", subject: "FORMATION_PERSONNEL_IDENTITY",
      value: Object.freeze({ passGameCoordinator: "Nick Holz", runGameCoordinator: "Mario Jeberaeel", structure: "DEDICATED_PASS_AND_RUN_GAME_COORDINATION" }),
      classification: "OBSERVATION",
      sourceId: "raiders-2026-coaching-staff", sourceLabel: "Raiders announce 2026 coaching staff",
      sourceUri: "https://www.raiders.com/news/raiders-announce-2026-coaching-staff",
      tags: ["2026_OFFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "This captures staff responsibility structure only; it does not infer formations or personnel rates."
    }),
    obs({
      domain: "DEFENSE", subject: "RUN_GAME_IDENTITY",
      value: Object.freeze({ defensiveCoordinator: "Rob Leonard", priorRole2025: "RUN_GAME_COORDINATOR_DEFENSIVE_LINE", priorRushYardsPerCarryAllowed: 3.9 }),
      classification: "HISTORICAL_PRIOR",
      sourceId: "raiders-leonard-bio-2026", sourceLabel: "Rob Leonard — Raiders coaching biography",
      sourceUri: "https://www.raiders.com/team/coaches-roster/rob-leonard",
      tags: ["2025_DEFENSIVE_RUN_GAME_CONTEXT", "2026_DEFENSIVE_COORDINATOR"], confidence: 0.9,
      notes: "2025 production is historical context for the 2026 coordinator, not a 2026 quality score or projection."
    }),
  ]),

  MIA: record("MIA", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Jeff Hafley", offensiveCoordinator: "Bobby Slowik", defensiveCoordinator: "Sean Duggan", passingGameCoordinator: "Kevin Patullo", defensiveRunGameCoordinatorSeniorDefensiveAssistant: "Joe Barry", defensiveBacksPassingGameCoordinator: "Ryan Downard" }),
      sourceId: "dolphins-2026-coaching-staff", sourceLabel: "Miami Dolphins announce 2026 coaching staff",
      sourceUri: "https://www.miamidolphins.com/news/miami-dolphins-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ headCoach: "NEW_2026", offensiveCoordinator: "PROMOTED_FROM_2025_SENIOR_PASS_GAME_COORDINATOR", returningCoaches: 6 }),
      classification: "OBSERVATION",
      sourceId: "dolphins-2026-coaching-staff", sourceLabel: "Miami Dolphins announce 2026 coaching staff",
      sourceUri: "https://www.miamidolphins.com/news/miami-dolphins-announce-2026-coaching-staff",
      tags: ["2026_SYSTEM_CONTINUITY"], confidence: 0.95
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ offensiveCoordinator: "Bobby Slowik", passingGameCoordinator: "Kevin Patullo", coordinatorPriorRole2025: "SENIOR_PASS_GAME_COORDINATOR" }),
      sourceId: "dolphins-2026-coaching-staff", sourceLabel: "Miami Dolphins announce 2026 coaching staff",
      sourceUri: "https://www.miamidolphins.com/news/miami-dolphins-announce-2026-coaching-staff",
      tags: ["2026_PASS_GAME_STRUCTURE"], confidence: 0.95
    }),
  ]),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_TEAMS = Object.freeze(Object.keys(nflTeamIdentityPrimarySourceEnrichment2026Wave3));

export function getNFLTeamIdentityPrimarySourceEnrichment2026Wave3(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return nflTeamIdentityPrimarySourceEnrichment2026Wave3[key] || null;
}

export default nflTeamIdentityPrimarySourceEnrichment2026Wave3;
