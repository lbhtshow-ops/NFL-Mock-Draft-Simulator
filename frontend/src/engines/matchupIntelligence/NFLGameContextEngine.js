export const NFL_GAME_CONTEXT_VERSION =
  "NFL-GAME-CONTEXT-V1.0.0";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildNFLGameContext({
  homeField = true,
  homeFieldIndex = 4,
  homeRestDays = null,
  awayRestDays = null,
  weather = null,
  travel = null,
} = {}) {
  const homeFieldValue =
    homeField
      ? clamp(
          finite(homeFieldIndex)
            ? homeFieldIndex
            : 4,
          0,
          10
        )
      : 0;

  let rest = null;

  if (
    finite(homeRestDays) &&
    finite(awayRestDays)
  ) {
    const delta =
      homeRestDays - awayRestDays;

    // Small contextual modifier in Matchup Index units.
    rest = clamp(delta * 0.75, -5, 5);
  }

  return {
    version: NFL_GAME_CONTEXT_VERSION,
    homeField: homeFieldValue,
    rest,
    weather,
    travel,

    limitations: [
      weather
        ? null
        : "Weather interaction is not yet modeled.",
      travel
        ? null
        : "Travel interaction is not yet modeled.",
    ].filter(Boolean),
  };
}

export default {
  NFL_GAME_CONTEXT_VERSION,
  buildNFLGameContext,
};
