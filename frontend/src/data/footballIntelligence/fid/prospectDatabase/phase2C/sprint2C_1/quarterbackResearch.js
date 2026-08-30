export const SPRINT_2C1_CAPTURE_DATE = "2026-08-06";
export const SPRINT_2C1_COHORT_REF = "prospect-position-cohort:2027:2c1:quarterback";

const freeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
};

const rows = [
  ["dj-lagway", "DJ Lagway", "Baylor", "QB", 75, 239, "JUNIOR_OR_YEAR_THREE", "EXISTING_2A_PREPARATION", "https://baylorbears.com/sports/football/roster/dj-lagway/15606", { games: 12, starts: 12, completions: 213, attempts: 337, passingYards: 2264, passingTouchdowns: 16, interceptions: 14, rushingYards: 244 }],
  ["dylan-raiola", "Dylan Raiola", "Oregon", "QB", 75, 230, "JUNIOR_OR_YEAR_THREE", "EXISTING_2A_PREPARATION", "https://goducks.com/sports/football/roster", { games: 9, starts: 9, completions: 181, attempts: 250, passingYards: 2000, passingTouchdowns: 18 }],
  ["julian-sayin", "Julian Sayin", "Ohio State", "QB", 73, 208, "REDSHIRT_SOPHOMORE", "NEW_POSITION_COHORT", "https://ohiostatebuckeyes.com/sports/football/roster/julian-sayin/13331", { productionStatus: "OFFICIAL_2025_STATS_AVAILABLE_REVIEW_REQUIRED" }],
  ["luke-kromenhoek", "Luke Kromenhoek", "South Florida", "QB", 76, 220, "REDSHIRT_SOPHOMORE", "NEW_POSITION_COHORT", "https://gousfbulls.com/sports/football/roster/luke-kromenhoek/16188", { careerGames: 9, careerStarts: 2, priorPassingYards: 502, priorPassingTouchdowns: 3, priorRushingYards: 113 }],
  ["michael-van-buren-jr", "Michael Van Buren Jr.", "South Florida", "QB", 72, 195, "JUNIOR_OR_YEAR_THREE", "NEW_POSITION_COHORT", "https://gousfbulls.com/sports/football/roster/michael-van-buren-jr/16201", { careerGames: 17, careerStarts: 12, passingYards: 2896, passingTouchdowns: 19, interceptions: 9, rushingYards: 117, rushingTouchdowns: 6 }],
  ["elijah-brown", "Elijah Brown", "Washington", "QB", 74, 205, "THIRD_YEAR", "NEW_POSITION_COHORT", "https://gohuskies.com/sports/football/roster/elijah-brown/17904", { games2025: 6, completions2025: 74, attempts2025: 127, passingYards2025: 829, passingTouchdowns2025: 4, interceptions2025: 2 }],
  ["walker-white", "Walker White", "Central Arkansas", "QB", 76, 225, "SOPHOMORE", "NEW_POSITION_COHORT", "https://ucasports.com/sports/football/roster/walker-white/11084", { productionStatus: "NO_CURRENT_SEASON_STATISTICS_AVAILABLE" }],
  ["cutter-boley", "Cutter Boley", "Arizona State", "QB", 77, 220, "JUNIOR", "NEW_POSITION_COHORT", "https://thesundevils.com/sports/football/roster/player/cutter-boley", { productionStatus: "OFFICIAL_PRODUCTION_REVIEW_REQUIRED" }],
  ["austin-simmons", "Austin Simmons", "Ole Miss", "QB", 76, 215, "JUNIOR_OR_YEAR_THREE", "NEW_POSITION_COHORT", "https://olemisssports.com/sports/football/roster/austin-simmons/5877", { firstStartCompletions: 20, firstStartAttempts: 31, firstStartPassingYards: 341, firstStartPassingTouchdowns: 3, firstStartInterceptions: 2 }],
  ["avery-johnson", "Avery Johnson", "Kansas State", "QB", null, null, "SENIOR_OR_YEAR_FOUR", "NEW_POSITION_COHORT", "https://www.kstatesports.com/sports/football/roster/avery-johnson/13074", { careerPassingYardsObserved: 5576, careerPassingTouchdownsObserved: 48, careerRushingYardsObserved: 1378 }],
  ["marcel-reed", "Marcel Reed", "Texas A&M", "QB", 73, 185, "REDSHIRT_JUNIOR", "NEW_POSITION_COHORT", "https://12thman.com/sports/football/roster/player/marcel-reed", { games2025: 13, starts2025: 13, completions2025: 234, attempts2025: 377, passingYards2025: 3169, passingTouchdowns2025: 25, interceptions2025: 12, rushingYards2025: 493, rushingTouchdowns2025: 6 }],
  ["demond-williams-jr", "Demond Williams Jr.", "Washington", "QB", 71, 190, "THIRD_YEAR", "NEW_POSITION_COHORT", "https://gohuskies.com/sports/football/roster/demond-williams-jr-/17806", { productionStatus: "OFFICIAL_PRODUCTION_REVIEW_REQUIRED" }]
];

