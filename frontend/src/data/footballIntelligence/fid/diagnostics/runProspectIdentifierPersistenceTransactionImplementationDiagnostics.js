import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { evaluateProspectIdentifierMigration014Sql } from "../persistence/deployment/ProspectIdentifierMigration014StaticOracle.js";
import deploymentPlan from "../persistence/deployment/ProspectIdentifierPersistenceTransactionDeploymentPlan.js";
import { CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_IMPLEMENTATION as implementation, evaluateCanonicalProspectIdentifierPersistenceTransactionImplementation as evaluate } from "../prospectIntake/CanonicalProspectIdentifierPersistenceTransactionImplementationAssessment.js";
import snapshots from "../prospectIntake/fixtures/prospectIdentifierPersistenceTransactionImplementationSnapshots.js";
import { createProspectIdentifierPersistenceTransactionRequest } from "../prospectIntake/ProspectIdentifierPersistenceTransactionContracts.js";
import { createNonNetworkingRpcCapabilityDoubleV1_0 as createDouble } from "../../../../../supabase/functions/canonical-prospect-identifier-issuance/tests/rpcCapabilityDoubleV1_0.js";
import { CANONICAL_PROSPECT_IDENTIFIER_RPC_CAPABILITY_CONTRACT as capability, CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_RPC_TRANSACTION_ADAPTER as adapterDescriptor, PROSPECT_IDENTIFIER_REQUEST_TO_RPC_MAP as requestMap, createCanonicalProspectIdentifierRpcTransactionAdapterV1_0 as createAdapter, createPersistenceReadyRpcCompositionV1_3 as compose, mapProspectIdentifierRequestToRpcArguments as mapRequest } from "../../../../../supabase/functions/canonical-prospect-identifier-issuance/server-v1_3-persistence.js";

const assert = (value, message) => { if (!value) throw new Error(message); };
const migrationUrl = new URL("../persistence/deployment/sql/014_create_fid_identifier_issuance_transaction.sql", import.meta.url);
const sql = fs.readFileSync(fileURLToPath(migrationUrl), "utf8");
const oracle = evaluateProspectIdentifierMigration014Sql(sql);
const request = createProspectIdentifierPersistenceTransactionRequest({ requestId: "governed-request-ref", operationId: "governed-operation-ref", idempotencyRef: "governed-idempotency-ref", authorizationRef: "governed-authorization-ref", generationInvocationRef: "governed-generation-invocation-ref", generationResultRef: "governed-generation-result-ref", candidateIdentifier: `prospect:${"A".repeat(22)}`, identifierLayer: "PROSPECT", namespace: "prospect", strategyRef: "CANONICAL_PROSPECT_IDENTIFIER_GENERATION_STRATEGY@1.0.0", conventionRef: "CANONICAL_PROSPECT_IDENTIFIER_CONVENTION@1.0.0", generatorPortRef: "CANONICAL_PROSPECT_IDENTIFIER_GENERATOR_PORT@1.2.0", adapterRef: "CANONICAL_PROSPECT_IDENTIFIER_SECURE_OPAQUE_NON_PRODUCTION_ADAPTER@1.1.0", providerRef: "CANONICAL_PROSPECT_IDENTIFIER_SECURE_OPAQUE_NON_PRODUCTION_PROVIDER@1.1.0", attemptNumber: 1, attemptPolicyRef: "CANONICAL_PROSPECT_IDENTIFIER_MAXIMUM_ATTEMPTS_POLICY@1.0.0", environment: "TEST", actorRef: "governed-actor-ref", expectedPolicyRefs: ["policy-ref-1", "policy-ref-2"], auditRefs: ["governed-audit-ref"] });
const context = Object.freeze({ migration014Present: true, staticOraclePassed: oracle.status === "MIGRATION_014_STATIC_ORACLE_PASSED", productionEnabled: false });
const makeAdapter = (mode = "SUCCESS", overrides = {}) => createAdapter({ rpcCapability: createDouble(mode), environment: "TEST", runtimeTarget: "SERVER", ...overrides });

