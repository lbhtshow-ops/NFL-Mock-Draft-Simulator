#!/usr/bin/env python3
from __future__ import annotations
import json
from collections import defaultdict
from pathlib import Path

MIN_AGREEMENT = 0.60
MIN_COVERAGE = 0.75
ROOT = Path("data/calibration/historical/v1")

def load_jsonl(path):
    p=Path(path)
    if not p.exists(): return []
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]

def norm_pos(v):
    p=(str(v).strip().upper() if v else "UNKNOWN")
    if p in {"C","G","OG","T","OT","OL"}: return "OL"
    if p in {"CB","S","FS","SS","DB"}: return "DB"
    if p in {"DE","DT","NT","DL"}: return "DL"
    if p in {"LB","ILB","OLB"}: return "LB"
    if p in {"RB","HB","FB"}: return "RB"
    return p

def exact_pos(v):
    return str(v).strip().upper() if v else "UNKNOWN"

def snap_pct(r):
    g=norm_pos(r.get("position"))
    if g in {"QB","RB","WR","TE","OL"}: return float(r.get("offense_pct") or 0)
    if g in {"DB","DL","LB"}: return float(r.get("defense_pct") or 0)
    return float(r.get("st_pct") or 0)

def strict_teamweeks(rows):
    return {
      (r.get("season"),r.get("team"),r.get("resolvedWeek"))
      for r in rows
      if r.get("publicationType")=="DEPTH_CHART_RELEASE"
      and r.get("officialTeamDomain") is True
      and r.get("resolvedPregameSafe") is True
      and isinstance(r.get("resolvedWeek"),int)
    }

def depth_index(rows):
    idx=defaultdict(list)
    for r in rows:
        team=r.get("club_code") or r.get("team")
        if r.get("season") is not None and r.get("week") is not None and team:
            idx[(r.get("season"),r.get("week"),team)].append(r)
    return idx

def observation_map(rows):
    out={}
    for r in rows:
        key=(r.get("season"),r.get("week"),r.get("team"))
        if None not in key: out[key]=r
    return out

def roster_ids(obs):
    if not obs: return set()
    players=((obs.get("evidence") or {}).get("rosterDepth") or {}).get("players") or []
    out=set()
    for p in players:
        pid=p.get("playerId") or p.get("gsis_id")
        if not pid: continue
        status=str(p.get("status") or p.get("rosterStatus") or "").upper()
        if status in {"IR","RESERVE","SUSPENDED","PUP","NFI","OUT"}: continue
        out.add(pid)
    return out

def usage_candidates(event,snaps):
    by=defaultdict(list)
    for r in snaps:
        if r.get("canonical_identity_resolved") is not True: continue
        if r.get("season")!=event["season"] or r.get("team")!=event["team"]: continue
        if not isinstance(r.get("week"),int) or r["week"]>=event["week"]: continue
        pid=r.get("gsis_id")
        if not pid or pid==event["unavailablePlayerId"]: continue
        if norm_pos(r.get("position"))!=norm_pos(event["position"]): continue
        by[pid].append(r)
    out={}
    for pid,rows in by.items():
        latest=max(rows,key=lambda x:x["week"])
        out[pid]={
          "priorSnapPct":snap_pct(latest),
          "priorWeek":latest["week"],
          "exactPosition":exact_pos(latest.get("position"))==exact_pos(event["position"])
        }
    return out

def depth_candidates(event,idx):
    rows=idx.get((event["season"],event["week"],event["team"]),[])
    unavailable=[r for r in rows if r.get("gsis_id")==event["unavailablePlayerId"]]
    udepth=min([int(r.get("depth_team")) for r in unavailable if str(r.get("depth_team") or "").isdigit()] or [999])
    utype=next((r.get("depth_position") for r in unavailable if r.get("depth_position")),None)
    out={}
    for r in rows:
        pid=r.get("gsis_id")
        if not pid or pid==event["unavailablePlayerId"]: continue
        if norm_pos(r.get("position"))!=norm_pos(event["position"]): continue
        rank=int(r.get("depth_team")) if str(r.get("depth_team") or "").isdigit() else 999
        item={
          "depthRank":rank,
          "sameDepthPosition":bool(utype and r.get("depth_position")==utype),
          "exactPosition":exact_pos(r.get("position"))==exact_pos(event["position"]),
          "slotDistance":abs(rank-udep) if rank<999 and udepth<999 else 999
        }
        if pid not in out or rank<out[pid]["depthRank"]: out[pid]=item
    return out

