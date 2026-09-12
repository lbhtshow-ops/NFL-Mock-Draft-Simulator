// INT-1B.1 — 2026 leaguewide core organizational snapshot.
// Verified 2026-09-05. This is a read-only evidence source; it does not score teams.

const VERIFIED_AT = "2026-09-05T00:00:00Z";
const DRAFT_HISTORY_URI = "https://www.drafthistory.com/index.php/articles/view/2026-nfl-team-leadership";
const NFL_TRACKER_URI = "https://www.nfl.com/news/nfl-coaching-gm-tracker-latest-news-interviews-developments-2026-hiring-cycle";

const CORE = Object.freeze([
  {"team": "SF", "teamName": "San Francisco 49ers", "principalOwner": "Jed York", "generalManager": "John Lynch", "headCoach": "Kyle Shanahan", "offensiveCoordinator": "Klay Kubiak", "defensiveCoordinator": "Raheem Morris", "specialTeamsCoordinator": "Brant Boyer"},
  {"team": "CHI", "teamName": "Chicago Bears", "principalOwner": "George McCaskey", "generalManager": "Ryan Poles", "headCoach": "Ben Johnson", "offensiveCoordinator": "Press Taylor", "defensiveCoordinator": "Dennis Allen", "specialTeamsCoordinator": "Richard Hightower"},
  {"team": "CIN", "teamName": "Cincinnati Bengals", "principalOwner": "Mike Brown", "generalManager": "Duke Tobin", "headCoach": "Zac Taylor", "offensiveCoordinator": "Dan Pitcher", "defensiveCoordinator": "Al Golden", "specialTeamsCoordinator": "Darrin Simmons"},
  {"team": "BUF", "teamName": "Buffalo Bills", "principalOwner": "Terry Pegula", "generalManager": "Brandon Beane", "headCoach": "Joe Brady", "offensiveCoordinator": "Pete Carmichael", "defensiveCoordinator": "Jim Leonhard", "specialTeamsCoordinator": "Jeff Rodgers"},
  {"team": "DEN", "teamName": "Denver Broncos", "principalOwner": "Rob Walton", "generalManager": "George Paton", "headCoach": "Sean Payton", "offensiveCoordinator": "Davis Webb", "defensiveCoordinator": "Vance Joseph", "specialTeamsCoordinator": "Darren Rizzi"},
  {"team": "CLE", "teamName": "Cleveland Browns", "principalOwner": "Jimmy Haslam", "generalManager": "Andrew Berry", "headCoach": "Todd Monken", "offensiveCoordinator": "Travis Switzer", "defensiveCoordinator": "Mike Rutenberg", "specialTeamsCoordinator": "Byron Storer"},
  {"team": "TB", "teamName": "Tampa Bay Buccaneers", "principalOwner": "Bryan Glazer", "generalManager": "Jason Licht", "headCoach": "Todd Bowles", "offensiveCoordinator": "Zac Robinson", "defensiveCoordinator": "Todd Bowles", "specialTeamsCoordinator": "Danny Smith"},
  {"team": "ARI", "teamName": "Arizona Cardinals", "principalOwner": "Michael Bidwill", "generalManager": "Monti Ossenfort", "headCoach": "Mike LaFleur", "offensiveCoordinator": "Nathaniel Hackett", "defensiveCoordinator": "Nick Rallis", "specialTeamsCoordinator": "Michael Ghobrial"},
  {"team": "LAC", "teamName": "Los Angeles Chargers", "principalOwner": "Dean Spanos", "generalManager": "Joe Hortiz", "headCoach": "Jim Harbaugh", "offensiveCoordinator": "Mike McDaniel", "defensiveCoordinator": "Chris O'Leary", "specialTeamsCoordinator": "Ryan Ficken"},
  {"team": "KC", "teamName": "Kansas City Chiefs", "principalOwner": "Clark Hunt", "generalManager": "Brett Veach", "headCoach": "Andy Reid", "offensiveCoordinator": "Eric Bieniemy", "defensiveCoordinator": "Steve Spagnuolo", "specialTeamsCoordinator": "Dave Toub"},
  {"team": "IND", "teamName": "Indianapolis Colts", "principalOwner": "Carlie Irsay-Gordon", "generalManager": "Chris Ballard", "headCoach": "Shane Steichen", "offensiveCoordinator": "Jim Bob Cooter", "defensiveCoordinator": "Lou Anarumo", "specialTeamsCoordinator": "Brian Mason"},
  {"team": "WAS", "teamName": "Washington Commanders", "principalOwner": "Josh Harris", "generalManager": "Adam Peters", "headCoach": "Dan Quinn", "offensiveCoordinator": "David Blough", "defensiveCoordinator": "Daronte Jones", "specialTeamsCoordinator": "Larry Izzo"},
  {"team": "DAL", "teamName": "Dallas Cowboys", "principalOwner": "Jerry Jones", "generalManager": "Jerry Jones", "headCoach": "Brian Schottenheimer", "offensiveCoordinator": "Klayton Adams", "defensiveCoordinator": "Christian Parker", "specialTeamsCoordinator": "Nick Sorensen"},
  {"team": "MIA", "teamName": "Miami Dolphins", "principalOwner": "Stephen Ross", "generalManager": "Jon-Eric Sullivan", "headCoach": "Jeff Hafley", "offensiveCoordinator": "Bobby Slowik", "defensiveCoordinator": "Sean Duggan", "specialTeamsCoordinator": "Chris Tabor"},
  {"team": "PHI", "teamName": "Philadelphia Eagles", "principalOwner": "Jeffrey Lurie", "generalManager": "Howie Roseman", "headCoach": "Nick Sirianni", "offensiveCoordinator": "Sean Mannion", "defensiveCoordinator": "Vic Fangio", "specialTeamsCoordinator": "Michael Clay"},
  {"team": "ATL", "teamName": "Atlanta Falcons", "principalOwner": "Arthur Blank", "generalManager": "Ian Cunningham", "headCoach": "Kevin Stefanski", "offensiveCoordinator": "Tommy Rees", "defensiveCoordinator": "Jeff Ulbrich", "specialTeamsCoordinator": "Craig Aukerman"},
  {"team": "NYG", "teamName": "New York Giants", "principalOwner": "John Mara", "generalManager": "Joe Schoen", "headCoach": "John Harbaugh", "offensiveCoordinator": "Matt Nagy", "defensiveCoordinator": "Dennard Wilson", "specialTeamsCoordinator": "Chris Horton"},
  {"team": "JAX", "teamName": "Jacksonville Jaguars", "principalOwner": "Shahid Khan", "generalManager": "James Gladstone", "headCoach": "Liam Coen", "offensiveCoordinator": "Grant Udinski", "defensiveCoordinator": "Anthony Campanile", "specialTeamsCoordinator": "Heath Farwell"},
  {"team": "NYJ", "teamName": "New York Jets", "principalOwner": "Woody Johnson", "generalManager": "Darren Mougey", "headCoach": "Aaron Glenn", "offensiveCoordinator": "Frank Reich", "defensiveCoordinator": "Brian Duker", "specialTeamsCoordinator": "Chris Banjo"},
  {"team": "DET", "teamName": "Detroit Lions", "principalOwner": "Sheila Ford Hamp", "generalManager": "Brad Holmes", "headCoach": "Dan Campbell", "offensiveCoordinator": "Drew Petzing", "defensiveCoordinator": "Kelvin Sheppard", "specialTeamsCoordinator": "Dave Fipp"},
  {"team": "GB", "teamName": "Green Bay Packers", "principalOwner": null, "generalManager": "Brian Gutekunst", "headCoach": "Matt LaFleur", "offensiveCoordinator": "Adam Stenavich", "defensiveCoordinator": "Jonathan Gannon", "specialTeamsCoordinator": "Cameron Achord"},
  {"team": "CAR", "teamName": "Carolina Panthers", "principalOwner": "David Tepper", "generalManager": "Dan Morgan", "headCoach": "Dave Canales", "offensiveCoordinator": "Brad Idzik", "defensiveCoordinator": "Ejiro Evero", "specialTeamsCoordinator": "Tracy Smith"},
  {"team": "NE", "teamName": "New England Patriots", "principalOwner": "Robert Kraft", "generalManager": "Eliot Wolf", "headCoach": "Mike Vrabel", "offensiveCoordinator": "Josh McDaniels", "defensiveCoordinator": "Zak Kuhr", "specialTeamsCoordinator": "Jeremy Springer"},
  {"team": "LV", "teamName": "Las Vegas Raiders", "principalOwner": "Mark Davis", "generalManager": "John Spytek", "headCoach": "Klint Kubiak", "offensiveCoordinator": "Andrew Janocko", "defensiveCoordinator": "Rob Leonard", "specialTeamsCoordinator": "Joe DeCamillis"},
  {"team": "LAR", "teamName": "Los Angeles Rams", "principalOwner": "Stan Kroenke", "generalManager": "Les Snead", "headCoach": "Sean McVay", "offensiveCoordinator": "Nathan Scheelhaase", "defensiveCoordinator": "Chris Shula", "specialTeamsCoordinator": "Ray Ventrone"},
  {"team": "BAL", "teamName": "Baltimore Ravens", "principalOwner": "Steve Bisciotti", "generalManager": "Eric DeCosta", "headCoach": "Jesse Minter", "offensiveCoordinator": "Declan Doyle", "defensiveCoordinator": "Anthony Weaver", "specialTeamsCoordinator": "Anthony Levine"},
  {"team": "NO", "teamName": "New Orleans Saints", "principalOwner": "Gayle Benson", "generalManager": "Mickey Loomis", "headCoach": "Kellen Moore", "offensiveCoordinator": "Doug Nussmeier", "defensiveCoordinator": "Brandon Staley", "specialTeamsCoordinator": "Phil Galiano"},
  {"team": "SEA", "teamName": "Seattle Seahawks", "principalOwner": "Neeru Khosla", "generalManager": "John Schneider", "headCoach": "Mike Macdonald", "offensiveCoordinator": "Brian Fleury", "defensiveCoordinator": "Aden Durde", "specialTeamsCoordinator": "Jay Harbaugh"},
  {"team": "PIT", "teamName": "Pittsburgh Steelers", "principalOwner": "Art Rooney II", "generalManager": "Omar Khan", "headCoach": "Mike McCarthy", "offensiveCoordinator": "Brian Angelichio", "defensiveCoordinator": "Patrick Graham", "specialTeamsCoordinator": "Danny Crossman"},
  {"team": "HOU", "teamName": "Houston Texans", "principalOwner": "Cal McNair", "generalManager": "Nick Caserio", "headCoach": "DeMeco Ryans", "offensiveCoordinator": "Nick Caley", "defensiveCoordinator": "Matt Burke", "specialTeamsCoordinator": "Frank Ross"},
  {"team": "TEN", "teamName": "Tennessee Titans", "principalOwner": "Amy Adams Strunk", "generalManager": "Mike Borgonzi", "headCoach": "Robert Saleh", "offensiveCoordinator": "Brian Daboll", "defensiveCoordinator": "Gus Bradley", "specialTeamsCoordinator": "John Fassel"},
  {"team": "MIN", "teamName": "Minnesota Vikings", "principalOwner": "Zygi Wilf", "generalManager": "Nolan Teasley", "headCoach": "Kevin O'Connell", "offensiveCoordinator": "Wes Phillips", "defensiveCoordinator": "Brian Flores", "specialTeamsCoordinator": "Matt Daniels"},
]);

