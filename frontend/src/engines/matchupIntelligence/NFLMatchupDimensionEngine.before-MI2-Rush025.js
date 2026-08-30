import { buildNFLAdvancedMatchupDimensions } from "./NFLAdvancedMatchupDimensionEngine.js";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function difference(home, away) {
  if (!finite(home) || !finite(away)) {
    return null;
  }

  return clamp(home - away, -100, 100);
}

function inverseDifference(homeAllowed, awayAllowed) {
  if (!finite(homeAllowed) || !finite(awayAllowed)) {
    return null;
  }

  // Lower EPA allowed is better, so reverse the direction.
  return clamp(awayAllowed - homeAllowed, -100, 100);
}

function normalizeEpaDifference(delta, scale = 0.20) {
  if (!finite(delta)) return null;

  return clamp((delta / scale) * 50, -50, 50);
}

function normalizeIndexDifference(home, away) {
  const delta = difference(home, away);
  return delta === null
    ? null
    : clamp(delta, -50, 50);
}

function sourcePerformance(teamInput) {
  return teamInput?.performance || {};
}

export function buildNFLMatchupDimensions({
  home,
  away,
  weather = null,
} = {}) {
  const homePerf = sourcePerformance(home);
  const awayPerf = sourcePerformance(away);

  const homeStrength =
    home?.overallStrength ?? null;
  const awayStrength =
    away?.overallStrength ?? null;

  const overallStrength =
    normalizeIndexDifference(
      homeStrength,
      awayStrength
    );

  const homePassOff =
    homePerf?.offense?.passEpaPerPlay;
  const awayPassOff =
    awayPerf?.offense?.passEpaPerPlay;

  const homePassDefAllowed =
    homePerf?.defense?.passEpaPerPlay;
  const awayPassDefAllowed =
    awayPerf?.defense?.passEpaPerPlay;

  const homeRushOff =
    homePerf?.offense?.rushEpaPerPlay;
  const awayRushOff =
    awayPerf?.offense?.rushEpaPerPlay;

  const homeRushDefAllowed =
    homePerf?.defense?.rushEpaPerPlay;
  const awayRushDefAllowed =
    awayPerf?.defense?.rushEpaPerPlay;

  // Each matchup dimension compares a team's offense to the opponent defense,
  // then compares those two team-specific matchup scores.
  const homePassMatchup =
    finite(homePassOff) && finite(awayPassDefAllowed)
      ? homePassOff - awayPassDefAllowed
      : null;

  const awayPassMatchup =
    finite(awayPassOff) && finite(homePassDefAllowed)
      ? awayPassOff - homePassDefAllowed
      : null;

  const passMatchup =
    finite(homePassMatchup) &&
    finite(awayPassMatchup)
      ? normalizeEpaDifference(
          homePassMatchup - awayPassMatchup
        )
      : null;

  const homeRushMatchup =
    finite(homeRushOff) && finite(awayRushDefAllowed)
      ? homeRushOff - awayRushDefAllowed
      : null;

  const awayRushMatchup =
    finite(awayRushOff) && finite(homeRushDefAllowed)
      ? awayRushOff - homeRushDefAllowed
      : null;

  const rushMatchup =
    finite(homeRushMatchup) &&
    finite(awayRushMatchup)
      ? normalizeEpaDifference(
          homeRushMatchup - awayRushMatchup
        )
      : null;

  const recentForm =
    normalizeIndexDifference(
      homePerf?.recentFormIndex,
      awayPerf?.recentFormIndex
    );

  const specialTeams =
    normalizeIndexDifference(
      homePerf?.specialTeamsIndex,
      awayPerf?.specialTeamsIndex
    );

  const availability =
    normalizeIndexDifference(
      home?.components?.availability,
      away?.components?.availability
    );

  const quarterback =
    normalizeIndexDifference(
      home?.components?.quarterback,
      away?.components?.quarterback
    );

  const advanced =
    buildNFLAdvancedMatchupDimensions({
      homeEvidence:
        home?.advancedMatchupEvidence || null,
      awayEvidence:
        away?.advancedMatchupEvidence || null,
      weather,
    });

  return {
    overallStrength,
    passMatchup,
    rushMatchup,
    recentForm,
    specialTeams,
    quarterback,
    availability,

    protectionPressure:
      advanced.protectionPressure,
    explosivePlay:
      advanced.explosivePlay,
    redZone:
      advanced.redZone,
    weatherStyle:
      advanced.weatherStyle,

    tendencies:
      advanced.tendencies,

    raw: {
      homePassMatchup,
      awayPassMatchup,
      homeRushMatchup,
      awayRushMatchup,
    },
  };
}

export default {
  buildNFLMatchupDimensions,
};
