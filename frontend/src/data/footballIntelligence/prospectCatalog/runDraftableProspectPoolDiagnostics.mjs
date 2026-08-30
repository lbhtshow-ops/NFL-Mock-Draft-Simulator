import { buildDraftableProspectPool, resolveDraftableProspectPolicy } from "./DraftableProspectPool.js";

const runtimeFixtures = [
  { id: 8, rank: 22, name: "Carter Smith", position: "OT", school: "Indiana", year: 2027 },
  { id: 315, rank: 317, name: "Carter Smith", position: "QB", school: "Indiana", year: 2027 },
  { id: 1, rank: 1, name: "Jeremiah Smith", position: "WR", school: "Ohio State", year: 2027 },
];

const carterOt = resolveDraftableProspectPolicy(runtimeFixtures[0]);
const carterQb = resolveDraftableProspectPolicy(runtimeFixtures[1]);
const unknown = resolveDraftableProspectPolicy(runtimeFixtures[2]);
const pool = buildDraftableProspectPool(runtimeFixtures);

const checks = {
  carterOtRetained: carterOt.included === true,
  carterQbExcluded: carterQb.included === false,
  carterQbResolvedToWisconsin: carterQb.player?.school === "Wisconsin" && carterQb.player?.position === "QB",
  carterQbEarliestDraftYear2028: carterQb.earliestDraftYear === 2028,
  carterQbAbsentFromDraftablePool: !pool.some((player) => player.id === 315),
  unknownEligibilityRetained: unknown.included === true && unknown.eligibilityStatus === "UNKNOWN",
  poolContainsOnlyTwoFixtures: pool.length === 2,
};

const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
const result = {
  status,
  contract: "DraftableProspectPoolDiagnostics",
  contractVersion: "MDS-5B.7A-1.0.0",
  checks,
  samples: { carterOt, carterQb, unknown },
};

console.log(JSON.stringify(result, null, 2));
if (status !== "PASS") process.exitCode = 1;