def rank_tuple(c,variant):
    if variant=="ROLE_FIRST":
        return (int(c["sameDepthPosition"]),int(c["exactPosition"]),-c["slotDistance"],-c["depthRank"],c["priorSnapPct"])
    if variant=="BALANCED":
        return (int(c["exactPosition"]),int(c["sameDepthPosition"]),int(c["rosterEligible"]),c["priorSnapPct"],-c["slotDistance"])
    return (int(c["exactPosition"]),c["priorSnapPct"],int(c["sameDepthPosition"]),-c["slotDistance"])

def resolve(event,snaps,didx,omap,variant):
    usage=usage_candidates(event,snaps)
    depth=depth_candidates(event,didx)
    roster=roster_ids(omap.get((event["season"],event["week"],event["team"])))
    ids=set(usage)|set(depth)
    if not ids: return None
    cs=[]
    for pid in ids:
        u=usage.get(pid,{})
        d=depth.get(pid,{})
        c={
          "playerId":pid,
          "exactPosition":bool(u.get("exactPosition") or d.get("exactPosition")),
          "sameDepthPosition":bool(d.get("sameDepthPosition")),
          "depthRank":d.get("depthRank",999),
          "slotDistance":d.get("slotDistance",999),
          "priorSnapPct":float(u.get("priorSnapPct") or 0),
          "priorWeek":u.get("priorWeek"),
          "rosterEligible":(pid in roster) if roster else True,
          "hasDepthContext":pid in depth,
          "hasPriorUsage":pid in usage
        }
        c["rank"]=rank_tuple(c,variant)
        cs.append(c)
    cs.sort(key=lambda x:x["rank"],reverse=True)
    return cs[0],len(cs)

def evaluate(labels,snaps,didx,omap,variant):
    estimable=matches=0
    misses=[]
    for r in labels:
        e={"season":r.get("season"),"week":r.get("week"),"team":r.get("team"),
           "unavailablePlayerId":r.get("unavailablePlayerId"),"position":r.get("position")}
        result=resolve(e,snaps,didx,omap,variant)
        if not result: continue
        winner,count=result
        estimable+=1
        ok=winner["playerId"]==r.get("replacementPlayerId")
        matches+=int(ok)
        if not ok and len(misses)<20:
            misses.append({**e,"officialReplacementPlayerId":r.get("replacementPlayerId"),
                           "predictedReplacementPlayerId":winner["playerId"],
                           "candidateCount":count,
                           "winnerEvidence":{k:winner[k] for k in
                             ["exactPosition","sameDepthPosition","depthRank","slotDistance",
                              "priorSnapPct","priorWeek","rosterEligible",
                              "hasDepthContext","hasPriorUsage"]}})
    coverage=estimable/len(labels) if labels else 0
    agreement=matches/estimable if estimable else 0
    return {"strictOfficialLabels":len(labels),"estimableLabels":estimable,
            "strictLabelEstimableCoverageRate":coverage,
            "matchingReplacementIdentityCount":matches,
            "identityAgreementRate":agreement,
            "passesFrozenGate":coverage>=MIN_COVERAGE and agreement>=MIN_AGREEMENT,
            "sampleMismatches":misses}

obs=load_jsonl(ROOT/"observations-availability.jsonl")
snaps=load_jsonl(ROOT/"historical-snap-counts-resolved.jsonl")
depth=load_jsonl(ROOT/"historical-depth-charts.jsonl")
repls=load_jsonl(ROOT/"expected-replacement-identities-v1.jsonl")
pubs=load_jsonl(ROOT/"official-team-pregame-publications-r3.jsonl")

