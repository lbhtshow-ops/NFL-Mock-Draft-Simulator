import ModelIdentityPanel from "./ModelIdentityPanel.jsx";
import ModelLifecyclePanel from "./ModelLifecyclePanel.jsx";
import ModelValidationPanel from "./ModelValidationPanel.jsx";
import DiagnosticSuiteSummary from "./DiagnosticSuiteSummary.jsx";
import {
  DIAGNOSTIC_SUITE_INVENTORY,
  normalizeSuiteResult,
} from "./modelHealthFormatters.js";

async function loadAndRunDiagnostics() {
  const loaders = [
    () => import("../../../engines/playerEvaluation/prospectModels/ProspectPositionModelContractDiagnostics.js").then((module) => module.runProspectPositionModelContractDiagnostics({ throwOnFailure: false })),
    () => import("../../../engines/playerEvaluation/prospectModels/shared/ProspectModelSourceAdapterDiagnostics.js").then((module) => module.runProspectModelSourceAdapterDiagnostics({ throwOnFailure: false })),
    () => import("../../../engines/playerEvaluation/prospectModels/shared/ProspectModelAggregationDiagnostics.js").then((module) => module.runProspectModelAggregationDiagnostics({ throwOnFailure: false })),
    () => import("../../../engines/playerEvaluation/prospectModels/registry/ProspectModelRegistryDiagnostics.js").then((module) => module.runProspectModelRegistryDiagnostics({ throwOnFailure: false })),
    () => import("../../../engines/playerEvaluation/prospectModels/quarterback/QuarterbackProspectModelDiagnostics.js").then((module) => module.runQuarterbackProspectModelDiagnostics({ throwOnFailure: false })),
  ];
  const settled = await Promise.allSettled(loaders.map((load) => load()));
  if (settled.some((entry) => entry.status === "rejected")) throw new Error("PERMANENT_DIAGNOSTICS_FAILED");
  return settled.map((entry, index) => normalizeSuiteResult(DIAGNOSTIC_SUITE_INVENTORY[index], entry.value));
}

export default function ModelHealth({ evaluation, isEvaluating, diagnosticState, onDiagnosticStateChange }) {
  const evaluationInvalid = Boolean(evaluation && (!evaluation.success || evaluation.validation?.valid === false));
  const attentionRequired = evaluationInvalid || diagnosticState.status === "FAILED";

  async function handleRunDiagnostics() {
    onDiagnosticStateChange((current) => ({ ...current, status: "RUNNING", error: null }));
    try {
      const suites = await loadAndRunDiagnostics();
      const total = suites.reduce((sum, suite) => sum + suite.total, 0);
      const passedCount = suites.reduce((sum, suite) => sum + suite.passedCount, 0);
      const failedCount = suites.reduce((sum, suite) => sum + suite.failedCount, 0);
      onDiagnosticStateChange({ status: failedCount === 0 ? "PASSED" : "FAILED", suites, total, passedCount, failedCount, error: null });
    } catch {
      onDiagnosticStateChange({
        status: "FAILED",
        suites: [],
        total: 223,
        passedCount: 0,
        failedCount: 0,
        error: { code: "PERMANENT_DIAGNOSTICS_FAILED", message: "Permanent diagnostics could not be completed." },
      });
    }
  }

  return (
    <section className="fio-panel fio-panel--health fio-model-health" aria-labelledby="fio-model-health-title">
      <header className="fio-health-header">
        <div><h2 id="fio-model-health-title">Model Health</h2><p>Authoritative status, validation, versions, and permanent checks.</p></div>
        <strong className={attentionRequired ? "fio-health-overall--attention" : "fio-health-overall--provisional"}>{attentionRequired ? "Attention Required" : "Healthy \u2014 Provisional"}</strong>
      </header>
      <ModelIdentityPanel result={evaluation?.result} />
      <ModelLifecyclePanel />
      <ModelValidationPanel evaluation={evaluation} isEvaluating={isEvaluating} />
      <DiagnosticSuiteSummary diagnosticState={diagnosticState} onRunDiagnostics={handleRunDiagnostics} />
    </section>
  );
}
