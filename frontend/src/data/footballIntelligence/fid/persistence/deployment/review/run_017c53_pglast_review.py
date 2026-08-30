"""Parser-backed independent review for Sprint 17C.53; never executes PostgreSQL."""
import json,re
from pathlib import Path
import pglast
from pglast import parser
root=Path(__file__).parent
path=root/'017c52a_fid_atomic_function_acl_failed_remediation_bounded_jsonb_reconciliation.sql'
sql=path.read_text(encoding='utf-8')
def calls(text,marker):
 out=[];start=0
 while (pos:=text.find(marker,start))>=0:
  i=pos+len(marker);depth=1;quoted=False
  while depth:
   c=text[i]
   if quoted:
    if c=="'" and i+1<len(text) and text[i+1]=="'": i+=2;continue
    if c=="'": quoted=False
   elif c=="'": quoted=True
   elif c=='(': depth+=1
   elif c==')': depth-=1
   i+=1
  out.append(text[pos:i]);start=i
 return out
builders=calls(sql,'pg_catalog.jsonb_build_object(')
def func_arg_count(call):
 tree=json.loads(parser.parse_sql_json('SELECT '+call))
 found=[]
 def walk(value):
  if isinstance(value,dict):
   if 'FuncCall' in value:
    node=value['FuncCall'];names=[item.get('String',{}).get('sval') for item in node.get('funcname',[])]
    if names[-1:]==['jsonb_build_object']: found.append(len(node.get('args',[])))
   for child in value.values(): walk(child)
  elif isinstance(value,list):
   for child in value: walk(child)
 walk(tree)
 return found[0]
ast_counts=[func_arg_count(call) for call in builders]
complete_types=sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(sql))))
plpgsql=json.loads(parser.parse_plpgsql_json(sql))
visible=re.search(r'^SELECT r\.\* FROM[\s\S]*?;$',sql,re.M).group(0)
dynamic='SELECT count(*) FROM fid.fid_persistence_migrations WHERE migration_id COLLATE "C" LIKE \'%014%\' OR migration_sequence=14 OR \'fid-014-identifier-issuance-transaction\'=ANY(applied_migration_ids)'
print(json.dumps({"tool":f"pglast {pglast.__version__}","grammar":parser.get_postgresql_version(),"file":path.name,"completeStatementTypes":complete_types,"plpgsqlParsed":bool(plpgsql),"builderAstArgumentCounts":ast_counts,"builderAstPairCounts":[n//2 for n in ast_counts],"allFunctionCallsWithin100":max(ast_counts)<=100,"visibleSelectStatementTypes":sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(visible)))),"dynamicMetadataStatementTypes":sorted(set(re.findall(r'"([A-Za-z]+Stmt)"',parser.parse_sql_json(dynamic)))),"sqlExecuted":False},indent=2))
