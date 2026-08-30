#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re
from pathlib import Path
FILES=[
"src/engines/PlayerRosterEvaluationEngine.js",
"src/engines/PlayerUsageIndex.js",
"src/engines/PlayerPerformanceIndex.js",
"src/engines/playerEvaluation/PlayerRecognitionEngine.js",
"src/engines/playerEvaluation/positionModels/QuarterbackEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/RunningBackEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/ReceiverEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/OffensiveLineEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/DefensiveLineEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/LinebackerEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/SecondaryEvaluationModel.js",
"src/engines/playerEvaluation/positionModels/SpecialistEvaluationModel.js",
]
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--frontend-root",default=".");ap.add_argument("--output",required=True);a=ap.parse_args()
 root=Path(a.frontend_root).resolve();rows=[]
 for rel in FILES:
  p=root/rel;txt=p.read_text(encoding="utf-8",errors="replace") if p.exists() else ""
  imports=re.findall(r'from\s+["\']([^"\']+)["\']',txt)
  rows.append({"path":rel,"exists":p.exists(),"bytes":len(txt),"imports":imports,
   "containsAsOf":bool(re.search(r"\basOf\b",txt)),"acceptsContext":bool(re.search(r"\bcontext\b",txt)),
   "referencesUsageIndex":"PlayerUsageIndex" in txt,"referencesPerformanceIndex":"PlayerPerformanceIndex" in txt,
   "referencesRecognition":"Recognition" in txt or "recognition" in txt})
 result={"contractVersion":"FIE-NFL-HISTORICAL-PROVIDER-DEPENDENCY-AUDIT-1.0.0","sprint":"9D.1C2B2C6",
 "files":rows,"missingFiles":[x["path"] for x in rows if not x["exists"]],
 "filesWithAsOf":[x["path"] for x in rows if x["containsAsOf"]],
 "filesAcceptingContext":[x["path"] for x in rows if x["acceptsContext"]],
 "providerImplementationAuthorized":False,
 "recommendedNextStep":"IMPLEMENT_HISTORICAL_PROVIDER_FROM_AUDITED_DEPENDENCY_GRAPH",
 "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_text(json.dumps(result,indent=2),encoding="utf-8");print(json.dumps(result,indent=2))
if __name__=="__main__":main()
