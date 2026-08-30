import { sprint2A2Candidates } from "../../phase2A/sprint2A_2/cohortResearch.js";
import { preparationRecords } from "../../phase2A/sprint2A_3B/preparationCohort.js";
import { enrichmentRecords } from "../../phase2A/sprint2A_3C/enrichmentData.js";
import { ProspectResolver } from "./ProspectResolver.js";
import { RESOLVER_SOURCE_KINDS } from "./ProspectResolverContract.js";

const candidates = new Map(sprint2A2Candidates.map((candidate) => [candidate.candidateRef, candidate]));
const enrichments = new Map(enrichmentRecords.map((record) => [record.preparationRecordRef, record]));
const records = new Map(preparationRecords.flatMap((record) => [[record.preparationRecordRef, record], [record.intakeCandidateRef, record]]));
const measurement = (record, kind) => record.measurements.find((item) => item.kind === kind) ?? null;

const preparationSource = Object.freeze({
  kind: RESOLVER_SOURCE_KINDS.PREPARATION,
  find(reference) {
    const preparation = records.get(reference);
    if (!preparation) return null;
    const enrichment = enrichments.get(preparation.preparationRecordRef);
    const blocked = preparation.lifecycle === "BLOCKED" || !enrichment;
    return { preparation, enrichment, candidate: candidates.get(preparation.intakeCandidateRef), blocked, reason: blocked ? "Preparation evidence is unavailable or the record lifecycle is blocked." : null };
  },
  project({ preparation, enrichment, candidate }) {
    const height = measurement(enrichment, "HEIGHT"); const weight = measurement(enrichment, "WEIGHT");
    const projectedRole = enrichment.position.normalized === enrichment.position.official ? enrichment.position.official : enrichment.position.normalized;
    return {
      reference: preparation.intakeCandidateRef, displayName: candidate.name,
      program: { displayName: enrichment.currentProgram.displayName, conference: enrichment.currentProgram.conference, status: enrichment.currentProgram.resolutionState },
      officialPosition: enrichment.position.official, projectedRole,
      height: height && { value: height.value, unit: height.unit, verificationStatus: height.verificationStatus },
      weight: weight && { value: weight.value, unit: weight.unit, verificationStatus: weight.verificationStatus },
      productionSummary: { season: enrichment.production.season, statistics: enrichment.production.statistics, completeness: enrichment.production.completeness },
      testingStatus: { status: enrichment.testing.status, resultCount: enrichment.testing.results.length },
      strengths: enrichment.scouting.strengths.map(({ statement, classification }) => ({ statement, classification })),
      concerns: enrichment.scouting.concerns.map(({ statement, classification }) => ({ statement, classification })),
      eligibility: { status: enrichment.eligibilityReview.result, declarationStatus: enrichment.eligibilityReview.declarationStatus, earlyEntryPathway: enrichment.eligibilityReview.earlyEntryPathway },
      reviewStatus: preparation.lifecycle,
      evidenceSummary: { count: enrichment.evidenceRefs.length, scoutingCompleteness: enrichment.scouting.completeness },
      sourceSummary: { count: enrichment.sourceRefs.length, temporalReference: enrichment.temporalReference },
      mappingReadiness: enrichment.mappingReadiness, draftRoomReadiness: enrichment.draftRoomReadiness, draftResultsReadiness: enrichment.draftResultsReadiness,
      limitations: [...enrichment.limitations, ...enrichment.production.statDefinitionLimitations, ...enrichment.testing.limitations]
    };
  }
});

export const fixtureResolver = new ProspectResolver([preparationSource]);
export const fixtureProspectReferences = Object.freeze(preparationRecords.map(({ intakeCandidateRef }) => intakeCandidateRef));

