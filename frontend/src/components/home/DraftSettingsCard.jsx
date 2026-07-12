import React from "react";
import LBHTCard from "../ui/LBHTCard";
import LBHTButton from "../ui/LBHTButton";

function DraftSettingsCard({
  name,
  setName,
  year,
  setYear,
  setSelectedTeams,
  setYearDropdownInteracted,
  autoPickDelay,
  setAutoPickDelay,
  numRounds,
  setNumRounds,
  loading,
  dots,
  error,
  onStartDraft,
  onResetSettings,
}) {
  const PICK_SPEEDS = [
    { id: "slow", label: "Slow", delay: 2200 },
    { id: "normal", label: "Normal", delay: 1400 },
    { id: "fast", label: "Fast", delay: 800 },
    { id: "very_fast", label: "V. Fast", delay: 400 },
  ];

  return (
    <LBHTCard className="draft_settings_v2" variant="glass">
      <div className="draft_settings_v2_header">
        <p className="draft_settings_v2_kicker">Draft Setup</p>
        <h2>Draft Settings</h2>
        <p>Configure your draft room before launching the simulation.</p>
      </div>

      
      <label className="draft_settings_v2_field">
        <span>Draft Year</span>
        <select
          value={year}
          onChange={(e) => {
            setYear(parseInt(e.target.value));
            setSelectedTeams([]);
            setYearDropdownInteracted(true);
          }}
          onBlur={() => setYearDropdownInteracted(true)}
        >
          <option value={2026}>2026</option>
          <option value={2025}>2025</option>
        </select>
      </label>

      <div className="draft_settings_v2_field">
        <span>Pick Speed</span>

        <div className="draft_speed_buttons">
          {PICK_SPEEDS.map((speed) => (
            <button
              key={speed.id}
              type="button"
              className={
                autoPickDelay === speed.delay
                  ? "draft_speed_btn active"
                  : "draft_speed_btn"
              }
              onClick={() => setAutoPickDelay(speed.delay)}
            >
              {speed.label}
            </button>
          ))}
        </div>
      </div>

     <div className="draft_settings_v2_field">
    <span>Simulation Options</span>

    <div className="draft_settings_options">

        <button
            type="button"
            className="draft_option_toggle active"
        >
            <span>AI Team Needs</span>
            <span className="draft_option_switch">
  <span />
</span>
        </button>

        <button
            type="button"
            className="draft_option_toggle active"
        >
            <span>CPU Trades</span>
            <span className="draft_option_switch">
  <span />
</span>
        </button>

        <button
            type="button"
            className="draft_option_toggle active"
        >
            <span>Draft Recaps</span>
            <span className="draft_option_switch">
  <span />
</span>
        </button>

    </div>
</div>

      <div className="draft_settings_v2_field">
        <span>Number of Rounds</span>

        <div className="draft_settings_v2_rounds">
          {[1, 2, 3, 4, 5, 6, 7].map((round) => (
            <button
              key={round}
              type="button"
              className={numRounds === round ? "selected" : ""}
              onClick={() => setNumRounds(round)}
            >
              {round}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="draft_settings_v2_error">{error}</p>}

      <LBHTButton
        className="draft_settings_v2_start"
        variant="primary"
        size="lg"
        disabled={loading}
        onClick={onStartDraft}
      >
        {loading ? `Creating${dots}` : "Start Draft Room"}
      </LBHTButton>

<LBHTButton
  className="draft_settings_v2_reset"
  variant="ghost"
  size="md"
  onClick={onResetSettings}
>
  ↺ Reset Settings
</LBHTButton>

    </LBHTCard>
  );
}

export default DraftSettingsCard;