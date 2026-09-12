// INT-1B.2D — 2026 primary-source organizational enrichment, wave 4.
// NFC North + remaining NFC South organizations: CHI, DET, GB, MIN, CAR, NO.
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

const CHI = "https://www.chicagobears.com/team/front-office/";
const CHI_KING = "https://www.chicagobears.com/news/jeff-king-elevated-to-bears-assistant-gm-role";
const DET = "https://www.detroitlions.com/team/front-office-roster/";
const DET_UPDATES = "https://www.detroitlions.com/news/lions-announce-updates-to-player-personnel-and-football-operations-staffs-x0586";
const GB = "https://www.packers.com/team/front-office-roster/";
const GB_PROMOTIONS = "https://www.packers.com/news/packers-announce-promotions-in-player-personnel-may-19-2026";
const MIN = "https://www.vikings.com/team/front-office-roster/";
const MIN_AGM = "https://www.vikings.com/news/vikings-hire-andrew-healy-trent-kirchner-as-assistant-general-managers";
const CAR = "https://www.panthers.com/team/ownership_business/";
const CAR_PERSONNEL = "https://www.panthers.com/news/panthers-announce-changes-to-scouting-and-personnel-department";
const CAR_MORGAN = "https://www.panthers.com/news/dan-morgan-postseason-press-conference-transcript";
const CAR_TILIS = "https://www.panthers.com/team/ownership_business/brandt-tilis";
const NO = "https://www.neworleanssaints.com/team/front-office-roster/";
const NO_IRELAND = "https://www.neworleanssaints.com/team/front-office-roster/jeff-ireland";
const NO_PARENTON = "https://www.neworleanssaints.com/team/front-office-roster/michael-parenton";

