import { DRAFT_RESULT_CONTRACT, DRAFT_RESULT_SCHEMA, FUTURE_INTELLIGENCE_STATUS, RESULT_STATUS, clone, deepFreeze } from "./constants.js";

const isText = (value) => typeof value === "string" && value.trim().length > 0;
const countValues = (items, key) => items.reduce((result, item) => ({ ...result, [item[key]]: (result[item[key]] ?? 0) + 1 }), {});
const warningCounts = (items) => items.flatMap((item) => item.warnings).reduce((result, item) => ({ ...result, [item.category]: (result[item.category] ?? 0) + 1 }), {});

function createSelectionSnapshot(selection, prospect) {
  if (!selection || !prospect) throw new TypeError("Selection and prospect application view are required.");
  return deepFreeze({
    selectionRef: selection.selectionRef,
    pickRef: selection.pickRef,
    round: selection.round,
    pickInRound: selection.pickInRound ?? selection.overallPick,
    overallPick: selection.overallPick,
    originalTeamRef: selection.teamRef,
    selectingTeamRef: selection.teamRef,
    userControlled: selection.userOrCpuDeclaration === "USER",
    sourceProspectRef: selection.prospectRef,
    prospectDisplayName: selection.prospectDisplayNameSnapshot,
    program: selection.programSnapshot,
    officialPosition: selection.positionSnapshot,
    projectedRole: prospect.projectedRole ?? "Unavailable",
    measurements: clone(prospect.measurements),
    compactProductionSummary: clone(prospect.productionSummary),
    primaryStrength: prospect.strengthSummary ?? "Unavailable",
    primaryConcern: prospect.concernSummary ?? "Unavailable",
    warnings: clone(prospect.warnings ?? []),
    readiness: prospect.readiness,
    tradeReference: selection.tradeReference ?? null,
    fixtureOnly: true,
    selectionOrder: 1,
    sourceEventRef: selection.selectionRef,
    limitations: clone(selection.limitations ?? []),
  });
}

export function buildDraftResultSnapshot({ state, sourceProspects, suppliedCompletedAtRef = "fixture-step:2" }) {
  if (!state?.session || !Array.isArray(state.history)) throw new TypeError("Finalized Draft Room fixture state is required.");
  const prospectMap = new Map(sourceProspects.map((prospect) => [prospect.prospectRef, prospect]));
  const selections = state.history.map((selection, index) => deepFreeze({
    ...createSelectionSnapshot(selection, prospectMap.get(selection.prospectRef)),
    selectionOrder: index + 1,
  }));
  const userSelections = selections.filter((selection) => selection.userControlled);
  const resultStatus = state.session.remainingPickCount === 0 ? RESULT_STATUS.COMPLETE : RESULT_STATUS.PARTIAL;
  const resultRef = `fixture-draft-result:${state.session.draftYear}:${state.session.draftSessionRef}:${selections.map((item) => item.selectionRef).join("|") || "no-selections"}`;
  const globalLimitations = [
    "Fixture result is not persisted or associated with an account.",
    resultStatus === RESULT_STATUS.PARTIAL ? "This result represents a bounded partial fixture, not a complete NFL Draft." : null,
    "Draft Intelligence, team fit, scheme fit, value, confidence, grades, and trade analysis are unavailable.",
  ].filter(Boolean);
  return deepFreeze({
    contract: DRAFT_RESULT_CONTRACT,
    schemaVersion: DRAFT_RESULT_SCHEMA,
    draftResultRef: resultRef,
    sourceDraftSessionRef: state.session.draftSessionRef,
    fixtureVersionRef: state.session.fixtureVersionRef,
    draftYear: state.session.draftYear,
    mode: state.session.mode,
    userTeamRef: state.session.userTeamRef,
    totalRounds: state.session.totalRounds,
    completedRounds: [...new Set(selections.map((selection) => selection.round))],
    totalSelections: selections.length,
    userSelectionCount: userSelections.length,
    startedAtRef: state.session.startedAtRef,
    completedAtRef: suppliedCompletedAtRef,
    completionReason: resultStatus === RESULT_STATUS.COMPLETE ? "FIXTURE_PICK_SCOPE_COMPLETED" : "BOUNDED_FIXTURE_STOP_REACHED",
    resultStatus,
    sourceBoardVersionRef: state.session.boardVersionRef,
    prospectViewVersionRef: sourceProspects[0]?.contractVersion ?? "UNKNOWN",
    draftRoomVersionRef: state.contractVersion,
    fixtureOnly: true,
    persisted: false,
    shareable: false,
    productionResult: false,
    selections,
    completeHistory: selections,
    userDraftClass: {
      userTeamRef: state.session.userTeamRef,
      selectionCount: userSelections.length,
      selections: userSelections,
      positionDistribution: countValues(userSelections, "officialPosition"),
      programDistribution: countValues(userSelections, "program"),
      warningCount: userSelections.reduce((count, item) => count + item.warnings.length, 0),
      fixtureOnly: true,
      limitations: ["Factual fixture summary only; no evaluation score or grade."],
    },
    teamSummaries: [{
      teamRef: state.session.userTeamRef,
      displayName: state.teamContext.displayName,
      selectionCount: userSelections.length,
      selections: userSelections.map((item) => item.selectionRef),
      positionDistribution: countValues(userSelections, "officialPosition"),
      programDistribution: countValues(userSelections, "program"),
      teamContextStatus: "SYNTHETIC_FIXTURE_ONLY",
      intelligenceAvailability: FUTURE_INTELLIGENCE_STATUS,
      limitations: clone(state.teamContext.limitations ?? []),
    }],
    distributions: {
      positions: countValues(selections, "officialPosition"),
      programs: countValues(selections, "program"),
      teams: countValues(selections, "selectingTeamRef"),
      warnings: warningCounts(selections),
    },
    warningSummary: {
      global: globalLimitations,
      selectionWarningCount: selections.reduce((count, item) => count + item.warnings.length, 0),
      byCategory: warningCounts(selections),
    },
    tradeSummary: {
      featureAvailability: state.tradeState.featureAvailability,
      tradeCount: state.tradeState.tradeHistoryRefs.length,
      tradeReferences: clone(state.tradeState.tradeHistoryRefs),
      analysisAvailability: FUTURE_INTELLIGENCE_STATUS,
      limitations: clone(state.tradeState.limitations ?? []),
    },
    futureIntelligence: Object.fromEntries(["draftIntelligence", "pickValue", "teamFit", "schemeFit", "positionalValue", "needFulfillment", "confidence", "classComparison", "explainability", "tradeAnalysis"].map((key) => [key, FUTURE_INTELLIGENCE_STATUS])),
    provenance: {
      source: "SPRINT_2B_2_FINALIZED_FIXTURE_STATE",
      resultBuilderVersion: DRAFT_RESULT_CONTRACT,
      suppliedCompletedAtRef,
    },
    limitations: globalLimitations,
  });
}

