#!/usr/bin/env python3
from __future__ import annotations
import json
from collections import defaultdict, Counter
from pathlib import Path

ROOT = Path("data/calibration/historical/v1")
EXP = Path("data/calibration/historical/expansion-2020-2021")

FILES = {
    "legacy_obs": ROOT/"observations-availability.jsonl",
    "legacy_snaps": ROOT/"historical-snap-counts-resolved.jsonl",
    "legacy_replacements": ROOT/"expected-replacement-identities-v1.jsonl",
    "legacy_publications": ROOT/"official-team-pregame-publications-r3.jsonl",
    "exp_obs": EXP/"availability"/"observations-availability.jsonl",
    "exp_snaps": EXP/"snap-counts"/"historical-snap-counts-resolved-v1.jsonl",
}

def load_jsonl(path):
    if not path.exists(): return []
    return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]

def pos_group(pos):
    p=(pos or "").upper()
    if p in {"C","G","T","OT","OG","OL"}: return "OL"
    if p in {"CB","S","DB","FS","SS"}: return "DB"
    if p in {"DE","DT","DL","NT"}: return "DL"
    if p in {"LB","ILB","OLB"}: return "LB"
    if p in {"HB","FB","RB"}: return "RB"
    return p or "UNKNOWN"

def snap_pct(row):
    g=pos_group(row.get("position"))
    if g in {"OL","RB","WR","TE","QB"}:
        return float(row.get("offense_pct") or 0)
    if g in {"DB","DL","LB"}:
        return float(row.get("defense_pct") or 0)
    return float(row.get("st_pct") or 0)

def treatment_events(observations):
    out=[]
    roster_context=0
    for obs in observations:
        ev=obs.get("evidence") or {}
        roster=(ev.get("rosterDepth") or {}).get("players") or []
        if roster: roster_context += 1
        avail=ev.get("availabilityImpact") or {}
        for p in avail.get("players") or []:
            status=(p.get("reportStatus") or "").upper()
            if status in {"OUT","DOUBTFUL"}:
                out.append({
                    "season":obs.get("season"),"week":obs.get("week"),
                    "team":obs.get("team"),"gameId":obs.get("gameId"),
                    "unavailablePlayerId":p.get("playerId"),
                    "position":p.get("position"),
                    "status":status,
                })
    return out, roster_context

def build_snap_index(rows):
    idx=defaultdict(list)
    for r in rows:
        if r.get("canonical_identity_resolved") is not True: continue
        pid=r.get("gsis_id")
        if not pid: continue
        idx[(r.get("season"),r.get("team"),pid)].append(r)
    return idx

def candidate_for(event, snap_rows, exact=True):
    season,week,team=event["season"],event["week"],event["team"]
    unavailable=event["unavailablePlayerId"]
    target_pos=(event.get("position") or "").upper()
    target_group=pos_group(target_pos)
    by_player=defaultdict(list)

    for r in snap_rows:
        if r.get("season") != season or r.get("team") != team: continue
        if not isinstance(r.get("week"), int) or r["week"] >= week: continue
        pid=r.get("gsis_id")
        if not pid or pid == unavailable or r.get("canonical_identity_resolved") is not True: continue
        rp=(r.get("position") or "").upper()
        if exact:
            if rp != target_pos: continue
        else:
            if pos_group(rp) != target_group: continue
        by_player[pid].append(r)

    ranked=[]
    for pid,rows in by_player.items():
        # Primary proxy: most recent prior-game participation percentage only.
        latest=max(rows,key=lambda x:x["week"])
        ranked.append((snap_pct(latest), latest["week"], pid, latest.get("player_name")))
    if not ranked: return None
    ranked.sort(reverse=True)
    pct,w,pid,name=ranked[0]
    return {"playerId":pid,"playerName":name,"priorWeek":w,"priorSnapPct":pct}

legacy_obs=load_jsonl(FILES["legacy_obs"])
legacy_snaps=load_jsonl(FILES["legacy_snaps"])
legacy_rep=load_jsonl(FILES["legacy_replacements"])
legacy_pubs=load_jsonl(FILES["legacy_publications"])
exp_obs=load_jsonl(FILES["exp_obs"])
exp_snaps=load_jsonl(FILES["exp_snaps"])

legacy_events, legacy_roster_context = treatment_events(legacy_obs)
exp_events, exp_roster_context = treatment_events(exp_obs)

strict_teamweeks=set()
for r in legacy_pubs:
    if (r.get("publicationType")=="DEPTH_CHART_RELEASE"
        and r.get("officialTeamDomain") is True
        and r.get("resolvedPregameSafe") is True
        and isinstance(r.get("resolvedWeek"),int)):
        strict_teamweeks.add((r.get("season"),r.get("team"),r.get("resolvedWeek")))

strict_labels=[
    r for r in legacy_rep
    if r.get("replacementPlayerId")
    and (r.get("season"),r.get("team"),r.get("week")) in strict_teamweeks
]

def coverage(events,snaps,exact):
    resolved=0; by_season=Counter(); by_position=Counter()
    for e in events:
        c=candidate_for(e,snaps,exact=exact)
        if c:
            resolved += 1
            by_season[e["season"]] += 1
            by_position[pos_group(e.get("position"))] += 1
    return {
        "treatmentEvents":len(events),
        "resolvedProxyCandidates":resolved,
        "coverageRate":resolved/len(events) if events else 0,
        "resolvedBySeason":dict(sorted(by_season.items())),
        "resolvedByPosition":dict(sorted(by_position.items())),
    }

