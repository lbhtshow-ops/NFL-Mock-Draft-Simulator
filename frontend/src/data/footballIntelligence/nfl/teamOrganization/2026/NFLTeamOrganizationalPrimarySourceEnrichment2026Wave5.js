// INT-1B.2E — 2026 primary-source organizational enrichment, wave 5.
// Remaining NFC East + NFC West organizations: PHI, NYG, WAS, ARI, LAR, SEA.
// Verified 2026-09-05 from official club sources. Read-only evidence; no scoring.

const VERIFIED_AT = "2026-09-05T00:00:00Z";

const fact = ({ team, domain = "FOOTBALL_OPERATIONS", role, displayName, title, authorityScopes = [], reportsToRole = null, sourceId, sourceLabel, sourceUri, notes = null }) => Object.freeze({
  team,
  domain,
  role,
  displayName,
  title,
  entityType: "PERSON",
  classification: "FACT",
  authorityScopes: Object.freeze([...authorityScopes]),
  reportsToRole,
  sourceId,
  sourceType: "OFFICIAL_CLUB",
  sourceLabel,
  sourceUri,
  observedAt: VERIFIED_AT,
  verifiedAt: VERIFIED_AT,
  effectiveFrom: null,
  effectiveTo: null,
  confidence: 1,
  notes,
});

const PHI = "https://www.philadelphiaeagles.com/team/front-office/";
const PHI_UPDATES = "https://www.philadelphiaeagles.com/news/eagles-announce-football-staff-title-changes-post-2026-nfl-draft";
const NYG = "https://www.giants.com/team/front-office-roster/";
const WAS = "https://www.commanders.com/team/front-office-roster/";
const WAS_NEWMARK = "https://www.commanders.com/team/front-office-roster/lance-newmark";
const ARI = "https://www.azcardinals.com/team/front-office-roster/";
const LAR = "https://www.therams.com/team/front-office-roster/";
const SEA = "https://www.seahawks.com/team/front-office-roster/";
const SEA_PROMOTIONS = "https://www.seahawks.com/news/seahawks-announce-front-office-promotions-including-two-new-assistant-general-managers";

