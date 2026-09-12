// INT-2B.2D - 2026 primary-source Team Identity enrichment, wave 4.
// Teams: MIN, NE, NO, NYG, NYJ, PHI.
// Evidence only. No scoring, strength, prediction, or draft adjustment authority.

const VERIFIED_AT = "2026-09-06T05:10:00Z";

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

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_VERSION =
  "FIE-NFL-TEAM-IDENTITY-PRIMARY-SOURCE-ENRICHMENT-2026-W4-1.0.0";

export const nflTeamIdentityPrimarySourceEnrichment2026Wave4 = Object.freeze({
  MIN: record("MIN", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Kevin O'Connell", offensiveCoordinator: "Wes Phillips", defensiveCoordinator: "Brian Flores", assistantHeadCoach: "Frank Smith", offensivePassingGameCoordinatorQuarterbacks: "Josh McCown", offensiveRunningGameCoordinatorRunningBacks: "Curtis Modkins", defensivePassingGameCoordinatorDefensiveBacks: "Gerald Alexander", defensiveRunningGameCoordinator: "Ryan Nielsen" }),
      sourceId: "vikings-2026-coaching-updates", sourceLabel: "Vikings Announce Updates to 2026 Coaching Staff",
      sourceUri: "https://www.vikings.com/news/2026-coaching-staff-updates-promotions-hires",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "OFFENSE", subject: "FORMATION_PERSONNEL_IDENTITY",
      value: Object.freeze({ passingGameCoordinator: "Josh McCown", runningGameCoordinator: "Curtis Modkins", assistantOffensiveCoordinator: "Chris O'Hara", structure: "DEDICATED_PASS_AND_RUN_GAME_COORDINATION" }),
      classification: "OBSERVATION",
      sourceId: "vikings-2026-coaching-updates", sourceLabel: "Vikings Announce Updates to 2026 Coaching Staff",
      sourceUri: "https://www.vikings.com/news/2026-coaching-staff-updates-promotions-hires",
      tags: ["2026_OFFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "Official staff structure identifies dedicated pass- and run-game coordination. No formation or personnel-rate tendency is inferred."
    }),
    obs({
      domain: "DEFENSE", subject: "DEFENSIVE_FRONT",
      value: Object.freeze({ defensiveCoordinator: "Brian Flores", defensiveRunningGameCoordinator: "Ryan Nielsen", defensivePassingGameCoordinatorDefensiveBacks: "Gerald Alexander" }),
      sourceId: "vikings-2026-coaching-updates", sourceLabel: "Vikings Announce Updates to 2026 Coaching Staff",
      sourceUri: "https://www.vikings.com/news/2026-coaching-staff-updates-promotions-hires",
      tags: ["2026_DEFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "Captures official responsibility structure only; no base-front or coverage family is inferred."
    }),
  ]),

  NE: record("NE", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Mike Vrabel", assistantHeadCoach: "Terrell Williams", offensiveCoordinator: "Josh McDaniels", defensiveCoordinator: "Zak Kuhr", tightEndsPassingGameCoordinator: "Thomas Brown" }),
      sourceId: "patriots-2026-coaching-staff", sourceLabel: "Patriots Coaching Staff Updates for 2026",
      sourceUri: "https://www.patriots.com/news/patriots-coaching-staff-updates-for-2026",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offensiveCoordinator: "RETURNING_FROM_2025", coordinatorPatriotsTenure: "MULTIPLE_STINTS", coordinatorSeasonsInRoleEntering2026: 15 }),
      classification: "OBSERVATION",
      sourceId: "patriots-mcdaniels-bio-2026", sourceLabel: "Josh McDaniels - Patriots Coaching Biography",
      sourceUri: "https://www.patriots.com/team/coaches-roster/josh-mcdaniels",
      tags: ["2026_OFFENSIVE_CONTINUITY"], confidence: 0.98,
      notes: "Official club biography establishes role continuity and long Patriots tenure. Historical success is not converted into a 2026 quality score."
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ offensiveCoordinator: "Josh McDaniels", passingGameCoordinator: "Thomas Brown", passingGameCoordinatorPositionGroup: "TIGHT_ENDS" }),
      sourceId: "patriots-2026-coaching-staff", sourceLabel: "Patriots Coaching Staff Updates for 2026",
      sourceUri: "https://www.patriots.com/news/patriots-coaching-staff-updates-for-2026",
      tags: ["2026_PASS_GAME_STRUCTURE"], confidence: 0.95
    }),
  ]),

  NO: record("NO", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Kellen Moore", offensiveCoordinator: "Doug Nussmeier", defensiveCoordinator: "Brandon Staley", runGameCoordinator: "T.J. Paganetti", defensivePassGameCoordinator: "Terry Joseph", associateHeadCoachRunningBacks: "Joel Thomas" }),
      sourceId: "saints-2026-rookie-minicamp-staff", sourceLabel: "Saints Rookie Minicamp Roster for 2026 - Coaching Staff",
      sourceUri: "https://www.neworleanssaints.com/news/2026-rookie-minicamp-saints-roster-announced",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offensiveCoordinator: "RETURNING_SECOND_SEASON", headCoachOffensiveCollaboration: "CONTINUING_FROM_2025" }),
      classification: "OBSERVATION",
      sourceId: "saints-nussmeier-bio-2026", sourceLabel: "Doug Nussmeier - Saints Coaching Biography",
      sourceUri: "https://www.neworleanssaints.com/team/coaches-roster/doug-nussmeier",
      tags: ["2026_OFFENSIVE_CONTINUITY"], confidence: 0.95
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ designPrinciple: "ADAPT_TO_QUARTERBACK_STRENGTHS", evidenceContext: "2025_OFFICIAL_CLUB_DESCRIPTION", quarterbackContext: "Tyler Shough" }),
      classification: "HISTORICAL_PRIOR",
      sourceId: "saints-nussmeier-bio-2026", sourceLabel: "Doug Nussmeier - Saints Coaching Biography",
      sourceUri: "https://www.neworleanssaints.com/team/coaches-roster/doug-nussmeier",
      tags: ["2025_SYSTEM_CONTEXT", "2026_CONTINUITY_CONTEXT"], confidence: 0.9,
      notes: "Saints official biography says Moore and Nussmeier devised a scheme in 2025 that accentuated the rookie quarterback's abilities. Preserved as historical continuity evidence, not a universal scheme label or projection."
    }),
  ]),

  NYG: record("NYG", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "John Harbaugh", offensiveCoordinator: "Matt Nagy", defensiveCoordinator: "Dennard Wilson", assistantHeadCoachSpecialTeamsCoordinator: "Chris Horton", offensivePassingGameCoordinatorQuarterbacks: "Brian Callahan", offensiveSeniorAssistant: "Greg Roman", defensiveRunGameCoordinatorOutsideLinebackers: "Charlie Bullen", defensivePassCoordinatorSecondary: "Donald D'Alesio" }),
      sourceId: "giants-2026-coaching-staff", sourceLabel: "John Harbaugh announces 2026 Giants coaching staff",
      sourceUri: "https://www.giants.com/news/john-harbaugh-announces-2026-coaching-staff-coordinators-matt-nagy-dennard-wilson-chris-horton",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ composition: "BLEND_OF_MULTIPLE_STAFF_SYSTEMS", contributors: Object.freeze(["Matt Nagy", "Brian Callahan", "Greg Roman"]), status: "NEW_2026_OFFENSE" }),
      classification: "OBSERVATION",
      sourceId: "giants-2026-spring-offense", sourceLabel: "Giants Cover 3: Final thoughts from spring football",
      sourceUri: "https://www.giants.com/news/spring-practices-otas-minicamp-john-harbaugh-jaxson-dart-kayvon-thibodeaux-abdul-carter-2026-training-camp",
      tags: ["2026_OFFENSIVE_SYSTEM", "MULTI_STAFF_INPUT"], confidence: 0.95,
      notes: "Official club reporting explicitly describes the 2026 offense as a blend of prior systems from Nagy, Callahan, and Roman. No external scheme family is assigned."
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "Matt Nagy", supportingPlayCallerDepth: "Brian Callahan" }),
      sourceId: "giants-2026-preseason-playcalling", sourceLabel: "Giants Presser Points - preseason play-calling depth",
      sourceUri: "https://www.giants.com/news/presser-points-dominic-zvada-wins-giants-kicker-competition-ben-sauls-john-harbaugh",
      tags: ["2026_PLAY_CALLING"], confidence: 0.95,
      notes: "Harbaugh's official club remarks identify Nagy as the normal offensive caller while Callahan received a preseason opportunity to call plays."
    }),
  ]),

  NYJ: record("NYJ", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Aaron Glenn", offensiveCoordinator: "Frank Reich", defensiveCoordinator: "Brian Duker", offensivePassGameCoordinator: "Seth Ryan", defensiveBacksPassGameCoordinator: "Chris Harris" }),
      sourceId: "jets-2026-coaches", sourceLabel: "New York Jets Coaches Roster",
      sourceUri: "https://www.newyorkjets.com/team/coaches-roster/",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "Frank Reich", headCoach: "Aaron Glenn" }),
      sourceId: "jets-flight26-reich-playcaller", sourceLabel: "FLIGHT 26: Episode 1 - Jets offseason documentary",
      sourceUri: "https://www.newyorkjets.com/video/flight-26-jets-documentary-series-geno-smith-2026-season-episode-1",
      tags: ["2026_PLAY_CALLING"], confidence: 0.98,
      notes: "Official Jets documentary describes Reich as the team's Super Bowl-winning play caller."
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ designPrinciple: "ADAPT_TO_PLAYER_STRENGTHS", coordinator: "Frank Reich" }),
      classification: "OBSERVATION",
      sourceId: "jets-reich-bio-2026", sourceLabel: "Frank Reich - Jets Coaching Biography",
      sourceUri: "https://www.newyorkjets.com/team/coaches-roster/frank-reich",
      tags: ["2026_OFFENSIVE_DESIGN_PHILOSOPHY"], confidence: 0.95,
      notes: "Aaron Glenn's official club quote emphasizes Reich's ability to adapt and utilize player strengths. This is a design principle, not a numeric quality assessment."
    }),
  ]),

  PHI: record("PHI", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Nick Sirianni", offensiveCoordinator: "Sean Mannion", defensiveCoordinator: "Vic Fangio", offensivePassingGameCoordinator: "Josh Grizzard", runGameCoordinatorTightEnds: "Ryan Mahaffey", defensivePassingGameCoordinator: "Joe Kasper" }),
      sourceId: "eagles-2026-coaches", sourceLabel: "Philadelphia Eagles Coaches",
      sourceUri: "https://www.philadelphiaeagles.com/team/coaches/",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "Sean Mannion", experienceContext: "FIRST_TIME_NFL_PLAY_CALLER_2026" }),
      sourceId: "eagles-2026-offense-mannion", sourceLabel: "Spadaro: What will the Eagles' 2026 offense look like?",
      sourceUri: "https://www.philadelphiaeagles.com/news/eagles-2026-offense-sean-mannion-jalen-hurts-dave-spadaro",
      tags: ["2026_PLAY_CALLING", "NEW_OFFENSIVE_COORDINATOR"], confidence: 0.98
    }),
    obs({
      domain: "OFFENSE", subject: "FORMATION_PERSONNEL_IDENTITY",
      value: Object.freeze({ passingGameCoordinator: "Josh Grizzard", runGameCoordinatorTightEnds: "Ryan Mahaffey", structure: "DEDICATED_PASS_AND_RUN_GAME_COORDINATION" }),
      classification: "OBSERVATION",
      sourceId: "eagles-2026-coaches", sourceLabel: "Philadelphia Eagles Coaches",
      sourceUri: "https://www.philadelphiaeagles.com/team/coaches/",
      tags: ["2026_OFFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "Official staff titles establish dedicated pass- and run-game coordination. No formation or personnel-rate tendency is inferred."
    }),
  ]),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_TEAMS = Object.freeze(Object.keys(nflTeamIdentityPrimarySourceEnrichment2026Wave4));

export function getNFLTeamIdentityPrimarySourceEnrichment2026Wave4(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return nflTeamIdentityPrimarySourceEnrichment2026Wave4[key] || null;
}

export default nflTeamIdentityPrimarySourceEnrichment2026Wave4;
