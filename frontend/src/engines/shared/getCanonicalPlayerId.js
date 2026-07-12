// src/engines/shared/getCanonicalPlayerId.js

export function getCanonicalPlayerId(player = {}) {
  return (
    player?.canonicalId ||
    player?.playerId ||
    player?.prospectId ||
    player?.id ||
    player?.record?.playerId ||
    null
  );
}

export default getCanonicalPlayerId;