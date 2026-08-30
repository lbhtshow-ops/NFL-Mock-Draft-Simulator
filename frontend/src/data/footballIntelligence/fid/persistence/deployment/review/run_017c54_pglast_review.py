"""Parser-only Sprint 17C.54 review; never connects to or executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
root=Path(__file__).parent
files=[root/'017c54a_fid_atomic_function_acl_corrected_owner_preserving_remediation.sql',root/'017c46a_fid_atomic_function_acl_corrected_preflight.sql',root/'017c47b_fid_atomic_function_acl_owner_preserving_reconciliation.sql',root/'017c47c_fid_atomic_function_acl_owner_preserving_post_verification.sql']
parsed={}
for path in files:
 sql=path.read_text(encoding='utf-8')
 parsed[path.name]={"statementTypes":sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql)))),"plpgsqlParsed":bool(parser.parse_plpgsql_json(sql))}
 for body in re.findall(r'DO\s+\$[^$]+\$([\s\S]*?)\$[^$]+\$;',sql,re.I):
  assert parser.parse_plpgsql_json('DO $review$'+body+'$review$;')
 for statement in re.findall(r"EXECUTE pg_catalog\.format\('((?:''|[^'])*)'",sql):
  dynamic=statement.replace("''", "'").replace('%s','fid.fid_persistence_migrations').replace('%L',"'%014%'",1).replace('%L',"'fid-014-identifier-issuance-transaction'",1)
  parser.parse_sql_json(dynamic)
 for visible in re.findall(r'^SELECT r\.\* FROM[\s\S]*?;$',sql,re.M): parser.parse_sql_json(visible)
assert parser.parse_sql_json("SELECT pg_catalog.jsonb_build_object('a',1,'b',2)")
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"files":parsed,"postgresql17SemanticReview":"independent static review passed; PostgreSQL 18 grammar used only as syntax evidence","sqlExecuted":False,"databaseConnected":False},indent=2))
