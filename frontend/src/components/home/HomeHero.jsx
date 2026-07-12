import React from "react";
import LBHTCard from "../ui/LBHTCard";

function HomeHero({ logoSrc }) {
  const capabilityChips = [
    "Football Intelligence",
    "Player Evaluation",
    "Trade Intelligence",
    "Consensus Engine",
    "Explainability",
  ];

  const heroStats = [
    { label: "Draft Class", value: "2027", detail: "Upcoming Draft" },
    { label: "Teams", value: "32", detail: "NFL Teams" },
    { label: "Prospects", value: "487", detail: "Rated Prospects" },
    { label: "Engine Status", value: "Online", detail: "All Systems Operational" },
  ];

  return (
    <LBHTCard className="home_hero_v2" variant="glass">
      <div className="home_hero_v2_inner">
        {logoSrc && (
          <img
            src={logoSrc}
            alt="LBHT logo"
            className="home_hero_v2_logo"
          />
        )}

        <p className="home_hero_v2_kicker">Draft Operations Center</p>

        <h1>2027 NFL Mock Draft Simulator</h1>

        <p className="home_hero_v2_subtitle">
          Powered by the Draft Intelligence Engine.
        </p>

        <div className="home_hero_v2_chips">
          {capabilityChips.map((chip) => (
            <span key={chip} className="home_hero_v2_chip">
              {chip}
            </span>
          ))}
        </div>

        <div className="home_hero_v2_stats">
          {heroStats.map((stat) => (
            <div key={stat.label} className="home_hero_v2_stat">
              <span className="home_hero_v2_stat_label">{stat.label}</span>
              <strong>{stat.value}</strong>
              <span className="home_hero_v2_stat_detail">{stat.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </LBHTCard>
  );
}

export default HomeHero;