import { NFL_AVAILABILITY_SIGNAL_CLASSES } from "./NFLAvailabilitySignalContract.js";

const millis = (value) => { const n = Date.parse(value || ""); return Number.isFinite(n) ? n : -1; };
const keyFor = (signal) => signal?.player?.playerId || signal?.player?.providerPlayerId || `${signal?.team || "UNKNOWN"}:${signal?.player?.playerName || "UNKNOWN"}`;
const upper = (value) => typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;

export const NFL_CANONICAL_AVAILABILITY_STATES = Object.freeze({
  AVAILABLE: "AVAILABLE",
  LIMITED: "LIMITED",
  QUESTIONABLE: "QUESTIONABLE",
  DOUBTFUL: "DOUBTFUL",
  OUT: "OUT",
  INJURED_RESERVE: "INJURED_RESERVE",
  PUP: "PUP",
  SUSPENDED: "SUSPENDED",
  INACTIVE: "INACTIVE",
  UNKNOWN: "UNKNOWN",
});

export const NFL_AVAILABILITY_RESOLUTION_TYPES = Object.freeze({
  OFFICIAL_DESIGNATION: "OFFICIAL_DESIGNATION",
  GAMEDAY_INACTIVE: "GAMEDAY_INACTIVE",
  ROSTER_AND_TRANSACTION: "ROSTER_AND_TRANSACTION",
  ROSTER_INFERENCE: "ROSTER_INFERENCE",
  TRANSACTION_INFERENCE: "TRANSACTION_INFERENCE",
  ROLE_ONLY: "ROLE_ONLY",
  UNRESOLVED: "UNRESOLVED",
});

export const NFL_AVAILABILITY_EVIDENCE_TYPES = Object.freeze({
  DIRECT_MEDICAL: "DIRECT_MEDICAL",
  DIRECT_GAMEDAY: "DIRECT_GAMEDAY",
  STRUCTURAL: "STRUCTURAL",
  ROLE: "ROLE",
  NONE: "NONE",
});

function canonicalStatus({ official, roster, transaction, gameday }) {
  const officialStatus = upper(official?.availability?.status);
  if (officialStatus) {
    const map = {
      AVAILABLE: "AVAILABLE", FULL: "AVAILABLE", LIMITED: "LIMITED",
      QUESTIONABLE: "QUESTIONABLE", DOUBTFUL: "DOUBTFUL",
      OUT: "OUT", INACTIVE: "INACTIVE",
    };
    return map[officialStatus] || "UNKNOWN";
  }
  const gameStatus = upper(gameday?.availability?.status);
  if (gameStatus === "INACTIVE" || gameStatus === "OUT") return "INACTIVE";

  const rosterStatus = upper(roster?.availability?.rosterStatus || transaction?.transaction?.statusAfter);
  if (["IR", "INJURED_RESERVE", "RESERVE_INJURED"].includes(rosterStatus)) return "INJURED_RESERVE";
  if (["PUP", "RESERVE_PUP"].includes(rosterStatus)) return "PUP";
  if (["SUS", "SUSPENDED", "RESERVE_SUSPENDED"].includes(rosterStatus)) return "SUSPENDED";
  if (["ACT", "ACTIVE"].includes(rosterStatus)) return "AVAILABLE";
  return "UNKNOWN";
}

function confidenceFor({ official, roster, transaction, depth, gameday }) {
  if (official) return 0.98;
  if (gameday) return 0.95;
  if (roster && transaction) return 0.92;
  if (roster) return 0.86;
  if (transaction) return 0.8;
  if (depth) return 0.6;
  return 0;
}

function conflictFor({ official, roster, transaction, gameday }) {
  const canonical = canonicalStatus({ official, roster, transaction, gameday });
  const rosterState = upper(roster?.availability?.rosterStatus || transaction?.transaction?.statusAfter);
  const officialState = upper(official?.availability?.status);
  const conflicts = [];
  if (officialState && ["OUT", "DOUBTFUL"].includes(officialState) && ["ACT", "ACTIVE"].includes(rosterState)) {
    conflicts.push("OFFICIAL_DESIGNATION_VS_ACTIVE_ROSTER");
  }
  if (gameday && canonical === "INACTIVE" && officialState === "AVAILABLE") {
    conflicts.push("GAMEDAY_INACTIVE_VS_OFFICIAL_AVAILABLE");
  }
  return { hasConflict: conflicts.length > 0, codes: conflicts };
}

