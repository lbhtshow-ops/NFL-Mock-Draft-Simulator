import { deepFreeze } from "./contractSupport.js";
import { sha256Hex, utf8Bytes } from "./canonicalIdentity.js";
import { createRuntimeWitnessResult } from "./runtimeWitness.js";

const safeRef = (value) => typeof value === "string" && /^[A-Za-z0-9:_./-]{1,160}$/.test(value) ? value : null;
const byteSize = (value) => new TextEncoder().encode(JSON.stringify(value ?? null)).byteLength;
const event = (chronology, type, detail = null) => chronology.push(deepFreeze({ sequence: chronology.length + 1, type, detail }));

export function createPostgresTransactionWitnessAdapter({ driver, cryptoProvider = globalThis.crypto, cancellation = null } = {}) {
  let calls = 0;
  return Object.freeze({
    witnessType: "POSTGRESQL_TRANSACTION_WITNESS_ADAPTER_WITH_INJECTED_DRIVER",
    get callCount() { return calls; },
    async observeGovernedExecution(request) {
      calls += 1;
      const profile = request?.extensions?.atomicOperationProfile;
      const chronology = [], stageObservations = [], stateObservations = [], resultObservations = [], errorObservations = [], uncertaintyObservations = [], residualGaps = [], contradictions = [];
      let acquired = null, transactionRef = null, outcome = { state: "NOT_STARTED", requested: null, observed: null }, status = "BLOCKED";
      const fail = (code, uncertain = false) => { errorObservations.push({ observationState: "PRESENT", boundedDetail: { code } }); if (uncertain) { uncertaintyObservations.push({ observationState: "UNRESOLVED", boundedDetail: { code } }); residualGaps.push(code); } };
      if (!request?.validation?.valid || !profile?.validation?.valid || request.manifestRef !== profile?.manifestRef || request.executionPlanRef !== profile?.executionPlanRef || request.observationPlanRef !== profile?.observationPlanRef || request.authorizationRef !== profile?.authorizationRef || request.executionRef !== profile?.executionRef || request.attemptRef !== profile?.attemptRef) fail("PROFILE_OR_REQUEST_BINDING_INVALID");
      else if (!driver || typeof driver.acquireDedicatedConnection !== "function") fail("DRIVER_PORT_INVALID");
      else {
        let identitiesValid = await sha256Hex(utf8Bytes(request.extensions.artifactText), cryptoProvider) === profile.artifactDigest;
        for (const stage of profile.stages) identitiesValid &&= await sha256Hex(utf8Bytes(stage.payloadText), cryptoProvider) === stage.payloadDigest;
        if (!identitiesValid) fail("ARTIFACT_OR_STAGE_PAYLOAD_DIGEST_MISMATCH");
        else if (cancellation?.isCancelled?.("BEFORE_CONNECTION")) { status = "INTERRUPTED"; fail("CANCELLED_BEFORE_CONNECTION"); }
        else try {
          event(chronology, "CONNECTION_ACQUISITION_REQUESTED");
          acquired = await driver.acquireDedicatedConnection({ profileRef: profile.profileRef });
          if (acquired?.state !== "ACQUIRED" || !acquired.connection || !safeRef(acquired.connectionRef)) throw Object.assign(new Error("CONNECTION_NOT_ACQUIRED"), { code: "CONNECTION_NOT_ACQUIRED" });
          event(chronology, "CONNECTION_ACQUIRED", acquired.connectionRef);
          if (cancellation?.isCancelled?.("BEFORE_TRANSACTION_BEGIN")) throw Object.assign(new Error("CANCELLED_BEFORE_TRANSACTION_BEGIN"), { code: "CANCELLED_BEFORE_TRANSACTION_BEGIN" });
          event(chronology, "TRANSACTION_BEGIN_REQUESTED");
          const begun = await driver.beginTransaction({ connection: acquired.connection, connectionRef: acquired.connectionRef });
          if (begun?.connection !== acquired.connection || begun?.connectionRef !== acquired.connectionRef) throw Object.assign(new Error("CONNECTION_AFFINITY_VIOLATION"), { code: "CONNECTION_AFFINITY_VIOLATION" });
          if (begun?.state !== "ACKNOWLEDGED") throw Object.assign(new Error("TRANSACTION_BEGIN_NOT_OBSERVED"), { code: "TRANSACTION_BEGIN_NOT_OBSERVED" });
          transactionRef = safeRef(begun.transactionRef); outcome = { state: "ACTIVE", requested: "BEGIN", observed: "ACTIVE" }; event(chronology, "TRANSACTION_BEGIN_OBSERVED", transactionRef);
          status = "OBSERVING";
          for (const stage of profile.stages) {
            if (cancellation?.isCancelled?.(`BEFORE_STAGE:${stage.stageRef}`)) throw Object.assign(new Error("CANCELLED_BEFORE_STAGE"), { code: "CANCELLED_BEFORE_STAGE" });
            event(chronology, stage.stageType === "BOUNDED_OBSERVATION" ? "OBSERVATION_SUBMITTED" : "STAGE_SUBMITTED", stage.stageRef);
            const observed = await driver.executeGovernedStage({ connection: acquired.connection, connectionRef: acquired.connectionRef, transactionRef, stageRef: stage.stageRef, stageType: stage.stageType, sequence: stage.sequence, payloadText: stage.payloadText, payloadDigest: stage.payloadDigest });
            if (observed?.connection !== acquired.connection || observed?.connectionRef !== acquired.connectionRef) throw Object.assign(new Error("CONNECTION_AFFINITY_VIOLATION"), { code: "CONNECTION_AFFINITY_VIOLATION" });
            if (transactionRef && observed?.transactionRef && observed.transactionRef !== transactionRef) throw Object.assign(new Error("TRANSACTION_AFFINITY_VIOLATION"), { code: "TRANSACTION_AFFINITY_VIOLATION" });
            const base = { stageRef: stage.stageRef, observationState: observed?.completionState === "COMPLETED" ? "PRESENT" : "UNRESOLVED", boundedDetail: { stageType: stage.stageType, submission: observed?.state ?? "UNRESOLVED", completion: observed?.completionState ?? "UNRESOLVED" } };
            stageObservations.push(base);
            if (observed?.state !== "ACKNOWLEDGED" || observed?.completionState !== "COMPLETED") throw Object.assign(new Error(observed?.code ?? "STAGE_OUTCOME_UNRESOLVED"), { code: observed?.code ?? "STAGE_OUTCOME_UNRESOLVED", uncertain: observed?.state === "DISCONNECTED" || observed?.state === "CANCELLED" });
            if (observed.result != null) {
              if (byteSize(observed.result) > profile.outputPolicy.maximumBytes || (Array.isArray(observed.result.rows) && observed.result.rows.length > profile.outputPolicy.maximumRows)) throw Object.assign(new Error("BOUNDED_OUTPUT_EXCEEDED"), { code: "BOUNDED_OUTPUT_EXCEEDED" });
              const target = stage.stageType === "BOUNDED_OBSERVATION" ? stateObservations : resultObservations;
              target.push({ stageRef: stage.stageRef, observationState: "PRESENT", boundedDetail: observed.result });
            }
            event(chronology, stage.stageType === "BOUNDED_OBSERVATION" ? "OBSERVATION_COMPLETED" : "STAGE_COMPLETED", stage.stageRef);
          }
          if (profile.transactionPolicy === "COMMIT_ALLOWED") {
            event(chronology, "COMMIT_REQUESTED"); outcome = { state: "COMMIT_REQUESTED", requested: "COMMIT", observed: null };
            const committed = await driver.requestCommit({ connection: acquired.connection, connectionRef: acquired.connectionRef, transactionRef });
            if (committed?.connection !== acquired.connection || committed?.connectionRef !== acquired.connectionRef) throw Object.assign(new Error("CONNECTION_AFFINITY_VIOLATION"), { code: "CONNECTION_AFFINITY_VIOLATION" });
            if (committed.state === "OBSERVED") { outcome = { state: "COMMIT_OBSERVED", requested: "COMMIT", observed: "COMMIT" }; event(chronology, "COMMIT_OBSERVED"); } else throw Object.assign(new Error("COMMIT_OUTCOME_UNRESOLVED"), { code: "COMMIT_OUTCOME_UNRESOLVED", uncertain: true });
          } else {
            event(chronology, "ROLLBACK_REQUESTED"); outcome = { state: "ROLLBACK_REQUESTED", requested: "ROLLBACK", observed: null };
            const rolledBack = await driver.requestRollback({ connection: acquired.connection, connectionRef: acquired.connectionRef, transactionRef });
            if (rolledBack?.connection !== acquired.connection || rolledBack?.connectionRef !== acquired.connectionRef) throw Object.assign(new Error("CONNECTION_AFFINITY_VIOLATION"), { code: "CONNECTION_AFFINITY_VIOLATION" });
            if (rolledBack.state === "OBSERVED") { outcome = { state: "ROLLBACK_OBSERVED", requested: "ROLLBACK", observed: "ROLLBACK" }; event(chronology, "ROLLBACK_OBSERVED"); } else throw Object.assign(new Error("ROLLBACK_OUTCOME_UNRESOLVED"), { code: "ROLLBACK_OUTCOME_UNRESOLVED", uncertain: true });
          }
          status = "COMPLETED";
        } catch (error) {
          status = error?.code?.includes("CANCELLED") ? "INTERRUPTED" : error?.code?.includes("DISCONNECT") ? "DISCONNECTED" : "FAILED";
          fail(error?.code ?? "ADAPTER_FAILURE", error?.uncertain === true || status === "DISCONNECTED");
          if (outcome.state === "ACTIVE") outcome = { state: error?.uncertain ? "UNKNOWN" : "FAILED", requested: null, observed: null };
        } finally {
          if (acquired?.connection) {
            event(chronology, "CONNECTION_RELEASE_REQUESTED");
            try { const released = await driver.releaseConnection({ connection: acquired.connection, connectionRef: acquired.connectionRef }); if (released?.state === "RELEASED" && released.connection === acquired.connection) event(chronology, "CONNECTION_RELEASED"); else { fail("CONNECTION_RELEASE_UNRESOLVED", true); if (!["ROLLBACK_OBSERVED", "COMMIT_OBSERVED"].includes(outcome.state)) outcome = { state: "UNKNOWN", requested: outcome.requested, observed: null }; } }
            catch { fail("CONNECTION_RELEASE_UNRESOLVED", true); if (!["ROLLBACK_OBSERVED", "COMMIT_OBSERVED"].includes(outcome.state)) outcome = { state: "UNKNOWN", requested: outcome.requested, observed: null }; }
          }
        }
      }
      return createRuntimeWitnessResult({ witnessRequestRef: request?.witnessRequestRef, witnessIdentity: "ref:witness:postgres-transaction-adapter", witnessType: "POSTGRESQL_TRANSACTION_WITNESS_ADAPTER", witnessStatus: status, acceptanceState: status === "BLOCKED" ? "REJECTED" : "ACCEPTED", readinessState: "READY", executionRef: request?.executionRef, attemptRef: request?.attemptRef, session: acquired && safeRef(acquired.sessionRef) ? { state: "PRESENT", reference: acquired.sessionRef } : { state: "UNOBSERVABLE", reference: null }, transaction: transactionRef ? { state: "PRESENT", reference: transactionRef } : { state: "UNOBSERVABLE", reference: null }, stageObservations, stateObservations, resultObservations, errorObservations, uncertaintyObservations, chronology, transactionOutcome: outcome, witnessCompleteness: status === "COMPLETED" ? "COMPLETE_FOR_SYNTHETIC_FIXTURE" : "PARTIAL", residualGaps: ["ACTUAL_DATABASE_OBSERVATION_UNAVAILABLE", ...residualGaps], contradictions, limitations: ["SYNTHETIC_DRIVER_ONLY", "NO_REAL_POSTGRESQL_OR_PLATFORM_ATTESTATION"], mandatoryStop: true, evidenceSufficient: false, operationalSuccessEstablished: false, extensions: { fixtureOnly: true, actualRuntimeEvidence: false, actualDatabaseEvidence: false, retryCount: 0, adapterInvocationCount: calls, driverMetrics: driver?.metrics ?? null } });
    },
  });
}
