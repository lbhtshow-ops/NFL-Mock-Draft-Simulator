import record from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchResult017c43Record.js";
import { evaluate017c43Result } from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchResult017c43Evaluator.js";
import scenarios from "../persistence/deployment/FidFunctionOwnerCapabilityMismatchResult017c43Scenarios.js";

const baseline = evaluate017c43Result(record);
if (!baseline.accepted || baseline.provenOracleDefects.length !== 3) throw new Error("17C.43 captured result was not adjudicated");
for (const test of scenarios) {
  const result = evaluate017c43Result(test.input);
  if (result.accepted !== test.accepted || (test.failure && !result.failures.includes(test.failure))) throw new Error(`17C.43 scenario failed: ${test.name}`);
}
if (baseline.adjudications.length !== 6 || baseline.rootCauses.PUBLIC_EXECUTE_DIRECT_ACL.length !== 4) throw new Error("17C.43 adjudication coverage failed");
console.log("Sprint 17C.43 mismatch-result governance diagnostics passed.");
