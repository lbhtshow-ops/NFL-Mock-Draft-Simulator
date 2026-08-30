import {
  PERSISTENCE_DELETE_MODES,
  PERSISTENCE_LIFECYCLE_ACTIONS,
  PERSISTENCE_OPERATION_STATUSES,
  PERSISTENCE_OPERATION_TYPES,
} from "../researchRepositoryPersistenceConstants.js";
import {
  createPersistenceRequest,
  createPersistenceResult,
  getRecordContractValidator,
} from "../ResearchRepositoryPersistenceContract.js";
import {
  getSupabaseResearchIdColumn,
  getSupabaseResearchTable,
  mapResearchRecordToSupabaseRow,
  mapSupabaseRowToResearchRecord,
  mapSupabaseRowToStorageMetadata,
} from "../supabase/researchRepositorySupabaseMappers.js";

const ADAPTER_NAME = "PostgresResearchRepositoryAdapter";
const ADAPTER_VERSION = "POSTGRES-RESEARCH-REPOSITORY-ADAPTER-1.0.0";
const SAFE_FIELD = /^[A-Za-z][A-Za-z0-9_.]*$/;
const COLUMN_FIELDS = Object.freeze({
  contract: "contract_name", contractVersion: "contract_version", schemaVersion: "schema_version",
  recordVersion: "record_version", isArchived: "is_archived", isDeleted: "is_deleted",
  createdAt: "created_at", updatedAt: "updated_at",
});
const SELECT_COLUMNS = "contract_name, contract_version, schema_version, payload, record_version, is_archived, is_deleted, created_at, updated_at";

function quoteIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value || "")) throw new Error(`Unsafe SQL identifier: ${value}`);
  return `"${value}"`;
}
function storage(request) {
  const table = getSupabaseResearchTable(request.recordType);
  const idColumn = getSupabaseResearchIdColumn(request.recordType);
  if (!table || !idColumn) throw new Error(`Unsupported Research Repository record type: ${request.recordType}`);
  return { table, idColumn };
}
function prepare(input, operation) {
  const request = createPersistenceRequest(input);
  if (request.operation !== operation || !request.validation.valid) return { request, error: "INVALID_PERSISTENCE_REQUEST" };
  if (request.write?.validateBeforeWrite && request.record) {
    const validation = getRecordContractValidator(request.recordType)?.(request.record);
    if (!validation?.valid) return { request, error: "RECORD_VALIDATION_FAILED", validation };
  }
  return { request, error: null };
}
function failure(request, code, message, details = null, status = PERSISTENCE_OPERATION_STATUSES.FAILED) {
  return createPersistenceResult({ requestId: request?.requestId ?? null, operation: request?.operation ?? null,
    recordType: request?.recordType ?? null, recordId: request?.recordId ?? null, status,
    failure: { code, message, retryable: null, details }, audit: { storageAdapter: ADAPTER_NAME } });
}
function success(request, row = null, metadata = null) {
  const record = row ? mapSupabaseRowToResearchRecord(row) : null;
  const storageMeta = row ? mapSupabaseRowToStorageMetadata(row) : null;
  return createPersistenceResult({ requestId: request.requestId, operation: request.operation,
    recordType: request.recordType, recordId: request.recordId, status: PERSISTENCE_OPERATION_STATUSES.SUCCESS,
    record, audit: { storageAdapter: ADAPTER_NAME, storageVersion: storageMeta?.recordVersion ?? null },
    metadata: { warnings: [], tags: [], notes: metadata?.notes ?? null, ...(metadata || {}), ...(storageMeta ? { storage: storageMeta } : {}) } });
}
function pgError(request, error) {
  const code = String(error?.code || "POSTGRES_STORAGE_ERROR");
  const status = code === "23505" ? PERSISTENCE_OPERATION_STATUSES.CONFLICT
    : code === "42501" ? PERSISTENCE_OPERATION_STATUSES.RESTRICTED
    : PERSISTENCE_OPERATION_STATUSES.FAILED;
  return failure(request, code, error?.message || "PostgreSQL storage operation failed.",
    { constraint: error?.constraint ?? null, table: error?.table ?? null }, status);
}
function rowValues(row, idColumn) {
  return [row[idColumn], row.contract_name, row.contract_version, row.schema_version, row.payload];
}
function safePayloadPath(field) {
  if (!SAFE_FIELD.test(field || "")) return null;
  if (Object.hasOwn(COLUMN_FIELDS, field)) return { sql: quoteIdentifier(COLUMN_FIELDS[field]), json: false };
  return { sql: `payload #>> '{${field.split(".").join(",")}}'`, json: true };
}

