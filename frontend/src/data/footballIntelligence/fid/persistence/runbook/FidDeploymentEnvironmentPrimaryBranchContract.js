const immutable = (value) => Object.freeze(value);

export const FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT = "FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT";
export const FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT_VERSION = "1.0.0";

export function createFidDeploymentEnvironmentPrimaryBranch(input = {}) {
  const governedEnvironment = input.governedEnvironment ?? {};
  const platformBranchRole = input.platformBranchRole ?? {};
  const exactTargetAuthorization = input.exactTargetAuthorization ?? null;
  const checks = immutable({
    dedicatedTest: governedEnvironment.dedicatedTest === true,
    nonProduction: governedEnvironment.nonProduction === true,
    productionProhibited: governedEnvironment.productionProhibited === true,
    governedClassification: governedEnvironment.classification === "DEDICATED_NON_PRODUCTION_TEST",
    primaryBranch: platformBranchRole.primaryBranch === true,
    notPreviewBranch: platformBranchRole.previewBranch === false,
    platformRole: platformBranchRole.classification === "PRODUCTION_PRIMARY_BRANCH",
    topologyExplicit: platformBranchRole.platformLabelDefinesBranchTopology === true,
    classificationIndependent: platformBranchRole.platformLabelDoesNotOverrideGovernedProjectClassification === true,
    exactAuthorizationPresent: exactTargetAuthorization?.exactMatchOnly === true,
  });
  const errors = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => `${key.toUpperCase()}_REQUIRED`);
  return immutable({
    contract: FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT,
    contractVersion: FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT_VERSION,
    governedEnvironment: immutable({ ...governedEnvironment }),
    platformBranchRole: immutable({ ...platformBranchRole }),
    exactAuthorizationRequired: true,
    platformProductionLabelIgnored: false,
    platformProductionLabelAloneDefinesLbhtProduction: false,
    checks,
    validation: immutable({ valid: errors.length === 0, errors: immutable(errors) }),
  });
}

export const validateFidDeploymentEnvironmentPrimaryBranch = (input) => createFidDeploymentEnvironmentPrimaryBranch(input).validation;

export default immutable({
  FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT,
  FID_DEPLOYMENT_ENVIRONMENT_PRIMARY_BRANCH_CONTRACT_VERSION,
  createFidDeploymentEnvironmentPrimaryBranch,
  validateFidDeploymentEnvironmentPrimaryBranch,
});
