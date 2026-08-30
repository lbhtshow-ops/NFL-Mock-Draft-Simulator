export const SPRINT_2A2_CAPTURE_DATE = "2026-08-03";
export const SPRINT_2A2_CYCLE_REF = "draft-cycle:2027";

const candidate = (slug, name, program, conference, position, secondaryPositions, academicClass, draftYearStatus, eligibilityStatus, transfer, purpose, url, objectiveCompleteness = "PARTIAL") => Object.freeze({
  candidateRef: `intake-candidate:2027:${slug}`,
  name,
  aliases: [],
  program: Object.freeze({ programRef: `program-reference:${program.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, displayName: program, conference, resolution: "COMPATIBLE_PROVISIONAL_REFERENCE" }),
  officialPosition: position,
  secondaryPositions: Object.freeze(secondaryPositions),
  expectedDraftYear: 2027,
  draftYearStatus,
  eligibilityStatus,
  declarationStatus: "DECLARATION_UNRESOLVED",
  transferStatus: transfer,
  purpose,
  objectiveCompleteness,
  scoutingCompleteness: "DEFERRED",
  sources: Object.freeze([
    Object.freeze({ sourceRef: `source:2027:${slug}:official-bio`, publisher: program, title: `${name} official football roster/biography`, url, sourceClassification: "OFFICIAL_COLLEGE_ATHLETICS", accessDate: SPRINT_2A2_CAPTURE_DATE, reviewStatus: "ACCEPTED", claimSupported: "Current program, official position, academic class, measurements and participation history where the biography supplies them.", boundedSummary: "Official roster/biography facts only; no page content retained.", limitations: ["Roster presence does not prove 2027 NFL Draft entry or NCAA eligibility."] })
  ]),
  evidence: Object.freeze([
    Object.freeze({ evidenceRef: `evidence:2027:${slug}:roster`, classification: "OFFICIAL_OBSERVED", sourceRef: `source:2027:${slug}:official-bio`, claim: `${name} is listed by ${program} at ${position} for the current roster context.` }),
    Object.freeze({ evidenceRef: `evidence:2027:${slug}:pathway`, classification: "INFERRED", sourceRef: `source:2027:${slug}:official-bio`, claim: "A possible 2027 entry pathway is projected from participation/class evidence; declaration and final eligibility remain unresolved." })
  ]),
  blockers: Object.freeze(["DECLARATION_UNCLEAR", "ELIGIBILITY_UNCLEAR", "VERIFICATION_PENDING", "TECHNICAL_BLOCKER:LIVE_PERSISTENCE_DEFERRED"]),
  promotionReadiness: "DEFERRED",
  persistenceReadiness: "DEFERRED"
});

export const sprint2A2Candidates = Object.freeze([
  candidate("dj-lagway", "DJ Lagway", "Florida", "SEC", "QB", [], "Junior", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "QB pathway and production evidence", "https://floridagators.com/sports/football/roster/dj-lagway/17606", "ROBUST"),
  candidate("dylan-raiola", "Dylan Raiola", "Nebraska", "Big Ten", "QB", [], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "QB pathway with current-player-page limitation", "https://huskers.com/sports/football/roster", "PARTIAL"),
  candidate("jordan-seaton", "Jordan Seaton", "Colorado", "Big 12", "OT", [], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Official tackle role and incomplete testing", "https://cubuffs.com/sports/football/roster/jordan-seaton/17273"),
  candidate("brandon-baker", "Brandon Baker", "Texas", "SEC", "OL", ["OT"], "Junior", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "OL/OT normalization and participation", "https://texaslonghorns.com/sports/football/roster/brandon-baker/17014", "ROBUST"),
  candidate("jeremiah-smith", "Jeremiah Smith", "Ohio State", "Big Ten", "WR", [], "Junior", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Robust receiving production", "https://ohiostatebuckeyes.com/sports/football/roster/jeremiah-smith/13335", "ROBUST"),
  candidate("cam-coleman", "Cam Coleman", "Texas", "SEC", "WR", [], "Junior", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "TRANSFER_CONFIRMED:AUBURN_TO_TEXAS_SPRING_2026", "Transfer identity continuity", "https://texaslonghorns.com/sports/football/roster/cam-coleman/16950", "ROBUST"),
  candidate("nate-frazier", "Nate Frazier", "Georgia", "SEC", "RB", [], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Running-back production", "https://georgiadogs.com/sports/football/roster/nate-frazier/10638"),
  candidate("caden-durham", "Caden Durham", "LSU", "SEC", "RB", [], "Junior", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Robust rushing/receiving production", "https://lsusports.net/sports/fb/roster/player/caden-durham", "ROBUST"),
  candidate("colin-simmons", "Colin Simmons", "Texas", "SEC", "EDGE", ["DE"], "Junior", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "EDGE production and role normalization", "https://texaslonghorns.com/sports/football/roster/colin-simmons/16936", "ROBUST"),
  candidate("dylan-stewart", "Dylan Stewart", "South Carolina", "SEC", "ER", ["EDGE"], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Official ER label versus projected EDGE", "https://gamecocksonline.com/sports/football/roster/"),
  candidate("kam-franklin", "Kam Franklin", "Ole Miss", "SEC", "DE", ["DL"], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Defensive-front limited production", "https://olemisssports.com/sports/football/roster/kam-franklin/6469", "LIMITED"),
  candidate("kj-bolden", "KJ Bolden", "Georgia", "SEC", "DB", ["S"], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "DB-to-safety projection boundary", "https://georgiadogs.com/sports/football/roster"),
  candidate("zabien-brown", "Zabien Brown", "Alabama", "SEC", "DB", ["CB"], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "DB-to-corner projection boundary", "https://rolltide.com/sports/football/roster"),
  candidate("koi-perich", "Koi Perich", "Minnesota", "Big Ten", "DB", ["S", "RET", "OFFENSE"], "Junior", "ENTRY_PATHWAY_UNRESOLVED", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Multi-phase versatility and stale-bio review", "https://gophersports.com/sports/football/roster", "ROBUST"),
  candidate("sammy-brown", "Sammy Brown", "Clemson", "ACC", "LB", [], "Year 3", "PROJECTED_2027", "ELIGIBILITY_REVIEW_REQUIRED", "NO_TRANSFER_EVIDENCE_RECORDED", "Front-seven production and ACC coverage", "https://clemsontigers.com/sports/football/roster/player/sammy-brown", "ROBUST"),
  candidate("caleb-odom", "Caleb Odom", "Ole Miss", "SEC", "TE", [], "Junior", "PROVISIONAL_2027", "ELIGIBILITY_REVIEW_REQUIRED", "TRANSFER_CONFIRMED:ALABAMA_TO_OLE_MISS", "Tight-end and second transfer-history case", "https://olemisssports.com/sports/football/roster", "LIMITED")
]);

export const sprint2A2Exclusions = Object.freeze([
  { name: "Peter Woods", reason: "Existing governed 2026 canonical entity and selection; duplicate 2027 intake prohibited." },
  { name: "Arch Manning", reason: "Legacy diagnostic fixture declares 2026; excluded to avoid draft-year conflict and fixture-to-canonical leakage." },
  { name: "Francis Mauigoa", reason: "Legacy diagnostic fixture declares 2026; excluded pending conflict review." },
  { name: "Caleb Downs", reason: "Legacy diagnostic fixture declares 2026 and entry pathway remains unresolved; excluded without resolving uncertainty." }
]);

export const sprint2A2Manifest = Object.freeze({
  cohortId: "FID_2027_FIRST_RESEARCH_COHORT_2A2",
  version: 1,
  targetDraftYear: 2027,
  status: "RESEARCH_FIXTURE_PROVISIONAL",
  candidateRefs: Object.freeze(sprint2A2Candidates.map(({ candidateRef }) => candidateRef)),
  positionDistribution: Object.freeze({ QB: 2, OL: 2, RECEIVER: 2, RB: 2, DEFENSIVE_FRONT: 3, DB: 3, FLEX_LB_TE: 2 }),
  programCount: 11,
  rankedBigBoard: false,
  promotionProhibited: true,
  persistenceDeferred: true,
  simulatorAvailable: false,
  bigBoardAvailable: false,
  draftRoomUse: "FIXTURE_ONLY",
  draftResultsUse: "FIXTURE_ONLY",
  createdAt: SPRINT_2A2_CAPTURE_DATE,
  provenance: "Repository-only manual research using public official athletics sources; URLs and bounded summaries retained.",
  limitations: Object.freeze(["One official source record per candidate is captured in this bounded sprint package; additional independent corroboration and scouting-source review remain required before promotion review.", "Program references are compatible provisional references because no canonical college-program registry contract was found.", "No candidate is declared eligible for or committed to the 2027 NFL Draft."])
});

export default sprint2A2Manifest;
