const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;

function timestampValue(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function selectLatestSafeHistoricalAvailability(records = [], kickoffAt) {
  const kickoff = timestampValue(kickoffAt);
  if (kickoff === null) return Object.freeze([]);

  const byPlayer = new Map();

  for (const record of records) {
    const playerId = clean(record?.playerId ?? record?.gsisId);
    const modifiedAt = clean(record?.dateModified ?? record?.date_modified);
    const modified = timestampValue(modifiedAt);
    if (!playerId || modified === null || modified >= kickoff) continue;

    const current = byPlayer.get(playerId);
    const currentTime = current ? timestampValue(current.dateModified) : null;
    if (!current || currentTime === null || modified > currentTime) {
      byPlayer.set(playerId, Object.freeze({
        playerId,
        name: clean(record?.name ?? record?.fullName ?? record?.full_name),
        position: clean(record?.position),
        reportPrimaryInjury: clean(record?.reportPrimaryInjury ?? record?.report_primary_injury),
        reportSecondaryInjury: clean(record?.reportSecondaryInjury ?? record?.report_secondary_injury),
        reportStatus: clean(record?.reportStatus ?? record?.report_status),
        practicePrimaryInjury: clean(record?.practicePrimaryInjury ?? record?.practice_primary_injury),
        practiceSecondaryInjury: clean(record?.practiceSecondaryInjury ?? record?.practice_secondary_injury),
        practiceStatus: clean(record?.practiceStatus ?? record?.practice_status),
        dateModified: modifiedAt,
      }));
    }
  }

  return Object.freeze([...byPlayer.values()].sort((a,b) => a.playerId.localeCompare(b.playerId)));
}

export function summarizeHistoricalAvailability(players = []) {
  const normalized = players.map((player) => {
    const report = (player.reportStatus ?? "").toUpperCase();
    return Object.freeze({
      ...player,
      isOut: report === "OUT",
      isDoubtful: report === "DOUBTFUL",
      isQuestionable: report === "QUESTIONABLE",
    });
  });

  return Object.freeze({
    status: normalized.length ? "AVAILABLE" : "NO_REPORT_EVIDENCE",
    playerCount: normalized.length,
    outCount: normalized.filter((x)=>x.isOut).length,
    doubtfulCount: normalized.filter((x)=>x.isDoubtful).length,
    questionableCount: normalized.filter((x)=>x.isQuestionable).length,
    players: Object.freeze(normalized),
  });
}
