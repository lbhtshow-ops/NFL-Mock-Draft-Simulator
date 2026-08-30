import fs from "node:fs";
import path from "node:path";
import {
  evaluateCanonicalProspect,
} from "../src/engines/playerEvaluation/prospect/CanonicalProspectEvaluationService.js";

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

const numericEdge = evaluateCanonicalProspect({
  player: {
    id: 37,
    name: "Runtime EDGE",
    position: "EDGE",
  },
  playerContext: {
    position: "EDGE",
    evaluationPath: "PROSPECT",
    competition: { level: "COLLEGE" },
    careerStage: "PROSPECT",
  },
});

check("numeric runtime ID reaches canonical prospect service", numericEdge?.playerId === "37");
check("numeric runtime ID is normalized to string", typeof numericEdge?.playerId === "string");
check("numeric EDGE no longer fails MISSING_PLAYER_ID", numericEdge?.error !== "MISSING_PLAYER_ID");
check("numeric EDGE reaches position-model registry", Boolean(numericEdge?.modelResult));
check("unregistered EDGE reports MODEL_NOT_REGISTERED", numericEdge?.error === "MODEL_NOT_REGISTERED");
check("unregistered EDGE remains unavailable", numericEdge?.available === false);
check("unregistered EDGE does not invent grade", numericEdge?.modelResult?.overallGrade == null);
check("unregistered EDGE confidence remains zero", numericEdge?.modelResult?.confidence === 0);

const stringEdge = evaluateCanonicalProspect({
  player: {
    id: "runtime-edge-37",
    name: "Runtime EDGE",
    position: "EDGE",
  },
  playerContext: {
    position: "EDGE",
    evaluationPath: "PROSPECT",
    competition: { level: "COLLEGE" },
    careerStage: "PROSPECT",
  },
});

check("existing string runtime IDs are preserved", stringEdge?.playerId === "runtime-edge-37");
check("string EDGE still reports MODEL_NOT_REGISTERED", stringEdge?.error === "MODEL_NOT_REGISTERED");

const missingId = evaluateCanonicalProspect({
  player: {
    name: "No ID Prospect",
    position: "EDGE",
  },
  playerContext: {
    position: "EDGE",
    evaluationPath: "PROSPECT",
    competition: { level: "COLLEGE" },
    careerStage: "PROSPECT",
  },
});
check("truly missing ID still reports MISSING_PLAYER_ID", missingId?.error === "MISSING_PLAYER_ID");

const serviceSource = fs.readFileSync(
  path.resolve("src/engines/playerEvaluation/prospect/CanonicalProspectEvaluationService.js"),
  "utf8"
);
const opsSource = fs.readFileSync(
  path.resolve("src/components/draftOperations/DraftOperationsCenter.jsx"),
  "utf8"
);

check("canonical service contains runtime ID normalizer", serviceSource.includes("normalizeEvaluationPlayerId"));
check("canonical service converts finite numeric IDs", serviceSource.includes("return String(value)"));
check("canonical service does not synthesize application prospect ID", !serviceSource.includes("app-prospect:"));
check("Big Board grade checks null before numeric coercion", opsSource.includes("rawValue == null"));
check("Big Board unavailable grade returns dashes", opsSource.includes('return "--"'));
check("Big Board still accepts real numeric grades", opsSource.includes("Number(rawValue)"));

console.log(`\nProspect Runtime Identity + Grade Stabilization diagnostics: ${passed}/${passed + failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_PROSPECT_RUNTIME_IDENTITY_GRADE_STABILIZATION_READY");
