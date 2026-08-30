import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLAYER_AVAILABILITY_STATUSES,
  AVAILABILITY_FRESHNESS_STATES,
  createPlayerAvailabilityEvidence,
} from "../playerAvailability/contracts/PlayerAvailabilityEvidenceContract.js";
import {
  PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES,
  createPlayerAvailabilityRepositorySnapshot,
  validatePlayerAvailabilityRepositorySnapshot,
} from "../playerAvailability/repository/PlayerAvailabilityRepositorySnapshotContract.js";
import {
  validatePlayerAvailabilityEvidenceRepository,
} from "../playerAvailability/repository/PlayerAvailabilityEvidenceRepository.js";
import {
  adaptPlayerAvailabilityRepositorySnapshot,
} from "../playerAvailability/repository/PlayerAvailabilityEvidenceRepositoryAdapter.js";
import {
  createPlayerAvailabilityEvidenceChange,
  PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES,
} from "../playerAvailability/repository/PlayerAvailabilityEvidenceChangeContract.js";
import {
  resolvePlayerAvailabilityFreshness,
} from "../playerAvailability/repository/PlayerAvailabilityFreshnessPolicy.js";
import {
  getCanonicalPlayerAvailabilityImpactFromRepository,
} from "../playerAvailability/CanonicalPlayerAvailabilityImpactService.js";

const checks = {};
const failures = [];
const check = (name, condition) => {
  checks[name] = Boolean(condition);
  if (!condition) failures.push(name);
};

const fixtureEvidence = createPlayerAvailabilityEvidence({
  playerId: "nfl-player:diagnostic-1",
  status: PLAYER_AVAILABILITY_STATUSES.QUESTIONABLE,
  reason: "Diagnostic fixture",
  confidence: 0.91,
  freshness: AVAILABILITY_FRESHNESS_STATES.FRESH,
  observedAt: "2026-08-12T04:00:00Z",
  effectiveAt: "2026-08-12T04:00:00Z",
  sourceRefs: ["source:diagnostic"],
  evidenceRefs: ["evidence:diagnostic"],
  provenance: {
    contributors: ["source:diagnostic"],
    sourceArtifacts: ["artifact:diagnostic"],
  },
});

const fixtureSnapshot = createPlayerAvailabilityRepositorySnapshot({
  snapshotId: "availability-snapshot:diagnostic-1:r12",
  playerId: "nfl-player:diagnostic-1",
  asOf: "2026-08-12T04:05:00Z",
  repositoryVersion: "SPORTS-KNOWLEDGE-REPOSITORY-DIAGNOSTIC-1",
  revision: 12,
  state: PLAYER_AVAILABILITY_REPOSITORY_SNAPSHOT_STATES.AVAILABLE,
  evidence: fixtureEvidence,
  historyRefs: ["recorded-observation:diagnostic-1"],
  retrievedAt: "2026-08-12T04:05:05Z",
  repositoryFreshness: AVAILABILITY_FRESHNESS_STATES.FRESH,
  acquisitionFreshness: AVAILABILITY_FRESHNESS_STATES.FRESH,
  metadata: {
    persistenceContract: "ResearchRepositoryPersistence",
    persistenceSchemaVersion: "RESEARCH-REPOSITORY-PERSISTENCE-SCHEMA-1.0.0",
    adapter: "diagnostic-research-repository-adapter",
    sourceRecordType: "RECORDED_OBSERVATION",
  },
});

const readOnlyRepository = Object.freeze({
  async getPlayerAvailabilitySnapshot(request = {}) {
    if (request.playerId !== fixtureSnapshot.playerId) return null;
    return fixtureSnapshot;
  },
  async getPlayerAvailabilityHistory(request = {}) {
    return request.playerId === fixtureSnapshot.playerId
      ? [fixtureSnapshot]
      : [];
  },
});

const repositoryValidation = validatePlayerAvailabilityEvidenceRepository(
  readOnlyRepository,
);
const snapshotValidation = validatePlayerAvailabilityRepositorySnapshot(
  fixtureSnapshot,
);
const adapted = adaptPlayerAvailabilityRepositorySnapshot(fixtureSnapshot);
const serviceResult = await getCanonicalPlayerAvailabilityImpactFromRepository({
  repository: readOnlyRepository,
  player: {
    id: fixtureSnapshot.playerId,
    displayName: "Diagnostic Player",
    position: "QB",
  },
  canonicalCaliber: {
    available: true,
    caliberGrade: 94,
    confidence: 0.9,
    provenance: { model: "diagnostic-caliber" },
  },
  impactContext: {
    role: "PRIMARY_STARTER",
    replacementQuality: "UNKNOWN",
    teamDependency: "UNKNOWN",
    positionImportance: "UNKNOWN",
    snapShare: 0.97,
  },
  snapshotRequest: {
    playerId: fixtureSnapshot.playerId,
    asOf: fixtureSnapshot.asOf,
  },
});

const staleSnapshot = createPlayerAvailabilityRepositorySnapshot({
  ...fixtureSnapshot,
  snapshotId: "availability-snapshot:diagnostic-1:r11",
  revision: 11,
  repositoryFreshness: AVAILABILITY_FRESHNESS_STATES.STALE,
});
const staleAdapted = adaptPlayerAvailabilityRepositorySnapshot(staleSnapshot);
const change = createPlayerAvailabilityEvidenceChange({
  playerId: fixtureSnapshot.playerId,
  changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.CHANGED,
  previousSnapshotId: staleSnapshot.snapshotId,
  currentSnapshotId: fixtureSnapshot.snapshotId,
  detectedAt: fixtureSnapshot.retrievedAt,
  changedFields: ["status", "confidence", "status"],
  provenance: {
    adapter: fixtureSnapshot.metadata.adapter,
    repositoryVersion: fixtureSnapshot.repositoryVersion,
  },
});