const tests = [
  ["implementation", () => assert(implementation.implementationVersion === "1.0.0" && implementation.status === "IMPLEMENTED_UNAPPLIED", "implementation")],
  ["assessment", () => assert(evaluate(implementation, context).status === "PERSISTENCE_TRANSACTION_READY_FOR_DEPLOYMENT_REVIEW", "assessment")],
  ["next", () => assert(evaluate(implementation, context).requiredNextAction === "CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT_REVIEW", "next")],
  ["migration", () => assert(implementation.migration === "014_create_fid_identifier_issuance_transaction.sql", "migration")],
  ["tables", () => assert(implementation.tables.length === 3, "tables")],
  ["oracle", () => assert(oracle.status === "MIGRATION_014_STATIC_ORACLE_PASSED", "oracle")],
  ["oracle-checks", () => assert(Object.values(oracle.checks).every(Boolean), "oracle checks")],
  ["oracle-static", () => assert(oracle.staticOnly && !oracle.sqlExecuted && !oracle.databaseValidated, "oracle boundary")],
  ["uuid-capability", () => assert(implementation.uuidCapability === "pg_catalog.gen_random_uuid()", "uuid")],
  ["uuid-preflight", () => assert(implementation.uuidPreflightRequired && deploymentPlan.preflight.includes("CONFIRM_PG_CATALOG_GEN_RANDOM_UUID_EXISTS_AND_RETURNS_UUID_V4"), "preflight")],
  ["deployment-plan", () => assert(deploymentPlan.status === "DECLARED_NOT_EXECUTED" && deploymentPlan.acceptance.length === 22, "deployment plan")],
  ["recovery-plan", () => assert(deploymentPlan.recovery.reconciliationInput === "idempotencyRef" && deploymentPlan.recovery.replacementReferenceGenerationProhibited, "recovery")],
  ["permissions", () => assert(Object.values(implementation.permissions).every((value) => !value) && Object.values(deploymentPlan.permissions).every((value) => !value), "permissions")],
  ["request-map", () => assert(requestMap.length === 21 && new Set(requestMap.map((item) => item.rpcArgument)).size === 21, "request map")],
  ["request-map-types", () => assert(requestMap.filter((item) => item.sqlType === "jsonb").length === 2 && requestMap.filter((item) => item.sqlType === "integer").length === 1, "types")],
  ["candidate-classification", () => assert(requestMap.find((item) => item.runtimeField === "candidateIdentifier").sensitivity === "SENSITIVE_PRE_ISSUANCE_OPERATIONAL_DATA", "candidate classification")],
  ["created-refs-not-inputs", () => assert(["transactionRef", "reservationRef", "issuanceLedgerRef"].every((field) => !requestMap.some((item) => item.runtimeField === field)), "created references")],
  ["map-valid", () => assert(mapRequest(request).valid && mapRequest(request).fieldCount === 21, "mapping")],
  ["map-redacted", () => { const mapped = mapRequest(request); assert(mapped.candidatePresent && mapped.candidateValueRedacted && !Object.hasOwn(mapped, "candidateIdentifier"), "redaction"); }],
  ["map-invalid", () => assert(!mapRequest({ ...request, auditRefs: [] }).valid, "invalid request")],
  ["capability", () => assert(capability.capabilityVersion === "1.0.0" && !capability.operationallyBound, "capability")],
  ["adapter", () => assert(adapterDescriptor.adapterVersion === "1.0.0" && !adapterDescriptor.databaseBound, "adapter")],
  ["adapter-valid", () => assert(makeAdapter().valid, "adapter valid")],
  ["adapter-browser", () => assert(!makeAdapter("SUCCESS", { runtimeTarget: "BROWSER" }).valid, "browser")],
  ["adapter-production", () => assert(!makeAdapter("SUCCESS", { environment: "PRODUCTION" }).valid, "production")],
  ["adapter-client-rejected", () => assert(!createAdapter({ rpcCapability: { ...createDouble(), supabaseClient: {} }, environment: "TEST", runtimeTarget: "SERVER" }).valid, "client")],
  ["success", async () => assert((await makeAdapter().handoff(request)).status === "IDENTIFIER_RESERVED_AND_RECORDED", "success")],
  ["collision", async () => { const result = await makeAdapter("COLLISION").handoff(request); assert(result.status === "IDENTIFIER_COLLISION_DETECTED" && result.transactionRefPresent && !result.reservationRefPresent && !result.issuanceLedgerRefPresent, "collision"); }],
  ["replay", async () => assert((await makeAdapter("REPLAY").handoff(request)).status === "IDENTIFIER_IDEMPOTENT_REPLAY", "replay")],
  ["uncertainty", async () => { const result = await makeAdapter("UNCERTAIN").handoff(request); assert(result.state === "RECOVERY_REQUIRED" && !result.automaticRetry, "uncertainty"); }],
  ["raw-error-normalized", async () => { const result = await makeAdapter("THROW").handoff(request); assert(result.category === "TRANSACTION_COMMIT_UNKNOWN" && !Object.hasOwn(result, "error"), "raw error"); }],
  ["one-call", async () => { const double = createDouble(); const adapter = createAdapter({ rpcCapability: double, environment: "TEST", runtimeTarget: "SERVER" }); await adapter.handoff(request); assert(double.getCallCount() === 1 && adapter.getInvocationCount() === 1, "calls"); }],
  ["double-sanitized", async () => { const double = createDouble(); await createAdapter({ rpcCapability: double, environment: "TEST", runtimeTarget: "SERVER" }).handoff(request); const observation = double.getSanitizedObservation(); assert(observation.candidateValueRedacted && !Object.hasOwn(observation, "candidateIdentifier"), "double redaction"); }],
  ["double-no-effects", () => { const double = createDouble(); assert(double.networkRequests + double.databaseOperations + double.persistenceOperations === 0, "effects"); }],
  ["composition", () => assert(compose({ environment: "TEST", runtimeTarget: "SERVER", handlerVersion: "1.2.0", transactionPortVersion: "1.1.0", adapterVersion: "1.0.0", resultVersion: "1.1.0", rpcCapability: createDouble() }).valid, "composition")],
  ["composition-browser", () => assert(!compose({ environment: "TEST", runtimeTarget: "BROWSER", handlerVersion: "1.2.0", transactionPortVersion: "1.1.0", adapterVersion: "1.0.0", resultVersion: "1.1.0", rpcCapability: createDouble() }).valid, "composition browser")],
  ["composition-production", () => assert(!compose({ environment: "PRODUCTION", runtimeTarget: "SERVER", handlerVersion: "1.2.0", transactionPortVersion: "1.1.0", adapterVersion: "1.0.0", resultVersion: "1.1.0", rpcCapability: createDouble() }).valid, "composition production")],
  ["snapshots", () => assert(Object.keys(snapshots).length === 40, "snapshots")],
  ["snapshot-redaction", () => assert(Object.values(snapshots).every((item) => item === snapshots.cohort || (!item.candidateValuePresent && !item.referenceValuePresent)), "snapshot redaction")],
  ["cohort", () => assert(snapshots.cohort.length === 4 && snapshots.cohort.every((item) => Object.entries(item).filter(([key]) => key.endsWith("Count")).every(([, value]) => value === 0)), "cohort")],
  ["no-operational-binding", () => assert(!implementation.capabilities.rpcCapabilityOperationallyBound && !implementation.capabilities.databaseValidated && !implementation.capabilities.deployed, "binding")],
  ["no-sql-execution", () => assert(!implementation.capabilities.migrationExecuted && !oracle.sqlExecuted, "sql")],
  ["deterministic-assessment", () => assert(JSON.stringify(evaluate(implementation, context)) === JSON.stringify(evaluate(implementation, context)), "determinism")],
];

let passed = 0;
for (const [name, test] of tests) { try { await test(); passed += 1; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}: ${error.message}`); } }
console.log(`Prospect identifier persistence transaction implementation diagnostics: ${passed}/${tests.length}`);
if (passed !== tests.length) globalThis.process.exitCode = 1;
