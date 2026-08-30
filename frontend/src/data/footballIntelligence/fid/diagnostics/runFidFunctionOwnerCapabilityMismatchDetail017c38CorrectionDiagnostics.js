import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import declaration from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c38CorrectionDeclaration.js";
import contract, { AUTHORITATIVE_017C37_FIELD_ORDER, MANDATORY_017C38_ADDITIONS } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c38ResultContract.js";
import evaluate from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c38Oracle.js";
import scenarios, { REQUIRED_CORRECTION_SCENARIOS_017C38 } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchDetail017c38Scenarios.js";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const bytes = (relative) => fs.readFileSync(path.join(frontend, relative.replace(/^frontend\//, "")));
const hash = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex").toUpperCase();

assert.equal(hash(declaration.protectedPredecessorPath), declaration.protectedPredecessorSha256);
assert.equal(AUTHORITATIVE_017C37_FIELD_ORDER.length, 21);
assert.deepEqual(MANDATORY_017C38_ADDITIONS.filter((field) => AUTHORITATIVE_017C37_FIELD_ORDER.includes(field)), []);
const literal = evaluate();
assert.equal(literal.solvable, false);
assert.equal(literal.resultingCount, 25);
assert.equal(literal.removalsRequired, 4);
assert.equal(literal.specifiedRemovals, 0);
for (const scenario of scenarios) assert.equal(evaluate({ removals: scenario.removals }).solvable, scenario.solvable, scenario.id);
assert.deepEqual(contract.MANDATORY_017C38_EXTERNAL_RENAMES, { project_id: "project_reference", database_source: "dashboard_database_source" });
assert.equal(new Set(REQUIRED_CORRECTION_SCENARIOS_017C38).size, 26);
assert.equal(declaration.correctionImplemented, false);
assert.equal(declaration.authorization017c23Consumed && declaration.authorization017c26Consumed && declaration.authorization017c29Consumed, true);
assert.equal(declaration.sqlExecuted || declaration.databaseConnected || declaration.authorizationCreated, false);
console.log(JSON.stringify({ status: declaration.status, blocker: declaration.blocker, authoritativeFields: 21,
  mandatoryAbsentAdditions: literal.absentAdditions, literalResultingFieldCount: literal.resultingCount,
  unspecifiedRemovalsRequired: literal.removalsRequired, correctionScenariosRecorded: REQUIRED_CORRECTION_SCENARIOS_017C38.length,
  sqlCreated: false, sqlExecuted: false, authorizationCreated: false }));