function resolutionSemantics({ official, roster, transaction, depth, gameday, canonicalAvailabilityStatus }) {
  const officialStatus = upper(official?.availability?.status);
  const officialPractice = upper(official?.availability?.practiceStatus);
  const officialInjury = official?.availability?.injury || null;
  const gamedayStatus = upper(gameday?.availability?.status);

  if (official) {
    return {
      resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.OFFICIAL_DESIGNATION,
      resolutionBasis: officialStatus || officialPractice || (officialInjury ? "OFFICIAL_INJURY_EVIDENCE" : "OFFICIAL_REPORT"),
      availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.DIRECT_MEDICAL,
      directAvailabilityEvidence: true,
      inferredAvailabilityEvidence: false,
      medicalAvailabilityKnown: Boolean(officialStatus || officialPractice || officialInjury),
      resolutionConfidence:
        ["OUT", "INACTIVE", "AVAILABLE", "FULL"].includes(officialStatus) ? "HIGH" :
        ["DOUBTFUL", "QUESTIONABLE", "LIMITED"].includes(officialStatus) ? "MODERATE" :
        "MODERATE",
    };
  }

  if (gameday && ["INACTIVE", "OUT"].includes(gamedayStatus)) {
    return {
      resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.GAMEDAY_INACTIVE,
      resolutionBasis: gamedayStatus,
      availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.DIRECT_GAMEDAY,
      directAvailabilityEvidence: true,
      inferredAvailabilityEvidence: false,
      medicalAvailabilityKnown: false,
      resolutionConfidence: "HIGH",
    };
  }

  if (roster && transaction) {
    return {
      resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.ROSTER_AND_TRANSACTION,
      resolutionBasis: upper(roster?.availability?.rosterStatus || transaction?.transaction?.statusAfter) || canonicalAvailabilityStatus,
      availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.STRUCTURAL,
      directAvailabilityEvidence: false,
      inferredAvailabilityEvidence: true,
      medicalAvailabilityKnown: false,
      resolutionConfidence: canonicalAvailabilityStatus === "UNKNOWN" ? "LOW" : "MODERATE",
    };
  }

  if (roster) {
    return {
      resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.ROSTER_INFERENCE,
      resolutionBasis: upper(roster?.availability?.rosterStatus) || canonicalAvailabilityStatus,
      availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.STRUCTURAL,
      directAvailabilityEvidence: false,
      inferredAvailabilityEvidence: true,
      medicalAvailabilityKnown: false,
      resolutionConfidence: canonicalAvailabilityStatus === "UNKNOWN" ? "LOW" : "MODERATE",
    };
  }

  if (transaction) {
    return {
      resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.TRANSACTION_INFERENCE,
      resolutionBasis: upper(transaction?.transaction?.statusAfter || transaction?.transaction?.type) || canonicalAvailabilityStatus,
      availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.STRUCTURAL,
      directAvailabilityEvidence: false,
      inferredAvailabilityEvidence: true,
      medicalAvailabilityKnown: false,
      resolutionConfidence: canonicalAvailabilityStatus === "UNKNOWN" ? "LOW" : "MODERATE",
    };
  }

  if (depth) {
    return {
      resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.ROLE_ONLY,
      resolutionBasis: "DEPTH_CHART",
      availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.ROLE,
      directAvailabilityEvidence: false,
      inferredAvailabilityEvidence: false,
      medicalAvailabilityKnown: false,
      resolutionConfidence: "LOW",
    };
  }

  return {
    resolutionType: NFL_AVAILABILITY_RESOLUTION_TYPES.UNRESOLVED,
    resolutionBasis: null,
    availabilityEvidenceType: NFL_AVAILABILITY_EVIDENCE_TYPES.NONE,
    directAvailabilityEvidence: false,
    inferredAvailabilityEvidence: false,
    medicalAvailabilityKnown: false,
    resolutionConfidence: "LOW",
  };
}

export function compareNFLAvailabilitySignals(a, b) {
  if ((a?.authority || 0) !== (b?.authority || 0)) return (b?.authority || 0) - (a?.authority || 0);
  return millis(b?.timing?.observedAt) - millis(a?.timing?.observedAt);
}

export function resolveNFLMultiSignalAvailability(signals = []) {
  const groups = new Map();
  for (const signal of signals.filter(Boolean)) {
    const key = keyFor(signal);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(signal);
  }
  const players = [];
  for (const [playerKey, playerSignals] of groups) {
    const ordered = [...playerSignals].sort(compareNFLAvailabilitySignals);
    const official = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT) || null;
    const roster = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS) || null;
    const transaction = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.TRANSACTION) || null;
    const depth = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART) || null;
    const gameday = ordered.find((x) => x.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.GAMEDAY_INACTIVE) || null;

    const canonicalAvailabilityStatus = canonicalStatus({ official, roster, transaction, gameday });
    const conflict = conflictFor({ official, roster, transaction, gameday });
    const semantics = resolutionSemantics({
      official,
      roster,
      transaction,
      depth,
      gameday,
      canonicalAvailabilityStatus,
    });

    players.push({
      playerKey,
      team: ordered[0]?.team || null,
      player: ordered[0]?.player || null,
      canonicalAvailabilityStatus,
      availabilityConfidence: confidenceFor({ official, roster, transaction, depth, gameday }),
      conflict,
      officialDesignation: official?.availability?.status || null,
      practiceStatus: official?.availability?.practiceStatus || null,
      injury: official?.availability?.injury || null,
      rosterStatus: roster?.availability?.rosterStatus || transaction?.transaction?.statusAfter || null,
      latestTransaction: transaction?.transaction || null,
      gamedayInactive: gameday ? gameday.availability?.status === "INACTIVE" || gameday.availability?.status === "OUT" : null,
      role: depth?.role || null,
      evidenceRefs: ordered.map((signal) => signal?.metadata?.observationId).filter(Boolean),
      evidence: { selected: ordered[0] || null, official, roster, transaction, depth, gameday, all: ordered },
      officialReportAvailable: Boolean(official),
      officialReportState: official ? "REPORTED" : "NOT_REPORTED",
      inferredAvailabilityOnly: !official && !gameday && Boolean(roster || transaction),
      ...semantics,
    });
  }
  return {
    contract: "NFLMultiSignalAvailabilityResolution",
    version: "1.0.0",
    semanticsVersion: "NFL-AVAILABILITY-SEMANTICS-1.0.0",
    players,
    signalCount: signals.length,
  };
}
