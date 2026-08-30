import assert from "node:assert/strict";
import {
  SOURCE_DOMAINS, SOURCE_AUTHORITY,
  getNFLHistoricalCalibrationSourceRegistry,
  findNFLHistoricalCalibrationSourcesByDomain,
  createNFLHistoricalAcquisitionEvidence,
  validateNFLHistoricalAcquisitionEvidence,
  createNFLHistoricalAcquisitionRequest,
  createNFLHistoricalCoverageReport,
  inspectNFLHistoricalSourceRegistry,
} from "../teamIntelligence/strength/calibration/acquisition/index.js";

const tests=[]; const t=(n,f)=>{try{f();tests.push([n,true])}catch(e){tests.push([n,false,e.message])}};
const registry=getNFLHistoricalCalibrationSourceRegistry();
const service=inspectNFLHistoricalSourceRegistry();

const safe=createNFLHistoricalAcquisitionEvidence({
 sourceId:"NFLVERSE_WEEKLY_ROSTERS",sourceRecordId:"BAL-2025-1",domain:SOURCE_DOMAINS.WEEKLY_ROSTERS,
 team:"BAL",opponent:"BUF",season:2025,week:1,gameId:"2025_01_BAL_BUF",
 retrievedAt:"2026-08-13T13:00:00Z",effectiveAt:"2025-09-07T18:00:00Z",kickoffAt:"2025-09-07T20:20:00Z",
 payload:{players:53},provenance:{provider:"nflverse",release:"weekly_rosters",locator:"roster_weekly_2025.parquet"}
});
const unsafe=createNFLHistoricalAcquisitionEvidence({...safe,effectiveAt:"2025-09-08T00:00:00Z"});
const req=createNFLHistoricalAcquisitionRequest({requestId:"REQ-1",sourceId:"NFLVERSE_PBP",seasons:[2023,2024,2025],domains:[SOURCE_DOMAINS.PLAY_BY_PLAY],requestedAt:"2026-08-13T13:00:00Z"});
const coverage=createNFLHistoricalCoverageReport([safe,createNFLHistoricalAcquisitionEvidence({...safe,sourceRecordId:"pbp",domain:SOURCE_DOMAINS.PLAY_BY_PLAY,season:2024,effectiveAt:"2024-09-01T10:00:00Z",kickoffAt:"2024-09-01T17:00:00Z"})],{reportId:"COV-1",generatedAt:"2026-08-13T13:00:00Z"});

