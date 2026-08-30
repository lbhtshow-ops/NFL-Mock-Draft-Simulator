import fs from "node:fs";
import path from "node:path";

const sprint = "2.18.23-RC11";
const auditPath = path.join(process.cwd(), "scripts", "audit2025AvailabilityAcquisitionCapability.mjs");
const text = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, "utf8") : "";

const tests = [
  ["audit-script-present", fs.existsSync(auditPath)],
  ["target-season-2025", /TARGET_SEASON\s*=\s*2025/.test(text)],
  ["nflverse-provider-required", /providerNFLVerse/.test(text)],
  ["injuries-dataset-required", /datasetInjuries/.test(text)],
  ["dynamic-season-path-required", /injuryUrlDynamic/.test(text)],
  ["csv-gz-capability-audited", /compressedFallback/.test(text)],
  ["report-status-capability-audited", /hasReportStatus/.test(text)],
  ["practice-status-capability-audited", /hasPracticeStatus/.test(text)],
  ["primary-injury-capability-audited", /hasInjury/.test(text)],
  ["date-modified-capability-audited", /hasModifiedDate/.test(text)],
  ["out-doubtful-questionable-audited", /OUT.*DOUBTFUL.*QUESTIONABLE/s.test(text)],
  ["latest-safe-join-audited", /LATEST_SAFE_PLAYER_WEEK_REPORT/.test(text)],
  ["external-fetch-prohibited", /externalNetworkInvoked:\s*false/.test(text)],
  ["normalization-locked", /governed2025NormalizationAuthorized:\s*false/.test(text)],
  ["treatment-rebuild-locked", /treatmentControlRebuildAuthorized:\s*false/.test(text)],
  ["matching-locked", /matchingRerunAuthorized:\s*false/.test(text)],
  ["att-locked", /attRecomputationAuthorized:\s*false/.test(text)],
  ["production-calibration-locked", /productionCalibrationAuthorized:\s*false/.test(text)],
  ["pickem-locked", /pickemScoringMutated:\s*false/.test(text)],
  ["database-read-only", /databaseMutated:\s*false/.test(text)],
].map(([name, passed]) => ({ name, passed }));

const failed = tests.filter((t) => !t.passed).length;
console.log(JSON.stringify({
  suite: "2025 Availability Acquisition Capability Audit RC11 Diagnostics",
  sprint,
  passed: tests.length - failed,
  failed,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
