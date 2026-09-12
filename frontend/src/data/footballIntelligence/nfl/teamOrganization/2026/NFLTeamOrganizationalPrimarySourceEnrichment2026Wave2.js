// INT-1B.2B — 2026 primary-source organizational enrichment, wave 2.
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

const BAL = "https://www.baltimoreravens.com/team/front-office-roster/";
const BUF = "https://www.buffalobills.com/team/front-office-roster/";
const BUF_PERSONNEL = "https://www.buffalobills.com/news/buffalo-bills-announce-promotions-and-additions-to-personnel-and-analytics-staffs-for-2025-season";
const BUF_2026 = "https://www.buffalobills.com/news/top-5-things-to-know-from-terry-pegula-and-brandon-beane-s-press-conference";
const CIN = "https://www.bengals.com/team/front-office-roster/";
const CLE = "https://www.clevelandbrowns.com/team/front-office-roster/";
const NE_WOLF = "https://www.patriots.com/news/transcript-eliot-wolf-press-conference-4-13";
const NE_COWDEN = "https://www.patriots.com/video/unfiltered-1-on-1-with-field-yates";
const NE_2024_PERSONNEL = "https://www.patriots.com/news/patriots-announce-personnel-changes-for-the-2024-season";
const NE_SCOUT = "https://www.patriots.com/news/matt-groh-and-camren-williams-detail-the-process-for-the-patriots-scouting-department-at-the-senior-bowl";
const NYJ = "https://www.newyorkjets.com/team/front-office-roster/";
const PIT = "https://www.steelers.com/team/front-office-roster/";

