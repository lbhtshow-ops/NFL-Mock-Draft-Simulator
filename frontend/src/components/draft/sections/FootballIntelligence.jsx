import IntelligenceIndicator from "../../draftV3/ui/IntelligenceIndicator";
import { buildProspectIntelligence } from "../../../engines/ProspectIntelligenceEngine";

function IQRow({ label, value }) {
  return (
    <div className="football_iq_row">
      <span>{label}</span>
      <IntelligenceIndicator value={value || 0} label={`${value || "--"}/100`} />
    </div>
  );
}

export default function FootballIntelligence({ player }) {
  const prospectIntelligence = buildProspectIntelligence(player);
  const footballIQSummary =
  prospectIntelligence?.footballIQ ||
  prospectIntelligence?.intelligence?.footballIQ ||
  {};
  const footballIQProfile = footballIQSummary?.data || {};

  const mentalProcessing = footballIQProfile?.mentalProcessing || {};
  const footballCharacter = footballIQProfile?.footballCharacter || {};
  const scores = footballIQProfile?.scores || {};

  return (
    <div className="football_iq_v2">
      <section className="football_iq_hero_card intelligence_hero">
        <div className="football_iq_label">Football Intelligence</div>

        <div className="football_iq_grade">
          {scores.overallFootballIQ || "--"}
        </div>

        <p>
          {footballIQSummary?.summary ||
            "Processing speed, recognition, instincts, leadership, competitiveness, coachability, and decision-making profile will appear here once the Football Intelligence Engine is connected."}
        </p>
      </section>

      <section className="football_iq_dashboard_grid intelligence_grid_two">
        <section className="football_iq_category_card intelligence_card">
          <h3>Mental Processing</h3>

          <IQRow label="Processing Speed" value={mentalProcessing.processingSpeed} />
          <IQRow label="Play Recognition" value={mentalProcessing.playRecognition} />
          <IQRow label="Anticipation" value={mentalProcessing.anticipation} />
          <IQRow label="Decision Making" value={mentalProcessing.decisionMaking} />
          <IQRow
            label="Situational Awareness"
            value={mentalProcessing.situationalAwareness}
          />
        </section>

        <section className="football_iq_category_card intelligence_card">
          <h3>Instincts & Awareness</h3>

          <IQRow label="Processing" value={scores.processing} />
          <IQRow label="Instincts" value={scores.instincts} />
          <IQRow label="Awareness" value={scores.awareness} />
          <IQRow label="Leadership" value={scores.leadership} />
        </section>
      </section>

      <section className="football_iq_bottom_grid intelligence_grid_two">
        <section className="football_iq_category_card intelligence_card">
          <h3>Leadership Profile</h3>

          <IQRow label="Leadership" value={footballCharacter.leadership} />
          <IQRow label="Communication" value={footballCharacter.communication} />
          <IQRow label="Coachability" value={footballCharacter.coachability} />
          <IQRow
            label="Competitive Toughness"
            value={footballCharacter.competitiveToughness}
          />
          <IQRow label="Discipline" value={footballCharacter.discipline} />
        </section>

        <section className="football_iq_category_card football_iq_notes_card intelligence_card">
          <h3>Football Intelligence Notes</h3>

          <p>
            {footballIQProfile?.notes ||
              "Mental profile, film-study indicators, leadership notes, processing strengths, recognition weaknesses, and coach feedback will appear here once the Football Intelligence Engine is connected."}
          </p>
        </section>
      </section>
    </div>
  );
}