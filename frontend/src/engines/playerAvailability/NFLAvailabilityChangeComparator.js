export const NFL_AVAILABILITY_CHANGE_VERSION =
  "NFL-AVAILABILITY-CHANGE-V1.0.0";

function keyFor(impact) {
  return (
    impact?.player?.playerId ||
    impact?.player?.playerName ||
    "UNKNOWN"
  );
}

export function compareNFLTeamAvailability(
  previous,
  current
) {
  const before = new Map(
    (previous?.impacts || [])
      .map((impact) => [
        keyFor(impact),
        impact,
      ])
  );

  const after = new Map(
    (current?.impacts || [])
      .map((impact) => [
        keyFor(impact),
        impact,
      ])
  );

  const keys = new Set([
    ...before.keys(),
    ...after.keys(),
  ]);

  const changes = [];

  for (const key of keys) {
    const previousImpact =
      before.get(key) || null;
    const currentImpact =
      after.get(key) || null;

    const previousAdjustment =
      previousImpact?.adjustment ?? 0;
    const currentAdjustment =
      currentImpact?.adjustment ?? 0;

    if (
      previousAdjustment !==
      currentAdjustment
    ) {
      changes.push({
        key,
        player:
          currentImpact?.player ||
          previousImpact?.player ||
          null,
        previousAdjustment,
        currentAdjustment,
        delta:
          currentAdjustment -
          previousAdjustment,
        previousStatus:
          previousImpact?.availability?.status ||
          null,
        currentStatus:
          currentImpact?.availability?.status ||
          null,
      });
    }
  }

  return {
    contract:
      "NFLAvailabilityChange",
    version:
      NFL_AVAILABILITY_CHANGE_VERSION,

    previousTeamAdjustment:
      previous?.adjustment ?? 0,
    currentTeamAdjustment:
      current?.adjustment ?? 0,

    teamDelta:
      (current?.adjustment ?? 0) -
      (previous?.adjustment ?? 0),

    changed:
      changes.length > 0,

    changes:
      changes.sort(
        (a, b) =>
          Math.abs(b.delta) -
          Math.abs(a.delta)
      ),
  };
}

export default {
  NFL_AVAILABILITY_CHANGE_VERSION,
  compareNFLTeamAvailability,
};
