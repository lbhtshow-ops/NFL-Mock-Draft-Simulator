import {
  coordinateNFLLiveEvidenceRefresh,
} from "../../src/engines/gameDecisionSupport/refresh/NFLLiveEvidenceRefreshCoordinator.js";

export const LE3J_ACCEPTANCE_FIXTURE_CONTRACT =
  "FIELE3JProductionConsumerAcceptanceFixture";
export const LE3J_ACCEPTANCE_FIXTURE_VERSION = "1.0.0";

export const LE3J_ACCEPTANCE_TARGET = Object.freeze({
  gameId: 34,
  season: 2026,
  week: 1,
  gameType: "REG",
  awayTeam: "BAL",
  homeTeam: "IND",
  kickoff: "2026-09-13T17:00:00.000Z",
  affectedTeam: "BAL",
});

const ACCEPTANCE_PLAYER = Object.freeze({
  playerId: "acceptance:BAL:qb1",
  displayName: "LE-3J Controlled Acceptance Quarterback",
  position: "QB",
  availability: Object.freeze({
    status: "OUT",
  }),
  decisionInfluenceEvidence: Object.freeze({
    contract: "NFLPlayerImpactDecisionInfluenceEvidence",
    version: "FIE-NFL-PLAYER-IMPACT-DECISION-INFLUENCE-EVIDENCE-1.0.0",
    affectedCaliberGrade: 95,
    replacementCaliberGrade: 75,
    caliberDelta: 20,
    replacementPlayerId: "acceptance:BAL:qb2",
    replacementPlayerName: "LE-3J Controlled Acceptance Replacement",
    evidenceBasis: "LE3J_CONTROLLED_CANONICAL_ACCEPTANCE_PAIR",
    productionScoringAuthority: "PI5_PLAYER_IMPACT_DECISION_INFLUENCE_ONLY",
  }),
});

function targetMatches(args = {}) {
  return (
    Number(args.gameId) === LE3J_ACCEPTANCE_TARGET.gameId &&
    Number(args.season) === LE3J_ACCEPTANCE_TARGET.season &&
    Number(args.week) === LE3J_ACCEPTANCE_TARGET.week &&
    String(args.awayTeam || "").toUpperCase() === LE3J_ACCEPTANCE_TARGET.awayTeam &&
    String(args.homeTeam || "").toUpperCase() === LE3J_ACCEPTANCE_TARGET.homeTeam
  );
}

function mergeAcceptancePlayer(matchup) {
  const source = matchup?.sourceTeamIntelligence || {};
  const away = source.away || {};
  const availability = away.availabilityEvidence || {};
  const players = Array.isArray(availability.players)
    ? availability.players.filter(player => player?.playerId !== ACCEPTANCE_PLAYER.playerId)
    : [];

  return Object.freeze({
    ...matchup,
    sourceTeamIntelligence: Object.freeze({
      ...source,
      away: Object.freeze({
        ...away,
        availabilityEvidence: Object.freeze({
          ...availability,
          players: Object.freeze([...players, ACCEPTANCE_PLAYER]),
          provenance: Object.freeze({
            ...(availability.provenance || {}),
            le3jAcceptanceOverlay: true,
            fixtureContract: LE3J_ACCEPTANCE_FIXTURE_CONTRACT,
            fixtureVersion: LE3J_ACCEPTANCE_FIXTURE_VERSION,
          }),
        }),
      }),
    }),
  });
}

function fingerprint(decision = null) {
  if (!decision) return null;
  return Object.freeze({
    contract: decision.contract ?? null,
    favorite: decision.favorite ?? null,
    homeWinProbability: decision.homeWinProbability ?? null,
    awayWinProbability: decision.awayWinProbability ?? null,
    expectedHomeMargin: decision.expectedHomeMargin ?? null,
    model: decision.model ?? null,
    decisionInfluence: decision.decisionInfluence ?? null,
  });
}