const entries = [
  // Philadelphia Eagles
  fact({ team:"PHI", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Jon Ferrari", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),
  fact({ team:"PHI", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Adam Berry", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-2026-staff-title-changes", sourceLabel:"Eagles 2026 Football Staff Title Changes", sourceUri:PHI_UPDATES }),
  fact({ team:"PHI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Joe Douglas", title:"Senior Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),
  fact({ team:"PHI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Phil Bhaya", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),
  fact({ team:"PHI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Charles Walls", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),
  fact({ team:"PHI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Jeremy Gray", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-2026-staff-title-changes", sourceLabel:"Eagles 2026 Football Staff Title Changes", sourceUri:PHI_UPDATES }),
  fact({ team:"PHI", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Ryan Myers", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),
  fact({ team:"PHI", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Lee DiValerio", title:"Assistant Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-2026-staff-title-changes", sourceLabel:"Eagles 2026 Football Staff Title Changes", sourceUri:PHI_UPDATES }),
  fact({ team:"PHI", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Jarrod Kilburn", title:"Assistant Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),
  fact({ team:"PHI", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Matt Russell", title:"Senior Personnel Director/Advisor to the General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"eagles-front-office-2026", sourceLabel:"Eagles Front Office", sourceUri:PHI }),

  // New York Giants
  fact({ team:"NYG", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Brandon Brown", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),
  fact({ team:"NYG", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Dawn Aponte", title:"Senior Vice President of Football Operations and Strategy", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),
  fact({ team:"NYG", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Tim McDonnell", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),
  fact({ team:"NYG", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"John Ritcher", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),
  fact({ team:"NYG", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Chris Rossetti", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),
  fact({ team:"NYG", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Dennis Hickey", title:"Senior Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),
  fact({ team:"NYG", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Chris Mara", title:"Senior Player Personnel Executive, Board Director", authorityScopes:["OWNERSHIP","PERSONNEL","DRAFT","ROSTER"], sourceId:"giants-front-office-2026", sourceLabel:"Giants Front Office", sourceUri:NYG }),

  // Washington Commanders
  fact({ team:"WAS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Lance Newmark", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"commanders-lance-newmark-2026", sourceLabel:"Commanders Lance Newmark Biography", sourceUri:WAS_NEWMARK, notes:"Official biography states Newmark reports directly to GM Adam Peters and oversees Washington's personnel and scouting departments." }),
  fact({ team:"WAS", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Brandon Sosna", title:"Senior Vice President, Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),
  fact({ team:"WAS", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Doug Williams", title:"Senior Advisor to the General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),
  fact({ team:"WAS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"David Blackburn", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"ASSISTANT_GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),
  fact({ team:"WAS", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Ryan Kessenich", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"ASSISTANT_GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),
  fact({ team:"WAS", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Chris White", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"ASSISTANT_GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),
  fact({ team:"WAS", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Demitrius Washington", title:"Senior Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),
  fact({ team:"WAS", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Rob Rogers", title:"Vice President of Football Administration", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"commanders-front-office-2026", sourceLabel:"Commanders Front Office", sourceUri:WAS }),

  // Arizona Cardinals
  fact({ team:"ARI", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Dave Sears", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"cardinals-front-office-2026", sourceLabel:"Cardinals Front Office", sourceUri:ARI }),
  fact({ team:"ARI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Rob Kisiel", title:"Vice President, Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"cardinals-front-office-2026", sourceLabel:"Cardinals Front Office", sourceUri:ARI }),
  fact({ team:"ARI", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Matt Harriss", title:"Vice President, Football Administration", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"cardinals-front-office-2026", sourceLabel:"Cardinals Front Office", sourceUri:ARI }),
  fact({ team:"ARI", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Glen Fox", title:"Director, Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"cardinals-front-office-2026", sourceLabel:"Cardinals Front Office", sourceUri:ARI }),
  fact({ team:"ARI", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Alfonza Knight", title:"Assistant Director, College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"cardinals-front-office-2026", sourceLabel:"Cardinals Front Office", sourceUri:ARI }),

  // Los Angeles Rams
  fact({ team:"LAR", role:"ASSISTANT_GENERAL_MANAGER", displayName:"John McKay", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"rams-front-office-2026", sourceLabel:"Rams Front Office", sourceUri:LAR }),
  fact({ team:"LAR", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Nicole Blake", title:"Director, Scouting, Strategy & Analytics", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"rams-front-office-2026", sourceLabel:"Rams Front Office", sourceUri:LAR }),
  fact({ team:"LAR", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Ray Farmer", title:"Senior Advisor to General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"rams-front-office-2026", sourceLabel:"Rams Front Office", sourceUri:LAR }),
  fact({ team:"LAR", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Taylor Morton", title:"Senior Personnel Executive & Deputy Chief of College Scouting Staff", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"rams-front-office-2026", sourceLabel:"Rams Front Office", sourceUri:LAR }),
  fact({ team:"LAR", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Matt Waugh", title:"Director, Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"rams-front-office-2026", sourceLabel:"Rams Front Office", sourceUri:LAR }),

  // Seattle Seahawks
  fact({ team:"SEA", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"John Schneider", title:"President of Football Operations/General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"seahawks-front-office-2026", sourceLabel:"Seahawks Front Office", sourceUri:SEA }),
  fact({ team:"SEA", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Matt Berry", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"seahawks-2026-front-office-promotions", sourceLabel:"Seahawks 2026 Front Office Promotions", sourceUri:SEA_PROMOTIONS }),
  fact({ team:"SEA", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Willie Schneider", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"seahawks-2026-front-office-promotions", sourceLabel:"Seahawks 2026 Front Office Promotions", sourceUri:SEA_PROMOTIONS }),
  fact({ team:"SEA", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Aaron Hineline", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"seahawks-2026-front-office-promotions", sourceLabel:"Seahawks 2026 Front Office Promotions", sourceUri:SEA_PROMOTIONS }),
  fact({ team:"SEA", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Armani Perez", title:"Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"seahawks-2026-front-office-promotions", sourceLabel:"Seahawks 2026 Front Office Promotions", sourceUri:SEA_PROMOTIONS }),
  fact({ team:"SEA", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Jason Barnes", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"seahawks-2026-front-office-promotions", sourceLabel:"Seahawks 2026 Front Office Promotions", sourceUri:SEA_PROMOTIONS }),
  fact({ team:"SEA", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Patrick Ward", title:"Vice President/Research & Analytics", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"seahawks-2026-front-office-promotions", sourceLabel:"Seahawks 2026 Front Office Promotions", sourceUri:SEA_PROMOTIONS }),
];

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-PRIMARY-SOURCE-ENRICHMENT-2026-W5-1.0.0";

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5 = Object.freeze(
  entries.map((entry) => Object.freeze(entry))
);

export function listNFLTeamOrganizationalPrimarySourceEnrichment2026Wave5() {
  return NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5;
}

export function getNFLTeamOrganizationalPrimarySourceEnrichment2026Wave5(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return Object.freeze(NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5.filter((entry) => entry.team === key));
}

export default NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5;