t("registry_array",()=>assert.ok(Array.isArray(registry)));
t("registry_has_sources",()=>assert.ok(registry.length>=8));
t("schedules_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.SCHEDULES_RESULTS).length,1));
t("pbp_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.PLAY_BY_PLAY)[0].id,"NFLVERSE_PBP"));
t("team_stats_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.TEAM_STATS)[0].id,"NFLVERSE_TEAM_STATS"));
t("weekly_rosters_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.WEEKLY_ROSTERS)[0].id,"NFLVERSE_WEEKLY_ROSTERS"));
t("injuries_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.INJURIES)[0].id,"NFLVERSE_INJURIES"));
t("depth_charts_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.DEPTH_CHARTS)[0].id,"NFLVERSE_DEPTH_CHARTS"));
t("snap_counts_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.SNAP_COUNTS)[0].id,"NFLVERSE_SNAP_COUNTS"));
t("player_ids_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.PLAYER_IDENTITY)[0].id,"NFLVERSE_PLAYER_IDS"));
t("coaching_governed_source_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.COACHING)[0].provider,"LBHT Sports Intelligence Acquisition"));
t("scheme_governed_source_registered",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.SCHEME)[0].provider,"LBHT Sports Intelligence Acquisition"));
t("pbp_minimum_1999",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.PLAY_BY_PLAY)[0].minimumSeason,1999));
t("team_stats_minimum_1999",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.TEAM_STATS)[0].minimumSeason,1999));
t("weekly_rosters_minimum_2002",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.WEEKLY_ROSTERS)[0].minimumSeason,2002));
t("injury_coverage_not_invented",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.INJURIES)[0].coverage,"DISCOVER_AT_ACQUISITION"));
t("depth_coverage_not_invented",()=>assert.equal(findNFLHistoricalCalibrationSourcesByDomain(SOURCE_DOMAINS.DEPTH_CHARTS)[0].coverage,"DISCOVER_AT_ACQUISITION"));
t("registry_sources_not_database",()=>assert.ok(registry.every(x=>x.productionDatabase===false)));
t("source_authority_present",()=>assert.ok(registry.every(x=>Object.values(SOURCE_AUTHORITY).includes(x.authority))));
t("acquisition_status_not_fetched",()=>assert.ok(registry.every(x=>x.acquisitionStatus==="REGISTERED_NOT_FETCHED")));
t("evidence_contract_version",()=>assert.equal(safe.contractVersion,"FIE-NFL-HISTORICAL-ACQUISITION-EVIDENCE-1.0.0"));
t("source_id_preserved",()=>assert.equal(safe.sourceId,"NFLVERSE_WEEKLY_ROSTERS"));
t("source_record_preserved",()=>assert.equal(safe.sourceRecordId,"BAL-2025-1"));
t("domain_preserved",()=>assert.equal(safe.domain,SOURCE_DOMAINS.WEEKLY_ROSTERS));
t("team_preserved",()=>assert.equal(safe.team,"BAL"));
t("opponent_preserved",()=>assert.equal(safe.opponent,"BUF"));
t("season_preserved",()=>assert.equal(safe.season,2025));
t("week_preserved",()=>assert.equal(safe.week,1));
t("game_preserved",()=>assert.equal(safe.gameId,"2025_01_BAL_BUF"));
t("retrieval_time_preserved",()=>assert.equal(safe.retrievedAt,"2026-08-13T13:00:00Z"));
t("effective_time_preserved",()=>assert.equal(safe.effectiveAt,"2025-09-07T18:00:00Z"));
t("kickoff_preserved",()=>assert.equal(safe.kickoffAt,"2025-09-07T20:20:00Z"));
t("safe_pregame_true",()=>assert.equal(safe.safeForPregameCalibration,true));
t("unsafe_future_false",()=>assert.equal(unsafe.safeForPregameCalibration,false));
t("safe_validates",()=>assert.equal(validateNFLHistoricalAcquisitionEvidence(safe).valid,true));
t("unsafe_rejected",()=>assert.ok(validateNFLHistoricalAcquisitionEvidence(unsafe).errors.includes("NOT_SAFE_FOR_PREGAME_CALIBRATION")));
t("payload_preserved",()=>assert.equal(safe.payload.players,53));
t("provider_provenance",()=>assert.equal(safe.provenance.provider,"nflverse"));
t("release_provenance",()=>assert.equal(safe.provenance.release,"weekly_rosters"));
t("locator_provenance",()=>assert.equal(safe.provenance.locator,"roster_weekly_2025.parquet"));
t("request_contract_version",()=>assert.equal(req.contractVersion,"FIE-NFL-HISTORICAL-ACQUISITION-REQUEST-1.0.0"));
t("request_seasons_preserved",()=>assert.deepEqual([...req.seasons],[2023,2024,2025]));
t("request_discovery_only",()=>assert.equal(req.mode,"DISCOVERY_ONLY"));
t("request_no_persist",()=>assert.equal(req.persist,false));
t("request_no_database_mutation",()=>assert.equal(req.mutateDatabase,false));
t("request_no_network_execution",()=>assert.equal(req.executeNetworkFetch,false));
t("coverage_contract_version",()=>assert.equal(coverage.contractVersion,"FIE-NFL-HISTORICAL-COVERAGE-1.0.0"));
t("coverage_domains_distinct",()=>assert.equal(Object.keys(coverage.domains).length,2));
t("coverage_not_assumed_equivalent",()=>assert.equal(coverage.crossDomainCoverageAssumedEquivalent,false));
t("domain_coverage_not_equivalent",()=>assert.equal(coverage.domains.WEEKLY_ROSTERS.coverageIsEquivalentToOtherDomains,false));
t("coverage_minimum_season",()=>assert.equal(coverage.domains.PLAY_BY_PLAY.minimumSeason,2024));
t("coverage_maximum_season",()=>assert.equal(coverage.domains.WEEKLY_ROSTERS.maximumSeason,2025));
t("safe_record_counted",()=>assert.equal(coverage.domains.WEEKLY_ROSTERS.safePregameRecordCount,1));
t("service_version",()=>assert.equal(service.serviceVersion,"FIE-NFL-HISTORICAL-SOURCE-REGISTRY-SERVICE-1.0.0"));
t("service_ready_not_executed",()=>assert.equal(service.status,"REGISTRY_READY_ACQUISITION_NOT_EXECUTED"));
t("service_network_false",()=>assert.equal(service.networkFetchExecuted,false));
t("service_persistence_false",()=>assert.equal(service.persistenceExecuted,false));
t("service_database_false",()=>assert.equal(service.databaseMutationExecuted,false));
t("no_learned_weights",()=>assert.equal("learnedWeights" in service,false));
t("no_team_strength_score",()=>assert.equal("teamStrengthScore" in service,false));
t("no_win_probability",()=>assert.equal("winProbability" in service,false));
t("no_pick_recommendation",()=>assert.equal("pickRecommendation" in service,false));

const bad=tests.filter(x=>!x[1]);
console.log(JSON.stringify({suite:"NFL Historical Calibration Source Registry & Acquisition Contracts",contractVersion:"FIE-NFL-TEAM-STRENGTH-CALIBRATION-9A-1.0.0",status:bad.length?"FAIL":"PASS",passed:tests.length-bad.length,failed:bad.length,checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),failures:bad.map(x=>x[0]+": "+x[2])},null,2));
if(bad.length) process.exitCode=1;
