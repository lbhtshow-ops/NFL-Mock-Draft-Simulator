import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import audit from "../persistence/deployment/FidAtomicFunctionAclValidatorAudit017c59.js";

const reviewDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../persistence/deployment/review",
);
const hash = (filename) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(reviewDir, filename)))
    .digest("hex")
    .toUpperCase();
const remediation = fs.readFileSync(
  path.join(reviewDir, audit.protectedRemediation.filename),
  "utf8",
);
const failures = [];

if (hash(audit.protectedRemediation.filename) !== audit.protectedRemediation.sha256)
  failures.push("protected_remediation_hash");
if (hash(audit.protectedReconciliation.filename) !== audit.protectedReconciliation.sha256)
  failures.push("protected_reconciliation_hash");
if (audit.fiveFailedReconciliationPredicates.length !== 5)
  failures.push("five_predicates");

const mutation = remediation.indexOf("REVOKE EXECUTE ON FUNCTION");
const grant = remediation.indexOf("GRANT EXECUTE ON FUNCTION");
const afterQuery = remediation.indexOf("INTO direct_public", grant);
const assertion = remediation.indexOf("RAISE EXCEPTION 'after-state ACL mismatch'");
if (!(mutation >= 0 && mutation < grant && grant < afterQuery && afterQuery < assertion))
  failures.push("transaction_assertion_order");

for (const token of [
  "pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner)))",
  "pg_catalog.has_function_privilege(owner_oid, function_oid, 'EXECUTE')",
  "pg_catalog.has_function_privilege(service_oid, function_oid, 'EXECUTE')",
  "pg_catalog.has_function_privilege(anon_oid, function_oid, 'EXECUTE')",
  "pg_catalog.has_function_privilege(authenticated_oid, function_oid, 'EXECUTE')",
  "p.proowner = owner_oid",
])
  if (!remediation.includes(token)) failures.push(`dependency:${token}`);

if (
  audit.outcome !== "OUTCOME_D_REPOSITORY_EVIDENCE_INSUFFICIENT" ||
  audit.successorRemediationCreated ||
  audit.remediationCorrectionCreated ||
  audit.executionAuthorizationCreated ||
  audit.remediationAuthorizationCreated ||
  audit.reconciliationAuthorizationCreated
)
  failures.push("bounded_conclusion");

if (failures.length) throw new Error(`17C.59: ${[...new Set(failures)].join(",")}`);
console.log(
  JSON.stringify({
    status: audit.status,
    outcome: audit.outcome,
    failedPredicates: audit.fiveFailedReconciliationPredicates.length,
    protectedRemediationHash: audit.protectedRemediation.sha256,
    protectedReconciliationHash: audit.protectedReconciliation.sha256,
    successorRemediationCreated: false,
    authorizationCreated: false,
    sqlExecuted: false,
    databaseConnected: false,
  }),
);
