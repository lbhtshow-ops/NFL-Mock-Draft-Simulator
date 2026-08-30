import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, "syncNFLVersePlayerAvailabilityToResearchRepository.mjs");
const source = fs.readFileSync(target, "utf8");
const checks = [
  ["explicit-write-gate", source.includes('--execute-write') && source.includes('Refusing persistence without explicit --execute-write')],
  ["dry-run-supported", source.includes('--dry-run') && source.includes('Research Repository was not mutated')],
  ["first-write-requires-team-week", source.includes('requires both --week and --team')],
  ["dedicated-research-repository-url", source.includes('RESEARCH_REPOSITORY_SUPABASE_URL')],
  ["dedicated-service-role-key", source.includes('RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY')],
  ["no-generic-service-role-fallback", !source.includes('process.env.SUPABASE_SERVICE_ROLE_KEY')],
  ["canonical-research-adapter-reused", source.includes('createSupabaseResearchRepositoryAdapter')],
  ["canonical-availability-bundle-reused", source.includes('createNFLAvailabilityResearchBundle')],
  ["scope-filter-before-persistence", source.includes('requestedWeek') && source.includes('requestedTeam') && source.includes('allEvidence.filter')],
];
const tests = checks.map(([name, passed]) => ({ name, passed }));
const failed = tests.filter((t) => !t.passed);
console.log(JSON.stringify({suite:"First Governed Availability Persistence V1 Diagnostics",passed:tests.length-failed.length,failed:failed.length,tests},null,2));
if (failed.length) process.exitCode=1;
