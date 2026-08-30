"""Parser-only Sprint 17C.56 review; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
path=Path(__file__).parent/'017c56a_fid_atomic_function_acl_uncertain_remediation_commit_state_reconciliation.sql'
sql=path.read_text(encoding='utf-8')
complete=parser.parse_sql_json(sql)
plpgsql=parser.parse_plpgsql_json(sql)
visible=re.search(r'^SELECT r\.\* FROM[\s\S]*?;$',sql,re.M).group(0)
dynamic='SELECT count(*) FROM fid.fid_persistence_migrations WHERE migration_id COLLATE "C" LIKE \'%014%\' OR migration_sequence=14 OR \'fid-014-identifier-issuance-transaction\'=ANY(applied_migration_ids)'
builders=[]
for match in re.finditer(r'pg_catalog\.jsonb_build_object\(',sql):
 i=match.end();depth=1;quoted=False
 while depth:
  c=sql[i]
  if quoted:
   if c=="'" and i+1<len(sql) and sql[i+1]=="'": i+=2;continue
   if c=="'": quoted=False
  elif c=="'": quoted=True
  elif c=='(': depth+=1
  elif c==')': depth-=1
  i+=1
 call=sql[match.start():i];tree=json.loads(parser.parse_sql_json('SELECT '+call));args=[]
 def walk(v):
  if isinstance(v,dict):
   if 'FuncCall' in v and v['FuncCall'].get('funcname',[])[-1].get('String',{}).get('sval')=='jsonb_build_object': args.append(len(v['FuncCall'].get('args',[])))
   for child in v.values(): walk(child)
  elif isinstance(v,list):
   for child in v: walk(child)
 walk(tree);builders.append(args[0])
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"completeParsed":bool(complete),"plpgsqlParsed":bool(plpgsql),"visibleParsed":bool(parser.parse_sql_json(visible)),"dynamicMetadataParsed":bool(parser.parse_sql_json(dynamic)),"builderArgumentCounts":builders,"within100":max(builders)<=100,"postgresql17SemanticsReviewedSeparately":True,"sqlExecuted":False},indent=2))
