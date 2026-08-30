export const NFL_HISTORICAL_AVAILABILITY_REQUIRED_COLUMNS = Object.freeze([
  "season","team","week","gsis_id","position","full_name",
  "report_primary_injury","report_status","practice_primary_injury",
  "practice_status","date_modified"
]);

export function qualifyNFLHistoricalAvailabilitySeason(input = {}) {
  const required = NFL_HISTORICAL_AVAILABILITY_REQUIRED_COLUMNS;
  const columns = Array.isArray(input.columns) ? input.columns : [];
  const missingColumns = required.filter((column) => !columns.includes(column));
  const rowCount = Number.isInteger(input.rowCount) ? input.rowCount : 0;
  const gsisCoverageRate = Number.isFinite(input.gsisCoverageRate) ? input.gsisCoverageRate : null;
  const dateModifiedCoverageRate = Number.isFinite(input.dateModifiedCoverageRate) ? input.dateModifiedCoverageRate : null;
  const pregameSafeRate = Number.isFinite(input.pregameSafeRate) ? input.pregameSafeRate : null;
  const sourceAvailable = input.sourceAvailable === true;

  const schemaQualified = sourceAvailable && rowCount > 0 && missingColumns.length === 0;
  const identityQualified = schemaQualified && gsisCoverageRate !== null && gsisCoverageRate >= 0.95;
  const temporalQualified = schemaQualified && pregameSafeRate !== null && pregameSafeRate >= 0.95;
  const qualifiedForJoin = schemaQualified && identityQualified && temporalQualified;

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-AVAILABILITY-QUALIFICATION-1.0.0",
    season: Number.isInteger(input.season) ? input.season : null,
    sourceAvailable,
    sourceFormat: input.sourceFormat ?? null,
    sourceUrl: input.sourceUrl ?? null,
    rowCount,
    columns: Object.freeze(columns),
    missingColumns: Object.freeze(missingColumns),
    gsisCoverageRate,
    dateModifiedCoverageRate,
    pregameSafeRate,
    duplicateRate: Number.isFinite(input.duplicateRate) ? input.duplicateRate : null,
    schemaQualified,
    identityQualified,
    temporalQualified,
    qualifiedForJoin,
    calibrationAuthorized: false,
    learnedWeightsAuthorized: false,
  });
}
