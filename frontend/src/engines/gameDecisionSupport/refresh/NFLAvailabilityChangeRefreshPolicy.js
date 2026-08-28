import {
  PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES,
} from "../../playerAvailability/repository/PlayerAvailabilityEvidenceChangeContract.js";

import {
  NFL_GAME_DECISION_REFRESH_REASON_CODES,
} from "./NFLGameDecisionRefreshRequirementContract.js";

export const NFL_AVAILABILITY_REFRESH_MATERIALITY = Object.freeze({
  NONE: "NONE",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
  UNKNOWN: "UNKNOWN",
});

const upper = value => {
  const text = String(value ?? "").trim();
  return text ? text.toUpperCase() : null;
};

const normalizedFields = change =>
  new Set(
    Array.isArray(change?.changedFields)
      ? change.changedFields
          .map(value => String(value ?? "").trim().toLowerCase())
          .filter(Boolean)
      : []
  );

const hasAny = (fields, candidates) =>
  candidates.some(candidate => fields.has(candidate));

const UNAVAILABLE_STATUSES = new Set([
  "OUT",
  "INACTIVE",
  "SUSPENDED",
  "IR",
  "INJURED_RESERVE",
  "PUP",
  "NFI",
]);

const STATUS_FIELDS = [
  "status",
  "availabilitystatus",
  "injurystatus",
  "reportstatus",
  "canonicalavailabilitystatus",
  "practicestatus",
  "rosterstatus",
];

const ROLE_FIELDS = [
  "starter",
  "depthrole",
  "depthposition",
  "depthrank",
  "role",
  "position",
];

const TRANSACTION_FIELDS = [
  "transaction",
  "transactiontype",
  "transactioncode",
  "rosterstatus",
];

export function classifyNFLAvailabilityChangeRefreshMateriality(
  change = {},
  context = {}
) {
  const fields = normalizedFields(change);
  const changeType = upper(change.changeType);
  const position = upper(context.position);
  const previousStatus = upper(context.previousStatus);
  const currentStatus = upper(context.currentStatus);
  const starter = context.starter === true || Number(context.depthRank) === 1;
  const qb = position === "QB";

  if (
    changeType === PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNCHANGED ||
    fields.size === 0
  ) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.NONE,
      refreshRequired: false,
      reasonCode: NFL_GAME_DECISION_REFRESH_REASON_CODES.UNCHANGED_EVIDENCE,
      rationale: "No canonical availability content changed.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  const statusChanged = hasAny(fields, STATUS_FIELDS);
  const roleChanged = hasAny(fields, ROLE_FIELDS);
  const transactionChanged = hasAny(fields, TRANSACTION_FIELDS);
  const becameUnavailable =
    currentStatus !== previousStatus && UNAVAILABLE_STATUSES.has(currentStatus);

  if (qb && starter && (statusChanged || roleChanged || becameUnavailable)) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.CRITICAL,
      refreshRequired: true,
      reasonCode:
        NFL_GAME_DECISION_REFRESH_REASON_CODES.STARTING_QB_AVAILABILITY_CHANGE,
      rationale:
        "Starting-quarterback availability or role evidence changed and requires a fresh canonical decision.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  if (starter && (statusChanged || roleChanged || becameUnavailable)) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.HIGH,
      refreshRequired: true,
      reasonCode:
        NFL_GAME_DECISION_REFRESH_REASON_CODES.STARTER_AVAILABILITY_CHANGE,
      rationale:
        "Starter availability or role evidence changed and requires a fresh canonical decision.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  if (roleChanged) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.MEDIUM,
      refreshRequired: true,
      reasonCode: NFL_GAME_DECISION_REFRESH_REASON_CODES.DEPTH_CHART_CHANGE,
      rationale:
        "Depth-chart or player-role evidence changed and may alter canonical availability context.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  if (transactionChanged) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.MEDIUM,
      refreshRequired: true,
      reasonCode:
        NFL_GAME_DECISION_REFRESH_REASON_CODES.ROSTER_TRANSACTION_CHANGE,
      rationale:
        "Roster or transaction evidence changed and may alter canonical availability context.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  if (statusChanged) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.MEDIUM,
      refreshRequired: true,
      reasonCode:
        NFL_GAME_DECISION_REFRESH_REASON_CODES.MATERIAL_PLAYER_AVAILABILITY_CHANGE,
      rationale:
        "Player availability status changed and requires canonical reevaluation.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  if (changeType === PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNKNOWN) {
    return Object.freeze({
      level: NFL_AVAILABILITY_REFRESH_MATERIALITY.UNKNOWN,
      refreshRequired: true,
      reasonCode:
        NFL_GAME_DECISION_REFRESH_REASON_CODES.PLAYER_AVAILABILITY_CHANGE_REVIEW_REQUIRED,
      rationale:
        "A non-empty availability change could not be safely classified; refresh is requested without inventing football impact.",
      position,
      starter,
      previousStatus,
      currentStatus,
    });
  }

  return Object.freeze({
    level: NFL_AVAILABILITY_REFRESH_MATERIALITY.LOW,
    refreshRequired: false,
    reasonCode:
      NFL_GAME_DECISION_REFRESH_REASON_CODES.NON_MATERIAL_PLAYER_AVAILABILITY_CHANGE,
    rationale:
      "The observed change does not affect a canonical availability, role, or transaction field used by the refresh policy.",
    position,
    starter,
    previousStatus,
    currentStatus,
  });
}

export default {
  NFL_AVAILABILITY_REFRESH_MATERIALITY,
  classifyNFLAvailabilityChangeRefreshMateriality,
};
