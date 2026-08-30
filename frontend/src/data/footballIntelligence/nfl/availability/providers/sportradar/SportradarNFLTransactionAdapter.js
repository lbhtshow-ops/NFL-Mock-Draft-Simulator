import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../../signals/NFLAvailabilitySignalContract.js";

export const SPORTRADAR_NFL_TRANSACTION_PROVIDER_ID = "sportradar-nfl-v7-transactions";

const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function getTransactionRows(payload) {
  if (Array.isArray(payload?.players)) {
    const rows = [];
    for (const player of payload.players) {
      const transactions = Array.isArray(player?.transactions)
        ? player.transactions
        : [];
      for (const transaction of transactions) {
        rows.push({ player, transaction });
      }
    }
    return rows;
  }

  if (Array.isArray(payload?.transactions)) {
    return payload.transactions.map((transaction) => ({
      player: transaction?.player || transaction?.athlete || {},
      transaction,
    }));
  }

  if (Array.isArray(payload)) {
    return payload.map((transaction) => ({
      player: transaction?.player || transaction?.athlete || {},
      transaction,
    }));
  }

  return [];
}

function resolveTransactionTeam(transaction) {
  return (
    transaction?.to_team ||
    transaction?.team ||
    transaction?.destination ||
    transaction?.from_team ||
    {}
  );
}

export function adaptSportradarDailyTransactionsPayload(
  payload,
  {
    season,
    week,
    gameType = "REG",
    sourceUrl = null,
    now = new Date().toISOString(),
  } = {},
) {
  const out = [];

  for (const { player, transaction } of getTransactionRows(payload)) {
    const team = resolveTransactionTeam(transaction);
    const alias = clean(
      team?.alias ||
        transaction?.team_alias ||
        (typeof transaction?.team === "string" ? transaction.team : null),
    )?.toUpperCase();

    if (!alias) continue;

    const observedAt =
      transaction?.last_modified ||
      transaction?.updated ||
      transaction?.created_at ||
      payload?.end_time ||
      payload?.start_time ||
      payload?.generated_at ||
      now;

    const transactionType =
      transaction?.transaction_type ||
      transaction?.transaction_code ||
      transaction?.type ||
      transaction?.desc ||
      transaction?.description;

    try {
      out.push(
        createNFLAvailabilitySignal({
          signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.TRANSACTION,
          authority: NFL_AVAILABILITY_AUTHORITY.TRANSACTION,
          season,
          week,
          gameType,
          team: alias,
          playerId: player?.id || transaction?.player_id,
          playerName:
            player?.name ||
            [player?.first_name, player?.last_name].filter(Boolean).join(" ") ||
            transaction?.player_name,
          position: player?.position,
          observedAt,
          effectiveAt:
            transaction?.effective_date || transaction?.effective_at || null,
          source: SPORTRADAR_NFL_TRANSACTION_PROVIDER_ID,
          sourceUrl,
          transactionType,
          statusBefore: transaction?.status_before,
          statusAfter: transaction?.status_after,
          rosterStatus: transaction?.status_after,
          providerPlayerId:
            player?.id || player?.sr_id || transaction?.player_id,
          providerTeamId: team?.id || team?.sr_id || transaction?.team_id,
          metadata: {
            providerTransactionId: transaction?.id || null,
            providerPlayerSrId: player?.sr_id || null,
            providerTeamSrId: team?.sr_id || null,
            transactionCode: transaction?.transaction_code || null,
            transactionType: transaction?.transaction_type || null,
            rawDescription:
              transaction?.desc || transaction?.description || null,
            fromTeam: transaction?.from_team || null,
            toTeam: transaction?.to_team || null,
            transactionYear: transaction?.transaction_year || null,
            leagueWindowStart: payload?.start_time || null,
            leagueWindowEnd: payload?.end_time || null,
          },
        }),
      );
    } catch {
      // Fail closed on malformed individual provider rows.
    }
  }

  return out;
}
