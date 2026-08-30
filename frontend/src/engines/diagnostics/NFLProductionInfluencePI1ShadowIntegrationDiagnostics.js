import assert from "node:assert/strict";

import {
  createNFLPlayerAvailabilityEvidence,
} from "../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityEvidenceContract.js";
import {
  createNFLRuntimeCanonicalTeamAvailabilityProvider,
} from "../teamIntelligence/availability/NFLRuntimeCanonicalTeamAvailabilityProvider.js";
import {
  emptyNFLTeamAvailabilityEvidenceProvider,
} from "../teamIntelligence/availability/NFLTeamAvailabilityEvidenceProvider.js";
import {
  getNFLTeamIntelligenceResult,
} from "../teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";
import {
  buildNFLMatchupIntelligenceProfile,
} from "../../data/footballIntelligence/services/NFLMatchupIntelligenceService.js";
import {
  getNFLGameDecision,
} from "../gameDecisionSupport/canonical/NFLGameDecisionService.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

const qb = {
  playerId: "00-0034796",
  identity: {
    playerId: "00-0034796",
    playerName: "Lamar Jackson",
    position: "QB",
  },
  roster: {
    starter: true,
    depthChartRank: 1,
  },
};

const evidence = createNFLPlayerAvailabilityEvidence({
  season: 2026,
  week: 1,
  team: "BAL",
  playerId: "00-0034796",
  playerName: "Lamar Jackson",
  position: "QB",
  reportStatus: "QUESTIONABLE",
  practiceStatus: "LIMITED",
  primaryInjury: "Diagnostic fixture",
  modifiedAt: "2026-09-08T16:00:00Z",
  source: "PI1_DIAGNOSTIC_FIXTURE",
});

const provider = createNFLRuntimeCanonicalTeamAvailabilityProvider({
  rosterResolver(team) {
    return { roster: team === "BAL" ? [qb] : [] };
  },
  availabilityEvidenceResolver(team) {
    return team === "BAL" ? [evidence] : [];
  },
  availabilityRuntimeStatusResolver({ team }) {
    return team === "BAL"
      ? {
          freshness: "FRESH",
          providerStatus: "DIAGNOSTIC",
          evidenceSource: "PI1_DIAGNOSTIC_FIXTURE",
          checkedAt: "2026-09-08T16:05:00Z",
        }
      : {};
  },
  roleEvidenceResolver() {
    return [];
  },
});

const teamEvidence = provider.resolve("BAL", { season: 2026, throughWeek: 1 });
const team = getNFLTeamIntelligenceResult("BAL", {
  season: 2026,
  throughWeek: 1,
  availabilityProvider: provider,
});

const baselineMatchup = buildNFLMatchupIntelligenceProfile({
  gameId: 910001,
  season: 2026,
  week: 1,
  awayTeam: "BAL",
  homeTeam: "BUF",
  availabilityProvider: emptyNFLTeamAvailabilityEvidenceProvider,
  context: { homeField: true },
});
const shadowMatchup = buildNFLMatchupIntelligenceProfile({
  gameId: 910001,
  season: 2026,
  week: 1,
  awayTeam: "BAL",
  homeTeam: "BUF",
  availabilityProvider: provider,
  context: { homeField: true },
});

const generatedAt = "2026-09-08T17:00:00Z";
const baselineDecision = getNFLGameDecision({
  game: { gameId: 910001, season: 2026, week: 1, awayTeam: "BAL", homeTeam: "BUF" },
  matchupIntelligence: baselineMatchup,
  generatedAt,
});
const shadowDecision = getNFLGameDecision({
  game: { gameId: 910001, season: 2026, week: 1, awayTeam: "BAL", homeTeam: "BUF" },
  matchupIntelligence: shadowMatchup,
  generatedAt,
});

test("provider projects canonical player availability", () => {
  assert.equal(teamEvidence.available, true);
  assert.equal(teamEvidence.playerCount, 1);
  assert.equal(teamEvidence.players[0].availability.status, "QUESTIONABLE");
});

test("provider projects canonical quarterback state", () => {
  assert.equal(teamEvidence.quarterbackState?.playerId, "00-0034796");
  assert.equal(teamEvidence.quarterbackState?.status, "QUESTIONABLE");
});

test("PI.1 does not authorize player impact scoring", () => {
  assert.equal(teamEvidence.modeledImpactCount, 0);
  assert.equal(teamEvidence.players[0].impact?.modelState, "UNMODELED");
  assert.equal(teamEvidence.players[0].impact?.overallImpact, null);
});

test("Team Intelligence carries availability evidence", () => {
  const availability = team.evidence.find((item) => item.type === "NFL_PLAYER_AVAILABILITY_IMPACT");
  assert.ok(availability);
  assert.equal(availability.playerCount, 1);
  assert.equal(availability.quarterbackState?.status, "QUESTIONABLE");
});

test("Team Intelligence scoring components remain null", () => {
  assert.equal(team.components?.availability, null);
  assert.equal(team.components?.quarterback, null);
});

test("Matchup availability and quarterback dimensions remain null", () => {
  assert.equal(shadowMatchup.dimensions?.availability, null);
  assert.equal(shadowMatchup.dimensions?.quarterback, null);
});

test("Matchup Edge is invariant", () => {
  assert.equal(shadowMatchup.matchupEdge, baselineMatchup.matchupEdge);
  assert.equal(shadowMatchup.evidenceQuality, baselineMatchup.evidenceQuality);
});

test("Decision favorite and probabilities are invariant", () => {
  assert.equal(shadowDecision.favorite, baselineDecision.favorite);
  assert.equal(shadowDecision.homeWinProbability, baselineDecision.homeWinProbability);
  assert.equal(shadowDecision.awayWinProbability, baselineDecision.awayWinProbability);
  assert.equal(shadowDecision.expectedHomeMargin, baselineDecision.expectedHomeMargin);
  assert.equal(shadowDecision.confidence, baselineDecision.confidence);
});

const failed = tests.filter((item) => !item.passed);
console.log(JSON.stringify({
  suite: "FIE PI.1 Production Influence Shadow Integration",
  contractVersion: "FIE-PI1-PRODUCTION-INFLUENCE-SHADOW-INTEGRATION-1.0.0",
  status: failed.length ? "FAIL" : "PASS",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  safeguards: {
    availabilityScoringAuthorized: false,
    quarterbackScoringAuthorized: false,
    playerImpactScoringAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionScoringMutationAuthorized: false,
  },
}, null, 2));

if (failed.length) process.exitCode = 1;
