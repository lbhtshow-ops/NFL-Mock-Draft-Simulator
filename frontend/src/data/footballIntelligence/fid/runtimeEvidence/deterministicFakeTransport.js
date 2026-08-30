import { deepFreeze } from "./contractSupport.js";

export function createDeterministicFakeTransport(configuration = {}) {
  const allowedOutcomes = ["RESULT", "FAILURE", "REJECTED", "TIMEOUT", "INTERRUPTION", "DISCONNECT", "CANCELLED", "MISSING"];
  if (!allowedOutcomes.includes(configuration.outcome ?? "RESULT")) throw new TypeError("UNSUPPORTED_FAKE_TRANSPORT_OUTCOME");
  let calls = 0;
  const submissions = [];
  return {
    get callCount() { return calls; },
    get submissions() { return Object.freeze([...submissions]); },
    async submit(submission) {
      calls += 1; submissions.push(submission);
      return deepFreeze({ transportClassification: "DETERMINISTIC_IN_MEMORY_FAKE", acceptedByFakeTransport: configuration.accepted !== false, governedOperationExecutionEstablished: false, operationalSuccessEstablished: false, externalReceiptEstablished: false, outcome: configuration.outcome ?? "RESULT", resultRef: configuration.resultRef ?? null, failureRef: configuration.failureRef ?? null, uncertaintyRef: configuration.uncertaintyRef ?? null, transactionRef: configuration.transactionRef ?? null, stagesClaimedReached: [...(configuration.stagesClaimedReached ?? [])], events: [...(configuration.events ?? [])], observations: [...(configuration.observations ?? [])] });
    },
  };
}

export function createDeterministicClock(values) {
  let index = 0; return Object.freeze({ next() { if (index >= values.length) throw new TypeError("DETERMINISTIC_CLOCK_EXHAUSTED"); return values[index++]; } });
}

export function createDeterministicIdentityProvider(prefix, count = 512) {
  let index = 0; return Object.freeze({ next(kind = "identity") { if (index >= count) throw new TypeError("DETERMINISTIC_IDENTITY_PROVIDER_EXHAUSTED"); index += 1; return `ref:${kind}:${prefix}:${String(index).padStart(3, "0")}`; } });
}

export function createDeterministicCancellation(cancelledAt = null) { return Object.freeze({ isCancelled(point) { return point === cancelledAt; } }); }
