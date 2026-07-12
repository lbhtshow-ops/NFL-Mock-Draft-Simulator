import { useMemo, useState } from "react";

import { evaluatePlayer } from "../../../engines/PlayerEvaluationEngine";
import { resolveProspect } from "../../../data/draft/prospects/resolveProspect";

import IntelligenceTabs from "../../draft/shared/IntelligenceTabs";
import ProspectHeader from "../../draft/sections/ProspectHeader";
import OverviewDashboard from "../../draft/sections/OverviewDashboard";
import TraitIntelligence from "../../draft/sections/TraitIntelligence";
import ScoutingReport from "../../draft/sections/ScoutingReport";
import AthleticProfile from "../../draft/sections/AthleticProfile";
import FootballIntelligence from "../../draft/sections/FootballIntelligence";
import SchemeFit from "../../draft/sections/SchemeFit";

export default function ProspectIntelligenceCenter({
  player,
  getProspectGrade,
  getProspectTier,
  getProspectProjection,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const evaluatedPlayer = useMemo(() => {
    const resolvedPlayer = resolveProspect(player);

    if (!resolvedPlayer) {
      return null;
    }

    return evaluatePlayer(resolvedPlayer);
  }, [player]);

  const grade = evaluatedPlayer
    ? evaluatedPlayer.overallGrade || getProspectGrade?.(evaluatedPlayer) || "--"
    : "--";

  const tier = evaluatedPlayer
    ? evaluatedPlayer.tier || getProspectTier?.(evaluatedPlayer) || "--"
    : "--";

  const projection = evaluatedPlayer
    ? evaluatedPlayer.draftProjection ||
      evaluatedPlayer.projection ||
      getProspectProjection?.(evaluatedPlayer) ||
      "--"
    : "--";

  const confidence = evaluatedPlayer
    ? `${evaluatedPlayer.traitConfidence || 0}%`
    : "--";

  return (
    <section className="prospect_intelligence_center">
      <div className="prospect_intelligence_header">
        <p className="prospect_intelligence_kicker">
          Draft Intelligence
        </p>

        <h2>Prospect Intelligence Center</h2>
      </div>

      <ProspectHeader
        player={evaluatedPlayer}
        grade={grade}
        tier={tier}
        projection={projection}
        confidence={confidence}
      />

      <IntelligenceTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="intelligence_workspace">
        {activeTab === "overview" && (
          <OverviewDashboard player={evaluatedPlayer} />
        )}

        {activeTab === "traits" && (
          <TraitIntelligence player={evaluatedPlayer} />
        )}

        {activeTab === "scouting" && (
          <ScoutingReport player={evaluatedPlayer} />
        )}

        {activeTab === "athletic" && (
          <AthleticProfile player={evaluatedPlayer} />
        )}

        {activeTab === "football" && (
          <FootballIntelligence player={evaluatedPlayer} />
        )}

        {activeTab === "scheme" && (
          <SchemeFit player={evaluatedPlayer} />
        )}
      </div>
    </section>
  );
}