#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re
from pathlib import Path

CANDIDATES=[
 "src/engines/PlayerEvaluationEngine.js",
 "src/engines/playerEvaluation/nfl/CanonicalNFLPlayerEvaluationService.js",
 "src/engines/playerEvaluation/nfl/NFLPlayerEvaluationGovernance.js",
 "src/engines/playerEvaluation/caliber/CanonicalPlayerCaliberService.js",
 "src/engines/playerEvaluation/caliber/adapters/NFLPlayerCaliberAdapter.js"
]
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--frontend-root",default=".");ap.add_argument("--output",required=True);a=ap.parse_args()
 root=Path(a.frontend_root).resolve();files=[];combined=""
 for rel in CANDIDATES:
  p=root/rel;exists=p.exists();txt=p.read_text(encoding="utf-8",errors="replace") if exists else ""
  combined+="\n"+txt
  files.append({"path":rel,"exists":exists,"bytes":len(txt),"containsAsOf":bool(re.search(r"\basOf\b",txt)),
   "containsHistorical":bool(re.search(r"historical",txt,re.I)),"containsEvidenceBundle":bool(re.search(r"evidenceBundle|evidence_bundle",txt,re.I))})
 result={
  "contractVersion":"FIE-NFL-CANONICAL-PLAYER-EVALUATOR-READINESS-AUDIT-1.0.0","sprint":"9D.1C2B2C5",
  "candidateFiles":files,"canonicalEvaluatorFilesPresent":sum(1 for x in files if x["exists"]),
  "asOfSupportDetected":bool(re.search(r"\basOf\b",combined)),
  "historicalInputSupportDetected":bool(re.search(r"historical",combined,re.I) and re.search(r"evidenceBundle|asOf",combined,re.I)),
  "currentStateRiskDetected":not bool(re.search(r"\basOf\b",combined)),
  "historicalAdapterRequired":not bool(re.search(r"\basOf\b",combined)),
  "competingEvaluatorAuthorized":False,
  "recommendedNextStep":"BUILD_CANONICAL_HISTORICAL_INPUT_ADAPTER" if not bool(re.search(r"\basOf\b",combined)) else "REVIEW_EXISTING_ASOF_PATH",
  "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None}
 Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_text(json.dumps(result,indent=2),encoding="utf-8");print(json.dumps(result,indent=2))
if __name__=="__main__":main()
