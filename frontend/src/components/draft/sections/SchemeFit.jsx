import IntelligenceIndicator from "../../draftV3/ui/IntelligenceIndicator";
import { buildProspectIntelligence } from "../../../engines/ProspectIntelligenceEngine";

function SchemeRow({ label, value }) {
  return (
    <div className="scheme_row">
      <span>{label}</span>
      <IntelligenceIndicator value={value || 0} label={`${value || "--"}/100`} />
    </div>
  );
}

function TextList({ items = [] }) {
  return (
    <div className="scheme_fit_list">
      {items.length > 0 ? (
        items.map((item) => (
          <div key={item} className="scheme_fit_item">
            <span>{item}</span>
            <strong>✓</strong>
          </div>
        ))
      ) : (
        <div className="scheme_fit_item">
          <span>Scheme data pending</span>
          <strong>--</strong>
        </div>
      )}
    </div>
  );
}

export default function SchemeFit({ player, intelligence }) {
  const prospectIntelligence = intelligence || buildProspectIntelligence(player);

  const schemeFitSummary =
    prospectIntelligence?.schemeFit ||
    prospectIntelligence?.intelligence?.schemeFit ||
    {};

  const schemeFitProfile = schemeFitSummary?.data || {};

  const roleFits = schemeFitProfile?.roleFits || [];
  const offensiveSchemes = schemeFitProfile?.offensiveSchemes || [];
  const defensiveSchemes = schemeFitProfile?.defensiveSchemes || [];
  const versatility = schemeFitProfile?.versatility || {};
  const strengths = schemeFitProfile?.strengths || [];
  const concerns = schemeFitProfile?.concerns || [];

  const systems =
    offensiveSchemes.length > 0 ? offensiveSchemes : defensiveSchemes;

  return (
    <div className="scheme_dashboard">
      <section className="dashboard_hero scheme_fit_hero intelligence_hero">
        <span>Scheme Fit Engine</span>

        <h1>{versatility.score || "--"}</h1>

        <p>
          {schemeFitSummary?.summary ||
            "This prospect's role projection, system fit, and positional versatility will appear here once the Scheme Fit Engine is connected."}
        </p>
      </section>

      <section className="scheme_dashboard_grid intelligence_grid_two">
        <section className="dashboard_card intelligence_card">
          <h3>Primary NFL Roles</h3>
          <TextList items={roleFits} />
        </section>

        <section className="dashboard_card intelligence_card">
          <h3>Best NFL Systems</h3>
          <TextList items={systems} />
        </section>
      </section>

      <section className="scheme_dashboard_grid intelligence_grid_two">
        <section className="dashboard_card intelligence_card">
          <h3>Scheme Scores</h3>

          <SchemeRow label="Role Fit" value={versatility.score} />
          <SchemeRow label="Scheme Versatility" value={versatility.score} />
          <SchemeRow label="System Translation" value={versatility.score} />
          <SchemeRow label="Positional Flexibility" value={versatility.score} />
        </section>

        <section className="dashboard_card scheme_translation intelligence_card">
          <h3>Scheme Intelligence Notes</h3>

          <p>
            {schemeFitProfile?.notes ||
              "Ideal offensive and defensive scheme fits, positional versatility, coaching preferences, and deployment recommendations will appear here once the Scheme Fit Engine is connected."}
          </p>
        </section>
      </section>

      <section className="scheme_dashboard_grid intelligence_grid_two">
        <section className="dashboard_card intelligence_card">
          <h3>Best Translation Traits</h3>
          <TextList items={strengths} />
        </section>

        <section className="dashboard_card intelligence_card">
          <h3>Potential Fit Concerns</h3>
          <TextList items={concerns} />
        </section>
      </section>
    </div>
  );
}