export const getPlayerTier = (player) => {
  const rank = player?.rank || 999;

  if (rank <= 5) return "elite";
  if (rank <= 15) return "blueChip";
  if (rank <= 40) return "firstRound";
  if (rank <= 80) return "dayTwo";
  if (rank <= 150) return "depth";
  return "developmental";
};

export const tierMultipliers = {
  elite: 1.35,
  blueChip: 1.22,
  firstRound: 1.1,
  dayTwo: 1,
  depth: 0.92,
  developmental: 0.85,
};

export const getTierMultiplier = (player) => {
  const tier = getPlayerTier(player);
  return tierMultipliers[tier] || 1;
};