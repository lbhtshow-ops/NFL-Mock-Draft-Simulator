import { adaptLegacyAthleticProfile } from "../src/engines/athletics/AthleticLegacyCompatibilityAdapter.js";
import { createAthleticInputProjection } from "../src/engines/athletics/AthleticInputProjection.js";

let passed=0,failed=0;
function check(name, condition) {
  if (condition) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.error(`FAIL ${name}`); }
}

const legacyProfile = {
  measurements: {},
  testing: {},
  scores: {},
  confidence: 0,
  strengths: [],
  limitations: [],
  notes: "No athletic profile available yet.",
};

const numericIdentity = adaptLegacyAthleticProfile(legacyProfile, {
  playerId: 37,
  playerName: "Runtime Prospect",
  position: "EDGE",
});

check("numeric legacy player id adapts without throwing", Boolean(numericIdentity));
check("numeric player id normalized to governed string", numericIdentity.projection.identity.playerId === "37");
check("player name preserved", numericIdentity.projection.identity.playerName === "Runtime Prospect");
check("position preserved", numericIdentity.projection.identity.position === "EDGE");
check("projection remains governed-valid", numericIdentity.projection.validation.valid === true);
check("modeled declaration remains governed-valid", numericIdentity.declaration.validation.valid === true);
check("legacy modeled output remains compatibility-only", numericIdentity.declaration.permittedUse === "COMPATIBILITY_ONLY");
check("missing testing remains unavailable", numericIdentity.projection.testingAvailability === "UNAVAILABLE");
check("no athletic score invented", numericIdentity.declaration.overallScore === null);

const stringIdentity = adaptLegacyAthleticProfile(legacyProfile, {
  playerId: "prospect-37",
  playerName: "Runtime Prospect",
  position: "EDGE",
});
check("existing string ids remain unchanged", stringIdentity.projection.identity.playerId === "prospect-37");

const governed = createAthleticInputProjection({
  identity: { playerId: "37", playerName: "Runtime Prospect", position: "EDGE" },
  measurements: {},
  testing: {},
  testingAvailability: "UNAVAILABLE",
  limitations: [],
  unknownFields: {},
});
check("normalized identity satisfies governed input contract", governed.validation.valid === true);

console.log(`\nAthletic Legacy Identity Compatibility Hotfix diagnostics: ${passed}/${passed+failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_ATHLETIC_LEGACY_IDENTITY_COMPATIBILITY_HOTFIX_READY");
