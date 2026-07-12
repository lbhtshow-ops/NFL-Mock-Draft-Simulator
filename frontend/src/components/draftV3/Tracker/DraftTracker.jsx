import { useState } from "react";
import TeamLogo from "../ui/TeamLogo";

const teamNames = {
  ARI: "Arizona Cardinals",
  CLE: "Cleveland Browns",
  NYG: "New York Giants",
  TEN: "Tennessee Titans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  WAS: "Washington Commanders",
  NO: "New Orleans Saints",
  LV: "Las Vegas Raiders",
  CAR: "Carolina Panthers",
  NYJ: "New York Jets",
  DAL: "Dallas Cowboys",
  MIA: "Miami Dolphins",
  ATL: "Atlanta Falcons",
  CHI: "Chicago Bears",
};

const roundPicks = [
  { overall: 1, round: 1, pickInRound: 1, team: "IND" },
  { overall: 2, round: 1, pickInRound: 2, team: "JAX" },
  { overall: 3, round: 1, pickInRound: 3, team: "ARI" },
  { overall: 4, round: 1, pickInRound: 4, team: "CLE" },
  { overall: 5, round: 1, pickInRound: 5, team: "NYG" },
  { overall: 6, round: 1, pickInRound: 6, team: "TEN" },
  { overall: 7, round: 1, pickInRound: 7, team: "WAS" },
  { overall: 8, round: 1, pickInRound: 8, team: "NO" },
  { overall: 9, round: 1, pickInRound: 9, team: "LV" },
  { overall: 10, round: 1, pickInRound: 10, team: "CAR" },
  { overall: 11, round: 1, pickInRound: 11, team: "NYJ" },
  { overall: 12, round: 1, pickInRound: 12, team: "DAL" },
  { overall: 13, round: 1, pickInRound: 13, team: "MIA" },
  { overall: 14, round: 1, pickInRound: 14, team: "IND" },
  { overall: 15, round: 1, pickInRound: 15, team: "ATL" },
  { overall: 16, round: 1, pickInRound: 16, team: "CHI" },
];

const feedItems = [
  { type: "Intel", time: "Now", text: "Arizona evaluating offensive tackles." },
  { type: "Rumor", time: "2m", text: "Browns interested in quarterback." },
  { type: "Trade", time: "4m", text: "Trade market currently quiet." },
  {
    type: "Projection",
    time: "Live",
    text: "LBHT projects OT as the most likely selection.",
  },
];

function formatPick(pick) {
  if (!pick) return "--";
  return `${pick.round}.${String(pick.pickInRound).padStart(2, "0")}`;
}

function getTeamName(abbreviation) {
  return teamNames[abbreviation] || abbreviation || "Unknown Team";
}

function getProspectName(prospect) {
  return (
    prospect?.bio?.name ||
    prospect?.displayName ||
    prospect?.name ||
    prospect?.player ||
    prospect?.identity?.playerName ||
    null
  );
}

function formatScore(score) {
  return typeof score === "number" ? Math.round(score) : "--";
}