export function createLE3JProductionConsumerAcceptanceFixture({
  enabled = process.env.FIE_LE3J_ACCEPTANCE_ENABLED === "true",
  token = process.env.FIE_LE3J_ACCEPTANCE_TOKEN || null,
  now = () => new Date().toISOString(),
} = {}) {
  let active = false;
  let activatedAt = null;
  let lastActivation = null;

  function authorize(candidate) {
    if (!enabled) {
      return { ok: false, statusCode: 404, code: "LE3J_ACCEPTANCE_DISABLED" };
    }
    if (!token || String(candidate || "") !== String(token)) {
      return { ok: false, statusCode: 403, code: "LE3J_ACCEPTANCE_UNAUTHORIZED" };
    }
    return { ok: true };
  }

  function status() {
    return Object.freeze({
      contract: LE3J_ACCEPTANCE_FIXTURE_CONTRACT,
      version: LE3J_ACCEPTANCE_FIXTURE_VERSION,
      enabled,
      active,
      activatedAt,
      target: LE3J_ACCEPTANCE_TARGET,
      lastActivation,
      governance: Object.freeze({
        productionEvidenceMutationAuthorized: false,
        repositoryMutationAuthorized: false,
        providerRequestAuthorized: false,
        modelMutationAuthorized: false,
        probabilityMutationAuthorized: false,
        pickemReasoningAuthorized: false,
        onlyForceRefreshDecisionRequestsSeeOverlay: true,
      }),
    });
  }

  function shouldApply(args = {}) {
    return (
      active &&
      targetMatches(args) &&
      (args.forceRefresh === true || args.acceptanceFixture === true)
    );
  }

  function applyToMatchup(matchup, args = {}) {
    return shouldApply(args) ? mergeAcceptancePlayer(matchup) : matchup;
  }

  async function activate({ production } = {}) {
    if (!enabled) throw new Error("LE3J_ACCEPTANCE_DISABLED");
    if (
      !production ||
      typeof production.buildMatchup !== "function" ||
      typeof production.getDecision !== "function"
    ) {
      throw new Error("LE3J_ACCEPTANCE_PRODUCTION_COMPOSITION_REQUIRED");
    }

    active = true;
    activatedAt = now();

    const previousPlayers = [{
      playerId: "acceptance:BAL:qb1",
      playerName: "LE-3J Controlled Acceptance Quarterback",
      position: "QB",
      starter: true,
      depthRank: 1,
      availabilityStatus: "AVAILABLE",
      rosterStatus: "ACTIVE",
      snapshotId: "le3j-a",
      effectiveAt: activatedAt,
    }];

    const currentPlayers = [{
      ...previousPlayers[0],
      availabilityStatus: "OUT",
      reportStatus: "OUT",
      snapshotId: "le3j-b",
    }];

    const scheduleRecords = [{
      ...LE3J_ACCEPTANCE_TARGET,
      status: "SCHEDULED",
      sourceAuthority: "LBHT_CANONICAL_SCHEDULE",
      externalRefs: {},
    }];

    try {
      const refresh = await coordinateNFLLiveEvidenceRefresh({
        affectedTeam: LE3J_ACCEPTANCE_TARGET.affectedTeam,
        previousPlayers,
        currentPlayers,
        scheduleRecords,
        asOf: activatedAt,
        provenance: {
          acceptanceGate: "LE-3J-B2",
          source: "CONTROLLED_NONDESTRUCTIVE_PRODUCTION_CONSUMER_ACCEPTANCE",
          providerSpecificDependencyAuthorized: false,
        },
        availabilityRuntime: production.availabilityRuntime,
        buildMatchup: input =>
          production.buildMatchup({
            ...input,
            forceRefresh: true,
            acceptanceFixture: true,
          }),
        getDecision: production.getDecision,
        now,
      });

      const executed = refresh?.results?.find(
        entry => entry?.execution?.status === "EXECUTED"
      );

      if (
        refresh?.summary?.changes !== 1 ||
        refresh?.summary?.refreshRequirements !== 1 ||
        refresh?.summary?.executed !== 1 ||
        !executed?.execution?.decision
      ) {
        throw new Error("LE3J_ACCEPTANCE_CANONICAL_REFRESH_DID_NOT_EXECUTE");
      }

      lastActivation = Object.freeze({
        status: "ACTIVE",
        activatedAt,
        change: Object.freeze({
          playerId: previousPlayers[0].playerId,
          previousStatus: "AVAILABLE",
          currentStatus: "OUT",
          materiality: executed.orchestration?.materiality?.level ?? null,
          reasonCode: executed.orchestration?.materiality?.reasonCode ?? null,
        }),
        refresh: Object.freeze({
          changes: refresh.summary.changes,
          refreshRequirements: refresh.summary.refreshRequirements,
          executed: refresh.summary.executed,
          executionStatus: executed.execution.status,
        }),
        canonicalDecisionB: fingerprint(executed.execution.decision),
      });

      return status();
    } catch (error) {
      active = false;
      activatedAt = null;
      lastActivation = Object.freeze({
        status: "FAILED",
        error: error.message,
      });
      throw error;
    }
  }

  function deactivate() {
    active = false;
    activatedAt = null;
    return status();
  }

  return Object.freeze({
    contract: LE3J_ACCEPTANCE_FIXTURE_CONTRACT,
    version: LE3J_ACCEPTANCE_FIXTURE_VERSION,
    authorize,
    status,
    shouldApply,
    applyToMatchup,
    activate,
    deactivate,
  });
}

export default {
  LE3J_ACCEPTANCE_FIXTURE_CONTRACT,
  LE3J_ACCEPTANCE_FIXTURE_VERSION,
  LE3J_ACCEPTANCE_TARGET,
  createLE3JProductionConsumerAcceptanceFixture,
};
