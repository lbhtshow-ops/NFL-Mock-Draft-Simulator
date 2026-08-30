export const ATHLETIC_DECISION_SUPPORT_POLICY_ID = "ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY";
export const ATHLETIC_DECISION_SUPPORT_POLICY_VERSION = "1.0.0";

export const ATHLETIC_COMPATIBILITY_AUTHORIZATIONS = Object.freeze({
  AUTHORIZED_TEMPORARY: "AUTHORIZED_TEMPORARY",
  READ_ONLY_COMPATIBILITY: "READ_ONLY_COMPATIBILITY",
  DIAGNOSTIC_ONLY: "DIAGNOSTIC_ONLY",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const removalConditions = [
  "A separately designed canonical Athletic scoring model exists with a new model identity.",
  "Governed score inputs are defined.",
  "Position and population semantics are documented.",
  "Formula and weights are versioned.",
  "Calibration methodology is documented.",
  "Reproducibility diagnostics pass.",
  "Evidence-confidence methodology is approved.",
  "Current consumers are migrated deliberately.",
  "Draft Board fallback 80 is removed or replaced with governed unavailable handling.",
  "Quarterback mobility inputs are migrated or reclassified.",
  "UI and explainability language is updated.",
  "Old and new behavior is compared through migration diagnostics.",
  "Production approval is explicitly granted.",
  "Compatibility snapshots authorize retirement.",
  "Legacy declarations remain preserved for historical traceability.",
];

const consumer = ({ consumerId, consumerType, fieldsConsumed, numericalDependency, decisionImpact, currentFallback = null, compatibilityAuthorization, riskLevel, limitations, removalCondition }) => ({
  consumerId, consumerType, fieldsConsumed, numericalDependency, decisionImpact, currentFallback,
  compatibilityAuthorization, canonicalEvidenceAvailable: true, canonicalEvidenceConsumed: false,
  migrationStatus: "NOT_MIGRATED", riskLevel, limitations, removalCondition,
});

const authorizedConsumers = [
  consumer({ consumerId: "FOOTBALL_INTELLIGENCE_SERVICE", consumerType: "SERVICE", fieldsConsumed: ["summary", "confidence", "data.scores"], numericalDependency: true, decisionImpact: "INDIRECT", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "HIGH", limitations: ["Transport does not approve the values analytically."], removalCondition: "Migrate service payload consumers to approved governed outputs." }),
  consumer({ consumerId: "PROSPECT_INTELLIGENCE_ENGINE", consumerType: "INTELLIGENCE_AGGREGATOR", fieldsConsumed: ["compatibility result"], numericalDependency: true, decisionImpact: "INDIRECT", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "HIGH", limitations: ["Aggregation does not make Athletic scores canonical."], removalCondition: "Migrate aggregation to an approved Athletic replacement." }),
  consumer({ consumerId: "EXECUTIVE_SUMMARY", consumerType: "PRESENTATION", fieldsConsumed: ["scores.overallAthleticScore"], numericalDependency: true, decisionImpact: "INDIRECT", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "MEDIUM", limitations: ["Existing language is compatibility-only and not production-approved analysis."], removalCondition: "Update language after governed consumer migration." }),
  consumer({ consumerId: "EXPLAINABILITY", consumerType: "PRESENTATION", fieldsConsumed: ["scores.overallAthleticScore"], numericalDependency: true, decisionImpact: "INDIRECT", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "MEDIUM", limitations: ["Explanation may not claim canonical or verified Athletic derivation."], removalCondition: "Update explanation ownership after governed consumer migration." }),
  consumer({ consumerId: "DRAFT_BOARD", consumerType: "DECISION_SUPPORT", fieldsConsumed: ["overallAthleticScore", "fallback:80"], numericalDependency: true, decisionImpact: "DIRECT_RANKING_INFLUENCE", currentFallback: "80", compatibilityAuthorization: "AUTHORIZED_TEMPORARY", riskLevel: "CRITICAL", limitations: ["Fallback 80 has no canonical Athletic meaning.", "Production approval is blocked while fallback 80 remains unresolved."], removalCondition: "Replace compatibility score and fallback 80 through an approved migration." }),
  consumer({ consumerId: "DRAFT_DECISION", consumerType: "DECISION_SUPPORT", fieldsConsumed: ["scores.overallAthleticScore", "athleticism weight"], numericalDependency: true, decisionImpact: "DIRECT_OUTCOME_INFLUENCE", compatibilityAuthorization: "AUTHORIZED_TEMPORARY", riskLevel: "CRITICAL", limitations: ["Consumer-owned weighting remains transitional and is not canonical decision authority."], removalCondition: "Migrate the weighted input through approved Decision Support diagnostics." }),
  consumer({ consumerId: "QUARTERBACK_PREPARATION", consumerType: "DEVELOPMENT_ADAPTER", fieldsConsumed: ["Athletic IntelligenceResult"], numericalDependency: true, decisionImpact: "MODEL_INPUT", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "HIGH", limitations: ["Preparation transports compatibility declarations without approving them."], removalCondition: "Supply an approved governed Athletic input to the quarterback model." }),
  consumer({ consumerId: "QUARTERBACK_MODEL", consumerType: "POSITION_MODEL", fieldsConsumed: ["speed", "agility", "explosiveness", "sizeAdjustedAthleticism"], numericalDependency: true, decisionImpact: "MOBILITY_COMPONENT_INFLUENCE", compatibilityAuthorization: "AUTHORIZED_TEMPORARY", riskLevel: "CRITICAL", limitations: ["The quarterback formula may be governed while its Athletic component inputs remain transitional.", "Mobility is not fully canonical while legacy Athletic inputs remain active."], removalCondition: "Migrate or reclassify all Athletic mobility inputs without silently changing formula ownership." }),
  consumer({ consumerId: "PROSPECT_SOURCE_ADAPTER", consumerType: "SOURCE_ADAPTER", fieldsConsumed: ["available", "dataState", "rawData.profile"], numericalDependency: false, decisionImpact: "INDIRECT", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "MEDIUM", limitations: ["Availability adaptation is not analytical approval."], removalCondition: "Adapt the approved replacement result after migration." }),
  consumer({ consumerId: "CARRYOVER_EVALUATION", consumerType: "EVALUATION", fieldsConsumed: ["adapted Athletic source"], numericalDependency: true, decisionImpact: "EVALUATION_INFLUENCE", compatibilityAuthorization: "AUTHORIZED_TEMPORARY", riskLevel: "HIGH", limitations: ["Exact Player Evaluation execution remains blocked by an existing runtime import-resolution issue."], removalCondition: "Verify and migrate carryover behavior through executable diagnostics." }),
  consumer({ consumerId: "ATHLETIC_UI", consumerType: "PRESENTATION", fieldsConsumed: ["measurements", "testing", "scores", "notes"], numericalDependency: true, decisionImpact: "DISPLAY_ONLY", compatibilityAuthorization: "READ_ONLY_COMPATIBILITY", riskLevel: "MEDIUM", limitations: ["Display must not imply canonical, calibrated, or verified scores."], removalCondition: "Update UI language and data source after approved migration." }),
];

export const ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY = deepFreeze({
  policyId: ATHLETIC_DECISION_SUPPORT_POLICY_ID,
  policyVersion: ATHLETIC_DECISION_SUPPORT_POLICY_VERSION,
  domain: "ATHLETIC",
  status: "ACTIVE_TRANSITIONAL_COMPATIBILITY_POLICY",
  phaseStatus: "PHASE_2_COMPLETE_WITH_TRANSITIONAL_SCORE",
  effectiveScope: "Temporary use of AthleticModeledOutputDeclaration values by explicitly listed existing consumers only.",
  classification: "LEGACY_DECLARED_MODELED_OUTPUT",
  owner: "UNKNOWN",
  governanceStatus: "TRANSITIONAL",
  calibrationStatus: "NOT_DOCUMENTED",
  reproducibilityStatus: "NOT_DOCUMENTED",
  canonicalDerivation: false,
  permittedUse: "BOUNDED_COMPATIBILITY",
  authorizedConsumers,
  prohibitedConsumers: ["Any unlisted runtime consumer", "Model training pipelines", "Autonomous draft recommendation systems", "Public analytical benchmark publishers"],
  authorizedFields: ["overallAthleticScore", "speed", "explosiveness", "agility", "strength", "sizeAdjustedAthleticism", "stored legacy confidence", "legacy strengths", "legacy limitations", "legacy summary", "legacy source label", "legacy last-updated value"],
  prohibitedFields: ["canonical Athletic score", "canonical Athletic confidence", "percentile", "position norm", "calibrated grade", "predictive label"],
  authorizedUses: ["Preserve existing UI behavior", "Preserve compatibility summaries", "Preserve current development evaluation behavior", "Preserve current Draft Board calculation behavior", "Preserve current Draft Decision behavior", "Preserve current quarterback mobility behavior", "Preserve snapshots and regression baselines"],
  prohibitedUses: ["Production-grade player evaluation", "Final scouting grades", "Calibrated rankings", "Public claims of analytical validity", "Canonical decision authority", "Autonomous draft recommendations", "Model training labels", "Historical benchmark comparisons", "Cross-position percentile claims"],
  prohibitedClaims: ["canonical", "verified", "calibrated", "reproduced", "evidence-derived", "percentile-based", "position-normalized", "Combine-equivalent", "RAS-equivalent", "predictive", "production-approved", "decision-authoritative", "stored confidence is evidence confidence", "stored confidence is model confidence", "stored confidence is calibration confidence", "stored confidence is prediction confidence", "stored confidence is canonical confidence"],
  fallbackInventory: [
    { fallbackId: "DRAFT_BOARD_MISSING_ATHLETIC_SCORE", behavior: "Use 80 when overall Athletic score is missing.", owner: "DRAFT_BOARD", currentValue: 80, reasonKnown: "UNKNOWN", canonicalMeaning: "NONE", decisionImpact: "DIRECT_RANKING_INFLUENCE", governanceStatus: "UNRESOLVED_GOVERNANCE_DEBT", removalRequirement: "Remove or replace with governed unavailable handling before analytical production approval." },
    { fallbackId: "DEFAULT_ATHLETIC_PROFILE", behavior: "Return the default Athletic profile when registry lookup does not resolve a profile.", owner: "ATHLETIC_COMPATIBILITY_FACADE", currentValue: "defaultAthleticProfile", reasonKnown: "COMPATIBILITY", canonicalMeaning: "NONE", decisionImpact: "INDIRECT", governanceStatus: "TRANSITIONAL", removalRequirement: "Migrate callers to governed unavailable handling." },
    { fallbackId: "MISSING_PROFILE_COMPATIBILITY_RESULT", behavior: "Return the existing unavailable compatibility result.", owner: "ATHLETIC_COMPATIBILITY_FACADE", currentValue: "score:null confidence:0", reasonKnown: "COMPATIBILITY", canonicalMeaning: "UNAVAILABLE_OR_UNKNOWN_ONLY", decisionImpact: "INDIRECT", governanceStatus: "TRANSITIONAL", removalRequirement: "Approve and migrate a replacement consumer contract." },
    { fallbackId: "QUARTERBACK_MISSING_COMPONENT", behavior: "Quarterback preparation/model applies existing missing-component behavior.", owner: "QUARTERBACK_CONSUMER", currentValue: "CURRENT_RUNTIME_BEHAVIOR", reasonKnown: "UNKNOWN", canonicalMeaning: "NONE", decisionImpact: "MOBILITY_COMPONENT_INFLUENCE", governanceStatus: "TRANSITIONAL", removalRequirement: "Diagnose and migrate component absence explicitly." },
    { fallbackId: "CARRYOVER_MISSING_ATHLETIC_SOURCE", behavior: "Carryover evaluation applies existing adapted-source absence behavior.", owner: "CARRYOVER_EVALUATION", currentValue: "CURRENT_RUNTIME_BEHAVIOR", reasonKnown: "UNKNOWN", canonicalMeaning: "NONE", decisionImpact: "EVALUATION_INFLUENCE", governanceStatus: "TRANSITIONAL", removalRequirement: "Execute blocked diagnostics and approve governed unavailable behavior." },
  ],
  riskClassification: "CRITICAL_TRANSITIONAL_DECISION_DEPENDENCY",
  productionReadiness: {
    legacyAnalyticalScoring: "NOT_APPROVED",
    canonicalEvidenceReporting: "PRODUCTION_CAPABLE_FOR_GOVERNED_FACTUAL_EVIDENCE_REPORTING",
    blockers: ["Unknown score derivation", "Unknown owner", "Undocumented calibration", "Undocumented reproducibility", "Undocumented confidence method", "Unresolved position and population semantics", "Active Draft Board fallback 80", "Consumer dependence on legacy modeled outputs", "No approved canonical Athletic scoring model"],
  },
  migrationStatus: "NOT_STARTED",
  removalConditions,
  reviewConditions: ["Canonical Athletic scoring design begins", "A consumer changes weights", "A new consumer is added", "A compatibility score enters a new decision path", "Draft Board fallback changes", "Production launch is proposed", "2027 prospect population begins using Athletic modeled scores", "Calibration data becomes available", "Athletic profile schema changes"],
  limitations: ["Policy authorization preserves behavior but does not validate the legacy analysis.", "Canonical evidence does not legitimize legacy scores.", "No automatic migration or runtime policy enforcement is introduced."],
  notes: "Athletic Phase 2 is complete with a transitional legacy score; canonical scoring, canonical confidence, consumer migration, and analytical production approval remain unimplemented.",
});

export default ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY;
