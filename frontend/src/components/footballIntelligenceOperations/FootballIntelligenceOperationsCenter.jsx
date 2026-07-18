import { useEffect, useState } from "react";
import OperationsCenterHeader from "./OperationsCenterHeader.jsx";
import ProspectCommand from "./prospectCommand/ProspectCommand.jsx";
import ExecutiveEvaluationSummary from "./evaluationSummary/ExecutiveEvaluationSummary.jsx";
import QuarterbackComponentBreakdown from "./componentBreakdown/QuarterbackComponentBreakdown.jsx";
import { QUARTERBACK_COMPONENT_ORDER } from "./componentBreakdown/componentBreakdownFormatters.js";
import ComponentInspector from "./componentInspector/ComponentInspector.jsx";
import AggregationInspector from "./aggregationInspector/AggregationInspector.jsx";
import SourceInspector from "./sourceInspector/SourceInspector.jsx";
import ModelHealth from "./modelHealth/ModelHealth.jsx";
import ConclusionsInspector from "./conclusionsInspector/ConclusionsInspector.jsx";
import DeveloperTools from "./developerTools/DeveloperTools.jsx";
import { createIdleDiagnosticState } from "./modelHealth/modelHealthFormatters.js";
import { prepareQuarterbackProspectEvaluation } from "../../services/development/prepareQuarterbackProspectEvaluation.js";
import "./football-intelligence-operations.css";

export default function FootballIntelligenceOperationsCenter() {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedComponentKey, setSelectedComponentKey] = useState("accuracy");
  const [selectedSourceKey, setSelectedSourceKey] = useState("production");
  const [diagnosticState, setDiagnosticState] = useState(createIdleDiagnosticState);

  useEffect(() => {
    const components = evaluation?.result?.components;
    if (!evaluation?.success || !components || components[selectedComponentKey]) return;

    const fallback = QUARTERBACK_COMPONENT_ORDER.find(([key]) => components[key]);
    if (fallback) setSelectedComponentKey(fallback[0]);
  }, [evaluation, selectedComponentKey]);

  function handleProspectChange(prospect) {
    setSelectedProspect(prospect);
    setEvaluation(null);
  }

  function handleRunEvaluation() {
    if (!selectedProspect || isEvaluating) return;

    setIsEvaluating(true);
    setEvaluation(null);

    window.setTimeout(() => {
      const nextEvaluation = prepareQuarterbackProspectEvaluation({
        prospect: selectedProspect,
      });
      setEvaluation(nextEvaluation);
      setIsEvaluating(false);
    }, 0);
  }

  return (
    <div className="fio-page">
      <OperationsCenterHeader />

      <main className="fio-workspace">
        <div className="fio-workspace__primary">
          <ProspectCommand
            selectedProspect={selectedProspect}
            onProspectChange={handleProspectChange}
            readiness={
              isEvaluating
                ? { status: "RUNNING", missingRequirements: [], missingOptional: [] }
                : evaluation?.readiness || {
                    status: "PENDING",
                    missingRequirements: [],
                    missingOptional: [],
                  }
            }
            coverage={evaluation?.coverage || null}
            isEvaluating={isEvaluating}
            hasEvaluation={Boolean(evaluation)}
            onRunEvaluation={handleRunEvaluation}
          />

          <ExecutiveEvaluationSummary
            selectedProspect={selectedProspect}
            evaluation={evaluation}
            isEvaluating={isEvaluating}
          />

          <ModelHealth
            evaluation={evaluation}
            isEvaluating={isEvaluating}
            diagnosticState={diagnosticState}
            onDiagnosticStateChange={setDiagnosticState}
          />
        </div>

        <QuarterbackComponentBreakdown
          evaluation={evaluation}
          isEvaluating={isEvaluating}
          selectedComponentKey={selectedComponentKey}
          onSelectComponent={setSelectedComponentKey}
        />

        <ComponentInspector
          evaluation={evaluation}
          isEvaluating={isEvaluating}
          componentKey={selectedComponentKey}
        />

        <AggregationInspector
          evaluation={evaluation}
          isEvaluating={isEvaluating}
        />

        <SourceInspector
          evaluation={evaluation}
          isEvaluating={isEvaluating}
          selectedSourceKey={selectedSourceKey}
          onSelectSource={setSelectedSourceKey}
        />

        <ConclusionsInspector
          evaluation={evaluation}
          isEvaluating={isEvaluating}
        />

        <DeveloperTools
          evaluation={evaluation}
          isEvaluating={isEvaluating}
          diagnosticState={diagnosticState}
        />

        <p className="fio-viewport-note" role="note">
          A wider desktop viewport is recommended for the full operations
          workspace.
        </p>
      </main>
    </div>
  );
}
