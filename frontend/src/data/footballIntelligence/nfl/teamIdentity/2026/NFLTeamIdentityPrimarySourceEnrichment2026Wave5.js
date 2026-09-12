// INT-2B.2E - 2026 primary-source Team Identity enrichment, wave 5.
// Teams: PIT, SEA, SF, TB, TEN, WAS.
// Evidence only. No scoring, strength, prediction, or draft adjustment authority.

const VERIFIED_AT = "2026-09-06T05:35:00Z";

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

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_VERSION =
  "FIE-NFL-TEAM-IDENTITY-PRIMARY-SOURCE-ENRICHMENT-2026-W5-1.0.0";

export const nflTeamIdentityPrimarySourceEnrichment2026Wave5 = Object.freeze({
  PIT: record("PIT", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Mike McCarthy", offensiveCoordinator: "Brian Angelichio", defensiveCoordinator: "Patrick Graham", assistantHeadCoachSecondary: "Joe Whitt Jr.", defensivePassGameCoordinatorDefensiveBacks: "Jason Simmons" }),
      sourceId: "steelers-2026-coaching-staff", sourceLabel: "Steelers complete 2026 coaching staff",
      sourceUri: "https://www.steelers.com/news/steelers-complete-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "Mike McCarthy", offensiveCoordinator: "Brian Angelichio", collaboration: "HEAD_COACH_OC_GAMEPLAN_COLLABORATION" }),
      classification: "OBSERVATION",
      sourceId: "steelers-2026-coordinators-corner", sourceLabel: "Coordinators Corner: New coordinators share their takes",
      sourceUri: "https://www.steelers.com/news/coordinators-corner-new-coordinators-share-their-takes",
      tags: ["2026_PLAY_CALLING"], confidence: 0.98,
      notes: "Official club coverage states McCarthy will call the offensive plays while Angelichio works with him on the offense and weekly decisions."
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ designPrinciple: "QUARTERBACK_FRIENDLY", decisionPrinciple: "QUARTERBACK_COMFORT_DRIVES_CONCEPT_SELECTION", headCoach: "Mike McCarthy" }),
      classification: "OBSERVATION",
      sourceId: "steelers-2026-coordinators-corner", sourceLabel: "Coordinators Corner: New coordinators share their takes",
      sourceUri: "https://www.steelers.com/news/coordinators-corner-new-coordinators-share-their-takes",
      tags: ["2026_OFFENSIVE_DESIGN_PHILOSOPHY"], confidence: 0.98,
      notes: "Preserves explicit club-reported quarterback-friendly design philosophy; no quality score or external scheme label is inferred."
    }),
  ]),

  SEA: record("SEA", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Mike Macdonald", offensiveCoordinator: "Brian Fleury", defensiveCoordinator: "Aden Durde", runGameCoordinator: "Justin Outten", offensivePassingGameCoordinatorQuarterbacks: "Jake Peetz", defensiveRunGameCoordinator: "Chris Partridge", defensivePassingGameCoordinatorDefensiveBacks: "Karl Scott" }),
      sourceId: "seahawks-2026-coaching-staff", sourceLabel: "Seahawks Finalize 2026 Coaching Staff",
      sourceUri: "https://www.seahawks.com/news/seattle-seahawks-finalize-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offensiveCoordinatorChange: true, priorCoordinator: "Klint Kubiak", currentCoordinator: "Brian Fleury", continuityIntent: "MAINTAIN_2025_OFFENSIVE_FOUNDATION" }),
      classification: "OBSERVATION",
      sourceId: "seahawks-fleury-continuity-2026", sourceLabel: "Brian Fleury focused on maintaining Seattle offensive foundation",
      sourceUri: "https://www.seahawks.com/news/seahawks-offensive-coordinator-brian-fleury-not-looking-for-huge-changes-but-to-maintain-what-made-seattle-s-offense-successful",
      tags: ["2026_OFFENSIVE_CONTINUITY"], confidence: 0.98,
      notes: "Official club reporting says Fleury intends to maintain as much of the prior offensive foundation as possible."
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ continuityModel: "EVOLUTION_NOT_OVERHAUL", baseContext: "2025_SEAHAWKS_OFFENSE", coordinator: "Brian Fleury" }),
      classification: "OBSERVATION",
      sourceId: "seahawks-2026-offseason-takeaways", sourceLabel: "Takeaways From The Seahawks' 2026 Offseason Program & Minicamp",
      sourceUri: "https://www.seahawks.com/news/takeaways-from-the-seahawks-2026-offseason-program-minicamp",
      tags: ["2026_OFFENSIVE_SYSTEM", "SYSTEM_CONTINUITY"], confidence: 0.95,
      notes: "Official club reporting describes the 2026 offense as this year's version of last year's offense. No independent scheme family is inferred beyond the club's continuity description."
    }),
  ]),

  SF: record("SF", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Kyle Shanahan", offensiveCoordinator: "Klay Kubiak", defensiveCoordinator: "Raheem Morris", assistantHeadCoachDefense: "Matt Eberflus", runGameCoordinator: "Joe Graves", passingGameCoordinatorWideReceivers: "Leonard Hankerson", defensiveRunGameCoordinator: "Johnny Holland", defensivePassingGameCoordinator: "Jerry Gray" }),
      sourceId: "49ers-2026-coaching-moves", sourceLabel: "49ers Announce Coaching Staff Moves",
      sourceUri: "https://www.49ers.com/news/49ers-announce-coaching-staff-moves-raheem-morris-matt-eberflus-roman-sapolu",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "OFFENSE", subject: "FORMATION_PERSONNEL_IDENTITY",
      value: Object.freeze({ runGameCoordinator: "Joe Graves", passingGameCoordinatorWideReceivers: "Leonard Hankerson", structure: "DEDICATED_PASS_AND_RUN_GAME_COORDINATION" }),
      classification: "OBSERVATION",
      sourceId: "49ers-2026-coaching-moves", sourceLabel: "49ers Announce Coaching Staff Moves",
      sourceUri: "https://www.49ers.com/news/49ers-announce-coaching-staff-moves-raheem-morris-matt-eberflus-roman-sapolu",
      tags: ["2026_OFFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "Captures official run- and pass-game coordination titles only; no formation or personnel rate is inferred."
    }),
    obs({
      domain: "DEFENSE", subject: "DEFENSIVE_FRONT",
      value: Object.freeze({ defensiveCoordinator: "Raheem Morris", assistantHeadCoachDefense: "Matt Eberflus", defensiveRunGameCoordinator: "Johnny Holland", defensivePassingGameCoordinator: "Jerry Gray" }),
      sourceId: "49ers-2026-coaching-moves", sourceLabel: "49ers Announce Coaching Staff Moves",
      sourceUri: "https://www.49ers.com/news/49ers-announce-coaching-staff-moves-raheem-morris-matt-eberflus-roman-sapolu",
      tags: ["2026_DEFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "Captures official responsibility structure only; no front family, coverage family, or pressure tendency is inferred."
    }),
  ]),

  TB: record("TB", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Todd Bowles", offensiveCoordinator: "Zac Robinson", offensiveRunGameCoordinatorOffensiveLine: "Kevin Carberry", offensivePassGameCoordinator: "T.J. Yates", defensivePassGameCoordinator: "George Edwards", defensiveRunGameCoordinatorOutsideLinebackers: "Larry Foote" }),
      sourceId: "buccaneers-2026-coaches", sourceLabel: "Tampa Bay Buccaneers Coaching Staff",
      sourceUri: "https://www.buccaneers.com/team/coaches-roster/",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "Zac Robinson", role: "OFFENSIVE_COORDINATOR" }),
      sourceId: "buccaneers-2026-offensive-preview", sourceLabel: "Buccaneers' Offensive Preview, Training Camp 2026",
      sourceUri: "https://www.buccaneers.com/news/buccaneers-offensive-preview-training-camp-2026",
      tags: ["2026_PLAY_CALLING"], confidence: 0.99
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ status: "NEW_2026_OFFENSE", designPrinciple: "ADAPT_TO_CURRENT_PERSONNEL", coordinator: "Zac Robinson" }),
      classification: "OBSERVATION",
      sourceId: "buccaneers-2026-offensive-preview", sourceLabel: "Buccaneers' Offensive Preview, Training Camp 2026",
      sourceUri: "https://www.buccaneers.com/news/buccaneers-offensive-preview-training-camp-2026",
      tags: ["2026_OFFENSIVE_SYSTEM", "PERSONNEL_ADAPTATION"], confidence: 0.97,
      notes: "Official club reporting says Robinson will cater strategies to the specific skills of Tampa Bay's personnel. No performance score is inferred."
    }),
  ]),

  TEN: record("TEN", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Robert Saleh", offensiveCoordinator: "Brian Daboll", defensiveCoordinator: "Gus Bradley", assistantHeadCoachSpecialTeamsCoordinator: "John Fassel", defensiveRunGameCoordinatorDefensiveLine: "Aaron Whitecotton" }),
      sourceId: "titans-2026-coaching-staff", sourceLabel: "Titans Finalize Coaching Staff Under Robert Saleh",
      sourceUri: "https://www.tennesseetitans.com/news/titans-finalize-coaching-staff-under-robert-saleh",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "Brian Daboll", offensiveCoordinator: "Brian Daboll" }),
      classification: "OBSERVATION",
      sourceId: "titans-saleh-preseason-2026", sourceLabel: "Hot Topics From Titans HC Robert Saleh's Zoom Call on Friday",
      sourceUri: "https://www.tennesseetitans.com/news/hot-topics-from-titans-hc-robert-saleh-s-zoom-call-on-friday",
      tags: ["2026_PLAY_CALLING"], confidence: 0.98,
      notes: "Official club reporting attributes preseason offensive play calls to OC Brian Daboll. Preserved as current play-calling evidence without assigning performance quality."
    }),
    obs({
      domain: "DEFENSE", subject: "DEFENSIVE_FRONT",
      value: Object.freeze({ defensiveCoordinator: "Gus Bradley", defensiveRunGameCoordinatorDefensiveLine: "Aaron Whitecotton", headCoach: "Robert Saleh" }),
      sourceId: "titans-2026-transactions", sourceLabel: "Tennessee Titans 2026 Transactions",
      sourceUri: "https://www.tennesseetitans.com/team/transactions/2026",
      tags: ["2026_DEFENSIVE_STAFF_STRUCTURE"], confidence: 0.95,
      notes: "Official transactions establish defensive responsibility structure only; no front family or coverage system is inferred."
    }),
  ]),

  WAS: record("WAS", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Dan Quinn", offensiveCoordinator: "David Blough", defensiveCoordinator: "Daronte Jones", offensivePassGameCoordinator: "David Raih", defensiveRunGameCoordinatorDefensiveLine: "Eric Henderson" }),
      sourceId: "commanders-2026-coaching-staff", sourceLabel: "Commanders announce 2026 coaching staff",
      sourceUri: "https://www.commanders.com/news/commanders-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ playCaller: "David Blough", experienceContext: "FIRST_YEAR_NFL_PLAY_CALLER_2026" }),
      sourceId: "commanders-blough-playcaller-2026", sourceLabel: "Blough wants to elevate personnel in first year as play caller",
      sourceUri: "https://www.commanders.com/news/david-blough-builds-commanders-playbook",
      tags: ["2026_PLAY_CALLING", "NEW_OFFENSIVE_COORDINATOR"], confidence: 0.99
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ composition: "BLEND_OF_MULTIPLE_PRIOR_SYSTEMS", designPrinciple: "BUILD_AROUND_PLAYER_STRENGTHS", quarterbackUsage: "MORE_UNDER_CENTER", runPassApproach: "MORE_BALANCED", coordinator: "David Blough" }),
      classification: "OBSERVATION",
      sourceId: "commanders-blough-playcaller-2026", sourceLabel: "Blough wants to elevate personnel in first year as play caller",
      sourceUri: "https://www.commanders.com/news/david-blough-builds-commanders-playbook",
      tags: ["2026_OFFENSIVE_SYSTEM", "PERSONNEL_ADAPTATION"], confidence: 0.97,
      notes: "Official club reporting describes Blough's offense as collaborative, personnel-centered, more balanced, and using Jayden Daniels under center more often. No external scheme label or quality score is assigned."
    }),
  ]),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_TEAMS = Object.freeze(Object.keys(nflTeamIdentityPrimarySourceEnrichment2026Wave5));

export function getNFLTeamIdentityPrimarySourceEnrichment2026Wave5(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return nflTeamIdentityPrimarySourceEnrichment2026Wave5[key] || null;
}

export default nflTeamIdentityPrimarySourceEnrichment2026Wave5;
