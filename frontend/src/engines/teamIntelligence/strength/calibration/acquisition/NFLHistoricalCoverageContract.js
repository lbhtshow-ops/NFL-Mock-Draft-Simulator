export function createNFLHistoricalCoverageReport(records = [], metadata = {}) {
  const byDomain = {};
  for (const record of records) {
    if (!record?.domain || !Number.isInteger(record?.season)) continue;
    if (!byDomain[record.domain]) byDomain[record.domain] = {seasons:new Set(), records:0, safePregameRecords:0};
    const item = byDomain[record.domain];
    item.seasons.add(record.season);
    item.records += 1;
    if (record.safeForPregameCalibration) item.safePregameRecords += 1;
  }

  const domains = Object.fromEntries(Object.entries(byDomain).map(([domain, value]) => {
    const seasons = [...value.seasons].sort((a,b)=>a-b);
    return [domain, Object.freeze({
      seasons: Object.freeze(seasons),
      minimumSeason: seasons.length ? seasons[0] : null,
      maximumSeason: seasons.length ? seasons[seasons.length-1] : null,
      recordCount: value.records,
      safePregameRecordCount: value.safePregameRecords,
      coverageIsEquivalentToOtherDomains: false,
    })];
  }));

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-COVERAGE-1.0.0",
    reportId: metadata.reportId ?? null,
    generatedAt: metadata.generatedAt ?? null,
    domains: Object.freeze(domains),
    crossDomainCoverageAssumedEquivalent: false,
  });
}
