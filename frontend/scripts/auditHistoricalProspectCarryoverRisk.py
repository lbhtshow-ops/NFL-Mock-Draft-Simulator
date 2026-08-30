#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re
from pathlib import Path
FILES=[
"src/engines/playerEvaluation/ProspectCarryoverEvaluationEngine.js",
"src/engines/playerEvaluation/positionModels/RunningBackEvaluationModel.js",
]
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--frontend-root",default=".");ap.add_argument("--output",required=True);a=ap.parse_args()
 root=Path(a.frontend_root).resolve();rows=[]
 for rel in FILES:
  p=root/rel;txt=p.read_text(encoding="utf-8",errors="replace") if p.exists() else ""
  rows.append({"path":rel,"exists":p.exists(),"bytes":len(txt),
   "importsProspectRegistry":bool(re.search(r"resolveProspect|registry/prospect",txt,re.I)),
   "importsFootballPlayerRecords":bool(re.search(r"footballPlayerRecords|database/players",txt,re.I)),
   "containsAsOf":bool(re.search(r"\basOf\b",txt)),
   "containsHistorical":bool(re.search(r"historical",txt,re.I))})
 risk=any(x["importsProspectRegistry"] or x["importsFootballPlayerRecords"] for x in rows)
 report={"contractVersion":"FIE-NFL-HISTORICAL-PROSPECT-CARRYOVER-RISK-AUDIT-1.0.0","sprint":"9D.1C2B2C8",
 "files":rows,"presentStateOrUndatedProspectDependencyRisk":risk,
 "historicalProspectCarryoverAuthorized":False,
 "recommendedPolicy":"BLOCK_PROSPECT_CARRYOVER_UNLESS_DATED_HISTORICAL_PROSPECT_EVIDENCE_IS_EXPLICITLY_QUALIFIED",
 "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps(report,indent=2))
if __name__=="__main__":main()
