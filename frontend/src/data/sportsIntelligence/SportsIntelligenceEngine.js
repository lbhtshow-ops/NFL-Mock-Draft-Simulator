import { buildProspectIntelligence } from "../../engines/ProspectIntelligenceEngine.js";
import { getPlayerEvaluationIntelligenceResult } from "../../engines/PlayerEvaluationEngine.js";
import { buildDerivedTeamNeeds } from "../../engines/DerivedTeamNeedsEngine.js";
import { resolveFootballIntelligence } from "../../engines/FootballIntelligenceResolver.js";
import { getTeamContext, teamContexts } from "../footballIntelligence/teamContext/teamContextIndex.js";
import { teamProfiles } from "../../components/draftV3/WarRoom/WarRoomData.js";
import { resolveDevelopmentProspectProjection } from "./adapters/DevelopmentProspectProjectionAdapter.js";
import { getTeamAIProfile, teamAIProfiles } from "../../engines/TeamProfiles.js";
import { resolveSportsDraftDecision as resolveSportsDraftDecisionCore } from "./draft/SportsDraftDecisionEngine.js";
import { resolveDraftWireItems } from "./draft/DraftWireEngine.js";
import { resolveApplicationProspect } from "../footballIntelligence/prospectCatalog/ApplicationProspectCatalog.js";
import {
  createMDSFIEIntelligenceApplicationServiceResult,
} from "./services/MDSFIEIntelligenceApplicationService.js";
import {
  getNFLTeamIntelligenceResult,
} from "../../engines/teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";

const POSITION_ORDER = ["QB", "RB", "WR", "TE", "OT", "IOL", "EDGE", "DT", "LB", "CB", "S"];

const WAR_ROOM_COVERAGE = Object.freeze({
  CANONICAL: "CANONICAL",
  ROSTER_DERIVED: "ROSTER_DERIVED",
  MDS_RUNTIME: "MDS_RUNTIME",
  TRANSITIONAL: "TRANSITIONAL",
  UNAVAILABLE: "UNAVAILABLE",
});

function coverage(classification, available, source, limitations = []) {
  return { classification, available: Boolean(available), source: source || null, limitations };
}

function classifiedValue(canonicalValue, transitionalValue, canonicalSource) {
  if (canonicalValue !== null && canonicalValue !== undefined && canonicalValue !== "") return coverage(WAR_ROOM_COVERAGE.CANONICAL, true, canonicalSource);
  if (transitionalValue !== null && transitionalValue !== undefined && transitionalValue !== "") return coverage(WAR_ROOM_COVERAGE.TRANSITIONAL, true, "TRANSITIONAL_WAR_ROOM_DATA", ["Canonical team knowledge has not yet established this field."]);
  return coverage(WAR_ROOM_COVERAGE.UNAVAILABLE, false, null, ["No established value is available."]);
}

function domainClassification(fields) {
  const states = Object.values(fields || {}).map((entry) => entry?.classification).filter(Boolean);
  if (!states.length || states.every((state) => state === WAR_ROOM_COVERAGE.UNAVAILABLE)) return WAR_ROOM_COVERAGE.UNAVAILABLE;
  for (const state of [WAR_ROOM_COVERAGE.CANONICAL, WAR_ROOM_COVERAGE.ROSTER_DERIVED, WAR_ROOM_COVERAGE.MDS_RUNTIME, WAR_ROOM_COVERAGE.TRANSITIONAL]) {
    if (states.every((value) => value === state)) return state;
  }
  return "PARTIAL";
}

function normalizeNeedPosition(position) {
  if (position === "DE") return "EDGE";
  if (position === "DL") return "DT";
  if (position === "OL") return "IOL";
  return position;
}

function needLabel(score) {
  if (score >= 90) return "Critical";
  if (score >= 75) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Low";
  return "Depth";
}

function teamAbbreviation(team) {
  return team?.abbreviation || team?.abbr || team?.short_name || team?.code || "";
}

function mergeProspectProfile(base, development) {
  if (!development) return base;

  const bio = {
    ...(base?.profile?.bio || {}),
    playerName: base?.profile?.bio?.playerName || development.subject?.name || null,
    name: base?.profile?.bio?.name || development.subject?.name || null,
    position: base?.profile?.bio?.position || development.subject?.position || null,
    school: development.subject?.school || base?.profile?.bio?.school || null,
    conference: development.subject?.conference || base?.profile?.bio?.conference || null,
    heightInches: development.subject?.heightInches ?? base?.profile?.bio?.heightInches ?? null,
    weightPounds: development.subject?.weightPounds ?? base?.profile?.bio?.weightPounds ?? null,
  };

  return {
    ...base,
    profile: {
      ...(base?.profile || {}),
      bio,
    },
  };
}

