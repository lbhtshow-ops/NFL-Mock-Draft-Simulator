import { evaluateNFLTeamContext } from "../../src/engines/teamIntelligence/context/NFLTeamContextIntelligenceService.js";
import { getNFLRosterByTeam } from "../../src/data/footballIntelligence/nfl/rosters/nflRosterRecords.js";

export const PUBLIC_NFL_TEAM_BUNDLE_CONTRACT = "LBHTFIEPublicNFLTeamBundle";
export const PUBLIC_NFL_TEAM_BUNDLE_VERSION = "1.0.0";

const freeze = (value) => Object.freeze(value);
const stringOrNull = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const normalizeTeam = (team) => stringOrNull(team)?.toUpperCase() || null;
const resolvedValue = (entry) => entry && Object.prototype.hasOwnProperty.call(entry, "value") ? entry.value : null;
const displayName = (entry) => stringOrNull(entry?.displayName);

function playCaller(entry) {
  const value = resolvedValue(entry);
  if (typeof value === "string" && value.trim()) return value.trim();
  return stringOrNull(value?.playCaller) || stringOrNull(value?.caller);
}

function titleCaseToken(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayFactValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return titleCaseToken(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    const items = value
      .map(displayFactValue)
      .filter(Boolean);
    return items.length ? items.join(", ") : null;
  }

  if (typeof value === "object") {
    for (const key of ["displayName", "label", "name", "system", "emphasis", "type", "value"]) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const resolved = displayFactValue(value[key]);
        if (resolved) return resolved;
      }
    }
  }

  return null;
}

function publicFact(value, source = null) {
  const normalized = value ?? null;
  return freeze({
    value: normalized,
    displayValue: displayFactValue(normalized),
    available: normalized !== null && normalized !== undefined && normalized !== "",
    confidence: Number.isFinite(source?.confidence) ? source.confidence : null,
    verifiedAt: source?.verifiedAt || null,
  });
}

function publicStaffMember(entry = {}) {
  return freeze({
    role: entry.role || entry.subject || null,
    title: stringOrNull(entry.title),
    displayName: stringOrNull(entry.displayName) || stringOrNull(entry.value?.displayName) || (typeof entry.value === "string" ? stringOrNull(entry.value) : null),
    confidence: Number.isFinite(entry.confidence) ? entry.confidence : null,
    verifiedAt: entry.verifiedAt || null,
  });
}

function normalizedRosterPlayer(player = {}) {
  const identity = player.identity || {};
  const roster = player.roster || {};
  const profile = player.profile || {};
  const rankRaw = roster.depthChartRank ?? player.depthChartRank ?? null;
  const depthChartRank = rankRaw !== null && Number.isFinite(Number(rankRaw)) ? Number(rankRaw) : null;
  const starter = typeof roster.starter === "boolean" ? roster.starter : typeof player.starter === "boolean" ? player.starter : null;
  return freeze({
    playerId: player.playerId || player.id || identity.playerId || null,
    displayName: stringOrNull(identity.playerName) || stringOrNull(identity.displayName) || stringOrNull(player.displayName) || stringOrNull(player.name),
    position: stringOrNull(identity.position)?.toUpperCase() || stringOrNull(player.position)?.toUpperCase() || null,
    age: Number.isFinite(Number(profile.age ?? player.age)) ? Number(profile.age ?? player.age) : null,
    experience: Number.isFinite(Number(profile.experience ?? player.experience)) ? Number(profile.experience ?? player.experience) : null,
    status: stringOrNull(roster.status) || stringOrNull(player.status),
    rosterRole: stringOrNull(roster.rosterRole) || stringOrNull(player.rosterRole),
    starter,
    depthChartRole: stringOrNull(roster.depthChartRole) || stringOrNull(player.depthChartRole),
    depthChartRank,
  });
}