export function createPostgresResearchRepositoryAdapter({ pool, options = {} } = {}) {
  if (!pool || typeof pool.query !== "function") return null;
  const capabilities = { allowSoftDelete: options.allowSoftDelete ?? true, allowArchive: options.allowArchive ?? true,
    allowHardDelete: options.allowHardDelete ?? false };
  async function safely(input, operation, execute) {
    const prepared = prepare(input, operation);
    if (prepared.error) return failure(prepared.request, prepared.error, "The persistence request was rejected before PostgreSQL execution.", prepared.validation ?? null,
      prepared.error === "RECORD_VALIDATION_FAILED" ? PERSISTENCE_OPERATION_STATUSES.VALIDATION_FAILED : PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST);
    try { return await execute(prepared.request, storage(prepared.request)); }
    catch (error) { return pgError(prepared.request, error); }
  }
  return Object.freeze({
    create(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.CREATE, async (request, target) => {
      const row = mapResearchRecordToSupabaseRow(request.recordType, request.record);
      const t=quoteIdentifier(target.table), id=quoteIdentifier(target.idColumn);
      const q=`insert into public.${t} (${id},contract_name,contract_version,schema_version,payload) values ($1,$2,$3,$4,$5::jsonb) returning ${SELECT_COLUMNS}`;
      const r=await pool.query(q,rowValues(row,target.idColumn)); return success(request,r.rows[0]);
    });},
    read(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.READ, async (request,target)=>{
      const t=quoteIdentifier(target.table), id=quoteIdentifier(target.idColumn);
      const clauses=[`${id}=$1`]; if(request.query?.includeDeleted!==true) clauses.push("is_deleted=false"); if(request.query?.includeArchived===false) clauses.push("is_archived=false");
      const r=await pool.query(`select ${SELECT_COLUMNS} from public.${t} where ${clauses.join(" and ")} limit 1`,[request.recordId]);
      return r.rows[0] ? success(request,r.rows[0]) : failure(request,"RECORD_NOT_FOUND","The requested record was not found.",null,PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);
    });},
    update(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.UPDATE, async (request,target)=>{
      const row=mapResearchRecordToSupabaseRow(request.recordType,request.record), t=quoteIdentifier(target.table), id=quoteIdentifier(target.idColumn);
      const params=rowValues(row,target.idColumn); let versionClause="";
      if(request.write?.expectedVersion!=null){params.push(request.write.expectedVersion);versionClause=` and record_version=$${params.length}`;}
      const q=`update public.${t} set contract_name=$2,contract_version=$3,schema_version=$4,payload=$5::jsonb,record_version=record_version+1 where ${id}=$1${versionClause} returning ${SELECT_COLUMNS}`;
      const r=await pool.query(q,params); return r.rows[0]?success(request,r.rows[0]):failure(request,"RECORD_NOT_FOUND_OR_VERSION_CONFLICT","Update matched no record.",null,PERSISTENCE_OPERATION_STATUSES.CONFLICT);
    });},
    upsert(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.UPSERT, async (request,target)=>{
      const row=mapResearchRecordToSupabaseRow(request.recordType,request.record), t=quoteIdentifier(target.table), id=quoteIdentifier(target.idColumn);
      const q=`insert into public.${t} (${id},contract_name,contract_version,schema_version,payload) values ($1,$2,$3,$4,$5::jsonb) on conflict (${id}) do update set contract_name=excluded.contract_name,contract_version=excluded.contract_version,schema_version=excluded.schema_version,payload=excluded.payload,record_version=public.${t}.record_version+1 returning ${SELECT_COLUMNS}`;
      const r=await pool.query(q,rowValues(row,target.idColumn)); return success(request,r.rows[0]);
    });},
    list(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.LIST, async (request,target)=>{
      const t=quoteIdentifier(target.table), params=[], clauses=[];
      if(request.query?.includeDeleted!==true) clauses.push("is_deleted=false"); if(request.query?.includeArchived===false) clauses.push("is_archived=false");
      for(const f of request.query?.filters||[]){const p=safePayloadPath(f.field);if(!p) return failure(request,"INVALID_FILTER_FIELD","Unsafe filter field.",null,PERSISTENCE_OPERATION_STATUSES.INVALID_REQUEST); const vals=(f.operator||"").toUpperCase().startsWith("IN")?f.values:[f.value]; params.push(vals); clauses.push(`${p.sql} = any($${params.length}::text[])`);}
      let q=`select ${SELECT_COLUMNS} from public.${t}${clauses.length?` where ${clauses.join(" and ")}`:""}`;
      if(request.query?.limit!=null){params.push(request.query.limit);q+=` limit $${params.length}`;} if(request.query?.offset!=null){params.push(request.query.offset);q+=` offset $${params.length}`;}
      const r=await pool.query(q,params); const records=r.rows.map(mapSupabaseRowToResearchRecord).filter(Boolean);
      return createPersistenceResult({requestId:request.requestId,operation:request.operation,recordType:request.recordType,recordId:request.recordId,status:PERSISTENCE_OPERATION_STATUSES.SUCCESS,records,page:{count:records.length,total:null,limit:request.query?.limit??null,offset:request.query?.offset??null,hasMore:null},audit:{storageAdapter:ADAPTER_NAME}});
    });},
    exists(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.EXISTS, async (request,target)=>{const t=quoteIdentifier(target.table),id=quoteIdentifier(target.idColumn);const r=await pool.query(`select 1 from public.${t} where ${id}=$1 and is_deleted=false limit 1`,[request.recordId]);return success(request,null,{exists:Boolean(r.rowCount)});});},
    archive(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.ARCHIVE, async (request,target)=>{if(!capabilities.allowArchive||request.lifecycle?.action!==PERSISTENCE_LIFECYCLE_ACTIONS.ARCHIVE)return failure(request,"ARCHIVE_RESTRICTED","Archive is restricted.",null,PERSISTENCE_OPERATION_STATUSES.RESTRICTED);const t=quoteIdentifier(target.table),id=quoteIdentifier(target.idColumn);const r=await pool.query(`update public.${t} set is_archived=true where ${id}=$1 returning ${SELECT_COLUMNS}`,[request.recordId]);return r.rows[0]?success(request,r.rows[0]):failure(request,"RECORD_NOT_FOUND","Record not found.",null,PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);});},
    delete(input) { return safely(input, PERSISTENCE_OPERATION_TYPES.DELETE, async (request,target)=>{const t=quoteIdentifier(target.table),id=quoteIdentifier(target.idColumn),mode=request.lifecycle?.deleteMode;if(mode===PERSISTENCE_DELETE_MODES.HARD_DELETE){if(!capabilities.allowHardDelete)return failure(request,"HARD_DELETE_RESTRICTED","Hard delete is restricted.",null,PERSISTENCE_OPERATION_STATUSES.RESTRICTED);const r=await pool.query(`delete from public.${t} where ${id}=$1 returning ${SELECT_COLUMNS}`,[request.recordId]);return r.rows[0]?success(request,r.rows[0]):failure(request,"RECORD_NOT_FOUND","Record not found.",null,PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);}if(!capabilities.allowSoftDelete)return failure(request,"SOFT_DELETE_RESTRICTED","Soft delete is restricted.",null,PERSISTENCE_OPERATION_STATUSES.RESTRICTED);const r=await pool.query(`update public.${t} set is_deleted=true where ${id}=$1 returning ${SELECT_COLUMNS}`,[request.recordId]);return r.rows[0]?success(request,r.rows[0]):failure(request,"RECORD_NOT_FOUND","Record not found.",null,PERSISTENCE_OPERATION_STATUSES.NOT_FOUND);});},
    adapterName: ADAPTER_NAME, adapterVersion: ADAPTER_VERSION,
  });
}
export default Object.freeze({ createPostgresResearchRepositoryAdapter });
