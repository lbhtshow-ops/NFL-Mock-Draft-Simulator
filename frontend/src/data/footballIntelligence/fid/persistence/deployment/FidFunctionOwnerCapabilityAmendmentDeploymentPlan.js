export const FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DEPLOYMENT_PLAN = Object.freeze({
  status: "REVIEW_ONLY_NOT_AUTHORIZED",
  orderedSteps: Object.freeze(["independently verify target", "run read-only preflight", "review sanitized result", "obtain separate execution authorization", "execute entire amendment as one unit", "run post-verification", "use reconciliation if commit result is unknown"]),
  stopConditions: Object.freeze(["target mismatch", "preflight not passed", "authorization absent", "SQL hash mismatch", "any assertion failure", "unknown commit state"]),
  unknownCommitRule: "Do not retry. Run only the read-only reconciliation and obtain a new governed decision.",
  migration014Rule: "Migration 014 remains separate, unapplied, and unauthorized.",
});

export default FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_DEPLOYMENT_PLAN;