check("repository_port_accepts_read_only_adapter", repositoryValidation.valid);
check("repository_port_requires_snapshot_read", typeof readOnlyRepository.getPlayerAvailabilitySnapshot === "function");
check("repository_port_requires_history_read", typeof readOnlyRepository.getPlayerAvailabilityHistory === "function");
check("repository_port_rejects_mutation_method", !validatePlayerAvailabilityEvidenceRepository({ ...readOnlyRepository, upsert() {} }).valid);
check("snapshot_contract_valid", snapshotValidation.valid);
check("snapshot_identity_preserved", fixtureSnapshot.snapshotId === "availability-snapshot:diagnostic-1:r12");
check("snapshot_revision_preserved", fixtureSnapshot.revision === 12);
check("snapshot_as_of_preserved", fixtureSnapshot.asOf === "2026-08-12T04:05:00Z");
check("snapshot_repository_version_preserved", fixtureSnapshot.repositoryVersion === "SPORTS-KNOWLEDGE-REPOSITORY-DIAGNOSTIC-1");
check("research_repository_contract_identity_preserved", fixtureSnapshot.metadata.persistenceContract === "ResearchRepositoryPersistence");
check("repository_adapter_preserves_canonical_evidence", adapted.available && adapted.evidence.status === PLAYER_AVAILABILITY_STATUSES.QUESTIONABLE);
check("repository_adapter_preserves_snapshot_provenance", adapted.evidence.repository.snapshotId === fixtureSnapshot.snapshotId);
check("repository_adapter_preserves_retrieval_time", adapted.evidence.repository.retrievedAt === fixtureSnapshot.retrievedAt);
check("history_refs_flow_to_source_artifacts", adapted.evidence.provenance.sourceArtifacts.includes("recorded-observation:diagnostic-1"));
check("freshness_dimensions_remain_separate", fixtureSnapshot.freshness.repository === "FRESH" && fixtureSnapshot.freshness.acquisition === "FRESH" && fixtureSnapshot.freshness.evidence === "FRESH");
check("freshness_policy_reports_all_fresh", resolvePlayerAvailabilityFreshness({ evidenceFreshness: "FRESH", repositoryFreshness: "FRESH", acquisitionFreshness: "FRESH" }) === "FRESH");
check("freshness_policy_reports_stale_if_any_layer_stale", staleAdapted.evidence.freshness === "STALE");
check("freshness_policy_does_not_invent_ttl", resolvePlayerAvailabilityFreshness({ evidenceFreshness: "FRESH", repositoryFreshness: "UNKNOWN", acquisitionFreshness: "FRESH" }) === "UNKNOWN");
check("change_contract_preserves_type", change.changeType === "CHANGED");
check("change_contract_deduplicates_changed_fields", change.changedFields.length === 2);
check("service_reads_explicit_repository_snapshot", serviceResult.available && serviceResult.snapshot.snapshotId === fixtureSnapshot.snapshotId);
check("service_feeds_canonical_availability_engine", serviceResult.result?.availability?.status === PLAYER_AVAILABILITY_STATUSES.QUESTIONABLE);
check("service_preserves_repository_provenance", serviceResult.result?.provenance?.availabilityRepository?.snapshotId === fixtureSnapshot.snapshotId);
check("service_does_not_require_impact_model", serviceResult.result?.impact?.overallImpact == null);
check("missing_repository_fails_explicitly", !(await getCanonicalPlayerAvailabilityImpactFromRepository({ repository: null })).available);
check("missing_snapshot_fails_explicitly", !(await getCanonicalPlayerAvailabilityImpactFromRepository({ repository: readOnlyRepository, player: { id: "missing" } })).available);

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryDir = path.resolve(here, "../playerAvailability/repository");
const productionText = fs
  .readdirSync(repositoryDir)
  .filter((name) => name.endsWith(".js"))
  .map((name) => fs.readFileSync(path.join(repositoryDir, name), "utf8"))
  .join("\n");
check("repository_boundary_has_no_supabase_import", !/from\s+["'][^"']*supabase/i.test(productionText));
check("repository_boundary_has_no_sql_execution", !/\b(select|insert|update|delete)\s+.+\s+from\b/i.test(productionText));
check("repository_boundary_has_no_http_transport", !/\b(fetch|axios)\s*\(/i.test(productionText));

const passed = Object.values(checks).filter(Boolean).length;
const failed = failures.length;
console.log(JSON.stringify({
  suite: "Player Availability Repository Boundary",
  contractVersion: "FIE-PLAYER-AVAILABILITY-IMPACT-SPRINT3-1.0.0",
  status: failed === 0 ? "PASS" : "FAIL",
  passed,
  failed,
  checks,
  failures,
  sample: {
    snapshotId: fixtureSnapshot.snapshotId,
    revision: fixtureSnapshot.revision,
    status: serviceResult.result?.availability?.status || null,
    freshness: serviceResult.result?.availability?.freshness || null,
    impactModelState: serviceResult.result?.impact?.modelState || null,
  },
}, null, 2));
if (failed) process.exitCode = 1;
