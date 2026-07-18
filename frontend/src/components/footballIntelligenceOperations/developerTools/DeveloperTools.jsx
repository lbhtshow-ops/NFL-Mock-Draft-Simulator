import { useEffect, useMemo, useState } from "react";
import ContractResultViewer from "./ContractResultViewer.jsx";
import DeveloperExportActions from "./DeveloperExportActions.jsx";
import DiagnosticDetailPanel from "./DiagnosticDetailPanel.jsx";
import EvaluationMetadataPanel from "./EvaluationMetadataPanel.jsx";
import {
  DEVELOPER_RECORDS,
  getDeveloperRecords,
  hasDeveloperRecord,
} from "./developerToolsFormatters.js";

export default function DeveloperTools({ evaluation, isEvaluating, diagnosticState }) {
  const [selectedRecordKey, setSelectedRecordKey] = useState("evaluation");
  const records = useMemo(
    () => getDeveloperRecords(evaluation, diagnosticState),
    [evaluation, diagnosticState]
  );

  useEffect(() => {
    setSelectedRecordKey(evaluation?.success ? "result" : "evaluation");
  }, [evaluation]);

  useEffect(() => {
    if (hasDeveloperRecord(records[selectedRecordKey])) return;
    if (evaluation?.success && hasDeveloperRecord(records.result)) {
      setSelectedRecordKey("result");
    } else {
      setSelectedRecordKey("evaluation");
    }
  }, [evaluation?.success, records, selectedRecordKey]);

  const selectedDefinition = DEVELOPER_RECORDS.find(({ key }) => key === selectedRecordKey) || DEVELOPER_RECORDS[0];
  const selectedRecord = records[selectedDefinition.key];

  return (
    <section className="fio-panel fio-developer-tools" aria-labelledby="fio-developer-tools-title">
      <header className="fio-developer-header">
        <div>
          <h2 id="fio-developer-tools-title">Developer Tools</h2>
          <p>Read-only contract inspection and deterministic local export.</p>
        </div>
        <strong>Research &amp; Calibration</strong>
      </header>

      <p className="fio-developer-notice" role="note">Developer Tools is read-only. Export and copy actions do not modify the model, registry, data, or evaluation result.</p>

      <EvaluationMetadataPanel evaluation={evaluation} isEvaluating={isEvaluating} />

      {isEvaluating ? (
        <p className="fio-developer-state">Preparing developer inspection data…</p>
      ) : !evaluation ? (
        <p className="fio-developer-state">Run an evaluation to inspect the contract result.</p>
      ) : null}

      <section className="fio-developer-section fio-developer-navigation">
        <h3>Structured Record Navigation</h3>
        <div role="tablist" aria-label="Developer record selection">
          {DEVELOPER_RECORDS.map(({ key, label }) => {
            const available = hasDeveloperRecord(records[key]);
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selectedRecordKey === key}
                className={selectedRecordKey === key ? "fio-developer-tab fio-developer-tab--selected" : "fio-developer-tab"}
                onClick={() => setSelectedRecordKey(key)}
                disabled={!available}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {hasDeveloperRecord(selectedRecord) && !isEvaluating && (
        <ContractResultViewer recordLabel={selectedDefinition.label} value={selectedRecord} />
      )}

      <DeveloperExportActions
        selectedRecord={isEvaluating ? null : selectedRecord}
        selectedRecordKey={selectedDefinition.key}
        evaluation={isEvaluating ? null : evaluation}
        prospectId={evaluation?.prospect?.id ?? evaluation?.playerId}
      />

      <DiagnosticDetailPanel diagnosticState={diagnosticState} />
    </section>
  );
}
