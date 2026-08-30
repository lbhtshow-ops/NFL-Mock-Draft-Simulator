export const VALID_017C33_TARGET_BINDING = Object.freeze({
  organization: "Lunch Break Hot Take",
  projectName: "LBHT FID Persistence Test",
  projectId: "ahmorpzcaapvoymiqlkv",
  region: "us-east-1",
  branch: "main",
  database: "Primary Database",
  sqlRole: "postgres",
  governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST",
});

export function evaluate017c33TargetBinding(binding) {
  const failures = Object.entries(VALID_017C33_TARGET_BINDING)
    .filter(([key, expected]) => binding?.[key] !== expected)
    .map(([key]) => `invalid_${key}`);
  return Object.freeze({ accepted: failures.length === 0, failures: Object.freeze(failures) });
}

export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C33_SCENARIOS = Object.freeze(
  Object.keys(VALID_017C33_TARGET_BINDING).map((key) => Object.freeze({
    id: `wrong-${key}`,
    binding: Object.freeze({ ...VALID_017C33_TARGET_BINDING, [key]: `WRONG_${key}` }),
    expectedFailure: `invalid_${key}`,
  })),
);

export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C33_SCENARIOS;
