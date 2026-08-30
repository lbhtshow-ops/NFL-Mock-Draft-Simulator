import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  adaptCanonicalPlayerAvailabilityResultsToTeamEvidence,
  createNFLTeamAvailabilityEvidenceProvider,
  validateNFLTeamAvailabilityEvidence,
} from "../teamIntelligence/availability/index.js";

const suite = "NFL Team Availability & Roster Integration";
const contractVersion = "FIE-NFL-TEAM-AVAILABILITY-ROSTER-SPRINT-1.0.0";
const checks = {};
const failures = [];
function check(name, fn) {
  try { fn(); checks[name] = true; }
  catch (error) { checks[name] = false; failures.push(`${name}: ${error.message}`); }
}
function player({ id, name, position, status, role, grade, modeled = false, impact = null }) {
  return {
    contract: "CanonicalPlayerAvailabilityImpactResult",
    contractVersion: "FIE-PLAYER-AVAILABILITY-IMPACT-1.1.0",
    playerId: id, displayName: name, position,
    availability: { status, confidence: 0.9, freshness: "FRESH" },
    caliber: { caliberGrade: grade, confidence: 0.85 },
    impactContext: { role, replacementQuality: "AVERAGE", teamDependency: "HIGH", positionImportance: position === "QB" ? "VERY_HIGH" : "HIGH" },
    impact: { modelState: modeled ? "MODELED" : "UNMODELED", overallImpact: modeled ? impact : null, confidence: modeled ? 0.8 : 0 },
    readiness: "AVAILABLE", missingEvidence: [], provenance: {}, versions: {},
  };
}
const qb = player({ id: "nfl:bal:qb1", name: "QB One", position: "QB", status: "QUESTIONABLE", role: "PRIMARY", grade: 94 });
const edge = player({ id: "nfl:bal:edge1", name: "Edge One", position: "EDGE", status: "OUT", role: "STARTER", grade: 92, modeled: true, impact: 74 });
const wr = player({ id: "nfl:bal:wr1", name: "WR One", position: "WR", status: "AVAILABLE", role: "STARTER", grade: 88, modeled: true, impact: 0 });
const evidence = adaptCanonicalPlayerAvailabilityResultsToTeamEvidence({
  teamAbbreviation: "BAL", playerResults: [qb, edge, wr, { bad: true }],
  freshness: { evidence: "FRESH", repository: "FRESH", acquisition: "FRESH", asOf: "2026-09-20T16:00:00Z" },
  provenance: { provider: "DIAGNOSTIC_CANONICAL_AVAILABILITY", snapshotId: "availability:bal:r7", revision: 7 },
  sourceRefs: ["evidence:qb", "evidence:edge", "evidence:wr"],
});
const provider = createNFLTeamAvailabilityEvidenceProvider({ providerId: "DIAGNOSTIC", resolve: () => evidence });
const here = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(here, "../teamIntelligence/NFLTeamIntelligenceInputProjection.js");
const enginePath = path.join(here, "../teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js");
const indexPath = path.join(here, "../teamIntelligence/index.js");
const availabilityRoot = path.join(here, "../teamIntelligence/availability");
const inputSource = fs.readFileSync(inputPath, "utf8");
const engineSource = fs.readFileSync(enginePath, "utf8");
const indexSource = fs.readFileSync(indexPath, "utf8");