function buildRoster(team) {
  const raw = getNFLRosterByTeam(team);
  const players = (Array.isArray(raw) ? raw : []).map(normalizedRosterPlayer).filter((p) => p.displayName);
  const groups = {};
  for (const player of players) {
    const key = player.position || "UNKNOWN";
    if (!groups[key]) groups[key] = [];
    groups[key].push(player);
  }
  for (const key of Object.keys(groups)) {
    groups[key] = freeze([...groups[key]].sort((a, b) => {
      const ar = a.depthChartRank ?? Number.MAX_SAFE_INTEGER;
      const br = b.depthChartRank ?? Number.MAX_SAFE_INTEGER;
      if (ar !== br) return ar - br;
      if (a.starter === true && b.starter !== true) return -1;
      if (b.starter === true && a.starter !== true) return 1;
      return String(a.displayName).localeCompare(String(b.displayName));
    }));
  }
  return freeze({ available: players.length > 0, playerCount: players.length, players: freeze(players), positionGroups: freeze(groups) });
}

function buildDepthChart(roster) {
  const positions = {};
  for (const player of roster.players || []) {
    const hasEvidence = Boolean(player.depthChartRole) || player.depthChartRank !== null || typeof player.starter === "boolean";
    if (!hasEvidence) continue;
    const key = player.position || "UNKNOWN";
    if (!positions[key]) positions[key] = [];
    positions[key].push(freeze({ playerId: player.playerId, displayName: player.displayName, position: player.position, role: player.depthChartRole, rank: player.depthChartRank, starter: player.starter }));
  }
  for (const key of Object.keys(positions)) {
    positions[key] = freeze([...positions[key]].sort((a, b) => {
      const ar = a.rank ?? Number.MAX_SAFE_INTEGER;
      const br = b.rank ?? Number.MAX_SAFE_INTEGER;
      if (ar !== br) return ar - br;
      if (a.starter === true && b.starter !== true) return -1;
      if (b.starter === true && a.starter !== true) return 1;
      return String(a.displayName).localeCompare(String(b.displayName));
    }));
  }
  return freeze({ available: Object.keys(positions).length > 0, positions: freeze(positions) });
}

