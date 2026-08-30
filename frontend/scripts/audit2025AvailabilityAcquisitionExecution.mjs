#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const reportPath = path.resolve("data/calibration/historical/v1/acquisition/nflverse-injuries-2025-acquisition-report.json");
if (!fs.existsSync(reportPath)) {
  console.error(JSON.stringify({
    audit: "2025_AVAILABILITY_ACQUISITION_EXECUTION",
    mode: "READ_ONLY",
    violations: { missingReport: 1 },
    decision: "AUDIT_REJECTED"
  }, null, 2));
  process.exitCode = 1;
} else {
  const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const violations = {
    wrongSeason: r?.scope?.season === 2025 ? 0 : 1,
    wrongProvider: r?.scope?.provider === "nflverse" ? 0 : 1,
    wrongDataset: r?.scope?.dataset === "injuries" ? 0 : 1,
    missingHash: r?.acquisition?.sourceContentSha256 ? 0 : 1,
    missingTimestamp: r?.acquisition?.acquisitionTimestamp ? 0 : 1,
    normalizationAuthorized: r?.authorizationBoundary?.normalizationAuthorized === false ? 0 : 1,
    matchingAuthorized: r?.authorizationBoundary?.matchingAuthorized === false ? 0 : 1,
    calibrationAuthorized: r?.authorizationBoundary?.calibrationAuthorized === false ? 0 : 1,
    pickemAuthorized: r?.authorizationBoundary?.pickemMutationAuthorized === false ? 0 : 1,
    databaseWriteAuthorized: r?.authorizationBoundary?.databaseWriteAuthorized === false ? 0 : 1
  };
  const failed = Object.values(violations).reduce((a,b)=>a+b,0);
  console.log(JSON.stringify({
    audit: "2025_AVAILABILITY_ACQUISITION_EXECUTION",
    sprint: "2.18.23-RC13",
    mode: "READ_ONLY",
    violations,
    summary: {
      sourceUrl: r?.acquisition?.sourceUrl ?? null,
      sourceFormat: r?.acquisition?.sourceFormat ?? null,
      bytes: r?.acquisition?.sourceContentBytes ?? null,
      sha256: r?.acquisition?.sourceContentSha256 ?? null,
      rows: r?.schemaInspection?.coverage?.rows ?? null,
      season2025Rows: r?.schemaInspection?.coverage?.season2025 ?? null,
      statusCounts: r?.schemaInspection?.coverage?.statuses ?? null
    },
    decision: failed === 0 ? "AUDIT_PASSED" : "AUDIT_REJECTED"
  }, null, 2));
  if (failed) process.exitCode = 1;
}
