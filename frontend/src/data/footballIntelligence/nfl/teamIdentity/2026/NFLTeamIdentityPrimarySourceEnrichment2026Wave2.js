// INT-2B.2B — 2026 primary-source Team Identity enrichment, wave 2.
// Teams: CLE, DAL, DEN, DET, GB, HOU, IND.
// Evidence only. No scoring, strength, prediction, or draft adjustment authority.

const VERIFIED_AT = "2026-09-06T04:00:00Z";

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

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_VERSION =
  "FIE-NFL-TEAM-IDENTITY-PRIMARY-SOURCE-ENRICHMENT-2026-W2-1.0.0";

export const nflTeamIdentityPrimarySourceEnrichment2026Wave2 = Object.freeze({
  CLE: record("CLE", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Todd Monken", offensiveCoordinator: "Travis Switzer", defensiveCoordinator: "Mike Rutenberg", specialTeamsCoordinator: "Byron Storer" }),
      sourceId: "browns-2026-coaching-staff", sourceLabel: "Browns finalize the 2026 coaching staff",
      sourceUri: "https://www.clevelandbrowns.com/news/browns-finalize-the-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "NEW_2026_OFFENSIVE_SYSTEM", headCoach: "NEW_2026_HEAD_COACH" }),
      classification: "OBSERVATION",
      sourceId: "browns-new-offense-2026", sourceLabel: "Wideouts Part One: The Route Ahead",
      sourceUri: "https://www.clevelandbrowns.com/news/wideouts-part-one-the-route-ahead",
      tags: ["2026_SYSTEM_CONTINUITY"], confidence: 0.95,
      notes: "Official club coverage states Monken and Switzer built a new offensive system and playbook for 2026."
    }),
    obs({
      domain: "TEAM_BUILDING", subject: "DEVELOPMENT_PHILOSOPHY",
      value: Object.freeze({ emphasis: "PLAYER_DEVELOPMENT", complementaryEmphasis: "SCHEME_AND_DEVELOPMENT" }),
      classification: "OBSERVATION",
      sourceId: "browns-2026-coaching-staff", sourceLabel: "Browns finalize the 2026 coaching staff",
      sourceUri: "https://www.clevelandbrowns.com/news/browns-finalize-the-2026-coaching-staff",
      tags: ["2026_DEVELOPMENT_PHILOSOPHY"], confidence: 0.95,
      notes: "Monken explicitly framed the staff around developing players and pairing development with schematic ability."
    }),
  ]),

  DAL: record("DAL", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Brian Schottenheimer", offensiveCoordinator: "Klayton Adams", defensiveCoordinator: "Christian Parker", defensivePassGameCoordinator: "Derrick Ansley", passGameSpecialist: "Ken Dorsey" }),
      sourceId: "cowboys-2026-coaches", sourceLabel: "Dallas Cowboys 2026 Coaching Staff",
      sourceUri: "https://www.dallascowboys.com/team/coaches-roster/",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Brian Schottenheimer", preseasonDelegate: "Klayton Adams" }),
      sourceId: "cowboys-preseason-playcalling-2026", sourceLabel: "Pic 6: 2026 Preseason — Calling the Shots",
      sourceUri: "https://www.dallascowboys.com/photos/pic-6-2026-preseason",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "YEAR_TWO_SCHOTTENHEIMER_ADAMS", posture: "EVOLVE_NOT_REPEAT" }),
      classification: "OBSERVATION",
      sourceId: "cowboys-adams-edge-2026", sourceLabel: "Klayton Adams looking to 'seek the edge' for Cowboys' offense",
      sourceUri: "https://www.dallascowboys.com/news/klayton-adams-looking-to-seek-the-edge-for-cowboys-offense",
      tags: ["2026_SYSTEM_CONTINUITY"], confidence: 0.95,
      notes: "Adams described a year-two offense that must evolve rather than simply repeat what worked in 2025."
    }),
  ]),

  DEN: record("DEN", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Sean Payton", offensiveCoordinator: "Davis Webb", defensiveCoordinator: "Vance Joseph", offensiveRunGameCoordinator: "Zach Strief", offensivePassGameCoordinator: "John Morton", defensivePassGameCoordinator: "Robert Livingston" }),
      sourceId: "broncos-2026-coaching-staff", sourceLabel: "Broncos announce updates to 2026 coaching staff",
      sourceUri: "https://www.denverbroncos.com/news/broncos-announce-updates-to-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Davis Webb", headCoachOffensiveInvolvement: "Sean Payton" }),
      sourceId: "broncos-webb-playcaller-2026", sourceLabel: "Sean Payton announces OC Davis Webb to call plays",
      sourceUri: "https://www.denverbroncos.com/news/i-wouldn-t-do-it-if-i-didn-t-think-it-was-going-to-help-our-team-win-hc-sean-payton-announces-oc-davis-webb-to-call-plays-for-broncos-offense",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "PAYTON_SYSTEM_WITH_WEBB_PLAYCALLER", playCallerTransition: true }),
      sourceId: "broncos-webb-resource-2026", sourceLabel: "Davis Webb 'blessed and thankful' to have Sean Payton as resource",
      sourceUri: "https://www.denverbroncos.com/news/davis-webb-blessed-and-thankful-to-have-hc-sean-payton-as-resource-entering-first-season-as-broncos-oc",
      tags: ["2026_SYSTEM_CONTINUITY"]
    }),
  ]),

  DET: record("DET", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Dan Campbell", offensiveCoordinator: "Drew Petzing", defensiveCoordinator: "Kelvin Sheppard", offensiveRunGameCoordinator: "Hank Fraley", offensivePassGameCoordinator: "Mike Kafka", defensiveRunGameCoordinator: "Kacy Rodgers", defensivePassGameCoordinator: "Deshea Townsend" }),
      sourceId: "lions-2026-coaching-staff", sourceLabel: "Detroit Lions announce 2026 coaching staff",
      sourceUri: "https://www.detroitlions.com/news/lions-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "PLAY_CALLING", subject: "OFFENSIVE_PLAY_CALLING",
      value: Object.freeze({ caller: "Drew Petzing" }),
      sourceId: "lions-petzing-playcaller-2026", sourceLabel: "Goff talks new offense under Petzing",
      sourceUri: "https://www.detroitlions.com/news/goff-talks-new-offense-under-petzing-williams-development-more",
      tags: ["2026_PLAY_CALLER"]
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ emphasis: "MATCHUP_DRIVEN", presentation: "SIMILAR_LOOKS_DIFFERENT_CONCEPTS" }),
      classification: "OBSERVATION",
      sourceId: "lions-petzing-bio-2026", sourceLabel: "Drew Petzing — Detroit Lions coaching biography",
      sourceUri: "https://www.detroitlions.com/team/coaches-roster/drew-petzing",
      tags: ["2026_OFFENSIVE_IDENTITY"], confidence: 0.95,
      notes: "Campbell highlighted Petzing's matchup orientation; club coverage later described concepts that present similarly while changing the underlying call."
    }),
  ]),

  GB: record("GB", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Matt LaFleur", offensiveCoordinator: "Adam Stenavich", defensiveCoordinator: "Jonathan Gannon", offensivePassingGameCoordinator: "Jason Vrable", defensivePassGameCoordinator: "Bobby Babich", defensiveRunGameCoordinator: "DeMarcus Covington" }),
      sourceId: "packers-2026-coaching-staff", sourceLabel: "Packers announce coaching-staff changes",
      sourceUri: "https://www.packers.com/news/packers-announce-coaching-staff-changes-march-19-2026",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "DEFENSE", subject: "DEFENSIVE_SYSTEM",
      value: Object.freeze({ status: "NEW_2026_SYSTEM", personnelAdaptive: true }),
      sourceId: "packers-gannon-system-2026", sourceLabel: "Jonathan Gannon building 'new system' for Packers' defense",
      sourceUri: "https://www.packers.com/news/jonathan-gannon-building-new-system-for-packers-defense-2026",
      tags: ["2026_DEFENSIVE_SYSTEM"]
    }),
    obs({
      domain: "DEFENSE", subject: "PRESSURE_IDENTITY",
      value: Object.freeze({ desiredPlayStyle: Object.freeze(["FAST", "VIOLENT", "PHYSICAL"]), takeawayEmphasis: true }),
      classification: "OBSERVATION",
      sourceId: "packers-gannon-system-2026", sourceLabel: "Jonathan Gannon building 'new system' for Packers' defense",
      sourceUri: "https://www.packers.com/news/jonathan-gannon-building-new-system-for-packers-defense-2026",
      tags: ["2026_DEFENSIVE_IDENTITY"], confidence: 0.95,
      notes: "Gannon described the desired 2026 play style and takeaway emphasis; this does not infer a fixed front or coverage family."
    }),
  ]),

  HOU: record("HOU", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "DeMeco Ryans", offensiveCoordinator: "Nick Caley", defensiveCoordinator: "Matt Burke", offensivePassingGameCoordinator: "Ben McDaniels", offensiveRunGameCoordinator: "Cole Popovich", defensivePassingGameCoordinator: "Cory Undlin", defensiveRunGameCoordinator: "Rod Wright" }),
      sourceId: "texans-2026-coaching-staff", sourceLabel: "Houston Texans announce 2026 coaching staff",
      sourceUri: "https://www.houstontexans.com/news/houston-texans-announce-2026-coaching-staff",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ offense: "SECOND_SEASON_NICK_CALEY", defense: "RYANS_BURKE_CONTINUITY" }),
      sourceId: "texans-caley-bio-2026", sourceLabel: "Nick Caley — Houston Texans coaching biography",
      sourceUri: "https://www.houstontexans.com/team/coaches-roster/nick-caley",
      tags: ["2026_SYSTEM_CONTINUITY"]
    }),
    obs({
      domain: "OFFENSE", subject: "OFFENSIVE_SYSTEM",
      value: Object.freeze({ designPrinciple: "PERSONNEL_STRENGTH_ADAPTIVE", gamePlanFlexible: true }),
      classification: "HISTORICAL_PRIOR",
      sourceId: "texans-caley-identity-2025", sourceLabel: "OC influences, Draft pick layout and more | Fans Wanna Know",
      sourceUri: "https://www.houstontexans.com/news/oc-influences-draft-pick-layout-and-more-fans-wanna-know",
      effectiveFrom: "2025-02-01", tags: ["SYSTEM_DESIGN_PRIOR", "2026_RETURNING_OC"], confidence: 0.85,
      notes: "Caley's official 2025 introduction emphasized fitting the offense to player strengths and varying the game plan. Preserved as historical prior because it predates the 2026 season."
    }),
  ]),

  IND: record("IND", [
    obs({
      domain: "CONTINUITY", subject: "STAFF_CONTINUITY",
      value: Object.freeze({ headCoach: "Shane Steichen", offensiveCoordinator: "Jim Bob Cooter", defensiveCoordinator: "Lou Anarumo", offensivePassingGameCoordinator: "Alex Tanney", defensivePassGameCoordinator: "Chris Hewitt" }),
      sourceId: "colts-2026-coaching-staff", sourceLabel: "Colts announce 2026 coaching staff",
      sourceUri: "https://www.colts.com/news/colts-announce-2026-coaching-staff-marian-hobby-defensive-line-lou-anarumo",
      tags: ["2026_STAFF", "PRIMARY_SOURCE_ENRICHMENT"]
    }),
    obs({
      domain: "CONTINUITY", subject: "SYSTEM_CONTINUITY",
      value: Object.freeze({ headCoach: "RETURNING", offensiveCoordinator: "RETURNING", defensiveCoordinator: "RETURNING" }),
      sourceId: "colts-steichen-return-2026", sourceLabel: "Chris Ballard, Shane Steichen to return for 2026 season",
      sourceUri: "https://www.colts.com/news/colts-general-manager-chris-ballard-head-coach-shane-steichen-to-return-for-2026-season",
      tags: ["2026_SYSTEM_CONTINUITY"]
    }),
    obs({
      domain: "OFFENSE", subject: "PASS_GAME_IDENTITY",
      value: Object.freeze({ recentProfile: "TOP_TEN_PASSING_OUTPUT", passingYardsPerGameRank2025: 9 }),
      classification: "HISTORICAL_PRIOR",
      sourceId: "colts-steichen-bio-2026", sourceLabel: "Shane Steichen — Colts coaching biography",
      sourceUri: "https://www.colts.com/team/coaches-roster/shane-steichen",
      tags: ["2025_PERFORMANCE_CONTEXT", "2026_RETURNING_STAFF"], confidence: 0.9,
      notes: "2025 passing output is retained only as historical context for a returning staff, not as a 2026 prediction or quality score."
    }),
  ]),
});

export const NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_TEAMS = Object.freeze(Object.keys(nflTeamIdentityPrimarySourceEnrichment2026Wave2));

export function getNFLTeamIdentityPrimarySourceEnrichment2026Wave2(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return nflTeamIdentityPrimarySourceEnrichment2026Wave2[key] || null;
}

export default nflTeamIdentityPrimarySourceEnrichment2026Wave2;