function DecisionSummary({ draftPick }) {
  const explanation = draftPick?.draftExplanation;
  const reasons = explanation?.reasons || [];

  if (draftPick.draftMode !== "cpu") {
    return null;
  }

  return (
    <div className="history_decision_summary">
      <div className="history_score_grid">
        <span>Decision {formatScore(draftPick.decisionScore)}</span>
        <span>Intel {formatScore(draftPick.intelligenceScore)}</span>
        <span>Fit {formatScore(draftPick.teamFitScore)}</span>
        <span>Consensus {formatScore(draftPick.consensusValue)}</span>
      </div>

      {reasons.length > 0 && (
        <ul className="history_reason_list">
          {reasons.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DraftTracker({
  currentPick,
  draftHistory = [],
  onSelectProspect,
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [expandedPickKey, setExpandedPickKey] = useState(null);

  const currentTeamName = currentPick
    ? getTeamName(currentPick.team)
    : "Draft Complete";

  const currentPickLabel = formatPick(currentPick);
  const completedPicks = draftHistory.length;
  const roundProgressPercent = Math.round((completedPicks / 32) * 100);
  const overallProgressPercent = Math.round((completedPicks / 257) * 100);

  return (
    <header className="draft_tracker">
      <section className="tracker_progress">
        <span className="tracker_kicker">ROUND {currentPick?.round || 1}</span>

        <div className="tracker_progress_pick">
          <span>Current Pick</span>
          <strong>{currentPickLabel}</strong>
        </div>

        <div className="tracker_progress_meta">
          <div>
            <span>Round Progress</span>
            <strong>{completedPicks} / 32</strong>
          </div>

          <div>
            <span>Overall</span>
            <strong>{currentPick?.overall || "--"} / 257</strong>
          </div>
        </div>

        <div className="tracker_progress_bar">
          <div
            className="tracker_progress_fill"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>

        <div className="tracker_progress_footer">
          <span>{roundProgressPercent}% Complete</span>
          <span>Draft Pace: Normal</span>
        </div>
      </section>

      <section className="tracker_command">
        <div className="tracker_team">
          <div className="tracker_logo tracker_logo_real">
            <TeamLogo
              abbreviation={currentPick?.team}
              name={currentTeamName}
              size="lg"
            />
          </div>

          <div className="tracker_team_info">
            <span className="tracker_kicker">
              {currentPick ? "ON THE CLOCK" : "DRAFT STATUS"}
            </span>

            <h2>{currentTeamName}</h2>

            <p>
              {currentPick
                ? "AI Selecting..."
                : "All available prospects drafted"}
            </p>
          </div>
        </div>

        <div className="tracker_prediction">
          <div className="prediction_title">LBHT Projection</div>

          <div className="prediction_grid">
            <div className="prediction_card">
              <span>OT</span>
              <strong>76%</strong>
            </div>

            <div className="prediction_card">
              <span>EDGE</span>
              <strong>18%</strong>
            </div>

            <div className="prediction_card">
              <span>Trade</span>
              <strong>6%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="tracker_upcoming">
        <span className="tracker_kicker">ROUND BOARD</span>

        <div className="tracker_pick_list">
          {roundPicks.map((item) => {
            const draftedPick = draftHistory.find(
              (draftPick) => draftPick.overallPick === item.overall
            );

            const status =
              item.overall === currentPick?.overall
                ? "current"
                : item.overall < (currentPick?.overall || 0)
                ? "completed"
                : "upcoming";

            const prospectName = getProspectName(draftedPick?.prospect);

            return (
              <div
                key={item.overall}
                className={`tracker_pick tracker_pick_${status}`}
              >
                <strong>{formatPick(item)}</strong>
                <span>{item.team}</span>
                {prospectName && <small>{prospectName}</small>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="tracker_feed tracker_history">
        <button
          type="button"
          className="tracker_feed_header tracker_history_toggle"
          onClick={() => setIsHistoryOpen((current) => !current)}
        >
          <span>DRAFT HISTORY</span>
          <span>{isHistoryOpen ? "−" : "+"}</span>
        </button>

        {isHistoryOpen && (
          <div className="tracker_feed_items tracker_history_items">
            {draftHistory.length === 0 ? (
              <div className="feed_item">
                <p>No picks made yet.</p>
              </div>
            ) : (
              [...draftHistory]
                .slice()
                .reverse()
                .map((draftPick) => {
                  const prospectName = getProspectName(draftPick.prospect);
                  const pickKey = `${draftPick.overallPick}-${prospectName}`;
                  const isExpanded = expandedPickKey === pickKey;

                  return (
                    <div key={pickKey} className="tracker_history_pick">
                      <button
                        type="button"
                        className="tracker_history_main"
                        onClick={() => onSelectProspect?.(draftPick.prospect)}
                      >
                        <span className="feed_item_type">
                          {draftPick.round}.
                          {String(draftPick.pickInRound).padStart(2, "0")}
                        </span>

                        <p>
                          {draftPick.team} selected{" "}
                          {prospectName || "Unknown Prospect"}
                        </p>

                        <span className="feed_item_time">
                          {draftPick.draftMode === "user" ? "User" : "CPU"}
                        </span>
                      </button>

                      {draftPick.draftMode === "cpu" && (
                        <button
                          type="button"
                          className="history_details_toggle"
                          onClick={() =>
                            setExpandedPickKey((currentKey) =>
                              currentKey === pickKey ? null : pickKey
                            )
                          }
                        >
                          {isExpanded ? "Hide Details" : "Details"}
                        </button>
                      )}

                      {isExpanded && <DecisionSummary draftPick={draftPick} />}
                    </div>
                  );
                })
            )}
          </div>
        )}
      </section>

      <section className="tracker_feed">
        <div className="tracker_feed_header">LIVE DRAFT FEED</div>

        <div className="tracker_feed_items">
          {feedItems.map((item) => (
            <div
              key={`${item.type}-${item.text}`}
              className={`feed_item feed_item_${item.type.toLowerCase()}`}
            >
              <span className="feed_item_type">{item.type}</span>
              <p>{item.text}</p>
              <span className="feed_item_time">{item.time}</span>
            </div>
          ))}
        </div>
      </section>
    </header>
  );
}