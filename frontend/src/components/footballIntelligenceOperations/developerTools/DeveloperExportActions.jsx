import { useEffect, useState } from "react";
import {
  copyDeveloperRecord,
  createDeveloperFilename,
  downloadDeveloperRecord,
} from "./developerExportUtils.js";

function copyLabel(kind, state) {
  const base = kind === "selected" ? "Copy Selected Record" : "Copy Full Evaluation";
  if (state === "COPYING") return "Copying…";
  if (state === "COPIED") return "Copied";
  if (state === "FAILED") return "Copy Failed";
  return base;
}

export default function DeveloperExportActions({ selectedRecord, selectedRecordKey, evaluation, prospectId }) {
  const [selectedCopyState, setSelectedCopyState] = useState("IDLE");
  const [fullCopyState, setFullCopyState] = useState("IDLE");
  const [downloadFailed, setDownloadFailed] = useState(false);

  useEffect(() => {
    setSelectedCopyState("IDLE");
    setDownloadFailed(false);
  }, [selectedRecord, selectedRecordKey]);

  useEffect(() => {
    setFullCopyState("IDLE");
    setDownloadFailed(false);
  }, [evaluation]);

  async function handleCopy(value, setState) {
    setState("COPYING");
    try {
      await copyDeveloperRecord(value);
      setState("COPIED");
    } catch {
      setState("FAILED");
    }
  }

  function handleDownload(value, options) {
    try {
      downloadDeveloperRecord(value, createDeveloperFilename({ ...options, prospectId }));
      setDownloadFailed(false);
    } catch {
      setDownloadFailed(true);
    }
  }

  const selectedAvailable = selectedRecord !== null && selectedRecord !== undefined;
  const evaluationAvailable = evaluation !== null && evaluation !== undefined;
  const copyFailed = selectedCopyState === "FAILED" || fullCopyState === "FAILED";

  return (
    <section className="fio-developer-section fio-developer-actions">
      <h3>Export / Copy Actions</h3>
      <div className="fio-developer-action-grid">
        <button type="button" onClick={() => handleCopy(selectedRecord, setSelectedCopyState)} disabled={!selectedAvailable || selectedCopyState === "COPYING"}>{copyLabel("selected", selectedCopyState)}</button>
        <button type="button" onClick={() => handleCopy(evaluation, setFullCopyState)} disabled={!evaluationAvailable || fullCopyState === "COPYING"}>{copyLabel("full", fullCopyState)}</button>
        <button type="button" onClick={() => handleDownload(selectedRecord, { recordKey: selectedRecordKey })} disabled={!selectedAvailable}>Download Selected JSON</button>
        <button type="button" onClick={() => handleDownload(evaluation, { fullEvaluation: true })} disabled={!evaluationAvailable}>Download Full Evaluation JSON</button>
      </div>
      <div className="fio-developer-copy-status" aria-live="polite">
        {copyFailed ? "Copy could not be completed." : downloadFailed ? "Download could not be completed." : selectedCopyState === "COPIED" || fullCopyState === "COPIED" ? "Sanitized JSON copied." : ""}
      </div>
    </section>
  );
}