def validate(labels,snaps,exact):
    estimable=matches=0
    mismatches=[]
    for r in labels:
        e={
          "season":r.get("season"),"week":r.get("week"),"team":r.get("team"),
          "unavailablePlayerId":r.get("unavailablePlayerId"),
          "position":r.get("position")
        }
        c=candidate_for(e,snaps,exact=exact)
        if not c: continue
        estimable += 1
        ok=c["playerId"]==r.get("replacementPlayerId")
        matches += int(ok)
        if not ok and len(mismatches)<20:
            mismatches.append({
              "season":e["season"],"week":e["week"],"team":e["team"],
              "position":e["position"],
              "officialReplacementPlayerId":r.get("replacementPlayerId"),
              "proxyReplacementPlayerId":c["playerId"],
              "proxyPriorWeek":c["priorWeek"],
              "proxyPriorSnapPct":c["priorSnapPct"],
            })
    return {
      "strictOfficialLabels":len(labels),
      "estimableLabels":estimable,
      "matchingReplacementIdentityCount":matches,
      "identityAgreementRate":matches/estimable if estimable else 0,
      "sampleMismatches":mismatches,
    }

exact_cov_legacy=coverage(legacy_events,legacy_snaps,True)
group_cov_legacy=coverage(legacy_events,legacy_snaps,False)
exact_val=validate(strict_labels,legacy_snaps,True)
group_val=validate(strict_labels,legacy_snaps,False)

exp_available=bool(exp_obs and exp_snaps)
exact_cov_exp=coverage(exp_events,exp_snaps,True) if exp_available else None
group_cov_exp=coverage(exp_events,exp_snaps,False) if exp_available else None

# Predeclared validation threshold: prior-usage alone must agree with strict official
# replacement labels at >=60% to be allowed as a standalone expected-replacement proxy.
PRIMARY_MIN_AGREEMENT=0.60
PRIMARY_MIN_LABEL_COVERAGE=0.75
label_coverage=(exact_val["estimableLabels"]/exact_val["strictOfficialLabels"]
                if exact_val["strictOfficialLabels"] else 0)

standalone_ready=(
    exact_val["identityAgreementRate"] >= PRIMARY_MIN_AGREEMENT
    and label_coverage >= PRIMARY_MIN_LABEL_COVERAGE
)

decision=("PRIOR_GAME_USAGE_PROXY_VALIDATED_FOR_STANDALONE_EXPECTED_REPLACEMENT"
          if standalone_ready else
          "PRIOR_GAME_USAGE_PROXY_NOT_VALIDATED_AS_STANDALONE_EXPECTED_REPLACEMENT")

report={
 "contractVersion":"FIE-NFL-PRIOR-USAGE-EXPECTED-REPLACEMENT-PROXY-VALIDATION-2D2D-R3-1.0.0",
 "sprint":"2D.2D-R3","mode":"READ_ONLY","decision":decision,
 "nestedCanonicalSignalAudit":{
   "legacyObservationCount":len(legacy_obs),
   "legacyObservationsWithRosterContext":legacy_roster_context,
   "legacyTreatmentEventsOutOrDoubtful":len(legacy_events),
   "expansionAvailabilityJoinedArtifactPresent":FILES["exp_obs"].exists(),
   "expansionTreatmentEventsOutOrDoubtful":len(exp_events),
   "note":"Corrects R2 top-level-only signal-shape assumption by reading evidence.availabilityImpact and evidence.rosterDepth."
 },
 "primaryProxy":{
   "definition":"EXACT_POSITION_HIGHEST_MOST_RECENT_PRIOR_GAME_SNAP_PCT",
   "targetGameSnapEvidenceUsed":False,
   "futureSnapEvidenceUsed":False,
   "legacyCoverage":exact_cov_legacy,
   "strictOfficialValidation":exact_val,
   "strictLabelEstimableCoverageRate":label_coverage,
   "minimumAgreementRequired":PRIMARY_MIN_AGREEMENT,
   "minimumStrictLabelCoverageRequired":PRIMARY_MIN_LABEL_COVERAGE,
 },
 "secondaryDiagnosticOnly":{
   "definition":"POSITION_GROUP_HIGHEST_MOST_RECENT_PRIOR_GAME_SNAP_PCT",
   "legacyCoverage":group_cov_legacy,
   "strictOfficialValidation":group_val,
   "expansionCoverage":group_cov_exp,
   "notAuthorizedForSelection":True,
 },
 "expansion":{
   "availableForAudit":exp_available,
   "exactPositionCoverage":exact_cov_exp,
 },
 "interpretation":{
   "priorUsageMayProvideRoleContext":True,
   "priorUsageMayDefineStandaloneExpectedReplacement":standalone_ready,
   "strictOfficialLabelsRemainValidationEvidence":True,
   "targetWeekUntimestampedDepthChartUsed":False,
   "targetGamePostgameSnapsUsed":False,
 },
 "safeguards":{
   "canonicalReplacementArtifactMutated":False,
   "calibrationExecuted":False,
   "learnedWeightsCreated":False,
   "playerImpactTeamStrengthMode":"SHADOW_ONLY",
   "playerImpactTeamStrengthAuthorized":False,
   "numericDelta":None,"adjustedTeamStrength":None,
   "teamStrengthMutated":False,"decisionModelMutated":False,"pickemMutated":False
 }
}
print(json.dumps(report,indent=2))
