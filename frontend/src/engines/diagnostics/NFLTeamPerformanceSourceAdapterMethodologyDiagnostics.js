import {
  createNFLTeamPerformanceMethodology,
  defaultNFLTeamPerformanceMethodology,
  validateNFLTeamPerformanceSourceAdapter,
  createNFLverseTeamPerformanceAdapter,
} from "../teamIntelligence/performance/index.js";

const rows = [
  { game_id: "2026_01_BAL_BUF", season: 2026, week: 1, season_type: "REG", posteam: "BAL", defteam: "BUF", epa: 0.20, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_01_BAL_BUF", season: 2026, week: 1, season_type: "REG", posteam: "BAL", defteam: "BUF", epa: -0.10, success: 0, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_01_BAL_BUF", season: 2026, week: 1, season_type: "REG", posteam: "BUF", defteam: "BAL", epa: -0.15, success: 0, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_02_BAL_CLE", season: 2026, week: 2, season_type: "REG", posteam: "BAL", defteam: "CLE", epa: 0.30, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_02_BAL_CLE", season: 2026, week: 2, season_type: "REG", posteam: "CLE", defteam: "BAL", epa: 0.05, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_03_BAL_PIT", season: 2026, week: 3, season_type: "REG", posteam: "BAL", defteam: "PIT", epa: 0.10, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_03_BAL_PIT", season: 2026, week: 3, season_type: "REG", posteam: "PIT", defteam: "BAL", epa: -0.05, success: 0, no_play: 0, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_03_BAL_PIT", season: 2026, week: 3, season_type: "REG", posteam: "BAL", defteam: "PIT", epa: 9.99, success: 1, no_play: 1, qb_kneel: 0, qb_spike: 0 },
  { game_id: "2026_04_BAL_NE", season: 2026, week: 4, season_type: "REG", posteam: "BAL", defteam: "NE", epa: 0.40, success: 1, no_play: 0, qb_kneel: 1, qb_spike: 0 },
  { game_id: "2026_05_BAL_MIA", season: 2026, week: 5, season_type: "REG", posteam: "BAL", defteam: "MIA", epa: 0.90, success: 1, no_play: 0, qb_kneel: 0, qb_spike: 0 },
];

const adapter = createNFLverseTeamPerformanceAdapter({
  datasetVersion: "DIAGNOSTIC",
  retrievedAt: "2026-09-30T12:00:00Z",
  sourceRefs: ["https://github.com/nflverse/nflverse-data/releases"],
});
const evidence = adapter.aggregate(rows, { team: "BAL", season: 2026, throughWeek: 3 });
const customMethodology = createNFLTeamPerformanceMethodology({ recentForm: { windowGames: 2 } });
const customAdapter = createNFLverseTeamPerformanceAdapter({ methodology: customMethodology });
const customEvidence = customAdapter.aggregate(rows, { team: "BAL", season: 2026, throughWeek: 3 });

const checks = {
  default_methodology_contract_present:
    defaultNFLTeamPerformanceMethodology.contract === "NFLTeamPerformanceMethodology",
  no_garbage_time_threshold_invented:
    defaultNFLTeamPerformanceMethodology.garbageTime.status === "DECLARED_NOT_MODELED",
  scoring_explicitly_unauthorized:
    defaultNFLTeamPerformanceMethodology.scoring.status === "UNAUTHORIZED",
  opponent_adjustment_not_silently_derived:
    defaultNFLTeamPerformanceMethodology.opponentAdjustment.status === "NOT_DERIVED_FROM_SINGLE_TEAM_PBP",
  drive_efficiency_not_silently_derived:
    defaultNFLTeamPerformanceMethodology.driveEfficiency.status === "NOT_DERIVED_FROM_UNVERIFIED_PBP_DRIVE_BOUNDARIES",
  adapter_contract_valid:
    validateNFLTeamPerformanceSourceAdapter(adapter).valid === true,
  provider_is_nflverse:
    adapter.provider === "NFLVERSE" && adapter.dataset === "NFLVERSE_PLAY_BY_PLAY",
  snapshot_excludes_future_week:
    evidence.sample.games === 3,
  no_play_and_kneel_excluded:
    evidence.sample.offensivePlays === 4,
  offense_epa_aggregates_expected:
    Math.abs(evidence.offense.epaPerPlay - 0.125) < 1e-9,
  offense_success_rate_aggregates_expected:
    Math.abs(evidence.offense.successRate - 0.75) < 1e-9,
  defense_evidence_uses_defteam_perspective:
    evidence.defense.perspective === "DEFENSE_ALLOWED" && evidence.sample.defensivePlays === 3,
  source_provenance_preserved:
    evidence.provenance.provider === "NFLVERSE" && evidence.provenance.sourceRefs.length === 1,
  unmodeled_fields_remain_null:
    evidence.strengthOfSchedule === null && evidence.opponentAdjustedRating === null && evidence.offense.pointsPerDrive === null,
  recent_form_policy_is_configurable:
    customEvidence.recentForm.windowGames === 2 && customEvidence.recentForm.decayModel === "EQUAL_WEIGHT_V1",
  malformed_request_returns_null:
    adapter.aggregate(rows, { team: null, season: 2026, throughWeek: 3 }) === null,
};

const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify({
  suite: "NFL Team Performance Source Adapter & Methodology Foundation",
  contractVersion: "FIE-NFL-TEAM-PERFORMANCE-SPRINT2A-1.0.0",
  status: failures.length === 0 ? "PASS" : "FAIL",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
