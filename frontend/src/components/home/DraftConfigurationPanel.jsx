import React from "react";
import LBHTCard from "../ui/LBHTCard";
import "../../styles/draft-modes.css";

function DraftConfigurationPanel({
  year,
  setYear,
  setSelectedTeams,
  setYearDropdownInteracted,
  autoPickDelay,
  setAutoPickDelay,
  draftMode,
  setDraftMode,
  numRounds,
  setNumRounds,
  loading,
  dots,
  error,
  onStartDraft,
  onResetSettings,
}) {
  const speedOptions = [
    { label: "Slow", value: 2200 },
    { label: "Normal", value: 1400 },
    { label: "Fast", value: 800 },
    { label: "Very Fast", value: 350 },
  ];

  const roundOptions = [1, 2, 3, 4, 5, 6, 7];

  const draftModes = [
    {
      id: "broadcast",
      label: "Broadcast",
      description: "Full draft-night pacing, live pick clocks, trades, and manual CPU simulation.",
    },
    {
      id: "standard",
      label: "Standard",
      description: "Balanced pacing for the complete draft experience.",
    },
    {
      id: "express",
      label: "Express",
      description: "Faster CPU decisions and shorter user clocks.",
    },
    {
      id: "auto",
      label: "Auto",
      description: "Hands-off simulation with the fastest CPU pacing.",
    },
  ];


  const handleYearChange = (event) => {
    setYear(Number(event.target.value));
    setSelectedTeams([]);
    setYearDropdownInteracted(true);
  };

  return (
    <LBHTCard variant="panel" className="draft_configuration_panel">
      <div className="draft_configuration_header">
        <p className="lbht_kicker">Draft Operations</p>
        <h2 className="lbht_section_title">Draft Configuration</h2>
        <p className="lbht_section_description">
          Configure the draft environment before entering the war room.
        </p>
      </div>

      <div className="draft_configuration_body">
        <label className="draft_configuration_field">
          <span>Draft Class</span>
          <select value={year} onChange={handleYearChange}>
            <option value={2026}>2026 NFL Draft</option>
            <option value={2027}>2027 NFL Draft</option>
          </select>
        </label>

        <div className="draft_configuration_group">
          <span className="draft_configuration_label">Draft Length</span>
          <div className="draft_round_grid">
            {roundOptions.map((round) => (
              <button
                key={round}
                type="button"
                className={numRounds === round ? "active" : ""}
                onClick={() => setNumRounds(round)}
              >
                {round}
              </button>
            ))}
          </div>
        </div>

        <div className="draft_configuration_group">
          <span className="draft_configuration_label">Draft Mode</span>
          <div className="draft_mode_grid">
            {draftModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={draftMode === mode.id ? "active" : ""}
                onClick={() => setDraftMode(mode.id)}
              >
                <strong>{mode.label}</strong>
                <span>{mode.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="draft_configuration_group">
          <span className="draft_configuration_label">Simulation Speed</span>
          <div className="draft_speed_grid">
            {speedOptions.map((speed) => (
              <button
                key={speed.value}
                type="button"
                className={autoPickDelay === speed.value ? "active" : ""}
                onClick={() => setAutoPickDelay(speed.value)}
              >
                {speed.label}
              </button>
            ))}
          </div>
        </div>

        <div className="draft_configuration_actions">
          <button
            type="button"
            className="lbht_btn lbht_btn_secondary"
            onClick={onResetSettings}
          >
            Reset
          </button>

          <button
            type="button"
            className="lbht_btn lbht_btn_primary"
            onClick={onStartDraft}
            disabled={loading}
          >
            {loading ? `Starting Draft${dots}` : "Enter Draft Room"}
          </button>
        </div>

        {error && <p className="draft_configuration_error">{error}</p>}
      </div>
    </LBHTCard>
  );
}

export default DraftConfigurationPanel;