import architectureApi from "./FidPersistenceArchitectureSpecification.js";
import repositoryContractApi from "./FidPersistenceRepositoryContract.js";
import inMemoryRepositoryApi from "./InMemoryFidPersistenceRepository.js";
import durableConstantsApi from "./durablePersistenceConstants.js";
import durablePortApi from "./DurableFidPersistencePortContract.js";
import durableCapabilityApi from "./DurableFidRepositoryCapabilityContract.js";
import durableConformanceApi from "./DurableFidPersistenceConformance.js";
import supabaseSchemaConstantsApi from "./supabasePersistenceSchemaConstants.js";
import supabaseSchemaApi from "./SupabaseFidPersistenceSchemaSpecification.js";
import supabaseMigrationApi from "./SupabaseFidMigrationSpecification.js";
import supabaseSecurityApi from "./SupabaseFidSecuritySpecification.js";
import supabaseSchemaConformanceApi from "./SupabaseFidSchemaConformance.js";
import mapperConstantsApi from "./fidPersistenceMapperConstants.js";
import mapperRowContractApi from "./FidCanonicalPersistenceRowContract.js";
import canonicalMapperApi from "./FidCanonicalPersistenceMapper.js";
import auxiliaryMapperApi from "./FidPersistenceAuxiliaryRowMapper.js";
import mapperConformanceApi from "./FidPersistenceMapperConformance.js";
import adapterConstantsApi from "./supabaseDurableAdapterConstants.js";
import clientBoundaryApi from "./SupabaseCompatibleClientBoundaryContract.js";
import adapterCommandApi from "./SupabaseFidAdapterCommandBuilder.js";
import adapterResultApi from "./SupabaseFidAdapterResultMapper.js";
import adapterApi from "./SupabaseFidDurableRepositoryAdapter.js";
import adapterConformanceApi from "./SupabaseFidAdapterConformance.js";
import runtimeConfigurationConstantsApi from "./supabaseRuntimeConfigurationConstants.js";
import runtimeConfigurationApi from "./SupabaseRuntimeConfigurationContract.js";
import credentialReferenceApi from "./SupabaseCredentialReferenceContract.js";
import clientFactoryBoundaryApi from "./SupabaseClientFactoryBoundaryContract.js";
import runtimeCompositionApi from "./SupabaseRuntimeCompositionPlanner.js";
import runtimeSanitizerApi from "./SupabaseRuntimeConfigurationSanitizer.js";
import runtimeConformanceApi from "./SupabaseRuntimeConfigurationConformance.js";
import clientFactoryConstantsApi from "./supabaseClientFactoryConstants.js";
import clientDescriptorApi from "./SupabaseClientDescriptorContract.js";
import clientConstructionResultApi from "./SupabaseClientConstructionResultContract.js";
import clientCreationPolicyApi from "./SupabaseClientCreationPolicy.js";
import concreteClientFactoryApi from "./SupabaseClientFactory.js";
import concreteClientFactoryConformanceApi from "./SupabaseClientFactoryConformance.js";
import repositoryRuntimeConstantsApi from "./supabaseRepositoryRuntimeConstants.js";
import repositoryRuntimeRequestApi from "./SupabaseRepositoryRuntimeCompositionRequestContract.js";
import repositoryRuntimeDescriptorApi from "./SupabaseRepositoryRuntimeDescriptorContract.js";
import repositoryRuntimeResultApi from "./SupabaseRepositoryRuntimeCompositionResultContract.js";
import repositoryRuntimePolicyApi from "./SupabaseRepositoryRuntimePolicy.js";
import repositoryRuntimeComposerApi from "./SupabaseRepositoryRuntimeComposer.js";
import repositoryRuntimeAccessApi from "./SupabaseRepositoryRuntimeAccessBoundary.js";
import repositoryRuntimeConformanceApi from "./SupabaseRepositoryRuntimeConformance.js";
import authoritativeSchemaConstantsApi from "./supabaseFidAuthoritativeSchemaConstants.js";
import executableSchemaContractsApi from "./SupabaseFidExecutableSchemaContracts.js";
import authoritativeSchemaInstanceApi from "./SupabaseFidAuthoritativeSchemaInstance.js";
import executableSchemaConformanceApi from "./SupabaseFidExecutableSchemaConformance.js";
import postgresqlDeterminismApi from "./SupabaseFidPostgresqlDeterminismSpecification.js";
import postgresqlDeterminismConformanceApi from "./SupabaseFidPostgresqlDeterminismConformance.js";
import rowMaterializationApi from "./SupabaseFidRowMaterializationSpecification.js";
import rowMaterializationConformanceApi from "./SupabaseFidRowMaterializationConformance.js";
import executionSemanticsApi from "./SupabaseFidExecutionSemanticsSpecification.js";
import executionSemanticsConformanceApi from "./SupabaseFidExecutionSemanticsConformance.js";
import deploymentApi from "./deployment/index.js";
import reviewApi from "./review/index.js";
import correctionApi from "./correction/index.js";
import runbookApi from "./runbook/index.js";

