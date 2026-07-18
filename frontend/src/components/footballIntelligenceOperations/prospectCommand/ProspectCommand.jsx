import { useEffect, useMemo, useState } from "react";
import prospects from "../../../data/draft/prospects.js";
import PositionSelector from "./PositionSelector.jsx";
import ProspectSelector from "./ProspectSelector.jsx";
import ProspectIdentityCard from "./ProspectIdentityCard.jsx";
import EvaluationReadinessCard from "./EvaluationReadinessCard.jsx";
import IntelligenceCoverageCard from "./IntelligenceCoverageCard.jsx";
import RunEvaluationButton from "./RunEvaluationButton.jsx";

function normalizeProspect(prospect) {
  return {
    id: prospect.canonicalId || prospect.playerId || prospect.prospectId || prospect.id,
    name: prospect.player || prospect.name || "Unknown Prospect",
    position: prospect.position || null,
    school: prospect.school || prospect.college || null,
    draftClass: prospect.draftClass || prospect.classYear || null,
  };
}

export default function ProspectCommand({
  selectedProspect,
  onProspectChange,
  readiness,
  coverage,
  isEvaluating,
  hasEvaluation,
  onRunEvaluation,
}) {
  const [position, setPosition] = useState("QB");
  const availableProspects = useMemo(
    () => prospects.map(normalizeProspect).filter((prospect) => prospect.position === position),
    [position]
  );
  useEffect(() => {
    if (!selectedProspect && availableProspects[0]) {
      onProspectChange(availableProspects[0]);
    }
  }, [availableProspects, onProspectChange, selectedProspect]);

  function handlePositionChange(nextPosition) {
    const nextProspects = prospects
      .map(normalizeProspect)
      .filter((prospect) => prospect.position === nextPosition);
    setPosition(nextPosition);
    onProspectChange(nextProspects[0] || null);
  }

  return (
    <section className="fio-panel fio-panel--command" aria-labelledby="fio-command-title">
      <h2 id="fio-command-title">Prospect Command</h2>
      <div className="fio-command-content">
        <PositionSelector value={position} onChange={handlePositionChange} />
        <ProspectSelector
          prospects={availableProspects}
          value={selectedProspect?.id || ""}
          onChange={(prospectId) =>
            onProspectChange(
              availableProspects.find((prospect) => prospect.id === prospectId) || null
            )
          }
        />
        <ProspectIdentityCard prospect={selectedProspect} />
        <EvaluationReadinessCard
          readiness={readiness}
        />
        <IntelligenceCoverageCard
          coverage={coverage}
          isRunning={isEvaluating}
        />
        <RunEvaluationButton
          disabled={!selectedProspect || isEvaluating}
          isRunning={isEvaluating}
          hasEvaluation={hasEvaluation}
          onRunEvaluation={onRunEvaluation}
        />
      </div>
    </section>
  );
}