check("team_availability_contract_valid", () => assert.equal(validateNFLTeamAvailabilityEvidence(evidence).valid, true));
check("invalid_player_result_filtered", () => assert.equal(evidence.playerCount, 3));
check("team_identity_preserved", () => assert.equal(evidence.teamAbbreviation, "BAL"));
check("status_counts_preserved", () => assert.equal(evidence.statusCounts.OUT, 1));
check("modeled_impact_count_preserved", () => assert.equal(evidence.modeledImpactCount, 2));
check("unmodeled_impact_count_preserved", () => assert.equal(evidence.unmodeledImpactCount, 1));
check("primary_qb_resolved_without_position_weight", () => assert.equal(evidence.quarterbackState.playerId, qb.playerId));
check("qb_status_preserved", () => assert.equal(evidence.quarterbackState.status, "QUESTIONABLE"));
check("qb_caliber_preserved_without_regrading", () => assert.equal(evidence.quarterbackState.caliberGrade, 94));
check("qb_unmodeled_impact_remains_null", () => assert.equal(evidence.quarterbackState.overallImpact, null));
check("provider_contract_resolves_evidence", () => assert.equal(provider.resolve("BAL").playerCount, 3));
check("no_qb_guess_when_primary_role_ambiguous", () => {
  const ambiguous = adaptCanonicalPlayerAvailabilityResultsToTeamEvidence({ teamAbbreviation: "BAL", playerResults: [qb, { ...qb, playerId: "nfl:bal:qb2" }] });
  assert.equal(ambiguous.quarterbackState, null);
});
check("no_team_impact_aggregation_in_adapter", () => assert.equal(Object.prototype.hasOwnProperty.call(evidence, "overallImpact"), false));
check("input_version_bumped", () => assert.match(inputSource, /NFL-TEAM-INTELLIGENCE-INPUT-1\.3\.0/));
check("input_imports_availability_provider", () => assert.match(inputSource, /emptyNFLTeamAvailabilityEvidenceProvider/));
check("input_accepts_availability_provider_option", () => assert.match(inputSource, /availabilityProvider\s*=\s*emptyNFLTeamAvailabilityEvidenceProvider/));
check("input_resolves_availability_provider", () => assert.match(inputSource, /availabilityProvider\?\.resolve/));
check("input_projects_player_results", () => assert.match(inputSource, /playerImpact:\s*availability\.players/));
check("input_projects_qb_state", () => assert.match(inputSource, /quarterbackState:\s*availability\.quarterbackState/));
check("missing_player_impact_is_conditional", () => assert.match(inputSource, /availability\.players\.length\s*===\s*0/));
check("missing_qb_state_is_conditional", () => assert.match(inputSource, /!availability\?\.quarterbackState/));
check("availability_source_added", () => assert.match(inputSource, /domain:\s*"NFL_PLAYER_AVAILABILITY"/));
check("availability_snapshot_identity_supported", () => assert.match(inputSource, /snapshotId:\s*availability\.provenance\?\.snapshotId/));
check("engine_emits_availability_evidence", () => assert.match(engineSource, /type:\s*"NFL_PLAYER_AVAILABILITY_IMPACT"/));
check("engine_preserves_player_availability", () => assert.match(engineSource, /players:\s*availability\.players/));
check("team_strength_scoring_remains_unmodeled", () => assert.match(engineSource, /overallStrength:\s*null/));
check("team_availability_score_remains_unmodeled", () => assert.match(engineSource, /availability:\s*null/));
check("team_index_exports_availability_boundary", () => assert.match(indexSource, /availability\/index\.js/));
check("team_availability_layer_has_no_supabase_sql_or_http", () => {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name)));
  walk(availabilityRoot);
  const source = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  assert.equal(/@supabase|createClient\(|insert\(|update\(|delete\(|upsert\(|fetch\(|axios|https?:\/\//i.test(source), false);
});
check("team_availability_layer_has_no_position_weight_constants", () => {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name)));
  walk(availabilityRoot);
  const source = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  assert.equal(/POSITION_WEIGHTS|positionWeight|QB\s*[:=]\s*\d/i.test(source), false);
});

const passed = Object.values(checks).filter(Boolean).length;
const failed = Object.values(checks).filter((v) => !v).length;
console.log(JSON.stringify({ suite, contractVersion, status: failed ? "FAIL" : "PASS", passed, failed, checks, failures,
  sample: { team: evidence.teamAbbreviation, playerCount: evidence.playerCount, qbStatus: evidence.quarterbackState?.status, modeledImpactCount: evidence.modeledImpactCount }
}, null, 2));
if (failed) process.exitCode = 1;
