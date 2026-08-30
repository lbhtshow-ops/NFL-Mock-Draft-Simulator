#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re
from collections import Counter,defaultdict
from pathlib import Path
POSITION_MODEL_PATTERNS=[re.compile(r'([A-Za-z]+)PlayerEvaluation',re.I),re.compile(r'([A-Za-z]+)PositionModel',re.I),re.compile(r'([A-Za-z]+)PlayerModel',re.I)]
ASOF_TERMS=("asof","as_of","evidenceasof","historical","effectiveat","observedat")
def load_jsonl(path):
 p=Path(path)
 if not p.exists():return []
 rows=[]
 for line in p.read_text(encoding='utf-8').splitlines():
  if line.strip():
   try:rows.append(json.loads(line))
   except:pass
 return rows
def inventory_player_evaluation(repo):
 roots=[repo/'frontend/src/engines/playerEvaluation',repo/'frontend/src/data/footballIntelligence'];files=[]
 for root in roots:
  if root.exists():files += [p for p in root.rglob('*') if p.is_file() and p.suffix in {'.js','.mjs','.ts','.json'}]
 position=set();terms=set();registries=[];services=[];canonical=[]
 for p in files:
  text=p.read_text(encoding='utf-8',errors='ignore');low=text.lower()
  for term in ASOF_TERMS:
   if term in low:terms.add(term)
  if 'registry' in p.name.lower():registries.append(str(p.relative_to(repo)))
  if 'service' in p.name.lower() or 'engine' in p.name.lower():services.append(str(p.relative_to(repo)))
  if 'canonical' in p.name.lower():canonical.append(str(p.relative_to(repo)))
  for pat in POSITION_MODEL_PATTERNS:
   for m in pat.finditer(text):
    token=m.group(1).upper()
    if 1<len(token)<12:position.add(token)
 return {'evaluationDomainPresent':any(r.exists() for r in roots),'fileCount':len(files),'canonicalFiles':canonical,'registryFiles':registries,'serviceFiles':services,'positionModelTokens':sorted(position),'historicalAsOfTermsObserved':sorted(terms),'historicalAsOfCapabilityObserved':bool(terms.intersection({'asof','as_of','evidenceasof','effectiveat','observedat'}))}
def availability_targets(observations):
 unique=set();status=Counter();positions=Counter();by_season=defaultdict(lambda:{'observations':0,'reportedPlayers':0,'uniquePlayers':set(),'statuses':Counter(),'positions':Counter()});total=0;unavailable=0
 for obs in observations:
  s=by_season[str(obs.get('season'))];s['observations']+=1;impact=(obs.get('evidence') or {}).get('availabilityImpact')
  if not impact or not isinstance(impact.get('players'),list):continue
  for p in impact['players']:
   pid=p.get('playerId');pos=p.get('position') or 'UNKNOWN';st=(p.get('reportStatus') or 'UNKNOWN').upper();total+=1;status[st]+=1;positions[pos]+=1;s['reportedPlayers']+=1;s['statuses'][st]+=1;s['positions'][pos]+=1
   if pid:unique.add(pid);s['uniquePlayers'].add(pid)
   if st in {'OUT','DOUBTFUL'}:unavailable+=1
 formatted={k:{'observations':v['observations'],'reportedPlayers':v['reportedPlayers'],'uniquePlayers':len(v['uniquePlayers']),'statuses':dict(v['statuses']),'positions':dict(v['positions'])} for k,v in by_season.items()}
 return {'observationCount':len(observations),'reportedPlayerStates':total,'uniqueReportedPlayers':len(unique),'unavailableCandidateStates':unavailable,'statusCounts':dict(status),'positionCounts':dict(positions),'bySeason':formatted}
def candidate_artifacts(repo):
 patterns={'caliber':['*caliber*.json','*caliber*.jsonl','*player*evaluation*.json','*player*evaluation*.jsonl'],'depthChart':['*depth*chart*.csv','*depth*chart*.json','*depth*chart*.jsonl','*depth*chart*.parquet'],'snapCounts':['*snap*count*.csv','*snap*count*.json','*snap*count*.jsonl','*snap*count*.parquet'],'starterEvidence':['*starter*.json','*starter*.jsonl','*starter*.csv'],'replacementMappings':['*replacement*mapping*.json','*replacement*mapping*.jsonl']};result={};roots=[repo/'frontend/data',repo/'data',repo/'frontend/src/data']
 for key,pats in patterns.items():
  found=[]
  for root in roots:
   if not root.exists():continue
   for pat in pats:found += [str(p.relative_to(repo)) for p in root.rglob(pat)]
  result[key]=sorted(set(found))
 return result
def build_readiness(eval_inv,targets,artifacts):
 caliber='BLOCKED' if not eval_inv['evaluationDomainPresent'] or not eval_inv['historicalAsOfCapabilityObserved'] else ('PARTIAL' if len(artifacts['caliber'])==0 else 'READY');explicit=sum(len(artifacts[k]) for k in ('depthChart','snapCounts','starterEvidence','replacementMappings'));replacement='BLOCKED' if targets['unavailableCandidateStates']>0 and explicit==0 else ('PARTIAL' if explicit else 'UNKNOWN');return {'caliberReadiness':caliber,'replacementReadiness':replacement,'historicalCaliberGenerationAuthorized':caliber=='READY','replacementGenerationAuthorized':False,'realCaliberReplacementJoinAuthorized':False,'calibrationAuthorized':False}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repository-root',default='..');ap.add_argument('--observations',default='data/calibration/historical/v1/observations-availability.jsonl');ap.add_argument('--output',default='data/calibration/historical/v1/player-evidence-coverage-audit.json');a=ap.parse_args();frontend=Path.cwd();repo=Path(a.repository_root).resolve();
 if not (repo/'frontend').exists():repo=frontend.parent.resolve()
 op=frontend/a.observations if not Path(a.observations).is_absolute() else Path(a.observations);observations=load_jsonl(op);evaluation=inventory_player_evaluation(repo);targets=availability_targets(observations);artifacts=candidate_artifacts(repo);readiness=build_readiness(evaluation,targets,artifacts);report={'contractVersion':'FIE-NFL-HISTORICAL-PLAYER-EVIDENCE-COVERAGE-AUDIT-REPORT-1.0.0','repositoryRoot':str(repo),'observationsPath':str(op),'canonicalPlayerEvaluationInventory':evaluation,'availabilityTargetPopulation':targets,'candidateHistoricalEvidenceArtifacts':artifacts,'readiness':readiness,'interpretation':{'historicalAsOfCapabilityObservedMeans':'Static audit found explicit as-of/effective-time vocabulary in canonical player evaluation code; it does not itself prove full historical data coverage.','caliberArtifactsMeaning':'Existing data artifacts only; no current ratings are backfilled.','replacementEvidenceMeaning':'Asset presence only; each mapping still requires explicit evidence qualification.'},'datasetMutated':False,'generationExecuted':False,'replacementInferenceExecuted':False,'calibrationExecuted':False,'learnedWeights':None};out=Path(a.output);out=frontend/out if not out.is_absolute() else out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