export function resolveSportsProspectIntelligence(player) {
  const applicationProspect = resolveApplicationProspect(player);
  const football = buildProspectIntelligence(player);
  const development = resolveDevelopmentProspectProjection(player);
  const canonicalEvaluation = getPlayerEvaluationIntelligenceResult(player);
  const canonicalRuntime = canonicalEvaluation?.rawData?.prospectRuntime || null;
  const canonicalModelResult = canonicalEvaluation?.rawData?.prospectModelResult || null;
  const canonicalDomains = canonicalRuntime?.intelligence || {};
  const merged = mergeProspectProfile(football, development);
  const governedAvailable = Boolean(football?.available);
  const canonicalProspectConnected = Boolean(canonicalRuntime);
  const canonicalProspectAvailable = Boolean(canonicalEvaluation?.available);
  const canonicalProspectError =
    canonicalRuntime?.error ||
    canonicalModelResult?.validation?.errors?.[0]?.code ||
    null;

  const canonicalIntelligence = {
    ...(merged?.intelligence || {}),
    evaluation: canonicalEvaluation || merged?.intelligence?.evaluation || null,
    production: canonicalDomains.production || merged?.intelligence?.production || null,
    athletics: canonicalDomains.athleticism || merged?.intelligence?.athletics || null,
    footballIQ: canonicalDomains.footballIQ || merged?.intelligence?.footballIQ || null,
    schemeFit: canonicalDomains.schemeFit || merged?.intelligence?.schemeFit || null,
    traits: canonicalDomains.playerTraits || merged?.intelligence?.traits || null,
  };

  return {
    ...merged,
    available: canonicalProspectConnected || governedAvailable || Boolean(development),
    intelligence: canonicalIntelligence,
    evaluation: canonicalIntelligence.evaluation,
    production: canonicalIntelligence.production,
    athletics: canonicalIntelligence.athletics,
    footballIQ: canonicalIntelligence.footballIQ,
    schemeFit: canonicalIntelligence.schemeFit,
    traits: canonicalIntelligence.traits,
    canonicalProspectEvaluation: canonicalEvaluation,
    canonicalProspectRuntime: canonicalRuntime,
    canonicalProspectModelResult: canonicalModelResult,
    applicationProspect,
    applicationProspectRef: applicationProspect?.applicationProspectRef || null,
    fidProspectRef: applicationProspect?.fidProspectRef || null,
    intelligenceCoverage: applicationProspect?.intelligenceCoverage || null,
    sportsIntelligence: {
      engine: "LBHT Sports Intelligence Engine",
      contractVersion: "SIE-CANONICAL-PROSPECT-CONSUMER-1.1.0",
      canonicalProspectConnected,
      canonicalProspectAvailable,
      canonicalProspectReadiness: canonicalRuntime?.readiness || "UNAVAILABLE",
      canonicalProspectPosition: canonicalRuntime?.position || player?.position || null,
      canonicalProspectModel: canonicalModelResult?.model || null,
      canonicalProspectError,
      footballIntelligenceAvailable: governedAvailable,
      developmentProjectionAvailable: Boolean(development),
      sourceClassification: canonicalProspectConnected
        ? canonicalProspectAvailable
          ? "CANONICAL_FIE_PROSPECT_MODEL"
          : "CANONICAL_FIE_PROSPECT_MODEL_UNAVAILABLE"
        : governedAvailable
          ? "FOOTBALL_INTELLIGENCE_PLATFORM"
          : development
            ? "DEVELOPMENT_FIXTURE_PROJECTION"
            : "UNAVAILABLE",
      canonical: canonicalProspectConnected || Boolean(football?.record?.canonicalId || football?.record?.entityRef),
      applicationProspectRef: applicationProspect?.applicationProspectRef || null,
      fidProspectRef: applicationProspect?.fidProspectRef || null,
      intelligenceCoverage: applicationProspect?.intelligenceCoverage?.level || "UNAVAILABLE",
      limitations: [
        ...(development?.limitations || applicationProspect?.intelligenceCoverage?.limitations || []),
        ...(canonicalProspectError ? [canonicalProspectError] : []),
      ],
    },
    developmentProjection: development,
  };
}