const entries = [
  // Chicago Bears
  fact({ team:"CHI", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Jeff King", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bears-jeff-king-agm-2026", sourceLabel:"Bears announce Jeff King promotion", sourceUri:CHI_KING }),
  fact({ team:"CHI", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Francis Saint Paul", title:"Assistant Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"COLLEGE_SCOUTING_EXECUTIVE", sourceId:"bears-front-office-2026", sourceLabel:"Bears Front Office", sourceUri:CHI }),
  fact({ team:"CHI", role:"PRO_SCOUTING_EXECUTIVE", displayName:"D.J. Hord", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bears-front-office-2026", sourceLabel:"Bears Front Office", sourceUri:CHI }),
  fact({ team:"CHI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Trey Koziol", title:"Senior Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bears-front-office-2026", sourceLabel:"Bears Front Office", sourceUri:CHI }),
  fact({ team:"CHI", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Breck Ackley", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"bears-front-office-2026", sourceLabel:"Bears Front Office", sourceUri:CHI, notes:"Official 2026 Bears front-office listing identifies Ackley in player-personnel leadership; college-scouting evidence is retained separately where directly supported." }),

  // Detroit Lions
  fact({ team:"DET", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Ray Agnew", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"lions-front-office-2026", sourceLabel:"Lions Front Office", sourceUri:DET }),
  fact({ team:"DET", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Dwayne Joseph", title:"Vice President, Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"lions-personnel-updates-2026", sourceLabel:"Lions 2026 Personnel Staff Updates", sourceUri:DET_UPDATES }),
  fact({ team:"DET", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Rob Lohman", title:"Vice President, Roster Operations/Evaluations", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"lions-personnel-updates-2026", sourceLabel:"Lions 2026 Personnel Staff Updates", sourceUri:DET_UPDATES }),
  fact({ team:"DET", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Brian Hudspeth", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"lions-front-office-2026", sourceLabel:"Lions Front Office", sourceUri:DET }),
  fact({ team:"DET", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Joe Kelleher", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"lions-front-office-2026", sourceLabel:"Lions Front Office", sourceUri:DET }),
  fact({ team:"DET", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"John Dorsey", title:"Senior Personnel Executive", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"lions-front-office-2026", sourceLabel:"Lions Front Office", sourceUri:DET }),
  fact({ team:"DET", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Chris Grier", title:"Personnel Advisor", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"lions-personnel-updates-2026", sourceLabel:"Lions 2026 Personnel Staff Updates", sourceUri:DET_UPDATES }),

  // Green Bay Packers — no fabricated assistant GM; current official structure is preserved.
  fact({ team:"GB", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Milt Hendrickson", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"packers-personnel-promotions-2026", sourceLabel:"Packers 2026 Player Personnel Promotions", sourceUri:GB_PROMOTIONS }),
  fact({ team:"GB", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Richmond Williams", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"packers-front-office-2026", sourceLabel:"Packers Front Office", sourceUri:GB }),
  fact({ team:"GB", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Lee Gissendaner", title:"Senior Player Personnel Executive/Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"packers-front-office-2026", sourceLabel:"Packers Front Office", sourceUri:GB }),
  fact({ team:"GB", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Patrick Moore", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"packers-personnel-promotions-2026", sourceLabel:"Packers 2026 Player Personnel Promotions", sourceUri:GB_PROMOTIONS }),
  fact({ team:"GB", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"John Wojciechowski", title:"Director – Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL"], reportsToRole:"GENERAL_MANAGER", sourceId:"packers-personnel-promotions-2026", sourceLabel:"Packers 2026 Player Personnel Promotions", sourceUri:GB_PROMOTIONS }),
  fact({ team:"GB", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Matt Malaspina", title:"Senior Player Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"packers-front-office-2026", sourceLabel:"Packers Front Office", sourceUri:GB }),

  // Minnesota Vikings
  fact({ team:"MIN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Andrew Healy", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"vikings-agm-hires-2026", sourceLabel:"Vikings 2026 Assistant GM Hires", sourceUri:MIN_AGM }),
  fact({ team:"MIN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Trent Kirchner", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"vikings-agm-hires-2026", sourceLabel:"Vikings 2026 Assistant GM Hires", sourceUri:MIN_AGM, notes:"Official Vikings biography states Kirchner assists GM Nolan Teasley with football operations and leads scouting operations." }),
  fact({ team:"MIN", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Ryan Monnens", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"vikings-front-office-2026", sourceLabel:"Vikings Front Office", sourceUri:MIN }),
  fact({ team:"MIN", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Sam DeLuca", title:"Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"vikings-front-office-2026", sourceLabel:"Vikings Front Office", sourceUri:MIN }),
  fact({ team:"MIN", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Mike Sholiton", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"vikings-front-office-2026", sourceLabel:"Vikings Front Office", sourceUri:MIN }),
  fact({ team:"MIN", role:"EXECUTIVE_VP_FOOTBALL_OPERATIONS", displayName:"Rob Brzezinski", title:"Executive Vice President - Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], sourceId:"vikings-front-office-2026", sourceLabel:"Vikings Front Office", sourceUri:MIN }),
  fact({ team:"MIN", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Ryan Pace", title:"Football Advisor", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"vikings-front-office-2026", sourceLabel:"Vikings Front Office", sourceUri:MIN }),

  // Carolina Panthers — no assistant GM title is fabricated.
  fact({ team:"CAR", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"Dan Morgan", title:"President of Football Operations/General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"panthers-morgan-title-2026", sourceLabel:"Panthers Dan Morgan Postseason Press Conference", sourceUri:CAR_MORGAN }),
  fact({ team:"CAR", role:"EXECUTIVE_VP_FOOTBALL_OPERATIONS", displayName:"Brandt Tilis", title:"Executive Vice President of Football Operations", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], sourceId:"panthers-brandt-tilis", sourceLabel:"Panthers Brandt Tilis Biography", sourceUri:CAR_TILIS, notes:"Official biography says Tilis works hand-in-hand with Dan Morgan across scouting, salary cap and analytics and owns football-administration/non-coaching operations responsibilities." }),
  fact({ team:"CAR", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Jared Kirksey", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"panthers-personnel-changes-2026", sourceLabel:"Panthers 2026 Scouting and Personnel Changes", sourceUri:CAR_PERSONNEL }),
  fact({ team:"CAR", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Lee McNeill", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"panthers-front-office-2026", sourceLabel:"Panthers Front Office", sourceUri:CAR }),
  fact({ team:"CAR", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"David Whittington", title:"Assistant Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"PLAYER_PERSONNEL_EXECUTIVE", sourceId:"panthers-front-office-2026", sourceLabel:"Panthers Front Office", sourceUri:CAR }),
  fact({ team:"CAR", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Justin Davidov", title:"Director of Football Administration", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"EXECUTIVE_VP_FOOTBALL_OPERATIONS", sourceId:"panthers-personnel-changes-2026", sourceLabel:"Panthers 2026 Scouting and Personnel Changes", sourceUri:CAR_PERSONNEL }),
  fact({ team:"CAR", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Eric Eager", title:"Vice President of Football Analytics", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"panthers-front-office-2026", sourceLabel:"Panthers Front Office", sourceUri:CAR }),

  // New Orleans Saints
  fact({ team:"NO", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Khai Harley", title:"Senior Vice President of Football Operations/Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"saints-front-office-2026", sourceLabel:"Saints Front Office", sourceUri:NO }),
  fact({ team:"NO", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Jeff Ireland", title:"Senior VP/Assistant General Manager - College Personnel", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"saints-jeff-ireland", sourceLabel:"Saints Jeff Ireland Biography", sourceUri:NO_IRELAND }),
  fact({ team:"NO", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Jeff Ireland", title:"Senior VP/Assistant General Manager - College Personnel", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"saints-jeff-ireland", sourceLabel:"Saints Jeff Ireland Biography", sourceUri:NO_IRELAND, notes:"Official biography identifies Ireland as the lead voice in the college scouting process and NFL Draft preparation." }),
  fact({ team:"NO", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Michael Parenton", title:"Vice President of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"saints-michael-parenton", sourceLabel:"Saints Michael Parenton Biography", sourceUri:NO_PARENTON, notes:"Official biography states Parenton is in charge of the pro personnel department and works daily with Mickey Loomis on roster construction." }),
  fact({ team:"NO", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Randy Mueller", title:"Senior Personnel Advisor", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"saints-front-office-2026", sourceLabel:"Saints Front Office", sourceUri:NO }),
  fact({ team:"NO", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Thomas Dimitroff", title:"Senior Personnel Advisor", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"saints-front-office-2026", sourceLabel:"Saints Front Office", sourceUri:NO }),
  fact({ team:"NO", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Scott Kuhn", title:"Director of Football Administration", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"saints-front-office-2026", sourceLabel:"Saints Front Office", sourceUri:NO }),
];

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-PRIMARY-SOURCE-ENRICHMENT-2026-W4-1.0.0";

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4 = Object.freeze(
  entries.map((entry) => Object.freeze(entry))
);

export function listNFLTeamOrganizationalPrimarySourceEnrichment2026Wave4() {
  return NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4;
}

export function getNFLTeamOrganizationalPrimarySourceEnrichment2026Wave4(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return Object.freeze(NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4.filter((entry) => entry.team === key));
}

export default NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4;
