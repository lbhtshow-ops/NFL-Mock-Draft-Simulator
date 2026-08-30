import { enrichmentRecords } from "../../footballIntelligence/fid/prospectDatabase/phase2A/sprint2A_3C/enrichmentData.js";
import { resolveApplicationProspect } from "../../footballIntelligence/prospectCatalog/ApplicationProspectCatalog.js";

const byCandidateRef = new Map(
  enrichmentRecords.map((record) => [record.candidateRef || "", record])
);

function playerName(player) {
  return String(player?.name || player?.player || player?.displayName || "").trim();
}

function measurement(record, kind) {
  return record?.measurements?.find((item) => item.kind === kind)?.value ?? null;
}

export function resolveDevelopmentProspectProjection(player) {
  const name = playerName(player);
  if (!name) return null;

  const applicationProspect = resolveApplicationProspect(player, { allowRuntimeBaseProfile: false });
  const record = applicationProspect?.fidProspectRef
    ? byCandidateRef.get(applicationProspect.fidProspectRef) || null
    : null;
  if (!record) return null;

  return {
    applicationProspectRef: applicationProspect.applicationProspectRef,
    fidProspectRef: applicationProspect.fidProspectRef,
    intelligenceCoverage: applicationProspect.intelligenceCoverage,
    available: true,
    classification: record.identityClassification,
    status: "DEVELOPMENT_FIXTURE_PROJECTION",
    temporalReference: record.temporalReference,
    subject: {
      name,
      position: record.position?.normalized || record.position?.official || player?.position || null,
      officialPosition: record.position?.official || null,
      school: record.currentProgram?.displayName || player?.school || player?.college || null,
      conference: record.currentProgram?.conference || null,
      heightInches: measurement(record, "HEIGHT"),
      weightPounds: measurement(record, "WEIGHT"),
    },
    production: record.production || null,
    scouting: record.scouting || null,
    eligibility: record.eligibilityReview || null,
    sourceRefs: record.sourceRefs || [],
    evidenceRefs: record.evidenceRefs || [],
    draftRoomReadiness: record.draftRoomReadiness || null,
    mappingReadiness: record.mappingReadiness || null,
    promotionReadiness: record.promotionReadiness || [],
    limitations: record.limitations || [],
    canonicalIdentifiers: record.canonicalIdentifiers || null,
    canonical: false,
  };
}

export default { resolveDevelopmentProspectProjection };