export function resolveSportsTeamIntelligence(team) {
  const abbreviation = teamAbbreviation(team);
  const governed = abbreviation ? resolveFootballIntelligence(abbreviation) : null;
  const teamContext = abbreviation ? getTeamContext(abbreviation) : null;
  const hasTeamSpecificContext = Boolean(abbreviation && teamContexts?.[abbreviation]);
  const rosterNeeds = abbreviation ? buildDerivedTeamNeeds(abbreviation) : null;
  const legacy = teamProfiles[abbreviation] || null;
  const decisionProfile = getTeamAIProfile(team);

  const fallbackNeeds = Object.fromEntries(
    (legacy?.needs || []).map((need) => [normalizeNeedPosition(need.position), need.score])
  );

  const rows = POSITION_ORDER.map((position) => {
    const raw = rosterNeeds?.needs?.[position];
    const score = Number.isFinite(raw)
      ? Math.round(raw <= 10 ? raw * 10 : raw)
      : Math.round(fallbackNeeds[position] || 0);

    return {
      position,
      score,
      label: needLabel(score),
      source: Number.isFinite(raw)
        ? "TEAM_INTELLIGENCE_ENGINE"
        : fallbackNeeds[position]
          ? "TRANSITIONAL_TEAM_CONTEXT"
          : "UNAVAILABLE",
    };
  });

  const governedTeam = governed?.team || null;
  const gm = governed?.generalManager || null;
  const headCoach = governed?.headCoach || null;

  const organizationCoverage = {
    owner: classifiedValue(governedTeam?.currentLeadership?.owner, legacy?.owner, "FOOTBALL_INTELLIGENCE_PLATFORM"),
    president: classifiedValue(governedTeam?.currentLeadership?.president, legacy?.president, "FOOTBALL_INTELLIGENCE_PLATFORM"),
    generalManager: classifiedValue(gm?.name, legacy?.gm, "FOOTBALL_INTELLIGENCE_PLATFORM"),
    headCoach: classifiedValue(headCoach?.name, legacy?.headCoach, "FOOTBALL_INTELLIGENCE_PLATFORM"),
    offensiveCoordinator: classifiedValue(governedTeam?.currentLeadership?.offensiveCoordinator, legacy?.offensiveCoordinator, "FOOTBALL_INTELLIGENCE_PLATFORM"),
    defensiveCoordinator: classifiedValue(governedTeam?.currentLeadership?.defensiveCoordinator, legacy?.defensiveCoordinator, "FOOTBALL_INTELLIGENCE_PLATFORM"),
    competitiveWindow: classifiedValue(governedTeam?.currentContext?.competitiveWindow || (hasTeamSpecificContext ? teamContext?.competitiveWindow : null), legacy?.window, hasTeamSpecificContext ? "TEAM_CONTEXT" : "FOOTBALL_INTELLIGENCE_PLATFORM"),
  };
  const identityCoverage = {
    offensiveScheme: classifiedValue(hasTeamSpecificContext ? teamContext?.offensiveScheme : null, legacy?.offensiveScheme, "TEAM_CONTEXT"),
    defensiveScheme: classifiedValue(hasTeamSpecificContext ? teamContext?.defensiveScheme : null, legacy?.defensiveScheme, "TEAM_CONTEXT"),
    teamBuildingStyle: coverage(WAR_ROOM_COVERAGE.TRANSITIONAL, Boolean(decisionProfile?.teamBuildingStyle), "TRANSITIONAL_DECISION_PROFILE", ["Draft strategy is not yet canonical FIE team knowledge."]),
    riskTolerance: coverage(WAR_ROOM_COVERAGE.TRANSITIONAL, Number.isFinite(decisionProfile?.aggression), "TRANSITIONAL_DECISION_PROFILE", ["Draft strategy is not yet canonical FIE team knowledge."]),
  };
  const needsCoverage = rosterNeeds?.available
    ? coverage(WAR_ROOM_COVERAGE.ROSTER_DERIVED, true, "DERIVED_TEAM_NEEDS_ENGINE", rosterNeeds?.coverage?.limitations || [])
    : legacy?.needs?.length
      ? coverage(WAR_ROOM_COVERAGE.TRANSITIONAL, true, "TRANSITIONAL_WAR_ROOM_DATA", ["Roster-derived needs unavailable; transitional need context is displayed."])
      : coverage(WAR_ROOM_COVERAGE.UNAVAILABLE, false, null);
  const coverageContract = {
    version: "WAR_ROOM_INTELLIGENCE_COVERAGE_V1",
    classifications: WAR_ROOM_COVERAGE,
    domains: {
      organization: { classification: domainClassification(organizationCoverage), fields: organizationCoverage },
      identity: { classification: domainClassification(identityCoverage), fields: identityCoverage },
      needs: needsCoverage,
      roster: coverage(WAR_ROOM_COVERAGE.ROSTER_DERIVED, Boolean(abbreviation), "NFL_ROSTER_REGISTRY"),
      drafted: coverage(WAR_ROOM_COVERAGE.MDS_RUNTIME, true, "MDS_DRAFT_RUNTIME"),
      draftCapital: coverage(WAR_ROOM_COVERAGE.MDS_RUNTIME, true, "MDS_DRAFT_RUNTIME"),
      draftQueue: coverage(WAR_ROOM_COVERAGE.MDS_RUNTIME, true, "MDS_DRAFT_RUNTIME"),
      draftStrategy: coverage(WAR_ROOM_COVERAGE.TRANSITIONAL, Boolean(decisionProfile), teamAIProfiles?.[team?.name] ? "TRANSITIONAL_TEAM_DECISION_PROFILE" : "DEFAULT_TRANSITIONAL_DECISION_PROFILE", ["Governed Draft Intelligence has not yet replaced this profile."]),
    },
  };

  return {
    available: Boolean(governed || rosterNeeds?.available || legacy),
    abbreviation,
    coverageContract,
    sourceClassification: governed
      ? "FOOTBALL_INTELLIGENCE_PLATFORM"
      : rosterNeeds?.available
        ? "ROSTER_DERIVED_TEAM_INTELLIGENCE"
        : legacy
          ? "TRANSITIONAL_TEAM_CONTEXT"
          : "UNAVAILABLE",
    organization: {
      owner: governedTeam?.currentLeadership?.owner || legacy?.owner || "Not yet established",
      president: governedTeam?.currentLeadership?.president || legacy?.president || "Not yet established",
      generalManager: gm?.name || legacy?.gm || "Not yet established",
      headCoach: headCoach?.name || legacy?.headCoach || "Not yet established",
      offensiveCoordinator: governedTeam?.currentLeadership?.offensiveCoordinator || legacy?.offensiveCoordinator || "Not yet established",
      defensiveCoordinator: governedTeam?.currentLeadership?.defensiveCoordinator || legacy?.defensiveCoordinator || "Not yet established",
      competitiveWindow:
        governedTeam?.currentContext?.competitiveWindow?.replace?.(/_/g, " ") ||
        (hasTeamSpecificContext ? teamContext?.competitiveWindow : null) ||
        legacy?.window ||
        "Not yet established",
    },
    identity: {
      offensiveScheme: (hasTeamSpecificContext ? teamContext?.offensiveScheme : null) || legacy?.offensiveScheme || "Not yet established",
      defensiveScheme: (hasTeamSpecificContext ? teamContext?.defensiveScheme : null) || legacy?.defensiveScheme || "Not yet established",
      teamBuildingStyle: decisionProfile?.teamBuildingStyle || "Not yet established",
      riskTolerance: Number.isFinite(decisionProfile?.aggression)
        ? decisionProfile.aggression >= 8 ? "Aggressive" : decisionProfile.aggression <= 4 ? "Conservative" : "Balanced"
        : "Not yet established",
      bpaPreference: decisionProfile?.bpaPreference ?? null,
      needPreference: decisionProfile?.needPreference ?? null,
      tradeUpWillingness: decisionProfile?.tradeUpWillingness ?? null,
      tradeDownWillingness: decisionProfile?.tradeDownWillingness ?? null,
      draftNotes: decisionProfile?.draftNotes || [],
      sourceClassification: teamAIProfiles?.[team?.name] ? "TRANSITIONAL_DECISION_PROFILE" : "DEFAULT_TRANSITIONAL_DECISION_PROFILE",
    },
    needs: {
      rows,
      sorted: [...rows].sort((a, b) => b.score - a.score),
      coverage: rosterNeeds?.coverage || null,
      engineAvailable: Boolean(rosterNeeds?.available),
    },
    signals: {
      gmDraftAndDevelop: gm?.tendencies?.draftAndDevelop?.value ?? null,
      gmContinuity: gm?.tendencies?.organizationalContinuity?.value ?? null,
      coachAdaptability: headCoach?.philosophy?.adaptability ?? null,
      coachDevelopment: headCoach?.philosophy?.playerDevelopment ?? null,
    },
    sportsIntelligence: {
      engine: "LBHT Sports Intelligence Engine",
      contractVersion: "SIE-TEAM-CONTEXT-1.0.0",
      footballIntelligenceAvailable: Boolean(governed),
      rosterIntelligenceAvailable: Boolean(rosterNeeds?.available),
      teamSpecificContextAvailable: hasTeamSpecificContext,
      transitionalContextUsed: Boolean(legacy),
      coverageContractVersion: coverageContract.version,
    },
  };
}

