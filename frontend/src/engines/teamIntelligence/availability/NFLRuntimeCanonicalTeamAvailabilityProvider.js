import { buildNFLRosterIntelligence } from "../../NFLRosterIntelligenceEngine.js";
import { getNFLTeamAvailabilityEvidence, getNFLAvailabilityRuntimeStatus } from "../../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityRegistry.js";
import { getNFLTeamPlayerRoleEvidence } from "../../../data/footballIntelligence/nfl/roles/NFLPlayerRoleRegistry.js";
import { enrichNFLRosterWithRoleEvidence } from "../../playerAvailability/NFLPlayerRoleEnrichmentEngine.js";
import { resolveNFLPlayerImpactIntegratedInputs } from "../../playerAvailability/integration/NFLPlayerImpactContextInputIntegrationService.js";
import { getCanonicalPlayerAvailabilityImpact } from "../../playerAvailability/CanonicalPlayerAvailabilityImpactService.js";
import { createPlayerAvailabilityEvidence, PLAYER_AVAILABILITY_STATUSES, AVAILABILITY_FRESHNESS_STATES } from "../../playerAvailability/contracts/PlayerAvailabilityEvidenceContract.js";
import { adaptCanonicalPlayerAvailabilityResultsToTeamEvidence } from "./adapters/CanonicalPlayerAvailabilityTeamAdapter.js";
import { createNFLTeamAvailabilityEvidenceProvider } from "./NFLTeamAvailabilityEvidenceProvider.js";

export const NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER_VERSION =
  "FIE-NFL-RUNTIME-CANONICAL-TEAM-AVAILABILITY-PROVIDER-1.0.0";

function normalizeTeam(value) {
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
}

function normalizeId(value) {
  return value == null ? null : String(value).trim();
}