export function validateDraftResultSnapshot(snapshot) {
  const errors = [];
  if (snapshot?.contract !== DRAFT_RESULT_CONTRACT) errors.push("INVALID_CONTRACT");
  if (snapshot?.schemaVersion !== DRAFT_RESULT_SCHEMA) errors.push("INVALID_SCHEMA");
  if (!isText(snapshot?.draftResultRef)) errors.push("MISSING_RESULT_REFERENCE");
  if (!snapshot?.fixtureOnly || snapshot?.persisted || snapshot?.shareable || snapshot?.productionResult) errors.push("INVALID_FIXTURE_CLASSIFICATION");
  if (!Array.isArray(snapshot?.selections)) errors.push("INVALID_SELECTIONS");
  const selections = snapshot?.selections ?? [];
  if (new Set(selections.map((item) => item.selectionRef)).size !== selections.length) errors.push("DUPLICATE_SELECTION_REFERENCE");
  if (new Set(selections.map((item) => item.pickRef)).size !== selections.length) errors.push("DUPLICATE_PICK_REFERENCE");
  if (snapshot?.totalSelections !== selections.length) errors.push("SELECTION_COUNT_MISMATCH");
  if (snapshot?.userSelectionCount !== snapshot?.userDraftClass?.selections?.length) errors.push("USER_SELECTION_COUNT_MISMATCH");
  if (selections.some((item, index) => item.selectionOrder !== index + 1)) errors.push("SELECTION_ORDER_INVALID");
  if (Object.values(snapshot?.userDraftClass?.positionDistribution ?? {}).reduce((a, b) => a + b, 0) !== snapshot?.userSelectionCount) errors.push("POSITION_DISTRIBUTION_MISMATCH");
  const prohibited = ["grade", "score", "rank", "confidence", "teamFitScore", "schemeFitScore", "pickValueScore"];
  if (prohibited.some((field) => Object.prototype.hasOwnProperty.call(snapshot ?? {}, field) || Object.prototype.hasOwnProperty.call(snapshot?.userDraftClass ?? {}, field))) errors.push("PROHIBITED_EVALUATION_FIELD");
  return deepFreeze({ valid: errors.length === 0, errors });
}
