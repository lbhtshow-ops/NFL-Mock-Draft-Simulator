import supabaseConstants, {
  SUPABASE_RESEARCH_DEFAULT_SELECT_COLUMNS,
  SUPABASE_RESEARCH_ID_COLUMNS,
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME,
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_VERSION,
  SUPABASE_RESEARCH_RESTRICTED_OPERATIONS,
  SUPABASE_RESEARCH_SUPPORTED_OPERATIONS,
  SUPABASE_RESEARCH_TABLES,
} from "./researchRepositorySupabaseConstants.js";
import supabaseMappers, {
  cloneSupabaseResearchValue,
  getSupabasePersistenceErrorStatus,
  getSupabaseResearchIdColumn,
  getSupabaseResearchTable,
  mapResearchRecordToSupabaseRow,
  mapSupabaseResponseToPersistenceResult,
  mapSupabaseRowToResearchRecord,
  mapSupabaseRowToStorageMetadata,
} from "./researchRepositorySupabaseMappers.js";
import supabaseAdapter, {
  createSupabaseResearchRepositoryAdapter,
  isSupabaseResearchRepositoryAdapter,
  validateSupabaseResearchRepositoryConfiguration,
} from "./createSupabaseResearchRepositoryAdapter.js";

export {
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_NAME,
  SUPABASE_RESEARCH_REPOSITORY_ADAPTER_VERSION,
  SUPABASE_RESEARCH_TABLES,
  SUPABASE_RESEARCH_ID_COLUMNS,
  SUPABASE_RESEARCH_SUPPORTED_OPERATIONS,
  SUPABASE_RESEARCH_RESTRICTED_OPERATIONS,
  SUPABASE_RESEARCH_DEFAULT_SELECT_COLUMNS,
  cloneSupabaseResearchValue,
  getSupabaseResearchTable,
  getSupabaseResearchIdColumn,
  mapResearchRecordToSupabaseRow,
  mapSupabaseRowToResearchRecord,
  mapSupabaseRowToStorageMetadata,
  getSupabasePersistenceErrorStatus,
  mapSupabaseResponseToPersistenceResult,
  createSupabaseResearchRepositoryAdapter,
  validateSupabaseResearchRepositoryConfiguration,
  isSupabaseResearchRepositoryAdapter,
};

export default Object.freeze({ ...supabaseConstants, ...supabaseMappers, ...supabaseAdapter });