const fact = ({ domain, role, displayName, title, entityType = "PERSON", authorityScopes = [], sourceId, sourceType, sourceLabel, sourceUri, notes = null }) =>
  Object.freeze({
    domain,
    role,
    displayName,
    title,
    entityType,
    classification: "FACT",
    authorityScopes: Object.freeze([...authorityScopes]),
    sourceId,
    sourceType,
    sourceLabel,
    sourceUri,
    observedAt: VERIFIED_AT,
    verifiedAt: VERIFIED_AT,
    effectiveFrom: null,
    effectiveTo: null,
    confidence: sourceType === "OFFICIAL_CLUB" || sourceType === "NFL_LEAGUE" ? 1 : 0.92,
    notes,
  });

function coreObservations(row) {
  const common = {
    sourceId: "drafthistory-2026-team-leadership",
    sourceType: "SECONDARY_REFERENCE",
    sourceLabel: "DraftHistory.com — 2026 NFL Team Leadership",
    sourceUri: DRAFT_HISTORY_URI,
  };
  const out = [];
  if (row.principalOwner) out.push(fact({ ...common, domain:"OWNERSHIP", role:"PRINCIPAL_OWNER", displayName:row.principalOwner, title:"Principal Owner", authorityScopes:["OWNERSHIP"] }));
  out.push(fact({ ...common, domain:"FOOTBALL_OPERATIONS", role:"GENERAL_MANAGER", displayName:row.generalManager, title:"General Manager", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER"] }));
  out.push(fact({ ...common, domain:"COACHING", role:"HEAD_COACH", displayName:row.headCoach, title:"Head Coach", authorityScopes:["COACHING","SCHEME"] }));
  out.push(fact({ ...common, domain:"COACHING", role:"OFFENSIVE_COORDINATOR", displayName:row.offensiveCoordinator, title:"Offensive Coordinator", authorityScopes:["COACHING","SCHEME"] }));
  out.push(fact({ ...common, domain:"COACHING", role:"DEFENSIVE_COORDINATOR", displayName:row.defensiveCoordinator, title:"Defensive Coordinator", authorityScopes:["COACHING","SCHEME"] }));
  out.push(fact({ ...common, domain:"COACHING", role:"SPECIAL_TEAMS_COORDINATOR", displayName:row.specialTeamsCoordinator, title:"Special Teams Coordinator", authorityScopes:["COACHING","SCHEME"] }));
  return out;
}

const OFFICIAL_SUPPLEMENTS = Object.freeze({
  ATL: Object.freeze([
    fact({ domain:"EXECUTIVE_LEADERSHIP", role:"PRESIDENT", displayName:"Greg Beadles", title:"President and CEO", authorityScopes:["BUSINESS"], sourceId:"falcons-front-office-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Atlanta Falcons Front Office Staff", sourceUri:"https://www.atlantafalcons.com/team/front-office-roster/" }),
    fact({ domain:"FOOTBALL_OPERATIONS", role:"PRESIDENT_FOOTBALL_OPERATIONS", displayName:"Matt Ryan", title:"President of Football", authorityScopes:["FOOTBALL_OPERATIONS","PERSONNEL","DRAFT","ROSTER","COACHING"], sourceId:"falcons-front-office-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Atlanta Falcons Front Office Staff", sourceUri:"https://www.atlantafalcons.com/team/front-office-roster/", notes:"Official club page states Ryan oversees all aspects of Falcons football, including the head coach and GM positions." }),
  ]),
  GB: Object.freeze([
    fact({ domain:"EXECUTIVE_LEADERSHIP", role:"CHAIRMAN", displayName:"Ed Policy", title:"Chairman of the Board, President & Chief Executive Officer", authorityScopes:["BUSINESS","FOOTBALL_OPERATIONS"], sourceId:"packers-front-office-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Green Bay Packers Front Office", sourceUri:"https://www.packers.com/team/front-office-roster/", notes:"No individual principal owner is asserted for Green Bay in this snapshot." }),
    fact({ domain:"EXECUTIVE_LEADERSHIP", role:"PRESIDENT", displayName:"Ed Policy", title:"President & Chief Executive Officer", authorityScopes:["BUSINESS","FOOTBALL_OPERATIONS"], sourceId:"packers-front-office-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Green Bay Packers Front Office", sourceUri:"https://www.packers.com/team/front-office-roster/" }),
  ]),
  SEA: Object.freeze([
    fact({ domain:"OWNERSHIP", role:"OWNERSHIP_GROUP", displayName:"Khosla Family", title:"Controlling Ownership Group", entityType:"ORGANIZATION", authorityScopes:["OWNERSHIP"], sourceId:"seahawks-khosla-sale-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Seattle Seahawks Sale To The Khosla Family Is Complete", sourceUri:"https://www.seahawks.com/news/seattle-seahawks-sale-to-the-khosla-family-is-complete" }),
    fact({ domain:"OWNERSHIP", role:"CHAIRMAN", displayName:"Vinod Khosla", title:"Chair", authorityScopes:["OWNERSHIP"], sourceId:"seahawks-front-office-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Seattle Seahawks Front Office", sourceUri:"https://www.seahawks.com/team/front-office-roster/" }),
    fact({ domain:"OWNERSHIP", role:"PRINCIPAL_OWNER", displayName:"Neeru Khosla", title:"Controlling Owner", authorityScopes:["OWNERSHIP"], sourceId:"seahawks-front-office-2026", sourceType:"OFFICIAL_CLUB", sourceLabel:"Seattle Seahawks Front Office", sourceUri:"https://www.seahawks.com/team/front-office-roster/" }),
  ]),
});

export const NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-CORE-SNAPSHOT-2026-1.0.0";
export const NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026 = Object.freeze(
  Object.fromEntries(CORE.map((row) => [row.team, Object.freeze({
    team: row.team,
    teamName: row.teamName,
    season: 2026,
    asOf: VERIFIED_AT,
    observations: Object.freeze([...coreObservations(row), ...(OFFICIAL_SUPPLEMENTS[row.team] || [])]),
  })]))
);

export function getNFLTeamOrganizationalCoreSnapshot2026(team) {
  const key = typeof team === "string" ? team.trim().toUpperCase() : "";
  return NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026[key] || null;
}

export function listNFLTeamOrganizationalCoreSnapshots2026() {
  return Object.freeze(Object.values(NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026));
}

export default NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026;
