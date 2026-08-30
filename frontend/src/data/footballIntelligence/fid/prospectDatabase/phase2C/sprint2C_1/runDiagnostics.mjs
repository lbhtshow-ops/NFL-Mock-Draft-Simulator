import assert from "node:assert/strict";
import { quarterbackResearchRecords, quarterbackCohortManifest } from "./quarterbackResearch.js";
import { quarterbackPreparationRecords } from "./quarterbackPreparationRecords.js";

const checks = [];
const check = (name, condition) => { assert.equal(Boolean(condition), true, name); checks.push(name); };

check("twelve quarterbacks", quarterbackResearchRecords.length === 12);
check("manifest count", quarterbackCohortManifest.candidateCount === 12);
check("two predecessor candidates", quarterbackCohortManifest.existingPreparationCount === 2);
check("ten new candidates", quarterbackCohortManifest.newCandidateCount === 10);
check("unique candidate refs", new Set(quarterbackResearchRecords.map((r) => r.candidateRef)).size === 12);
check("unique preparation refs", new Set(quarterbackPreparationRecords.map((r) => r.preparationRecordRef)).size === 12);
check("all quarterback", quarterbackResearchRecords.every((r) => r.positionGroup === "QUARTERBACK" && r.officialPosition === "QB"));
check("all expected 2027", quarterbackResearchRecords.every((r) => r.expectedDraftYear === 2027));
check("all preparation valid", quarterbackPreparationRecords.every((r) => r.validation.valid));
check("all deeply frozen", quarterbackPreparationRecords.every(Object.isFrozen));
check("sources present", quarterbackResearchRecords.every((r) => r.sources.length >= 1));
check("evidence present", quarterbackResearchRecords.every((r) => r.evidence.length >= 2));
check("no canonical ids", quarterbackResearchRecords.every((r) => Object.values(r.canonicalIdentifiers).every((v) => v === null)));
check("eligibility unresolved", quarterbackResearchRecords.every((r) => r.eligibilityStatus === "ELIGIBILITY_PATHWAY_REVIEW_REQUIRED"));
check("declaration unresolved", quarterbackResearchRecords.every((r) => r.declarationStatus === "DECLARATION_UNRESOLVED"));
check("not ranked", quarterbackResearchRecords.every((r) => r.ranked === false));
check("promotion prohibited", quarterbackCohortManifest.promotionAuthorized === false);
check("persistence prohibited", quarterbackCohortManifest.persistenceAuthorized === false);
check("registration prohibited", quarterbackCohortManifest.applicationRegistrationAuthorized === false);
check("no application availability", quarterbackPreparationRecords.every((r) => !r.availability.resolver && !r.availability.simulator && !r.availability.bigBoard));

console.log(JSON.stringify({ suite: "Sprint2C1QuarterbackCohortDiagnostics", passed: true, checks: checks.length, candidateCount: quarterbackResearchRecords.length, existingPreparationCount: quarterbackCohortManifest.existingPreparationCount, newCandidateCount: quarterbackCohortManifest.newCandidateCount, canonicalIdentifiersIssued: 0, persistence: false, applicationRegistration: false }, null, 2));
