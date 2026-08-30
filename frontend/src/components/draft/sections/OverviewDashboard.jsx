import IntelligenceCard from "../../draftV3/Intelligence/ui/IntelligenceCard";
import { buildProspectIntelligence } from "../../../engines/ProspectIntelligenceEngine";
import { buildExecutiveSummary } from "../../../engines/ExecutiveSummaryEngine";

function formatTraitLabel(label) {
  return label.replace(/([A-Z])/g, " $1").trim();
}

function getTopTraits(traits = {}, limit = 3) {
  return Object.entries(traits)
    .filter(([, value]) => typeof value === "number")
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([trait, value]) => ({
      label: formatTraitLabel(trait),
      value,
    }));
}

function OverviewMetric({ label, value }) {
  return (
    <div className="overview_metric">
      <span>{label}</span>
      <strong>{value || "Pending"}</strong>
    </div>
  );
}

function TraitPill({ label, value }) {
  return (
    <div className="overview_trait_pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function OverviewDashboard({ player, intelligence }) {
  const prospectIntelligence = intelligence || buildProspectIntelligence(player);
  const executiveSummary = buildExecutiveSummary(prospectIntelligence);

  const bio = prospectIntelligence?.profile?.bio || {};
  const rankings = prospectIntelligence?.profile?.rankings || {};

  const evaluationSummary =
    prospectIntelligence?.intelligence?.evaluation || {};
  const evaluation = evaluationSummary?.data || {};

  const traitSummary = prospectIntelligence?.intelligence?.traits || {};
  const traits = traitSummary?.data?.traits || {};

  const schemeFitSummary =
    prospectIntelligence?.schemeFit ||
    prospectIntelligence?.intelligence?.schemeFit ||
    {};

  const schemeFitProfile =
    schemeFitSummary?.data?.playerId || schemeFitSummary?.data?.roleFits
      ? schemeFitSummary.data
      : schemeFitSummary || {};

  const offensiveSchemes = schemeFitProfile?.offensiveSchemes || [];
  const defensiveSchemes = schemeFitProfile?.defensiveSchemes || [];
  const roleFits = schemeFitProfile?.roleFits || [];

  const schemeFits =
    offensiveSchemes.length > 0 ? offensiveSchemes : defensiveSchemes;

  const position = bio.position || player?.position || "Position";
  const school = bio.school || player?.college || "School";
  const grade = evaluation.grade || player?.grade || "Pending";

  const topTraits = getTopTraits(traits);

  return (
    <div className="overview_dashboard overview_dashboard_v2">
      <section className="overview_hero_card intelligence_hero">
        <div className="overview_hero_kicker">
          LBHT Front Office Recommendation
        </div>

        <h3>{executiveSummary.headline}</h3>

        <p>{executiveSummary.summary}</p>

        <div className="overview_recommendation_bar">
          <div>
            <span>Recommendation</span>
            <strong>{executiveSummary.recommendation}</strong>
          </div>

          <div>
            <span>Confidence</span>
            <strong>{executiveSummary.confidence}</strong>
          </div>

          <div>
            <span>Risk</span>
            <strong>{executiveSummary.risk}</strong>
          </div>
        </div>
      </section>

      <section className="overview_dashboard_grid">
        <IntelligenceCard title="Draft Profile">
          <div className="overview_grade_block">
            <span>Overall Grade</span>
            <strong>{grade}</strong>
          </div>

          <div className="overview_metric_grid">
            <OverviewMetric
              label="Consensus Rank"
              value={rankings.consensus ? `#${rankings.consensus}` : "Pending"}
            />
            <OverviewMetric label="Position Rank" value={rankings.position} />
            <OverviewMetric label="Tier" value={evaluation.tier} />
            <OverviewMetric label="Projection" value={evaluation.projection} />
          </div>
        </IntelligenceCard>

        <IntelligenceCard title="Player Identity">
          <div className="overview_metric_grid">
            <OverviewMetric label="Position" value={position} />
            <OverviewMetric label="School" value={school} />
            <OverviewMetric label="Archetype" value={evaluation.archetype} />
            <OverviewMetric label="Readiness" value={evaluation.readiness} />
          </div>
        </IntelligenceCard>

        <IntelligenceCard title="Trait Snapshot">
          <div className="overview_trait_pill_stack">
            {topTraits.length > 0 ? (
              topTraits.map((trait) => (
                <TraitPill
                  key={trait.label}
                  label={trait.label}
                  value={trait.value}
                />
              ))
            ) : (
              <TraitPill label="Trait Engine" value="Pending" />
            )}
          </div>
        </IntelligenceCard>
      </section>

      <section className="overview_analysis_row intelligence_grid_two">
        <IntelligenceCard title="Top Strengths">
          <div className="overview_trait_stack">
            {(evaluation.strengths || []).length > 0 ? (
              evaluation.strengths.map((strength) => (
                <span key={strength}>{strength}</span>
              ))
            ) : (
              <>
                <span>Trait Engine Connected</span>
                <span>Scouting Engine Pending</span>
                <span>Evaluation Data Pending</span>
              </>
            )}
          </div>
        </IntelligenceCard>

        <IntelligenceCard title="Development Areas">
          <div className="overview_trait_stack warning">
            {(evaluation.weaknesses || []).length > 0 ? (
              evaluation.weaknesses.map((weakness) => (
                <span key={weakness}>{weakness}</span>
              ))
            ) : (
              <>
                <span>Risk Profile Pending</span>
                <span>Development Projection Pending</span>
                <span>Scouting Engine Pending</span>
              </>
            )}
          </div>
        </IntelligenceCard>
      </section>

      <section className="overview_bottom_row intelligence_grid_two">
        <IntelligenceCard title="Scheme Fits">
          <div className="overview_metric_grid">
            {schemeFits.length > 0 ? (
              schemeFits.slice(0, 3).map((fit) => (
                <OverviewMetric key={fit} label={fit} value="Strong Fit" />
              ))
            ) : roleFits.length > 0 ? (
              roleFits.slice(0, 3).map((role) => (
                <OverviewMetric key={role} label={role} value="Role Fit" />
              ))
            ) : (
              <>
                <OverviewMetric label="Scheme Fit Engine" value="Pending" />
                <OverviewMetric label="Role Projection" value="Pending" />
                <OverviewMetric label="System Fit" value="Pending" />
                <OverviewMetric label="Team Fit Engine" value="Pending" />
              </>
            )}
          </div>
        </IntelligenceCard>

        <IntelligenceCard title="NFL Projection">
          <div className="overview_projection_block">
            <h4>{evaluation.comparison || "Engine Pending"}</h4>

            <p>
              {evaluation.ceiling || evaluation.floor
                ? `Ceiling: ${evaluation.ceiling || "Pending"} | Floor: ${
                    evaluation.floor || "Pending"
                  }`
                : "Similarity score, ceiling comparison, floor comparison, and role comparison will appear here."}
            </p>
          </div>
        </IntelligenceCard>
      </section>
    </div>
  );
}