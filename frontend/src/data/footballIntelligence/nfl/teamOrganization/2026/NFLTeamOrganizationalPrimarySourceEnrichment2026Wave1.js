// INT-1B.2A — 2026 primary-source organizational enrichment, wave 1.
// Verified 2026-09-05 from official club sources. Read-only evidence; no scoring.

const VERIFIED_AT = "2026-09-05T00:00:00Z";

const fact = ({ team, domain, role, displayName, title, authorityScopes = [], reportsToRole = null, sourceId, sourceLabel, sourceUri, notes = null }) => Object.freeze({
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

const SF = "https://www.49ers.com/team/front-office-roster/";
const TB = "https://www.buccaneers.com/team/front-office-roster/";
const KC = "https://www.chiefs.com/team/front-office-roster/";
const DAL = "https://www.dallascowboys.com/team/front-office-roster/";
const LAC = "https://www.chargers.com/team/front-office-roster/";
const MIA = "https://www.miamidolphins.com/news/miami-dolphins-announce-promotions-and-additions-to-personnel-front-office-player-performance-staffs";
const ATL = "https://www.atlantafalcons.com/team/front-office-roster/";

const entries = [
  // San Francisco 49ers
  fact({ team:"SF", domain:"FOOTBALL_OPERATIONS", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"John Lynch", title:"President of Football Operations/General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"49ers-front-office-2026", sourceLabel:"49ers Front Office Roster", sourceUri:SF }),
  fact({ team:"SF", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"RJ Gillen", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"49ers-rj-gillen-2026", sourceLabel:"49ers — RJ Gillen", sourceUri:"https://www.49ers.com/team/front-office-roster/r-j-gillen", notes:"Official club biography states Gillen oversees daily player-personnel operations and advises John Lynch and Kyle Shanahan on personnel decisions and team-building strategy." }),
  fact({ team:"SF", domain:"FOOTBALL_OPERATIONS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Tariq Ahmad", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"49ers-front-office-2026", sourceLabel:"49ers Front Office Roster", sourceUri:SF }),

  // Tampa Bay Buccaneers
  fact({ team:"TB", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Mike Greenberg", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"buccaneers-front-office-2026", sourceLabel:"Buccaneers Front Office Staff", sourceUri:TB }),
  fact({ team:"TB", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Rob McCartney", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"buccaneers-front-office-2026", sourceLabel:"Buccaneers Front Office Staff", sourceUri:TB }),
  fact({ team:"TB", domain:"FOOTBALL_OPERATIONS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Mike Biehl", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"buccaneers-front-office-2026", sourceLabel:"Buccaneers Front Office Staff", sourceUri:TB }),
  fact({ team:"TB", domain:"FOOTBALL_OPERATIONS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Shane Scannell", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"buccaneers-front-office-2026", sourceLabel:"Buccaneers Front Office Staff", sourceUri:TB }),
  fact({ team:"TB", domain:"FOOTBALL_OPERATIONS", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Tony Hardie", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"buccaneers-front-office-2026", sourceLabel:"Buccaneers Front Office Staff", sourceUri:TB }),

  // Kansas City Chiefs
  fact({ team:"KC", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Chris Shea", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"chiefs-front-office-2026", sourceLabel:"Chiefs Front Office Staff", sourceUri:KC }),
  fact({ team:"KC", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Mike Bradway", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"chiefs-front-office-2026", sourceLabel:"Chiefs Front Office Staff", sourceUri:KC }),

  // Dallas Cowboys
  fact({ team:"DAL", domain:"FOOTBALL_OPERATIONS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Will McClay", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"cowboys-front-office-2026", sourceLabel:"Dallas Cowboys Front Office", sourceUri:DAL }),
  fact({ team:"DAL", domain:"FOOTBALL_OPERATIONS", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Alex Loomis", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"cowboys-front-office-2026", sourceLabel:"Dallas Cowboys Front Office", sourceUri:DAL }),
  fact({ team:"DAL", domain:"FOOTBALL_OPERATIONS", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Mitch LaPoint", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"cowboys-front-office-2026", sourceLabel:"Dallas Cowboys Front Office", sourceUri:DAL }),

  // Los Angeles Chargers
  fact({ team:"LAC", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Chad Alexander", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"chargers-front-office-2026", sourceLabel:"Chargers Front Office", sourceUri:LAC }),
  fact({ team:"LAC", domain:"FOOTBALL_OPERATIONS", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Louis Clark", title:"Senior Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"chargers-front-office-2026", sourceLabel:"Chargers Front Office", sourceUri:LAC }),
  fact({ team:"LAC", domain:"FOOTBALL_OPERATIONS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Corey Krawiec", title:"Director of Player Personnel Strategy", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"chargers-front-office-2026", sourceLabel:"Chargers Front Office", sourceUri:LAC }),

  // Miami Dolphins
  fact({ team:"MIA", domain:"FOOTBALL_OPERATIONS", role:"EXECUTIVE_VP_FOOTBALL_OPERATIONS", displayName:"Brandon Shore", title:"Executive Vice President of Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], sourceId:"dolphins-personnel-promotions-2026", sourceLabel:"Miami Dolphins — Personnel, Front Office and Player Performance Promotions", sourceUri:MIA, notes:"Official club announcement states Shore works alongside Head Coach Jeff Hafley and GM Jon-Eric Sullivan on football administration and operations." }),
  fact({ team:"MIA", domain:"FOOTBALL_OPERATIONS", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Kyle Smith", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"dolphins-personnel-promotions-2026", sourceLabel:"Miami Dolphins — Personnel, Front Office and Player Performance Promotions", sourceUri:MIA }),
  fact({ team:"MIA", domain:"FOOTBALL_OPERATIONS", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Matt Winston", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"dolphins-personnel-promotions-2026", sourceLabel:"Miami Dolphins — Personnel, Front Office and Player Performance Promotions", sourceUri:MIA }),
  fact({ team:"MIA", domain:"FOOTBALL_OPERATIONS", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Venzell Boulware", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"dolphins-personnel-promotions-2026", sourceLabel:"Miami Dolphins — Personnel, Front Office and Player Performance Promotions", sourceUri:MIA }),
  fact({ team:"MIA", domain:"FOOTBALL_OPERATIONS", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Grant Wallace", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"dolphins-personnel-promotions-2026", sourceLabel:"Miami Dolphins — Personnel, Front Office and Player Performance Promotions", sourceUri:MIA }),

  // Atlanta Falcons — reinforce authority structure from primary club source
  fact({ team:"ATL", domain:"FOOTBALL_OPERATIONS", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"Matt Ryan", title:"President of Football", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER","COACHING"], reportsToRole:"PRINCIPAL_OWNER", sourceId:"falcons-front-office-2026", sourceLabel:"Atlanta Falcons Front Office Roster", sourceUri:ATL, notes:"Official club page states Ryan oversees all aspects of Falcons football, including the head coach and general manager positions, and reports directly to Owner and Chairman Arthur M. Blank." }),
  fact({ team:"ATL", domain:"FOOTBALL_OPERATIONS", role:"GENERAL_MANAGER", displayName:"Ian Cunningham", title:"General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"PRESIDENT_FOOTBALL_OPERATIONS", sourceId:"falcons-front-office-2026", sourceLabel:"Atlanta Falcons Front Office Roster", sourceUri:ATL }),
];

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-PRIMARY-SOURCE-ENRICHMENT-2026-W1-1.0.0";

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1 = Object.freeze(
  entries.map((entry) => Object.freeze(entry))
);

export function listNFLTeamOrganizationalPrimarySourceEnrichment2026Wave1() {
  return NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1;
}

export function getNFLTeamOrganizationalPrimarySourceEnrichment2026Wave1(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return Object.freeze(NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1.filter((entry) => entry.team === key));
}

export default NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1;
