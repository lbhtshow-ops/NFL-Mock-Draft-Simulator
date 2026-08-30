import {
  buildNFLTeamStrength,
} from "../../NFLTeamPriorAndStrengthEngine.js";

import {
  PLAYER_IMPACT_MODEL_STATES,
} from "../../../playerAvailability/contracts/CanonicalPlayerAvailabilityImpactContract.js";

import {
  getNFLTeamStrengthCalibrationContract,
} from "../NFLTeamStrengthCalibrationContract.js";

import {
  NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_CONTRACT,
  NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_VERSION,
  NFL_TEAM_STRENGTH_SHADOW_STATES,
  NFL_TEAM_STRENGTH_SHADOW_BLOCKERS,
} from "./NFLPlayerImpactTeamStrengthShadowContract.js";

const array = (value) => (Array.isArray(value) ? value : []);
const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);

function normalizeTeam(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;
}

function modeledPlayers(availabilityEvidence) {
  const players = array(
    availabilityEvidence?.players ??
    availabilityEvidence?.playerImpact
  );

  return players.filter((player) =>
    player?.impact?.modelState === PLAYER_IMPACT_MODEL_STATES.MODELED &&
    finite(player?.impact?.overallImpact)
  );
}

function projectPlayer(player) {
  return Object.freeze({
    playerId: player?.playerId ?? null,
    displayName: player?.displayName ?? null,
    position: player?.position ?? null,
    availabilityStatus: player?.availability?.status ?? null,
    readiness: player?.readiness ?? null,
    overallImpact: finite(player?.impact?.overallImpact)
      ? player.impact.overallImpact
      : null,
    impactConfidence: finite(player?.impact?.confidence)
      ? player.impact.confidence
      : null,
    role: player?.impactContext?.role ?? null,
    replacementPlayerId:
      player?.impactContext?.replacementPlayerId ?? null,
    replacementQuality:
      player?.impactContext?.replacementQuality ?? null,
    teamDependency:
      player?.impactContext?.teamDependency ?? null,
    positionImportance:
      player?.impactContext?.positionImportance ?? null,
    offensiveSnapShare:
      finite(player?.impactContext?.offensiveSnapShare)
        ? player.impactContext.offensiveSnapShare
        : null,
    defensiveSnapShare:
      finite(player?.impactContext?.defensiveSnapShare)
        ? player.impactContext.defensiveSnapShare
        : null,
    specialTeamsSnapShare:
      finite(player?.impactContext?.specialTeamsSnapShare)
        ? player.impactContext.specialTeamsSnapShare
        : null,
    caliberGrade:
      finite(player?.caliber?.caliberGrade)
        ? player.caliber.caliberGrade
        : null,
    evidenceRefs: array(player?.availability?.evidenceRefs),
    sourceRefs: array(player?.availability?.sourceRefs),
    methodology: player?.impact?.methodology ?? null,
  });
}

export function integrateNFLPlayerImpactIntoTeamStrengthShadow({
  team = null,
  targetSeason = null,
  phaseScope = "ALL",
  teamStrength = null,
  availabilityEvidence = null,
  asOf = null,
} = {}) {
  const teamAbbreviation = normalizeTeam(
    team ??
    teamStrength?.teamAbbreviation ??
    availabilityEvidence?.teamAbbreviation
  );

  const baseline =
    teamStrength ??
    (teamAbbreviation
      ? buildNFLTeamStrength({
          team: teamAbbreviation,
          targetSeason,
          phaseScope,
        })
      : null);

  const players = modeledPlayers(availabilityEvidence)
    .map(projectPlayer);

  const calibration =
    getNFLTeamStrengthCalibrationContract();

  const blockers = [
    NFL_TEAM_STRENGTH_SHADOW_BLOCKERS.CALIBRATION_REQUIRED,
  ];

  if (!finite(baseline?.overallStrength)) {
    blockers.push(
      NFL_TEAM_STRENGTH_SHADOW_BLOCKERS.BASELINE_STRENGTH_UNAVAILABLE
    );
  }

  if (players.length === 0) {
    blockers.push(
      NFL_TEAM_STRENGTH_SHADOW_BLOCKERS.NO_MODELED_PLAYER_IMPACT
    );
  }

  const state =
    !teamAbbreviation
      ? NFL_TEAM_STRENGTH_SHADOW_STATES.UNAVAILABLE
      : finite(baseline?.overallStrength) && players.length > 0
        ? NFL_TEAM_STRENGTH_SHADOW_STATES.READY
        : NFL_TEAM_STRENGTH_SHADOW_STATES.PARTIAL;

  return Object.freeze({
    contract: NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_CONTRACT,
    version: NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_VERSION,
    mode: "SHADOW_ONLY",
    state,
    teamAbbreviation,
    targetSeason:
      Number.isInteger(Number(targetSeason))
        ? Number(targetSeason)
        : baseline?.targetSeason ?? null,
    phaseScope: baseline?.phaseScope ?? phaseScope,
    asOf: asOf ?? null,

    baseline: Object.freeze({
      sourceContract: baseline?.contract ?? null,
      sourceVersion: baseline?.version ?? null,
      state: baseline?.state ?? "UNKNOWN",
      performanceStrength:
        finite(baseline?.overallStrength)
          ? baseline.overallStrength
          : null,
      confidence:
        finite(baseline?.confidence)
          ? baseline.confidence
          : null,
      mode: baseline?.mode ?? null,
      sampleMaturity: baseline?.sampleMaturity ?? null,
      current: baseline?.current ?? null,
      prior: baseline?.prior ?? null,
    }),

    availabilityModifierEvidence: Object.freeze({
      available: players.length > 0,
      modeledPlayerCount: players.length,
      players: Object.freeze(players),
      interpretation:
        "Canonical modeled Player Impact is connected as CURRENT_STATE_MODIFIER_EVIDENCE. The 0-100 Player Impact scale is not a Team Strength point delta.",
    }),

    shadowAdjustment: Object.freeze({
      authorized: false,
      numericDelta: null,
      adjustedTeamStrength: null,
      reason:
        NFL_TEAM_STRENGTH_SHADOW_BLOCKERS.CALIBRATION_REQUIRED,
      interpretation:
        "No numeric transformation from Player Impact to Team Strength is authorized until historical replacement/availability calibration and validation requirements are satisfied.",
    }),

    calibration: Object.freeze({
      contractVersion: calibration?.contractVersion ?? null,
      status: calibration?.status ?? null,
      injuryAvailabilityCalibrationRequired:
        calibration?.requirements?.injuryAvailabilityCalibrationRequired === true,
      positionAndReplacementSensitivityValidationRequired:
        calibration?.requirements?.positionAndReplacementSensitivityValidationRequired === true,
      baselineStrengthAuthorized:
        calibration?.outputsAuthorized?.baselineStrength === true,
      currentStrengthAuthorized:
        calibration?.outputsAuthorized?.currentStrength === true,
    }),

    blockers: Object.freeze(blockers),

    outputs: Object.freeze({
      winProbability: null,
      pointSpread: null,
      pickRecommendation: null,
      pickemAdjustment: null,
    }),

    safeguards: Object.freeze({
      existingPerformanceStrengthFormulaMutated: false,
      playerImpactTreatedAsStrengthPoints: false,
      uncalibratedAvailabilityWeightIntroduced: false,
      teamStrengthDeltaFabricated: false,
      winProbabilityScored: false,
      pickemDecisionModelInvoked: false,
      databaseMutationAuthorized: false,
    }),
  });
}

export default {
  integrateNFLPlayerImpactIntoTeamStrengthShadow,
};