export * from "./FidPersistenceArchitectureSpecification.js";
export * from "./FidPersistenceRepositoryContract.js";
export * from "./InMemoryFidPersistenceRepository.js";
export * from "./durablePersistenceConstants.js";
export * from "./DurableFidPersistencePortContract.js";
export * from "./DurableFidRepositoryCapabilityContract.js";
export * from "./DurableFidPersistenceConformance.js";
export * from "./supabasePersistenceSchemaConstants.js";
export * from "./SupabaseFidPersistenceSchemaSpecification.js";
export * from "./SupabaseFidMigrationSpecification.js";
export * from "./SupabaseFidSecuritySpecification.js";
export * from "./SupabaseFidSchemaConformance.js";
export * from "./fidPersistenceMapperConstants.js";
export * from "./FidCanonicalPersistenceRowContract.js";
export * from "./FidCanonicalPersistenceMapper.js";
export * from "./FidPersistenceAuxiliaryRowMapper.js";
export * from "./FidPersistenceMapperConformance.js";
export * from "./supabaseDurableAdapterConstants.js";
export * from "./SupabaseCompatibleClientBoundaryContract.js";
export * from "./SupabaseFidAdapterCommandBuilder.js";
export * from "./SupabaseFidAdapterResultMapper.js";
export * from "./SupabaseFidDurableRepositoryAdapter.js";
export * from "./SupabaseFidAdapterConformance.js";
export * from "./supabaseRuntimeConfigurationConstants.js";
export * from "./SupabaseRuntimeConfigurationContract.js";
export * from "./SupabaseCredentialReferenceContract.js";
export * from "./SupabaseClientFactoryBoundaryContract.js";
export * from "./SupabaseRuntimeCompositionPlanner.js";
export * from "./SupabaseRuntimeConfigurationSanitizer.js";
export * from "./SupabaseRuntimeConfigurationConformance.js";
export * from "./supabaseClientFactoryConstants.js";
export * from "./SupabaseClientDescriptorContract.js";
export * from "./SupabaseClientConstructionResultContract.js";
export * from "./SupabaseClientCreationPolicy.js";
export * from "./SupabaseClientFactory.js";
export * from "./SupabaseClientFactoryConformance.js";
export * from "./supabaseRepositoryRuntimeConstants.js";
export * from "./SupabaseRepositoryRuntimeCompositionRequestContract.js";
export * from "./SupabaseRepositoryRuntimeDescriptorContract.js";
export * from "./SupabaseRepositoryRuntimeCompositionResultContract.js";
export * from "./SupabaseRepositoryRuntimePolicy.js";
export * from "./SupabaseRepositoryRuntimeComposer.js";
export * from "./SupabaseRepositoryRuntimeAccessBoundary.js";
export * from "./SupabaseRepositoryRuntimeConformance.js";
export * from "./supabaseFidAuthoritativeSchemaConstants.js";
export * from "./SupabaseFidExecutableSchemaContracts.js";
export * from "./SupabaseFidAuthoritativeSchemaInstance.js";
export * from "./SupabaseFidExecutableSchemaConformance.js";
export * from "./SupabaseFidPostgresqlDeterminismSpecification.js";
export * from "./SupabaseFidPostgresqlDeterminismConformance.js";
export * from "./SupabaseFidRowMaterializationSpecification.js";
export * from "./SupabaseFidRowMaterializationConformance.js";
export * from "./SupabaseFidExecutionSemanticsSpecification.js";
export * from "./SupabaseFidExecutionSemanticsConformance.js";
export * from "./runbook/index.js";
export * from "./deployment/index.js";
export * from "./review/index.js";
export * from "./correction/index.js";

export default Object.freeze({
  ...architectureApi,
  ...repositoryContractApi,
  ...inMemoryRepositoryApi,
  ...durableConstantsApi,
  ...durablePortApi,
  ...durableCapabilityApi,
  ...durableConformanceApi,
  ...supabaseSchemaConstantsApi,
  ...supabaseSchemaApi,
  ...supabaseMigrationApi,
  ...supabaseSecurityApi,
  ...supabaseSchemaConformanceApi,
  ...mapperConstantsApi,
  ...mapperRowContractApi,
  ...canonicalMapperApi,
  ...auxiliaryMapperApi,
  ...mapperConformanceApi,
  ...adapterConstantsApi,
  ...clientBoundaryApi,
  ...adapterCommandApi,
  ...adapterResultApi,
  ...adapterApi,
  ...adapterConformanceApi,
  ...runtimeConfigurationConstantsApi,
  ...runtimeConfigurationApi,
  ...credentialReferenceApi,
  ...clientFactoryBoundaryApi,
  ...runtimeCompositionApi,
  ...runtimeSanitizerApi,
  ...runtimeConformanceApi,
  ...clientFactoryConstantsApi,
  ...clientDescriptorApi,
  ...clientConstructionResultApi,
  ...clientCreationPolicyApi,
  ...concreteClientFactoryApi,
  ...concreteClientFactoryConformanceApi,
  ...repositoryRuntimeConstantsApi,
  ...repositoryRuntimeRequestApi,
  ...repositoryRuntimeDescriptorApi,
  ...repositoryRuntimeResultApi,
  ...repositoryRuntimePolicyApi,
  ...repositoryRuntimeComposerApi,
  ...repositoryRuntimeAccessApi,
  ...repositoryRuntimeConformanceApi,
  ...authoritativeSchemaConstantsApi,
  ...executableSchemaContractsApi,
  ...authoritativeSchemaInstanceApi,
  ...executableSchemaConformanceApi,
  ...postgresqlDeterminismApi,
  ...postgresqlDeterminismConformanceApi,
  ...rowMaterializationApi,
  ...rowMaterializationConformanceApi,
  ...executionSemanticsApi,
  ...executionSemanticsConformanceApi,
  ...deploymentApi,
  ...reviewApi,
  ...correctionApi,
  ...runbookApi,
});
