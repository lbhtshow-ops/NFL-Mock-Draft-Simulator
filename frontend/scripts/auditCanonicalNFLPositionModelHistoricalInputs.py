#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re
from pathlib import Path

MODELS=[
 "QuarterbackEvaluationModel.js","RunningBackEvaluationModel.js",
 "ReceiverEvaluationModel.js","OffensiveLineEvaluationModel.js",
 "DefensiveLineEvaluationModel.js","LinebackerEvaluationModel.js",
 "SecondaryEvaluationModel.js","SpecialistEvaluationModel.js"
]

PATTERNS={
 "context_usage":r"context\?*\.?usageProfile|context\.usageProfile",
 "context_performance":r"context\?*\.?performanceProfile|context\.performanceProfile",
 "context_recognition":r"context\?*\.?recognition|context\?*\.?recognitionSummary|context\.recognition",
 "context_career":r"context\?*\.?career|context\.career",
 "player_identity":r"player\?*\.?identity|player\.identity",
 "player_position":r"player\?*\.?position|player\.position",
 "player_roster":r"player\?*\.?roster|player\.roster",
 "player_context":r"context",
 "prospect_carryover":r"ProspectCarryover|prospectCarryover",
}

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--frontend-root",default=".")
 ap.add_argument("--output",required=True)
 a=ap.parse_args()
 root=Path(a.frontend_root).resolve()
 base=root/"src/engines/playerEvaluation/positionModels"
 results=[]
 for name in MODELS:
  p=base/name
  txt=p.read_text(encoding="utf-8",errors="replace") if p.exists() else ""
  matches={k:bool(re.search(v,txt,re.I)) for k,v in PATTERNS.items()}
  imports=re.findall(r'from\s+["\']([^"\']+)["\']',txt)
  exports=re.findall(r'export function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)',txt)
  results.append({
   "model":name,"exists":p.exists(),"bytes":len(txt),"imports":imports,
   "exportedFunctions":[{"name":n,"params":params.strip()} for n,params in exports],
   "signals":matches,
   "containsAsOf":bool(re.search(r"\basOf\b",txt)),
   "containsGlobalDataImport":any("data/" in x or "generated" in x.lower() for x in imports),
  })
 report={
  "contractVersion":"FIE-NFL-POSITION-MODEL-HISTORICAL-INPUT-AUDIT-1.0.0",
  "sprint":"9D.1C2B2C7",
  "models":results,
  "missingModels":[r["model"] for r in results if not r["exists"]],
  "modelsWithAsOf":[r["model"] for r in results if r["containsAsOf"]],
  "modelsWithGlobalDataImports":[r["model"] for r in results if r["containsGlobalDataImport"]],
  "historicalProviderScoringAuthorized":False,
  "recommendedNextStep":"BUILD_POSITION_MODEL_HISTORICAL_CONTEXT_ADAPTER",
  "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
 }
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
 print(json.dumps(report,indent=2))

if __name__=="__main__":main()