function normalizeName(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function position(player) {
  return String(player?.identity?.position || player?.position || "").toUpperCase() || null;
}

function findRosterPlayer(roster, evidence) {
  const evidenceId = normalizeId(evidence?.player?.playerId);
  if (evidenceId) {
    const byId = roster.find((player) =>
      normalizeId(player?.playerId) === evidenceId ||
      normalizeId(player?.identity?.playerId) === evidenceId
    );
    if (byId) return byId;
  }

  const name = normalizeName(evidence?.player?.playerName);
  const evidencePosition = String(evidence?.player?.position || "").toUpperCase();
  if (!name) return null;

  return roster.find((player) => {
    const candidateName = normalizeName(
      player?.identity?.playerName || player?.playerName || player?.name
    );
    return candidateName === name && (!evidencePosition || position(player) === evidencePosition);
  }) || null;
}

function rawStatus(evidence) {
  return String(evidence?.status?.report || evidence?.status?.practice || "UNKNOWN")
    .trim()
    .toUpperCase();
}

function canonicalStatus(evidence) {
  const status = rawStatus(evidence);
  const aliases = {
    ACTIVE: PLAYER_AVAILABILITY_STATUSES.AVAILABLE,
    AVAILABLE: PLAYER_AVAILABILITY_STATUSES.AVAILABLE,
    FULL: PLAYER_AVAILABILITY_STATUSES.AVAILABLE,
    LIMITED: PLAYER_AVAILABILITY_STATUSES.LIMITED,
    QUESTIONABLE: PLAYER_AVAILABILITY_STATUSES.QUESTIONABLE,
    DOUBTFUL: PLAYER_AVAILABILITY_STATUSES.DOUBTFUL,
    OUT: PLAYER_AVAILABILITY_STATUSES.OUT,
    INACTIVE: PLAYER_AVAILABILITY_STATUSES.OUT,
    INJURED_RESERVE: PLAYER_AVAILABILITY_STATUSES.INJURED_RESERVE,
    PUP: PLAYER_AVAILABILITY_STATUSES.PUP,
    SUSPENDED: PLAYER_AVAILABILITY_STATUSES.SUSPENDED,
  };
  return aliases[status] || PLAYER_AVAILABILITY_STATUSES.UNKNOWN;
}

function canonicalFreshness(runtimeStatus) {
  const freshness = String(runtimeStatus?.freshness || "UNKNOWN").toUpperCase();
  if (freshness === "FRESH") return AVAILABILITY_FRESHNESS_STATES.FRESH;
  if (freshness === "AGING" || freshness === "STALE") return AVAILABILITY_FRESHNESS_STATES.STALE;
  return AVAILABILITY_FRESHNESS_STATES.UNKNOWN;
}

function canonicalAvailabilityPlayer(player, evidence) {
  const role = player?.roster?.roleEvidence || {};
  return {
    player: {
      playerId: evidence?.player?.playerId || player?.playerId || player?.identity?.playerId || null,
      playerName: evidence?.player?.playerName || player?.identity?.playerName || player?.playerName || null,
      position: evidence?.player?.position || position(player),
    },
    canonicalAvailabilityStatus: canonicalStatus(evidence),
    role: {
      depthPosition: evidence?.player?.position || position(player),
      depthRank: player?.roster?.depthChartRank ?? role?.depthRank ?? null,
      starter: player?.roster?.starter === true,
    },
    evidenceRefs: [
      evidence?.provenance?.sourceUrl,
      evidence?.provenance?.source,
    ].filter(Boolean),
  };
}

function canonicalAvailabilityRoster(roster, evidenceRecords) {
  return (Array.isArray(roster) ? roster : []).map((player) => {
    const matched = evidenceRecords.find((evidence) => findRosterPlayer([player], evidence));
    return canonicalAvailabilityPlayer(player, matched || { player: {
      playerId: player?.playerId || player?.identity?.playerId || null,
      playerName: player?.identity?.playerName || player?.playerName || null,
      position: position(player),
    }});
  });
}

function toCanonicalEvidence(raw, runtimeStatus) {
  const status = canonicalStatus(raw);
  return createPlayerAvailabilityEvidence({
    playerId: raw?.player?.playerId || null,
    status,
    reason: raw?.injury?.primary || raw?.injury?.secondary || null,
    confidence: 0,
    freshness: canonicalFreshness(runtimeStatus),
    observedAt: raw?.provenance?.modifiedAt || null,
    sourceRefs: [raw?.provenance?.sourceUrl].filter(Boolean),
    evidenceRefs: [raw?.provenance?.source].filter(Boolean),
    provenance: {
      contributors: raw?.provenance?.source
        ? [{ source: raw.provenance.source, role: "AVAILABILITY_EVIDENCE" }]
        : [],
    },
  });
}

export function createNFLRuntimeCanonicalTeamAvailabilityProvider({
  rosterResolver = buildNFLRosterIntelligence,
  availabilityEvidenceResolver = getNFLTeamAvailabilityEvidence,
  availabilityRuntimeStatusResolver = getNFLAvailabilityRuntimeStatus,
  roleEvidenceResolver = getNFLTeamPlayerRoleEvidence,
} = {}) {
  return createNFLTeamAvailabilityEvidenceProvider({
    providerId: "NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER",
    resolve(team, { season = null, throughWeek = null } = {}) {
      const teamAbbreviation = normalizeTeam(team);
      if (!teamAbbreviation) {
        return adaptCanonicalPlayerAvailabilityResultsToTeamEvidence({ teamAbbreviation: null });
      }

      const week = Number.isInteger(Number(throughWeek)) ? Number(throughWeek) : null;
      const normalizedSeason = Number.isInteger(Number(season)) ? Number(season) : null;
      const rosterIntelligence = rosterResolver(teamAbbreviation) || {};
      const rawRoster = Array.isArray(rosterIntelligence?.roster) ? rosterIntelligence.roster : [];
      const rawEvidence = availabilityEvidenceResolver(teamAbbreviation, {
        season: normalizedSeason,
        week,
        gameType: "REG",
      }) || [];
      const roleEvidence = roleEvidenceResolver(teamAbbreviation, {
        season: normalizedSeason,
        week,
      }) || [];
      const roster = enrichNFLRosterWithRoleEvidence({ roster: rawRoster, roleEvidence });
      const runtimeStatus = availabilityRuntimeStatusResolver({
        season: normalizedSeason,
        week,
        team: teamAbbreviation,
        gameType: "REG",
      }) || {};

      if (!Array.isArray(rawEvidence) || rawEvidence.length === 0) {
        return adaptCanonicalPlayerAvailabilityResultsToTeamEvidence({
          teamAbbreviation,
          freshness: {
            evidence: canonicalFreshness(runtimeStatus),
            repository: runtimeStatus?.providerStatus || null,
            acquisition: runtimeStatus?.freshness || null,
            asOf: runtimeStatus?.checkedAt || null,
          },
          provenance: {
            provider: "NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER",
            runtimeVersion: NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER_VERSION,
            evidenceSource: runtimeStatus?.evidenceSource || null,
          },
        });
      }

      const canonicalRoster = canonicalAvailabilityRoster(roster, rawEvidence);
      const playerResults = [];

      for (const raw of rawEvidence) {
        const matched = findRosterPlayer(roster, raw);
        const availabilityPlayer = canonicalAvailabilityPlayer(matched || {}, raw);
        const integrated = resolveNFLPlayerImpactIntegratedInputs({
          canonicalAvailabilityPlayer: availabilityPlayer,
          canonicalAvailabilityRoster: canonicalRoster,
          season: normalizedSeason,
          week,
          team: teamAbbreviation,
        });

        const result = getCanonicalPlayerAvailabilityImpact({
          player: {
            id: availabilityPlayer.player.playerId,
            playerId: availabilityPlayer.player.playerId,
            name: availabilityPlayer.player.playerName,
            playerName: availabilityPlayer.player.playerName,
            position: availabilityPlayer.player.position,
            identity: {
              position: availabilityPlayer.player.position,
            },
          },
          availabilityEvidence: toCanonicalEvidence(raw, runtimeStatus),
          canonicalCaliber: integrated?.canonicalCaliber || null,
          impactContext: integrated?.contextResolution?.context || null,
          // PI.5: the legacy normalized 0-100 methodology remains unapproved.
          // Decision Influence V1 uses only the validated caliber-loss signal.
          impactMethodologyProfile: null,
        });

        const affectedCaliberGrade =
          Number(integrated?.canonicalCaliber?.caliberGrade);
        const replacementCaliberGrade =
          Number(integrated?.replacementCaliber?.caliberGrade);

        const caliberDelta =
          Number.isFinite(affectedCaliberGrade) &&
          Number.isFinite(replacementCaliberGrade)
            ? Math.max(0, affectedCaliberGrade - replacementCaliberGrade)
            : null;

        playerResults.push({
          ...result,
          decisionInfluenceEvidence: {
            contract: "NFLPlayerImpactDecisionInfluenceEvidence",
            version: "FIE-NFL-PLAYER-IMPACT-DECISION-INFLUENCE-EVIDENCE-1.0.0",
            affectedCaliberGrade:
              Number.isFinite(affectedCaliberGrade) ? affectedCaliberGrade : null,
            replacementCaliberGrade:
              Number.isFinite(replacementCaliberGrade) ? replacementCaliberGrade : null,
            caliberDelta,
            replacementPlayerId: integrated?.replacement?.playerId || null,
            replacementPlayerName: integrated?.replacement?.playerName || null,
            evidenceBasis:
              caliberDelta === null
                ? "INSUFFICIENT_CALIBER_PAIR"
                : "CANONICAL_AFFECTED_MINUS_REPLACEMENT_CALIBER",
            productionScoringAuthority:
              "PI5_PLAYER_IMPACT_DECISION_INFLUENCE_ONLY",
          },
        });
      }

      return adaptCanonicalPlayerAvailabilityResultsToTeamEvidence({
        teamAbbreviation,
        playerResults,
        freshness: {
          evidence: canonicalFreshness(runtimeStatus),
          repository: runtimeStatus?.providerStatus || null,
          acquisition: runtimeStatus?.freshness || null,
          asOf: runtimeStatus?.checkedAt || null,
        },
        provenance: {
          provider: "NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER",
          runtimeVersion: NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER_VERSION,
          evidenceSource: runtimeStatus?.evidenceSource || null,
          scoringAuthorization: "SHADOW_ONLY",
        },
        sourceRefs: rawEvidence.flatMap((record) => [
          record?.provenance?.source,
          record?.provenance?.sourceUrl,
        ]).filter(Boolean),
      });
    },
  });
}

export const defaultNFLRuntimeCanonicalTeamAvailabilityProvider =
  createNFLRuntimeCanonicalTeamAvailabilityProvider();

export default {
  NFL_RUNTIME_CANONICAL_TEAM_AVAILABILITY_PROVIDER_VERSION,
  createNFLRuntimeCanonicalTeamAvailabilityProvider,
  defaultNFLRuntimeCanonicalTeamAvailabilityProvider,
};
