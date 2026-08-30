import IntelligenceIndicator from "../../draftV3/ui/IntelligenceIndicator";
import { buildProspectIntelligence } from "../../../engines/ProspectIntelligenceEngine";

function AthleticRow({ label, value }) {
  return (
    <div className="athletic_row">
      <span>{label}</span>
      <IntelligenceIndicator value={value || 0} label={`${value || "--"}/100`} />
    </div>
  );
}

function TestingItem({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "--"}</strong>
    </div>
  );
}

export default function AthleticProfile({ player, intelligence }) {
  const prospectIntelligence = intelligence || buildProspectIntelligence(player);
  const athleticSummary =
  prospectIntelligence?.athletics ||
  prospectIntelligence?.intelligence?.athletics ||
  {};
  const athleticProfile = athleticSummary?.data || {};
  const scores = athleticProfile?.scores || {};
  const testing = athleticProfile?.testing || {};

  const overallScore = scores.overallAthleticScore || "--";

  return (
    <div className="athletic_profile_v2">
      <section className="athletic_hero_card intelligence_hero">
        <div className="athletic_section_label">Athletic Profile</div>

        <div className="athletic_hero_grade">{overallScore}</div>

        <p>
          {athleticSummary?.summary ||
            "Testing data, athletic percentiles, movement profile, and RAS-style projections will appear here once the Athletic Engine is connected."}
        </p>
      </section>

      <section className="athletic_dashboard_grid intelligence_grid_two">
        <section className="athletic_category_card intelligence_card">
          <h3>Movement Skills</h3>

          <AthleticRow label="Speed" value={scores.speed} />
          <AthleticRow label="Agility" value={scores.agility} />
          <AthleticRow
            label="Size Adjusted Athleticism"
            value={scores.sizeAdjustedAthleticism}
          />
        </section>

        <section className="athletic_category_card intelligence_card">
          <h3>Explosion & Power</h3>

          <AthleticRow label="Explosiveness" value={scores.explosiveness} />
          <AthleticRow label="Strength" value={scores.strength} />
          <AthleticRow
            label="Overall Athletic Score"
            value={scores.overallAthleticScore}
          />
        </section>
      </section>

      <section className="athletic_testing_grid intelligence_grid_two">
        <section className="athletic_category_card intelligence_card">
          <h3>Testing Projection</h3>

          <div className="athletic_testing_list">
            <TestingItem label="40 Yard" value={testing.fortyYardDash} />
            <TestingItem label="10 Yard Split" value={testing.tenYardSplit} />
            <TestingItem label="Vertical" value={testing.verticalJump} />
            <TestingItem label="Broad Jump" value={testing.broadJump} />
            <TestingItem label="3 Cone" value={testing.threeCone} />
            <TestingItem label="Shuttle" value={testing.shortShuttle} />
          </div>
        </section>

        <section className="athletic_category_card athletic_ras_card intelligence_card">
          <h3>Athletic Intelligence</h3>

          <div className="athletic_ras_score">{overallScore}</div>

          <p>
            {athleticProfile?.notes ||
              "Relative Athletic Score, testing percentiles, and comparable athlete profiles will appear here once the Athletic Engine is connected."}
          </p>
        </section>
      </section>
    </div>
  );
}