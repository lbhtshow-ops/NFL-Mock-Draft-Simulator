#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re
from pathlib import Path

ENGINE="src/engines/PlayerRosterEvaluationEngine.js"
FIELDS={
 "statusScore":"getStatusScore",
 "experienceScore":"getExperienceScore",
 "usageScore":"getUsageScore",
 "productionScore":"getProductionScore",
 "recognitionScore":"getRecognitionScore",
}
def extract_function(src,name):
 m=re.search(rf"function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{",src)
 if not m:return None
 i=m.end();depth=1
 while i<len(src) and depth:
  if src[i]=="{":depth+=1
  elif src[i]=="}":depth-=1
  i+=1
 return src[m.start():i] if depth==0 else None

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--frontend-root",default=".")
 ap.add_argument("--output",required=True)
 a=ap.parse_args()
 root=Path(a.frontend_root).resolve();p=root/ENGINE
 src=p.read_text(encoding="utf-8",errors="replace") if p.exists() else ""
 projections=[]
 for field,fn in FIELDS.items():
  body=extract_function(src,fn)
  projections.append({
   "contextField":field,"canonicalSourceFunction":fn,
   "functionFound":body is not None,
   "bytes":len(body or ""),
   "referencesCurrentUsageIndex":"getPlayerUsageProfile" in (body or ""),
   "referencesCurrentPerformanceIndex":"getPlayerPerformanceProfile" in (body or ""),
   "referencesCurrentRecognition":"getPlayerRecognitionSummary" in (body or ""),
   "referencesPlayerStatus":"getPlayerStatus" in (body or ""),
   "referencesPlayerExperience":"getPlayerExperience" in (body or ""),
   "formulaCaptured":body is not None,
  })
 report={
  "contractVersion":"FIE-NFL-HISTORICAL-CANONICAL-SCORE-PROJECTION-READINESS-AUDIT-1.0.0",
  "sprint":"9D.1C2B2C8","engineExists":p.exists(),
  "projections":projections,
  "allCanonicalProjectionFunctionsFound":all(x["functionFound"] for x in projections),
  "historicalScoreProjectionImplementationAuthorized":False,
  "controlledPositionModelExecutionAuthorized":False,
  "recommendedNextStep":"BUILD_HISTORICAL_SCORE_PROJECTIONS_FROM_CANONICAL_FUNCTIONS",
  "datasetMutated":False,"calibrationExecuted":False,"learnedWeights":None
 }
 Path(a.output).parent.mkdir(parents=True,exist_ok=True)
 Path(a.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
 print(json.dumps(report,indent=2))
if __name__=="__main__":main()