const entries = [
  // Baltimore Ravens
  fact({ team:"BAL", role:"GENERAL_MANAGER", displayName:"Eric DeCosta", title:"Executive Vice President & General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"ravens-front-office-2026", sourceLabel:"Ravens Front Office Roster", sourceUri:BAL }),
  fact({ team:"BAL", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"George Kokinis", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"ravens-front-office-2026", sourceLabel:"Ravens Front Office Roster", sourceUri:BAL }),
  fact({ team:"BAL", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Mark Azevedo", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"ravens-front-office-2026", sourceLabel:"Ravens Front Office Roster", sourceUri:BAL }),
  fact({ team:"BAL", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Joey Cleary", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"ravens-front-office-2026", sourceLabel:"Ravens Front Office Roster", sourceUri:BAL }),
  fact({ team:"BAL", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Corey Frazier", title:"Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"ravens-front-office-2026", sourceLabel:"Ravens Front Office Roster", sourceUri:BAL }),
  fact({ team:"BAL", role:"FOOTBALL_OPERATIONS_EXECUTIVE", displayName:"Nick Matteo", title:"Vice President of Football Operations", authorityScopes:["FOOTBALL_OPERATIONS"], reportsToRole:"GENERAL_MANAGER", sourceId:"ravens-front-office-2026", sourceLabel:"Ravens Front Office Roster", sourceUri:BAL }),

  // Buffalo Bills
  fact({ team:"BUF", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"Brandon Beane", title:"President of Football Operations & General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"bills-front-office-2026", sourceLabel:"Bills Front Office", sourceUri:BUF, notes:"Official club front office identifies Beane as President of Football Operations & General Manager; club announced the additional president title in January 2026." }),
  fact({ team:"BUF", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Brian Gaine", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bills-2026-leadership-presser", sourceLabel:"Bills — Pegula and Beane 2026 Press Conference", sourceUri:BUF_2026 }),
  fact({ team:"BUF", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Terrance Gray", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bills-personnel-promotions-2025", sourceLabel:"Bills Personnel & Analytics Promotions", sourceUri:BUF_PERSONNEL }),
  fact({ team:"BUF", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Malik Boyd", title:"Senior Personnel Advisor", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bills-scouting-moves-2023", sourceLabel:"Bills Scouting Department Moves", sourceUri:"https://www.buffalobills.com/news/bills-announced-these-moves-within-the-scouting-department" }),

  // Cincinnati Bengals — preserve the club's unconventional title structure rather than inventing GM labels.
  fact({ team:"CIN", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Duke Tobin", title:"Director of Player Personnel", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"bengals-front-office-2026", sourceLabel:"Bengals Front Office Staff", sourceUri:CIN }),
  fact({ team:"CIN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Trey Brown", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"bengals-front-office-2026", sourceLabel:"Bengals Front Office Staff", sourceUri:CIN }),
  fact({ team:"CIN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Mike Potts", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"bengals-front-office-2026", sourceLabel:"Bengals Front Office Staff", sourceUri:CIN }),
  fact({ team:"CIN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Steven Radicevic", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"bengals-front-office-2026", sourceLabel:"Bengals Front Office Staff", sourceUri:CIN }),
  fact({ team:"CIN", role:"SCOUTING_EXECUTIVE", displayName:"Andrew Johnson", title:"Scouting Executive", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"bengals-front-office-2026", sourceLabel:"Bengals Front Office Staff", sourceUri:CIN }),

  // Cleveland Browns
  fact({ team:"CLE", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"Andrew Berry", title:"Executive Vice President, Football Operations & General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"browns-front-office-2026", sourceLabel:"Browns Front Office", sourceUri:CLE }),
  fact({ team:"CLE", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Catherine Hickman", title:"Assistant GM & Vice President of Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"browns-front-office-2026", sourceLabel:"Browns Front Office", sourceUri:CLE }),
  fact({ team:"CLE", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Glenn Cook", title:"Assistant GM & Vice President of Player Personnel", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"browns-front-office-2026", sourceLabel:"Browns Front Office", sourceUri:CLE }),
  fact({ team:"CLE", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Adam Al-Khayyal", title:"Director, Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"browns-front-office-2026", sourceLabel:"Browns Front Office", sourceUri:CLE }),
  fact({ team:"CLE", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Max Paulus", title:"Director, College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"browns-front-office-2026", sourceLabel:"Browns Front Office", sourceUri:CLE }),

  // New England Patriots — 2026 club materials show a layered personnel group rather than a conventional GM title.
  fact({ team:"NE", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Eliot Wolf", title:"Executive Vice President of Player Personnel", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"patriots-eliot-wolf-2026", sourceLabel:"Patriots — Eliot Wolf 2026 Press Conference", sourceUri:NE_WOLF }),
  fact({ team:"NE", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Ryan Cowden", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"patriots-ryan-cowden-2026", sourceLabel:"Patriots — Ryan Cowden 2026 Draft Interview", sourceUri:NE_COWDEN }),
  fact({ team:"NE", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Matt Groh", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"patriots-personnel-2024-current-context", sourceLabel:"Patriots Personnel Changes", sourceUri:NE_2024_PERSONNEL, notes:"Role is retained as organizational evidence; 2026 Eliot Wolf club remarks explicitly acknowledge Groh as part of the active personnel group." }),
  fact({ team:"NE", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Camren Williams", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"patriots-college-scouting", sourceLabel:"Patriots Scouting Department — Senior Bowl", sourceUri:NE_SCOUT }),
  fact({ team:"NE", role:"PERSONNEL_ADVISOR", displayName:"Alonzo Highsmith", title:"Senior Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"patriots-eliot-wolf-2026", sourceLabel:"Patriots — Eliot Wolf 2026 Press Conference", sourceUri:NE_WOLF }),

  // New York Jets
  fact({ team:"NYJ", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Robbie Paton", title:"Director, Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jets-front-office-2026", sourceLabel:"Jets Front Office", sourceUri:NYJ }),
  fact({ team:"NYJ", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Evan Ardoin", title:"Director, Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jets-front-office-2026", sourceLabel:"Jets Front Office", sourceUri:NYJ }),
  fact({ team:"NYJ", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Jason Mandolesi", title:"Director, College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"jets-front-office-2026", sourceLabel:"Jets Front Office", sourceUri:NYJ }),
  fact({ team:"NYJ", role:"FOOTBALL_OPERATIONS_EXECUTIVE", displayName:"Dan Zbojovsky", title:"Senior Director, Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jets-front-office-2026", sourceLabel:"Jets Front Office", sourceUri:NYJ }),
  fact({ team:"NYJ", role:"PERSONNEL_ADVISOR", displayName:"Rick Spielman", title:"Senior Football Advisor", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jets-front-office-2026", sourceLabel:"Jets Front Office", sourceUri:NYJ }),

  // Pittsburgh Steelers
  fact({ team:"PIT", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Andy Weidl", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"steelers-front-office-2026", sourceLabel:"Steelers Front Office Roster", sourceUri:PIT }),
  fact({ team:"PIT", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Dan Rooney Jr.", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"steelers-front-office-2026", sourceLabel:"Steelers Front Office Roster", sourceUri:PIT }),
  fact({ team:"PIT", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Sheldon White", title:"Senior Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"steelers-front-office-2026", sourceLabel:"Steelers Front Office Roster", sourceUri:PIT }),
  fact({ team:"PIT", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Tim Gribble", title:"Senior Director of College Personnel", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"steelers-front-office-2026", sourceLabel:"Steelers Front Office Roster", sourceUri:PIT }),
  fact({ team:"PIT", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Dan Colbert", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"steelers-front-office-2026", sourceLabel:"Steelers Front Office Roster", sourceUri:PIT }),
  fact({ team:"PIT", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Max Gruder", title:"Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"steelers-front-office-2026", sourceLabel:"Steelers Front Office Roster", sourceUri:PIT }),
];

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-PRIMARY-SOURCE-ENRICHMENT-2026-W2-1.0.0";

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2 = Object.freeze(
  entries.map((entry) => Object.freeze(entry))
);

export function listNFLTeamOrganizationalPrimarySourceEnrichment2026Wave2() {
  return NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2;
}

export function getNFLTeamOrganizationalPrimarySourceEnrichment2026Wave2(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return Object.freeze(NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2.filter((entry) => entry.team === key));
}

export default NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2;
