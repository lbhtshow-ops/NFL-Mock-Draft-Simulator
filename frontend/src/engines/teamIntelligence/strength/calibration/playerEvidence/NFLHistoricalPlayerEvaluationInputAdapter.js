
export const NFL_HISTORICAL_PLAYER_EVALUATION_INPUT_ADAPTER_VERSION =
  "FIE-NFL-HISTORICAL-PLAYER-EVALUATION-INPUT-ADAPTER-1.0.0";

const finite = (v) => typeof v === "number" && Number.isFinite(v);
const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
const resolve = (row, keys) => { for (const k of keys) if (row?.[k] != null) return row[k]; return null; };
const sum = (rows, keys) => rows.reduce((t,r)=>{ for (const k of keys){ const n=Number(r?.[k]); if(Number.isFinite(n)) return t+n; } return t;},0);
const max = (rows, keys) => rows.reduce((m,r)=>{ for(const k of keys){ const n=Number(r?.[k]); if(Number.isFinite(n)) return Math.max(m,n);} return m;},0);

function priorRows(rows, season, week, playerId) {
  return (Array.isArray(rows)?rows:[]).filter((r)=>{
    const s=Number(resolve(r,["season"])), w=Number(resolve(r,["week"]));
    const pid=clean(resolve(r,["playerId","player_id","gsis_id","canonicalPlayerId"]));
    const type=clean(resolve(r,["seasonType","season_type"]));
    return pid===playerId && s===season && Number.isInteger(w) && w<week && (!type || type.toUpperCase()==="REG");
  });
}

function normalizePosition(v){
  const p=clean(v)?.toUpperCase()??null;
  if(p==="OT") return "T";
  if(["SAF","FS","SS"].includes(p)) return "S";
  if(p==="DB") return "CB";
  if(p==="DL") return "DT";
  return p;
}

function performance(rows, id){
  if(!rows.length) return null;
  return {
    ...id,gamesTracked:rows.length,
    completions:sum(rows,["completions"]),attempts:sum(rows,["attempts"]),
    passingYards:sum(rows,["passingYards","passing_yards"]),
    passingTDs:sum(rows,["passingTDs","passing_tds"]),
    interceptions:sum(rows,["interceptions"]),
    sacksTaken:sum(rows,["sacksTaken","sacks"]),
    sackYardsLost:sum(rows,["sackYardsLost","sack_yards"]),
    passingAirYards:sum(rows,["passingAirYards","passing_air_yards"]),
    passingYardsAfterCatch:sum(rows,["passingYardsAfterCatch","passing_yards_after_catch"]),
    passingFirstDowns:sum(rows,["passingFirstDowns","passing_first_downs"]),
    passingEPA:sum(rows,["passingEPA","passing_epa"]),
    carries:sum(rows,["carries"]),rushingYards:sum(rows,["rushingYards","rushing_yards"]),
    rushingTDs:sum(rows,["rushingTDs","rushing_tds"]),
    rushingFirstDowns:sum(rows,["rushingFirstDowns","rushing_first_downs"]),
    rushingEPA:sum(rows,["rushingEPA","rushing_epa"]),fumbles:sum(rows,["fumbles"]),
    fumblesLost:sum(rows,["fumblesLost","fumbles_lost"]),targets:sum(rows,["targets"]),
    receptions:sum(rows,["receptions"]),receivingYards:sum(rows,["receivingYards","receiving_yards"]),
    receivingTDs:sum(rows,["receivingTDs","receiving_tds"]),
    sacks:sum(rows,["defSacks","def_sacks","sacks_defense"]),tackles:sum(rows,["tackles"]),
    defensiveInterceptions:sum(rows,["defensiveInterceptions","interceptions_defense"]),
    fantasyPoints:sum(rows,["fantasyPoints","fantasy_points"]),matchedBy:"historicalPregameEvidence"
  };
}

function usage(rows,id){
  if(!rows.length) return null;
  const offenseSnaps=sum(rows,["offenseSnaps","offense_snaps"]);
  const defenseSnaps=sum(rows,["defenseSnaps","defense_snaps"]);
  const specialTeamsSnaps=sum(rows,["specialTeamsSnaps","stSnaps","st_snaps"]);
  const totalSnaps=offenseSnaps+defenseSnaps+specialTeamsSnaps;
  return {...id,gamesTracked:rows.length,offenseSnaps,defenseSnaps,specialTeamsSnaps,totalSnaps,
    maxWeeklySnapShare:max(rows,["offensePct","offense_pct","defensePct","defense_pct","stPct","st_pct"]),
    averageWeeklySnapShare:rows.length?Math.round((totalSnaps/rows.length)*10)/10:0,
    matchedBy:"historicalPregameEvidence"};
}

export function adaptHistoricalPlayerEvaluationInput({bundle={},supplementalSnapRows=[]}={}){
  const season=Number(bundle?.season),week=Number(bundle?.week),playerId=clean(bundle?.playerId);
  const asOf=clean(bundle?.asOf),kickoffAt=clean(bundle?.kickoffAt);
  const temporal=asOf && kickoffAt && Date.parse(asOf)<Date.parse(kickoffAt) &&
    bundle?.targetWeekIncluded!==true && bundle?.futureWeekIncluded!==true && bundle?.futureSeasonIncluded!==true;
  if(!playerId || !Number.isInteger(season) || !Number.isInteger(week) || !temporal)
    return Object.freeze({status:"UNAVAILABLE",reason:"HISTORICAL_INPUT_NOT_TEMPORALLY_SAFE_OR_IDENTIFIED",player:null,evidence:null});

  const stats=priorRows(bundle?.priorCurrentSeasonWeeklyStats||[],season,week,playerId);
  const snaps=priorRows(supplementalSnapRows,season,week,playerId);
  const last=stats.at(-1)||snaps.at(-1)||{};
  const id={playerId,playerName:clean(resolve(last,["playerName","player_name"])),team:clean(bundle?.team||resolve(last,["team"])),
    position:normalizePosition(bundle?.position||resolve(last,["position"]))};
  const performanceProfile=performance(stats,id),usageProfile=usage(snaps,id);
  const player={canonicalPlayerId:playerId,playerId,id:playerId,name:id.playerName,position:id.position,team:id.team,
    identity:{playerId,playerName:id.playerName,position:id.position,team:id.team},
    historicalEvaluationEvidence:{contract:"NFLHistoricalPlayerEvaluationInput",version:NFL_HISTORICAL_PLAYER_EVALUATION_INPUT_ADAPTER_VERSION,
      season,week,asOf,kickoffAt,temporallySafe:true,usageProfile,performanceProfile,disableRecognition:true,
      provenance:{performance:performanceProfile?{source:"historical-player-evaluation-bundles-v1",priorGameCount:stats.length}:null,
        usage:usageProfile?{source:"historical-snap-counts-resolved",priorGameCount:snaps.length}:null,
        recognition:{source:null,status:"DISABLED_PENDING_GOVERNED_HISTORICAL_RECOGNITION_ADAPTER"}}}};
  return Object.freeze({status:(performanceProfile||usageProfile)?"AVAILABLE":"UNAVAILABLE",
    reason:(performanceProfile||usageProfile)?null:"NO_PREGAME_PLAYER_EVALUATION_EVIDENCE",player:Object.freeze(player),
    evidence:Object.freeze({performanceProfile,usageProfile,performanceGameCount:stats.length,usageGameCount:snaps.length,recognitionDisabled:true,temporallySafe:true})});
}

export default { NFL_HISTORICAL_PLAYER_EVALUATION_INPUT_ADAPTER_VERSION, adaptHistoricalPlayerEvaluationInput };
