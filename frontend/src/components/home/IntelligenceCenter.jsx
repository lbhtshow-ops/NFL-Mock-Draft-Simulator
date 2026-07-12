import React from "react";
import LBHTCard from "../ui/LBHTCard";

function IntelligenceCenter() {
  const intelligenceCards = [
    {
      icon: "🧠",
      title: "Advanced Scouting",
      description:
        "Prospect traits, strengths, weaknesses, player grades, and scouting intelligence.",
      action: "View Prospects",
    },
    {
      icon: "⇄",
      title: "Trade Analyzer",
      description:
        "Evaluate trade value, draft capital, team needs, and realistic trade scenarios.",
      action: "View Trade Tool",
    },
    {
      icon: "📊",
      title: "Draft Analytics",
      description:
        "Track positional value, draft trends, team needs, and board movement.",
      action: "View Analytics",
    },
    {
      icon: "🛡️",
      title: "Draft Recaps",
      description:
        "Generate team-by-team recaps, draft grades, reaches, steals, and explanations.",
      action: "View Recaps",
    },
  ];

  return (
    <LBHTCard className="intelligence_center_v2" variant="glass">
      <div className="intelligence_center_v2_header">
        <p className="intelligence_center_v2_kicker">Intelligence Center</p>
        <h2>Draft Intelligence Tools</h2>
        <p>
          Explore the engines that power scouting, team fit, trades, analytics,
          and draft explainability.
        </p>
      </div>

      <div className="intelligence_center_v2_grid">
        {intelligenceCards.map((card) => (
          <button
            key={card.title}
            type="button"
            className="intelligence_card_v2"
          >
            <span className="intelligence_card_v2_icon">{card.icon}</span>

            <div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <strong>{card.action} →</strong>
            </div>
          </button>
        ))}
      </div>
    </LBHTCard>
  );
}

export default IntelligenceCenter;