export const quarterbackResearchRecords = freeze(rows.map(([slug, name, program, officialPosition, heightInches, weightPounds, rosterClass, cohortStatus, officialUrl, production]) => ({
  candidateRef: `candidate:2027:qb:${slug}`,
  name,
  expectedDraftYear: 2027,
  positionGroup: "QUARTERBACK",
  officialPosition,
  currentProgram: { displayName: program, canonical: false, resolutionState: cohortStatus === "EXISTING_2A_PREPARATION" ? "PREDECESSOR_PROGRAM_OBSERVATION_REUSED" : "PROGRAM_REFERENCE_COMPATIBLE_PROVISIONAL" },
  rosterClass,
  measurements: { heightInches, weightPounds, classification: heightInches && weightPounds ? "CURRENT_OR_BOUNDED_OFFICIAL_ROSTER_OBSERVATION" : "MEASUREMENT_REVIEW_REQUIRED" },
  production,
  sources: [{ sourceRef: `source:2027:2c1:qb:${slug}:official`, publisher: program, title: `${name} official roster/biography`, url: officialUrl, sourceClassification: "OFFICIAL_COLLEGE_ATHLETICS", accessDate: SPRINT_2C1_CAPTURE_DATE }],
  evidence: [
    { evidenceRef: `evidence:2027:2c1:qb:${slug}:roster`, claim: "current roster identity, program, position, class, and measurements where published", sourceRef: `source:2027:2c1:qb:${slug}:official`, classification: "OFFICIAL_OBSERVED" },
    { evidenceRef: `evidence:2027:2c1:qb:${slug}:production`, claim: "bounded officially published production or explicit unavailability", sourceRef: `source:2027:2c1:qb:${slug}:official`, classification: "OFFICIAL_OBSERVED_BOUNDED" }
  ],
  eligibilityStatus: "ELIGIBILITY_PATHWAY_REVIEW_REQUIRED",
  declarationStatus: "DECLARATION_UNRESOLVED",
  testingStatus: "TESTING_NOT_YET_APPLICABLE",
  scoutingStatus: "INDEPENDENT_SCOUTING_REVIEW_REQUIRED",
  cohortStatus,
  ranked: false,
  canonicalIdentifiers: { profileId: null, entityRef: null, playerProfileRef: null },
  limitations: ["Roster and participation evidence do not establish 2027 NFL Draft declaration.", "No ranking, grade, confidence, fit, or modeled intelligence is asserted."]
})));

export const quarterbackCohortManifest = freeze({
  cohortRef: SPRINT_2C1_COHORT_REF,
  draftYear: 2027,
  positionGroup: "QUARTERBACK",
  candidateCount: quarterbackResearchRecords.length,
  existingPreparationCount: quarterbackResearchRecords.filter((record) => record.cohortStatus === "EXISTING_2A_PREPARATION").length,
  newCandidateCount: quarterbackResearchRecords.filter((record) => record.cohortStatus === "NEW_POSITION_COHORT").length,
  candidateRefs: quarterbackResearchRecords.map((record) => record.candidateRef),
  nonRankingOrder: true,
  promotionAuthorized: false,
  persistenceAuthorized: false,
  applicationRegistrationAuthorized: false,
  limitations: ["All candidates remain provisional 2027 research/preparation subjects.", "REF and Sprint 17C remain paused; canonical identifier issuance and live persistence are deferred."]
});
