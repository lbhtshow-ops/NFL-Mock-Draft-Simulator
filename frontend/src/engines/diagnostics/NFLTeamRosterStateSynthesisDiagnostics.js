import {
  createNFLTeamRosterState,
  validateNFLTeamRosterState,
  createNFLTeamProfile,
  validateNFLTeamProfile,
} from "../teamIntelligence/roster/index.js";
import {
  createNFLTeamIntelligenceResult,
} from "../teamIntelligence/NFLTeamIntelligenceResultContract.js";

const checks = {};
const failures = [];
function check(name, condition) {
  checks[name] = Boolean(condition);
  if (!condition) failures.push(name);
}

const roster = [
  { playerId: "qb1", identity: { playerName: "QB One", position: "QB" }, roster: { starter: true, depthChartRank: 1 } },
  { playerId: "qb2", identity: { playerName: "QB Two", position: "QB" }, roster: { starter: false, depthChartRank: 2 } },
  { playerId: "wr1", identity: { playerName: "WR One", position: "WR" }, roster: { starter: true } },
  { playerId: "cb1", identity: { playerName: "CB One", position: "CB" }, roster: { starter: true } },
  { playerId: "k1", identity: { playerName: "K One", position: "K" }, roster: { starter: true } },
];
const availability = {
  available: true,
  players: [
    { playerId: "qb1", availability: { status: "QUESTIONABLE" }, caliber: { caliberGrade: 95 }, impact: { modelState: "UNMODELED", overallImpact: null } },
    { playerId: "wr1", availability: { status: "AVAILABLE" }, caliber: { caliberGrade: 90 }, impact: { modelState: "MODELED", overallImpact: 72 } },
    { playerId: "cb1", availability: { status: "OUT" }, caliber: { caliberGrade: 88 }, impact: { modelState: "MODELED", overallImpact: 69 } },
  ],
};

const state = createNFLTeamRosterState({ teamAbbreviation: "BAL", roster, availabilityEvidence: availability });
const profile = createNFLTeamProfile({ teamAbbreviation: "BAL", rosterState: state, performance: { available: true }, availability });
const result = createNFLTeamIntelligenceResult({ teamAbbreviation: "BAL", teamProfile: profile, components: {} });

check("roster_state_contract_valid", validateNFLTeamRosterState(state).valid);
check("team_profile_contract_valid", validateNFLTeamProfile(profile).valid);
check("team_identity_preserved", state.teamAbbreviation === "BAL" && profile.teamAbbreviation === "BAL");
check("raw_roster_player_count_preserved", state.rosterPlayerCount === 5);
check("tracked_availability_count_preserved", state.trackedAvailabilityPlayerCount === 3);
check("roster_completeness_is_coverage_not_quality", state.completeness === 3 / 5);
check("qb_group_player_count_preserved", state.positionGroups.QB.rosterPlayerCount === 2);
check("qb_starter_state_preserved", state.positionGroups.QB.knownStarterCount === 1);
check("qb_caliber_observation_preserved", state.positionGroups.QB.players[0].caliberGrade === 95);
check("qb_unmodeled_impact_remains_null", state.positionGroups.QB.players[0].overallImpact === null);
check("wr_modeled_impact_observed", state.positionGroups.WR.modeledImpactCount === 1);
check("cb_out_status_observed", state.positionGroups.CB.statusCounts.OUT === 1);
check("missing_position_group_is_not_zero_strength", state.positionGroups.TE.strengthScore === null);
check("missing_position_group_is_not_zero_availability", state.positionGroups.TE.availabilityScore === null);
check("depth_score_remains_unmodeled", state.positionGroups.QB.depthScore === null);
check("offense_unit_exists", state.units.offense.rosterPlayerCount === 3);
check("defense_unit_exists", state.units.defense.rosterPlayerCount === 1);
check("special_teams_unit_exists", state.units.specialTeams.rosterPlayerCount === 1);
check("unit_strength_scoring_remains_unmodeled", state.units.offense.strengthScore === null && state.units.defense.strengthScore === null);
check("unit_availability_scoring_remains_unmodeled", state.units.offense.availabilityScore === null);
check("team_strength_scoring_remains_unmodeled", state.scoring.teamStrength === null && state.scoring.state === "UNMODELED");
check("team_profile_strength_remains_unmodeled", profile.scoring.overallStrength === null && profile.scoring.state === "UNMODELED");
check("coaching_remains_unmodeled", profile.coaching.state === "UNMODELED");
check("scheme_remains_unmodeled", profile.scheme.state === "UNMODELED");
check("profile_preserves_performance_without_scoring", profile.performance.available === true && profile.scoring.offense === null);
check("profile_preserves_availability_without_aggregation", profile.availability === availability && profile.scoring.availability === null);
check("result_contract_exposes_team_profile", result.teamProfile?.contract === "NFLTeamProfile");
check("result_does_not_promote_profile_to_score", result.overallStrength === null && result.components.roster === null);
check("position_value_not_inferred_from_position_name", !Object.prototype.hasOwnProperty.call(state.positionGroups.QB, "positionWeight"));
check("caliber_is_observation_not_group_score", state.positionGroups.QB.caliberObservedCount === 1 && state.positionGroups.QB.strengthScore === null);
check("availability_is_observation_not_group_score", state.positionGroups.CB.statusCounts.OUT === 1 && state.positionGroups.CB.availabilityScore === null);
check("synthesis_has_no_win_probability", !Object.prototype.hasOwnProperty.call(profile, "winProbability"));

console.log(JSON.stringify({
  suite: "NFL Team Roster-State & Team Profile Synthesis",
  contractVersion: "FIE-NFL-TEAM-ROSTER-STATE-SPRINT-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
  sample: {
    rosterPlayerCount: state.rosterPlayerCount,
    trackedAvailabilityPlayerCount: state.trackedAvailabilityPlayerCount,
    offensePlayers: state.units.offense.rosterPlayerCount,
    overallStrength: profile.scoring.overallStrength,
  },
}, null, 2));

if (failures.length) process.exitCode = 1;
