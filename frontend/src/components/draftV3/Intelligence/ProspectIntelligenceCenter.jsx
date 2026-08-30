import { useMemo, useState } from "react";

import { resolveSportsProspectIntelligence } from "../../../data/sportsIntelligence/SportsIntelligenceEngine";

import IntelligenceTabs from "../../draft/shared/IntelligenceTabs";
import ProspectHeader from "../../draft/sections/ProspectHeader";
import OverviewDashboard from "../../draft/sections/OverviewDashboard";
import TraitIntelligence from "../../draft/sections/TraitIntelligence";
import ScoutingReport from "../../draft/sections/ScoutingReport";
import AthleticProfile from "../../draft/sections/AthleticProfile";
import FootballIntelligence from "../../draft/sections/FootballIntelligence";
import SchemeFit from "../../draft/sections/SchemeFit";

export default function ProspectIntelligenceCenter({ player }) {
  const [activeTab, setActiveTab] = useState("overview");

  const sportsIntelligence = useMemo(
    () => resolveSportsProspectIntelligence(player),
    [player]
  );

  const bio = sportsIntelligence?.profile?.bio || {};
  const evaluationSummary = sportsIntelligence?.intelligence?.evaluation || sportsIntelligence?.evaluation || {};
  const evaluation =
    evaluationSummary?.value?.data ||
    evaluationSummary?.data ||
    {};
  const development = sportsIntelligence?.developmentProjection || null;
  const fieStatus = sportsIntelligence?.sportsIntelligence || {};
  const canonicalModelUnavailable =
    fieStatus.canonicalProspectConnected &&
    !fieStatus.canonicalProspectAvailable;
  const canonicalModelStatus = fieStatus.canonicalProspectError || null;

  const displayPlayer = player
    ? {
        ...player,
        name: bio.playerName || bio.name || development?.subject?.name || player.name,
        player: bio.playerName || bio.name || development?.subject?.name || player.player || player.name,
        position: bio.position || development?.subject?.position || player.position,
        school: bio.school || development?.subject?.school || player.school || player.college,
        college: bio.school || development?.subject?.school || player.college || player.school,
      }
    : null;

  const canonicalEvaluationData = evaluation?.evaluation || evaluation;
  const canonicalModelResult = sportsIntelligence?.canonicalProspectModelResult || null;
  const grade =
    Number.isFinite(canonicalModelResult?.overallGrade)
      ? canonicalModelResult.overallGrade
      : Number.isFinite(canonicalEvaluationData?.overallGrade)
        ? canonicalEvaluationData.overallGrade
        : "--";
  const tier = canonicalEvaluationData.tier ?? (canonicalModelUnavailable ? "Model Not Available" : "Pending");
  const projection = canonicalEvaluationData.draftProjection ?? canonicalEvaluationData.projection ?? (canonicalModelUnavailable ? "Model Not Available" : "Pending");
  const confidence = Number.isFinite(evaluationSummary?.confidence)
    ? `${Math.round(evaluationSummary.confidence * (evaluationSummary.confidence <= 1 ? 100 : 1))}%`
    : canonicalModelUnavailable
      ? "0%"
      : "Pending";

  return (
    <section className="prospect_intelligence_center">
      <div className="prospect_intelligence_header">
        <p className="prospect_intelligence_kicker">Sports Intelligence Engine</p>
        <h2>Prospect Intelligence Center</h2>
        <p className="prospect_intelligence_source">
          {fieStatus.canonicalProspectConnected
            ? fieStatus.canonicalProspectAvailable
              ? `Canonical FIE prospect model connected · ${fieStatus.canonicalProspectPosition || "position"} · ${fieStatus.canonicalProspectReadiness}`
              : `Canonical FIE connected · ${fieStatus.canonicalProspectPosition || "position"} model unavailable${canonicalModelStatus ? ` · ${canonicalModelStatus}` : ""}`
            : fieStatus.sourceClassification === "DEVELOPMENT_FIXTURE_PROJECTION"
              ? "2027 development projection · canonical FIE prospect runtime unavailable"
              : fieStatus.footballIntelligenceAvailable
                ? "Football Intelligence Platform connected · canonical prospect runtime unavailable"
                : "Select a prospect to request intelligence"}
        </p>
      </div>

      <ProspectHeader
        player={displayPlayer}
        grade={grade}
        tier={tier}
        projection={projection}
        confidence={confidence}
      />

      <IntelligenceTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="intelligence_workspace">
        {activeTab === "overview" && (
          <OverviewDashboard player={displayPlayer} intelligence={sportsIntelligence} />
        )}
        {activeTab === "traits" && (
          <TraitIntelligence player={displayPlayer} intelligence={sportsIntelligence} />
        )}
        {activeTab === "scouting" && (
          <ScoutingReport player={displayPlayer} intelligence={sportsIntelligence} />
        )}
        {activeTab === "athletic" && (
          <AthleticProfile player={displayPlayer} intelligence={sportsIntelligence} />
        )}
        {activeTab === "football" && (
          <FootballIntelligence player={displayPlayer} intelligence={sportsIntelligence} />
        )}
        {activeTab === "scheme" && (
          <SchemeFit player={displayPlayer} intelligence={sportsIntelligence} />
        )}
      </div>
    </section>
  );
}
