// INT-1B.2C — 2026 primary-source organizational enrichment, wave 3.
// Remaining AFC organizations: DEN, HOU, IND, JAX, LV, TEN.
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

const DEN = "https://www.denverbroncos.com/team/front-office-roster/";
const HOU = "https://www.houstontexans.com/team/front-office-roster/";
const IND = "https://www.colts.com/team/front-office-roster/";
const IND_DRAFT = "https://www.colts.com/news/colts-win-multiple-2026-bart-list-awards-ed-dodds-scouts-personnel";
const JAX = "https://www.jaguars.com/team/front-office-roster/";
const JAX_SCOUTS = "https://www.jaguars.com/team/scouts";
const LV = "https://www.raiders.com/team/front-office-roster/";
const LV_PROMOTIONS = "https://www.raiders.com/news/raiders-announce-promotions-for-player-personnel-staff";
const TEN = "https://www.tennesseetitans.com/team/front-office-roster/";
const TEN_DRAFT = "https://www.tennesseetitans.com/news/tennessee-titans-2026-draft-preview";
const TEN_PROMOTIONS = "https://www.tennesseetitans.com/news/titans-announce-one-recent-hire-and-17-promotions-on-football-staff";

const entries = [
  // Denver Broncos
  fact({ team:"DEN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Reed Burckhardt", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"broncos-front-office-2026", sourceLabel:"Broncos Staff Directory", sourceUri:DEN }),
  fact({ team:"DEN", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"A.J. Durso", title:"Co-Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"broncos-front-office-2026", sourceLabel:"Broncos Staff Directory", sourceUri:DEN }),
  fact({ team:"DEN", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Cam Williams", title:"Co-Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"broncos-front-office-2026", sourceLabel:"Broncos Staff Directory", sourceUri:DEN }),
  fact({ team:"DEN", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Jordon Dizon", title:"Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"broncos-front-office-2026", sourceLabel:"Broncos Staff Directory", sourceUri:DEN }),
  fact({ team:"DEN", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Bryan Chesin", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"broncos-front-office-2026", sourceLabel:"Broncos Staff Directory", sourceUri:DEN }),
  fact({ team:"DEN", role:"EXECUTIVE_VP_FOOTBALL_OPERATIONS", displayName:"Rich Hurtado", title:"Executive Vice President of Football Operations", authorityScopes:["FOOTBALL_OPERATIONS"], sourceId:"broncos-front-office-2026", sourceLabel:"Broncos Staff Directory", sourceUri:DEN }),

  // Houston Texans
  fact({ team:"HOU", role:"GENERAL_MANAGER", displayName:"Nick Caserio", title:"Executive Vice President and General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),
  fact({ team:"HOU", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Chris Blanco", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),
  fact({ team:"HOU", role:"ASSISTANT_GENERAL_MANAGER", displayName:"James Liipfert", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),
  fact({ team:"HOU", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"DJ Debick", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),
  fact({ team:"HOU", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Steve Cargile", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),
  fact({ team:"HOU", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Mozique McCurtis", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),
  fact({ team:"HOU", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Joe Vernon", title:"Senior Vice President of Football Operations", authorityScopes:["FOOTBALL_OPERATIONS"], sourceId:"texans-front-office-2026", sourceLabel:"Texans Front Office", sourceUri:HOU }),

  // Indianapolis Colts
  fact({ team:"IND", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Ed Dodds", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"colts-front-office-2026", sourceLabel:"Colts Front Office", sourceUri:IND }),
  fact({ team:"IND", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Kevin Rogers", title:"Director of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"colts-front-office-2026", sourceLabel:"Colts Front Office", sourceUri:IND }),
  fact({ team:"IND", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Jon Shaw", title:"Director of Pro Personnel", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"colts-front-office-2026", sourceLabel:"Colts Front Office", sourceUri:IND }),
  fact({ team:"IND", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Matt Terpening", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"colts-front-office-2026", sourceLabel:"Colts Front Office", sourceUri:IND, notes:"Official Colts 2026 combine coverage also identifies Terpening as a 2026 BART executive honoree." }),
  fact({ team:"IND", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Jamie Moore", title:"Assistant Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"COLLEGE_SCOUTING_EXECUTIVE", sourceId:"colts-front-office-2026", sourceLabel:"Colts Front Office", sourceUri:IND }),
  fact({ team:"IND", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Mike Bluem", title:"Director of Football Administration", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"colts-2026-draft-room", sourceLabel:"Colts 2026 Draft Room Coverage", sourceUri:IND_DRAFT }),

  // Jacksonville Jaguars — no assistant GM title is fabricated; official club personnel structure is preserved.
  fact({ team:"JAX", role:"GENERAL_MANAGER", displayName:"James Gladstone", title:"General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"jaguars-front-office-2026", sourceLabel:"Jaguars Front Office Roster", sourceUri:JAX }),
  fact({ team:"JAX", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"JW Jordan", title:"Senior Advisor to the General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jaguars-scouts-2026", sourceLabel:"Jaguars Scouts", sourceUri:JAX_SCOUTS }),
  fact({ team:"JAX", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Brian Xanders", title:"Senior Advisor to the General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jaguars-scouts-2026", sourceLabel:"Jaguars Scouts", sourceUri:JAX_SCOUTS }),
  fact({ team:"JAX", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Brian Hill", title:"Director of College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"jaguars-scouts-2026", sourceLabel:"Jaguars Scouts", sourceUri:JAX_SCOUTS }),
  fact({ team:"JAX", role:"PRO_SCOUTING_EXECUTIVE", displayName:"DeJuan Polk", title:"Director of Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jaguars-scouts-2026", sourceLabel:"Jaguars Scouts", sourceUri:JAX_SCOUTS }),
  fact({ team:"JAX", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Regis Eller", title:"Senior Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jaguars-scouts-2026", sourceLabel:"Jaguars Scouts", sourceUri:JAX_SCOUTS }),
  fact({ team:"JAX", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Tim Walsh", title:"Director of Football Administration", authorityScopes:["FOOTBALL_OPERATIONS","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"jaguars-front-office-2026", sourceLabel:"Jaguars Front Office Roster", sourceUri:JAX }),

  // Las Vegas Raiders
  fact({ team:"LV", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Brian Stark", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"raiders-front-office-2026", sourceLabel:"Raiders Front Office", sourceUri:LV }),
  fact({ team:"LV", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Brandon Hunt", title:"Vice President, Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"raiders-front-office-2026", sourceLabel:"Raiders Front Office", sourceUri:LV }),
  fact({ team:"LV", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Anthony Patch", title:"Senior Personnel Executive", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"raiders-front-office-2026", sourceLabel:"Raiders Front Office", sourceUri:LV }),
  fact({ team:"LV", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Brandon Yeargan", title:"Director, College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"raiders-front-office-2026", sourceLabel:"Raiders Front Office", sourceUri:LV }),
  fact({ team:"LV", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Ben Chester", title:"Director, Pro Scouting", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"raiders-personnel-promotions-2026", sourceLabel:"Raiders Player Personnel Promotions", sourceUri:LV_PROMOTIONS }),
  fact({ team:"LV", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Mark Thewes", title:"Senior Vice President, Football Operations and Strategy", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"raiders-front-office-2026", sourceLabel:"Raiders Front Office", sourceUri:LV }),

  // Tennessee Titans
  fact({ team:"TEN", role:"GENERAL_MANAGER", displayName:"Mike Borgonzi", title:"General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], sourceId:"titans-front-office-2026", sourceLabel:"Titans Front Office", sourceUri:TEN }),
  fact({ team:"TEN", role:"ASSISTANT_GENERAL_MANAGER", displayName:"Dave Ziegler", title:"Assistant General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"titans-draft-preview-2026", sourceLabel:"Titans 2026 Draft Preview", sourceUri:TEN_DRAFT }),
  fact({ team:"TEN", role:"PLAYER_PERSONNEL_EXECUTIVE", displayName:"Dan Saganey", title:"Vice President of Player Personnel", authorityScopes:["PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"titans-draft-preview-2026", sourceLabel:"Titans 2026 Draft Preview", sourceUri:TEN_DRAFT }),
  fact({ team:"TEN", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Reggie McKenzie", title:"Vice President / Football Advisor", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"titans-draft-preview-2026", sourceLabel:"Titans 2026 Draft Preview", sourceUri:TEN_DRAFT }),
  fact({ team:"TEN", role:"COLLEGE_SCOUTING_EXECUTIVE", displayName:"Mike Boni", title:"Director, College Scouting", authorityScopes:["PERSONNEL","DRAFT"], reportsToRole:"GENERAL_MANAGER", sourceId:"titans-football-staff-promotions-2026", sourceLabel:"Titans 2026 Football Staff Hires and Promotions", sourceUri:TEN_PROMOTIONS }),
  fact({ team:"TEN", role:"PRO_SCOUTING_EXECUTIVE", displayName:"Shane Normandeau", title:"Director, Pro Scout", authorityScopes:["PERSONNEL","ROSTER"], reportsToRole:"GENERAL_MANAGER", sourceId:"titans-football-staff-promotions-2026", sourceLabel:"Titans 2026 Football Staff Hires and Promotions", sourceUri:TEN_PROMOTIONS }),
  fact({ team:"TEN", role:"OTHER_FOOTBALL_DECISION_MAKER", displayName:"Nicole Kesten", title:"Chief of Staff, Football", authorityScopes:["FOOTBALL_OPERATIONS"], reportsToRole:"GENERAL_MANAGER", sourceId:"titans-football-staff-promotions-2026", sourceLabel:"Titans 2026 Football Staff Hires and Promotions", sourceUri:TEN_PROMOTIONS }),
];

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-PRIMARY-SOURCE-ENRICHMENT-2026-W3-1.0.0";

export const NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3 = Object.freeze(
  entries.map((entry) => Object.freeze(entry))
);

export function listNFLTeamOrganizationalPrimarySourceEnrichment2026Wave3() {
  return NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3;
}

export function getNFLTeamOrganizationalPrimarySourceEnrichment2026Wave3(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return Object.freeze(NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3.filter((entry) => entry.team === key));
}

export default NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3;
