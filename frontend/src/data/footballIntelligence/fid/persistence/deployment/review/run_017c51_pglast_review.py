"""Offline pglast review for Sprint 17C.51; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
root=Path(__file__).parent
path=root/'017c51a_fid_atomic_function_acl_failed_remediation_guarded_reconciliation.sql'
sql=path.read_text(encoding='utf-8')
complete=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql))))
plpgsql=json.loads(parser.parse_plpgsql_json(sql))
visible=re.search(r'^SELECT r\.\* FROM[\s\S]*?;$',sql,re.M).group(0)
visible_types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(visible))))
dynamic='SELECT count(*) FROM fid.fid_persistence_migrations WHERE migration_id COLLATE "C" LIKE \'%014%\' OR migration_sequence=14 OR \'fid-014-identifier-issuance-transaction\'=ANY(applied_migration_ids)'
dynamic_types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(dynamic))))
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"file":path.name,"completeStatementTypes":complete,"plpgsqlParsed":bool(plpgsql),"transactionStatementTypes":[item for item in complete if item=="TransactionStmt"],"visibleSelectStatementTypes":visible_types,"dynamicMetadataStatementTypes":dynamic_types,"visibleSelects":len(re.findall(r'^SELECT r\.\* FROM',sql,re.M)),"sqlExecuted":False},indent=2))