required=[ROOT/"observations-availability.jsonl",ROOT/"historical-snap-counts-resolved.jsonl",
          ROOT/"historical-depth-charts.jsonl",ROOT/"expected-replacement-identities-v1.jsonl",
          ROOT/"official-team-pregame-publications-r3.jsonl"]
missing=[str(p) for p in required if not p.exists()]
if missing:
    print(json.dumps({"contractVersion":"FIE-NFL-MULTI-SIGNAL-REPLACEMENT-SUCCESSION-VALIDATION-2D2E-1.0.0",
                      "status":"INPUTS_MISSING","missingInputs":missing},indent=2))
    raise SystemExit(2)

strict=strict_teamweeks(pubs)
labels=[r for r in repls if r.get("replacementPlayerId") and
        (r.get("season"),r.get("team"),r.get("week")) in strict]

didx=depth_index(depth); omap=observation_map(obs)
variants={v:evaluate(labels,snaps,didx,omap,v) for v in ["ROLE_FIRST","BALANCED","USAGE_FIRST"]}
passing=[v for v,x in variants.items() if x["passesFrozenGate"]]
best=max(variants,key=lambda v:(variants[v]["passesFrozenGate"],
                               variants[v]["identityAgreementRate"],
                               variants[v]["strictLabelEstimableCoverageRate"])) if variants else None

decision=("MULTI_SIGNAL_REPLACEMENT_SUCCESSION_VALIDATED_FOR_SHADOW_CORPUS_CONSTRUCTION"
          if passing else "MULTI_SIGNAL_REPLACEMENT_SUCCESSION_NOT_YET_VALIDATED")

print(json.dumps({
 "contractVersion":"FIE-NFL-MULTI-SIGNAL-REPLACEMENT-SUCCESSION-VALIDATION-2D2E-1.0.0",
 "sprint":"2D.2E","mode":"READ_ONLY_FROZEN_TRUTH_SET_VALIDATION","decision":decision,
 "frozenGate":{"minimumIdentityAgreementRate":MIN_AGREEMENT,
               "minimumStrictLabelEstimableCoverageRate":MIN_COVERAGE,
               "strictOfficialTruthSetSize":len(labels),
               "thresholdsChangedAfterOutcomeInspection":False},
 "evidenceSemantics":{"strictOfficialPregameRoleEvidence":"TRUTH_SET_ONLY",
                      "priorGameUsage":"CONTEXTUAL_CANDIDATE_FEATURE",
                      "targetWeekDepthRole":"CONTEXTUAL_CANDIDATE_FEATURE_NOT_TEMPORAL_PROOF",
                      "rosterContext":"CANDIDATE_ELIGIBILITY_CONTEXT",
                      "availability":"TREATMENT_PLAYER_CONTEXT_NOT_REPLACEMENT_PROOF",
                      "targetGameSnaps":"PROHIBITED","futureSnaps":"PROHIBITED"},
 "variants":variants,"passingVariants":passing,"bestVariant":best,
 "nextAction":{"shadowCorpusConstructionAuthorized":bool(passing),
               "replacementCaliberAttachmentAuthorized":bool(passing),
               "productionReplacementResolverAuthorized":False,
               "productionPlayerImpactCalibrationAuthorized":False,
               "teamStrengthPromotionAuthorized":False,
               "pickemHandoffAuthorized":False},
 "safeguards":{"strictOfficialLabelsUsedForTraining":False,
               "strictOfficialLabelsUsedForValidationOnly":True,
               "learnedResolverWeightsCreated":False,
               "targetGameSnapEvidenceUsed":False,"futureSnapEvidenceUsed":False,
               "untimestampedDepthRoleClaimedAsPregameProof":False,
               "fuzzyMatchingUsed":False,"canonicalReplacementArtifactMutated":False,
               "calibrationExecuted":False,"learnedPlayerImpactWeightsCreated":False,
               "playerImpactTeamStrengthMode":"SHADOW_ONLY",
               "playerImpactTeamStrengthAuthorized":False,
               "numericDelta":None,"adjustedTeamStrength":None,
               "teamStrengthMutated":False,"decisionModelMutated":False,"pickemMutated":False}
},indent=2))
