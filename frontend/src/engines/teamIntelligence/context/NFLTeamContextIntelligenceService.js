import {createNFLTeamCoachingSchemeEvidence} from "./NFLTeamCoachingSchemeEvidenceContract.js";
import {mergeNFLTeamCoachingStaffEvidence2026} from "../../../data/footballIntelligence/nfl/teamCoaching/2026/NFLTeamCoachingStaffEvidenceRegistry2026.js";
import {synthesizeNFLTeamCoachingIntelligence} from "./NFLTeamCoachingIntelligence.js";
import {synthesizeNFLTeamSchemeIntelligence} from "./NFLTeamSchemeIntelligence.js";
import {resolveNFLTeamOrganizationalKnowledge} from "./organization/NFLTeamOrganizationalKnowledgeService.js";
import {resolveNFLTeamIdentityKnowledge2026} from "./identity/NFLTeamIdentityKnowledgeResolver2026.js";

export function evaluateNFLTeamContext(input={}){
 const evidence=createNFLTeamCoachingSchemeEvidence(mergeNFLTeamCoachingStaffEvidence2026(input));
 const organization=resolveNFLTeamOrganizationalKnowledge({team:evidence.team,season:evidence.season,asOf:evidence.asOf});
 const identity=resolveNFLTeamIdentityKnowledge2026({team:evidence.team,season:evidence.season,asOf:evidence.asOf});
 return Object.freeze({contextVersion:"FIE-NFL-TEAM-CONTEXT-1.0.0",team:evidence.team,season:evidence.season,asOf:evidence.asOf,coaching:synthesizeNFLTeamCoachingIntelligence(evidence),scheme:synthesizeNFLTeamSchemeIntelligence(evidence),organization,identity,provenance:evidence.provenance,evidenceStatus:evidence.status});
}