export function buildPublicNFLTeamBundle(team, options = {}) {
  const abbreviation = normalizeTeam(team);
  const season = Number.isInteger(options.season) ? options.season : 2026;
  const asOf = stringOrNull(options.asOf);
  if (!abbreviation) return null;

  const context = evaluateNFLTeamContext({ team: abbreviation, season, asOf });

  const roster = buildRoster(abbreviation);
  const depthChart = buildDepthChart(roster);

  const organizationKnowledge = context?.organization || null;
  const organization = organizationKnowledge?.organization || null;
  const leadership = organization?.leadership || {};
  const identityKnowledge = context?.identity || null;
  const identity = identityKnowledge?.identity || {};
  const offense = identity?.offense || {};
  const defense = identity?.defense || {};
  const teamBuilding = identity?.teamBuilding || {};
  const coaching = context?.coaching || {};
  const coachingIdentity = coaching?.identity || {};

  const supported = Boolean(organizationKnowledge?.resolver?.resolved || identityKnowledge?.resolver?.resolved || roster.available);
  if (!supported) return null;

  return freeze({
    contract: PUBLIC_NFL_TEAM_BUNDLE_CONTRACT,
    version: PUBLIC_NFL_TEAM_BUNDLE_VERSION,
    sport: "football",
    league: "nfl",
    season,
    team: abbreviation,
    generatedAt: new Date().toISOString(),
    identity: freeze({
      offensiveSystem: publicFact(resolvedValue(offense.system), offense.system),
      passGameIdentity: publicFact(resolvedValue(offense.passGame), offense.passGame),
      runGameIdentity: publicFact(resolvedValue(offense.runGame), offense.runGame),
      formationPersonnelIdentity: publicFact(resolvedValue(offense.formationPersonnel), offense.formationPersonnel),
      motionIdentity: publicFact(resolvedValue(offense.motion), offense.motion),
      playActionRpoIdentity: publicFact(resolvedValue(offense.playActionRpo), offense.playActionRpo),
      offensivePlayCaller: publicFact(playCaller(offense.playCalling), offense.playCalling),
      defensiveSystem: publicFact(resolvedValue(defense.system), defense.system),
      defensiveFront: publicFact(resolvedValue(defense.front), defense.front),
      coverageIdentity: publicFact(resolvedValue(defense.coverage), defense.coverage),
      pressureIdentity: publicFact(resolvedValue(defense.pressure), defense.pressure),
      subpackageIdentity: publicFact(resolvedValue(defense.subpackage), defense.subpackage),
      defensivePlayCaller: publicFact(playCaller(defense.playCalling), defense.playCalling),
      teamBuildingPhilosophy: publicFact(resolvedValue(teamBuilding.teamBuildingPhilosophy) ?? resolvedValue(teamBuilding.philosophy), teamBuilding.teamBuildingPhilosophy || teamBuilding.philosophy),
    }),
    leadership: freeze({
      principalOwner: publicFact(displayName(leadership.principalOwner), leadership.principalOwner),
      ownershipGroup: publicFact(displayName(leadership.ownershipGroup), leadership.ownershipGroup),
      chairman: publicFact(displayName(leadership.chairman), leadership.chairman),
      president: publicFact(displayName(leadership.president), leadership.president),
      chiefExecutiveOfficer: publicFact(displayName(leadership.chiefExecutiveOfficer) || displayName(leadership.ceo), leadership.chiefExecutiveOfficer || leadership.ceo),
      presidentFootballOperations: publicFact(displayName(leadership.presidentFootballOperations), leadership.presidentFootballOperations),
      generalManager: publicFact(displayName(leadership.generalManager), leadership.generalManager),
    }),
    coaching: freeze({
      headCoach: publicFact(displayName(leadership.headCoach) || (typeof coachingIdentity.headCoach === "string" ? coachingIdentity.headCoach : coachingIdentity.headCoach?.displayName), leadership.headCoach),
      offensiveCoordinator: publicFact(displayName(leadership.offensiveCoordinator) || (typeof coachingIdentity.offensiveCoordinator === "string" ? coachingIdentity.offensiveCoordinator : coachingIdentity.offensiveCoordinator?.displayName), leadership.offensiveCoordinator),
      defensiveCoordinator: publicFact(displayName(leadership.defensiveCoordinator) || (typeof coachingIdentity.defensiveCoordinator === "string" ? coachingIdentity.defensiveCoordinator : coachingIdentity.defensiveCoordinator?.displayName), leadership.defensiveCoordinator),
      specialTeamsCoordinator: publicFact(displayName(leadership.specialTeamsCoordinator) || (typeof coachingIdentity.specialTeamsCoordinator === "string" ? coachingIdentity.specialTeamsCoordinator : coachingIdentity.specialTeamsCoordinator?.displayName), leadership.specialTeamsCoordinator),
      offensivePlayCaller: publicFact(playCaller(offense.playCalling), offense.playCalling),
      defensivePlayCaller: publicFact(playCaller(defense.playCalling), defense.playCalling),
      staff: freeze((Array.isArray(coaching.staff) ? coaching.staff : []).map(publicStaffMember).filter((m) => m.displayName)),
    }),
    roster,
    depthChart,
    intelligence: freeze({
      readiness: context?.evidenceStatus || "UNAVAILABLE",
      evidenceStatus: context?.evidenceStatus || "UNAVAILABLE",
    }),
    provenance: freeze({
      provider: "FIE",
      teamContextVersion: context?.contextVersion || null,
      rosterSource: roster.available ? "NFLVERSE_ROSTER_RECORDS" : null,
    }),
  });
}

export default { PUBLIC_NFL_TEAM_BUNDLE_CONTRACT, PUBLIC_NFL_TEAM_BUNDLE_VERSION, buildPublicNFLTeamBundle };


