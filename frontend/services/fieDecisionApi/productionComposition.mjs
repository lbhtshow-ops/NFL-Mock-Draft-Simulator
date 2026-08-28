import {
  buildNFLMatchupIntelligenceProfile,
} from "../../src/data/footballIntelligence/services/NFLMatchupIntelligenceService.js";
import {
  getNFLGameDecision,
} from "../../src/engines/gameDecisionSupport/canonical/NFLGameDecisionService.js";
import { normalizeNFLTeam } from "./teamNormalizer.mjs";
import {
  createFieResearchRepositoryAvailabilityRuntime,
} from "./researchRepositoryAvailability.mjs";

export const FIE_DECISION_PRODUCTION_COMPOSITION_CONTRACT =
  "FieDecisionProductionComposition";
export const FIE_DECISION_PRODUCTION_COMPOSITION_VERSION = "1.2.0";

const FORCED_REFRESH_UNSUPPORTED_STATUSES = new Set([
  "NOT_CONFIGURED",
  "ADAPTER_UNAVAILABLE",
]);

export function createFieDecisionProductionComposition({
  availabilityRuntime = null,
  availabilityRepositoryService = null,
  createAvailabilityRuntime = createFieResearchRepositoryAvailabilityRuntime,
  buildMatchupIntelligence = buildNFLMatchupIntelligenceProfile,
  getDecision = getNFLGameDecision,
  normalizeTeam = normalizeNFLTeam,
  acceptanceFixture = null,
} = {}) {
  const runtime =
    availabilityRuntime ||
    createAvailabilityRuntime({
      repositoryService: availabilityRepositoryService,
    });

  async function buildMatchup(args = {}) {
    const awayTeam = normalizeTeam(args.awayTeam);
    const homeTeam = normalizeTeam(args.homeTeam);
    const teams = [awayTeam, homeTeam].filter(Boolean);
    const season = args.season;
    const week = args.availabilityWeek ?? args.week;
    const gameType = args.gameType || "REG";
    const forceRefresh = args.forceRefresh === true;

    if (forceRefresh) {
      if (typeof runtime?.invalidateTeamAvailability !== "function") {
        throw new Error("FIE_FORCED_REFRESH_UNSUPPORTED:availability invalidation is unavailable");
      }

      for (const team of teams) {
        const invalidation = runtime.invalidateTeamAvailability({
          season,
          week,
          gameType,
          team,
        });

        if (FORCED_REFRESH_UNSUPPORTED_STATUSES.has(invalidation?.status)) {
          throw new Error(
            `FIE_FORCED_REFRESH_UNAVAILABLE:${invalidation.status}:${season}:${week}:${gameType}:${team}`
          );
        }
      }
    }

    await runtime.loadForMatchup({
      season,
      week,
      gameType,
      teams,
    });

    const matchup = await buildMatchupIntelligence({
      ...args,
      awayTeam,
      homeTeam,
    });

    return typeof acceptanceFixture?.applyToMatchup === "function"
      ? acceptanceFixture.applyToMatchup(matchup, {
          ...args,
          awayTeam,
          homeTeam,
        })
      : matchup;
  }

  return Object.freeze({
    contract: FIE_DECISION_PRODUCTION_COMPOSITION_CONTRACT,
    version: FIE_DECISION_PRODUCTION_COMPOSITION_VERSION,
    availabilityRuntime: runtime,
    buildMatchup,
    getDecision,
    governance: Object.freeze({
      canonicalAvailabilityRuntimeReused: true,
      canonicalMatchupBuilderReused: true,
      canonicalDecisionServiceReused: true,
      forcedRefreshInvalidatesAvailabilityCache: true,
      acceptanceFixtureMayAlterMatchupEvidenceOnly: true,
      providerSpecificReasoningAuthorized: false,
      pickemReasoningAuthorized: false,
      modelMutationAuthorized: false,
      probabilityMutationAuthorized: false,
    }),
  });
}

export default {
  FIE_DECISION_PRODUCTION_COMPOSITION_CONTRACT,
  FIE_DECISION_PRODUCTION_COMPOSITION_VERSION,
  createFieDecisionProductionComposition,
};
