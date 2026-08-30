function normalizeTeam(value) {
  const team = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2,3}$/.test(team) ? team : null;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function createNFLAvailabilityAcquisitionPlan(
  records = [],
  { season, week, teams = [], allTeams = false, maxTeams = null } = {}
) {
  const normalizedSeason = Number(season);
  const normalizedWeek = Number(week);

  if (!Number.isInteger(normalizedSeason)) throw new Error("A valid season is required.");
  if (!Number.isInteger(normalizedWeek) || normalizedWeek < 1) {
    throw new Error("A positive week is required.");
  }

  const weekRecords = (Array.isArray(records) ? records : [])
    .filter((record) => record?.season === normalizedSeason)
    .filter((record) => record?.week === normalizedWeek);

  const availableTeams = unique(
    weekRecords.map((record) => normalizeTeam(record?.team))
  ).sort();

  const explicitTeams = unique(
    (Array.isArray(teams) ? teams : []).map(normalizeTeam)
  ).sort();

  if (!allTeams && explicitTeams.length === 0) {
    throw new Error("Select explicit teams or set allTeams=true.");
  }

  const missingTeams = explicitTeams.filter(
    (team) => !availableTeams.includes(team)
  );

  let selectedTeams = allTeams
    ? [...availableTeams]
    : explicitTeams.filter((team) => availableTeams.includes(team));

  if (
    maxTeams != null &&
    Number.isInteger(Number(maxTeams)) &&
    Number(maxTeams) > 0
  ) {
    selectedTeams = selectedTeams.slice(0, Number(maxTeams));
  }

  const selectedSet = new Set(selectedTeams);
  const selectedRecords = weekRecords.filter((record) =>
    selectedSet.has(normalizeTeam(record?.team))
  );

  return Object.freeze({
    season: normalizedSeason,
    week: normalizedWeek,
    allTeams: Boolean(allTeams),
    availableTeams,
    selectedTeams,
    missingTeams,
    recordsByTeam: Object.fromEntries(
      selectedTeams.map((team) => [
        team,
        selectedRecords.filter(
          (record) => normalizeTeam(record?.team) === team
        ).length,
      ])
    ),
    selectedRecords,
    recordCount: selectedRecords.length,
    teamCount: selectedTeams.length,
  });
}

export function summarizeNFLAvailabilityAcquisitionResult({
  plan,
  bundle,
  persistence = null,
  sourceUrl = null,
  mode = "DRY_RUN",
  startedAt = null,
  completedAt = new Date().toISOString(),
} = {}) {
  return {
    contract: "NFLAvailabilityAcquisitionRunReport",
    version: "1.0.0",
    mode,
    season: plan?.season ?? null,
    week: plan?.week ?? null,
    selectedTeams: plan?.selectedTeams || [],
    missingTeams: plan?.missingTeams || [],
    sourceUrl,
    counts: {
      canonicalRecords: bundle?.summary?.recordCount ?? 0,
      observations: bundle?.summary?.observationCount ?? 0,
      artifacts: bundle?.summary?.artifactCount ?? 0,
      sessions: bundle?.summary?.sessionCount ?? 0,
      observationWrites: persistence?.observationWrites ?? 0,
      artifactWrites: persistence?.artifactWrites ?? 0,
      sessionWrites: persistence?.sessionWrites ?? 0,
      unchangedArtifacts: persistence?.unchangedArtifacts ?? 0,
      failures: persistence?.failures?.length ?? 0,
    },
    teamResults:
      persistence?.teamResults ||
      plan?.selectedTeams?.map((team) => ({
        team,
        status: mode === "DRY_RUN" ? "PLANNED" : "UNKNOWN",
      })) ||
      [],
    persistenceStatus:
      persistence?.status ||
      (mode === "DRY_RUN" ? "NOT_EXECUTED" : "UNKNOWN"),
    startedAt,
    completedAt,
  };
}

export default {
  createNFLAvailabilityAcquisitionPlan,
  summarizeNFLAvailabilityAcquisitionResult,
};
