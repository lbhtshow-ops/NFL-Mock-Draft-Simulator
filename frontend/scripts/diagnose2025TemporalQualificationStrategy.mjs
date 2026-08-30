import fs from "node:fs";
import path from "node:path";

const target =
  path.join(process.cwd(),
    "scripts",
    "audit2025TemporalQualificationStrategy.mjs"
  );

const text =
  fs.existsSync(target)
    ? fs.readFileSync(target,"utf8")
    : "";

const tests = [
  ["audit-script-present",fs.existsSync(target)],
  ["historical-date-modified-audited",/date_modified/.test(text)],
  ["latest-safe-selection-audited",/LATEST_SAFE_PLAYER_WEEK_REPORT/.test(text)],
  ["kickoff-aware-logic-audited",/kickoffAt|kickoff/.test(text)],
  ["2025-source-timestamp-absent",/sourceTimestampFieldPresent:\s*false/.test(text)],
  ["acquisition-time-substitution-rejected",
    /ACQUISITION_TIME_SUBSTITUTION/.test(text) &&
    /admissibleFor2025:\s*false/.test(text)],
  ["week-only-qualification-rejected",
    /WEEK_NUMBER_ONLY/.test(text)],
  ["source-release-provenance-strategy-defined",
    /C_GAME_CUTOFF_PLUS_EXTERNAL_RELEASE_PROVENANCE/.test(text)],
  ["date-modified-not-fabricated",
    /dateModifiedCanBeFabricated:\s*false/.test(text)],
  ["safe-qualification-not-yet-claimed",
    /safe2025QualificationCurrentlyEstablished:\s*false/.test(text)],
  ["raw-fetch-reexecution-locked",
    /"2025RawAcquisitionReexecutionAuthorized":\s*false/.test(text)],
  ["normalization-locked",
    /"2025NormalizationAuthorized":\s*false/.test(text)],
  ["matching-locked",
    /matchingRerunAuthorized:\s*false/.test(text)],
  ["att-locked",
    /attRecomputationAuthorized:\s*false/.test(text)],
  ["calibration-locked",
    /productionCalibrationAuthorized:\s*false/.test(text)],
  ["pickem-locked",
    /pickemMutationAuthorized:\s*false/.test(text)],
  ["database-read-only",
    /databaseMutated:\s*false/.test(text)],
  ["no-leading-digit-identifier",
    !/\b(?:const|let|var|function|class)\s+\d/.test(text)],
  ["no-unquoted-leading-digit-object-key",
    !/^\s*\d[A-Za-z0-9_$]*\s*:/m.test(text)],
  ["provenance-audit-gate-defined",
    /const provenanceAuditMayAdvance\s*=/.test(text)],
  ["provenance-audit-may-advance",
    /sourceReleaseProvenanceAuditMayAdvance:\s*provenanceAuditMayAdvance/.test(text)],
  ["temporal-qualification-remains-undefined",
    /"2025TemporalQualificationDefined":\s*false/.test(text)],
  ["provenance-audit-decision-explicit",
    /TEMPORAL_QUALIFICATION_REQUIRES_SOURCE_RELEASE_PROVENANCE_AUDIT/.test(text)],
  ["provenance-audit-next-step-explicit",
    /AUDIT_2025_SOURCE_RELEASE_PROVENANCE_WITHOUT_NORMALIZING_DATA/.test(text)],
  ["exit-gate-follows-provenance-audit",
    /if\(!provenanceAuditMayAdvance\)/.test(text)]
].map(([name,passed])=>({name,passed}));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:
    "2025 Temporal Qualification Strategy RC14 Diagnostics",
  sprint:"2.18.23-RC14",
  passed,
  failed,
  tests
},null,2));

if(failed) process.exitCode=1;
