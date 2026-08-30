import athleticProfiles from "../../data/footballIntelligence/athletics/athleticProfiles.js";
import defaultAthleticProfile from "../../data/footballIntelligence/athletics/defaultAthleticProfile.js";
import {
  createAthleticModeledOutputDeclaration,
  isAthleticModeledOutputDeclaration,
  validateAthleticModeledOutputDeclaration,
} from "../athletics/AthleticModeledOutputDeclaration.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
function declaration(profile) { return createAthleticModeledOutputDeclaration({ overallScore: profile.scores.overallAthleticScore, componentScores: { speed: profile.scores.speed, explosiveness: profile.scores.explosiveness, agility: profile.scores.agility, strength: profile.scores.strength, sizeAdjustedAthleticism: profile.scores.sizeAdjustedAthleticism }, storedConfidence: profile.confidence, strengths: profile.strengths, limitations: profile.limitations, summary: profile.notes, sourceLabel: profile.source, lastUpdated: profile.lastUpdated }); }
const sample = { scores: { speed: 88, explosiveness: 87, agility: 89, strength: 84, sizeAdjustedAthleticism: 91, overallAthleticScore: 90 }, confidence: 0.87, strengths: ["Legacy strength"], limitations: ["Legacy limitation"], notes: "Legacy summary.", source: "Legacy source", lastUpdated: "2026-07-03" };
const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("metadata", () => assert(isAthleticModeledOutputDeclaration(declaration(sample)), "Declaration invalid."));
check("legacy-score-preservation", () => { const result = declaration(sample); assert(result.overallScore === 90 && JSON.stringify(result.componentScores) === JSON.stringify({ speed: 88, explosiveness: 87, agility: 89, strength: 84, sizeAdjustedAthleticism: 91 }), "Scores changed."); });
check("legacy-confidence-preservation", () => assert(declaration(sample).storedConfidence === 0.87, "Confidence changed."));
check("summary-preservation", () => assert(declaration(sample).summary === sample.notes, "Summary changed."));
check("narrative-preservation", () => { const result = declaration(sample); assert(result.strengths[0] === sample.strengths[0] && result.limitations[0] === sample.limitations[0], "Narrative changed."); });
check("governance-metadata", () => { const result = declaration(sample); assert(result.classification === "LEGACY_DECLARED_MODELED_OUTPUT" && result.owner === "UNKNOWN" && result.derivationStatus === "UNKNOWN" && result.governanceStatus === "TRANSITIONAL" && result.calibrationStatus === "NOT_DOCUMENTED" && result.reproducibilityStatus === "NOT_DOCUMENTED" && result.canonicalDerivation === false && result.modelVersion === null && result.declaredBy === null && result.permittedUse === "COMPATIBILITY_ONLY", "Governance metadata changed."); });
check("no-objective-measurements", () => { const result = declaration(sample); assert(!Object.hasOwn(result, "measurements") && !Object.hasOwn(result, "testing"), "Objective measurements included."); });
check("serialization", () => assert(JSON.parse(JSON.stringify(declaration(sample))).overallScore === 90, "Serialization failed."));
check("immutability", () => assert(frozen(declaration(sample)), "Declaration mutable."));
check("validation", () => assert(!validateAthleticModeledOutputDeclaration({ overallScore: 101 }).valid, "Invalid score accepted."));
check("caller-preservation", () => { const before = JSON.stringify(sample); declaration(sample); assert(JSON.stringify(sample) === before && !Object.isFrozen(sample), "Caller input changed."); });

Object.entries(athleticProfiles).forEach(([playerId, profile]) => check(`legacy-${playerId}`, () => {
  const result = declaration(profile);
  assert(result.overallScore === profile.scores.overallAthleticScore, `${playerId} overall score changed.`);
  assert(result.storedConfidence === profile.confidence && result.summary === profile.notes, `${playerId} legacy content changed.`);
}));
check("default-profile-preserved", () => { const result = declaration(defaultAthleticProfile); assert(result.overallScore === defaultAthleticProfile.scores.overallAthleticScore && result.storedConfidence === defaultAthleticProfile.confidence, "Default profile changed."); });

export function runAthleticModeledOutputDeclarationDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((result) => result.passed).length;
  return { suite: "AthleticModeledOutputDeclarationDiagnostics", total: results.length, passed, failed: results.length - passed, compatibilitySnapshots: Object.keys(athleticProfiles).length + 1, results };
}
export default { runAthleticModeledOutputDeclarationDiagnostics };
