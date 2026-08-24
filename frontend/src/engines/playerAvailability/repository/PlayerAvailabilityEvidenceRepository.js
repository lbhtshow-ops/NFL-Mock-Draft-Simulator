export const PLAYER_AVAILABILITY_EVIDENCE_REPOSITORY_PORT_VERSION =
  "FIE-PLAYER-AVAILABILITY-EVIDENCE-REPOSITORY-PORT-1.0.0";

export const PLAYER_AVAILABILITY_REPOSITORY_REQUIRED_METHODS = Object.freeze([
  "getPlayerAvailabilitySnapshot",
  "getPlayerAvailabilityHistory",
]);

export function validatePlayerAvailabilityEvidenceRepository(repository) {
  const errors = [];
  if (!repository || typeof repository !== "object") {
    return { valid: false, errors: ["REPOSITORY_REQUIRED"] };
  }
  for (const method of PLAYER_AVAILABILITY_REPOSITORY_REQUIRED_METHODS) {
    if (typeof repository[method] !== "function") {
      errors.push(`MISSING_METHOD:${method}`);
    }
  }
  const forbiddenMutationMethods = [
    "create",
    "update",
    "upsert",
    "delete",
    "archive",
    "persist",
    "save",
  ];
  for (const method of forbiddenMutationMethods) {
    if (typeof repository[method] === "function") {
      errors.push(`MUTATION_METHOD_NOT_ALLOWED:${method}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function isPlayerAvailabilityEvidenceRepository(repository) {
  return validatePlayerAvailabilityEvidenceRepository(repository).valid;
}

export default {
  validatePlayerAvailabilityEvidenceRepository,
  isPlayerAvailabilityEvidenceRepository,
};