export function resolveSportsDraftDecision({ players = [], team, pick, teamPicks = [] } = {}) {
  const teamIntelligence = resolveSportsTeamIntelligence(team);
  const decisionProfile = getTeamAIProfile(team);
  const canonicalTeamIntelligence = resolveSportsCanonicalNFLTeamIntelligence(team);
  const fieApplicationContext = resolveSportsFIEApplicationContext({
    teamIntelligence: canonicalTeamIntelligence,
    draftContext: {
      pickId: pick?.id ?? null,
      pickNumber: pick?.draft_pick?.pick_number ?? null,
      round: pick?.draft_pick?.round ?? null,
      selectingTeam: teamAbbreviation(team),
    },
  });

  return resolveSportsDraftDecisionCore({
    players,
    team,
    pick,
    teamPicks,
    teamIntelligence,
    decisionProfile,
    fieApplicationContext,
  });
}

export function resolveSportsDraftWire(input = {}) {
  return resolveDraftWireItems(input);
}

export function resolveSportsCanonicalNFLTeamIntelligence(team, options = {}) {
  const abbreviation = teamAbbreviation(team);

  return getNFLTeamIntelligenceResult(
    abbreviation || team || null,
    options
  );
}

export function resolveSportsFIEApplicationContext({
  teamIntelligence = null,
  matchupIntelligence = null,
  draftContext = null,
} = {}) {
  return createMDSFIEIntelligenceApplicationServiceResult({
    teamIntelligence,
    matchupIntelligence,
    draftContext,
  });
}

export function getSportsProspectDecisionDisplay(player) {
  const result = resolveSportsProspectIntelligence(player);
  const evaluationResult = result?.intelligence?.evaluation || result?.evaluation || null;
  const canonicalEvaluation =
    evaluationResult?.value?.data?.evaluation ||
    evaluationResult?.data?.evaluation ||
    evaluationResult?.data ||
    {};
  const modelResult = result?.canonicalProspectModelResult || null;

  const grade =
    typeof modelResult?.overallGrade === "number" && Number.isFinite(modelResult.overallGrade)
      ? modelResult.overallGrade
      : typeof canonicalEvaluation?.overallGrade === "number" && Number.isFinite(canonicalEvaluation.overallGrade)
        ? canonicalEvaluation.overallGrade
        : null;

  return {
    grade,
    tier: canonicalEvaluation?.tier ?? null,
    projection: canonicalEvaluation?.draftProjection ?? canonicalEvaluation?.projection ?? null,
    confidence: Number.isFinite(evaluationResult?.confidence) ? evaluationResult.confidence : null,
    modelAvailable: Boolean(result?.sportsIntelligence?.canonicalProspectAvailable),
    model: result?.sportsIntelligence?.canonicalProspectModel || null,
    modelError: result?.sportsIntelligence?.canonicalProspectError || null,
    readiness: result?.sportsIntelligence?.canonicalProspectReadiness || "UNAVAILABLE",
    sourceClassification: result?.sportsIntelligence?.sourceClassification || "UNAVAILABLE",
  };
}

export default {
  resolveSportsProspectIntelligence,
  resolveSportsTeamIntelligence,
  getSportsProspectDecisionDisplay,
  resolveSportsDraftDecision,
  resolveSportsDraftWire,
  resolveSportsCanonicalNFLTeamIntelligence,
  resolveSportsFIEApplicationContext,
};
