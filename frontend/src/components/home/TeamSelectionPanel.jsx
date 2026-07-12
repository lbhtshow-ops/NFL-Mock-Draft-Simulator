import React from "react";
import LBHTCard from "../ui/LBHTCard";
import LBHTButton from "../ui/LBHTButton";

function TeamSelectionPanel({
  teams,
  selectedTeams,
  teamsLoading,
  teamsError,
  onToggleTeam,
  onSelectAll,
}) {
  return (
    <LBHTCard className="team_selection_v2" variant="glass">
      <div className="team_selection_v2_header">
  <div className="team_selection_v2_status_panel">
    <p className="team_selection_v2_status_kicker">Team Status</p>

    <div className="team_selection_v2_status_list">
      <div>
        <span>System Status</span>
        <strong>Ready</strong>
      </div>

      <div>
        <span>Teams Loaded</span>
        <strong>{teams.length}</strong>
      </div>

      <div>
        <span>User Teams</span>
        <strong>{selectedTeams.length}</strong>
      </div>

      <div>
        <span>AI Teams</span>
        <strong>{Math.max(teams.length - selectedTeams.length, 0)}</strong>
      </div>
    </div>
  </div>

  <div className="team_selection_v2_title">
    <p className="team_selection_v2_kicker">Team Control</p>
    <h2>Select Teams to Control</h2>
    <p>
      Assign user-controlled front offices before entering the draft room.
    </p>
  </div>

  <div className="team_selection_v2_actions">
    <LBHTButton
      variant="secondary"
      size="md"
      onClick={onSelectAll}
      disabled={teamsLoading}
    >
      {selectedTeams.length === teams.length ? "Clear All" : "Select All"}
    </LBHTButton>
  </div>
</div>
      
      {teamsError && <p className="team_selection_v2_error">{teamsError}</p>}

      <div className="team_selection_v2_grid">
        {teamsLoading ? (
          <p className="team_selection_v2_loading">Loading teams...</p>
        ) : (
          teams.map((team) => {
            const isSelected = selectedTeams.includes(team.id);

            return (
              <button
                key={team.id}
                type="button"
                className={`team_card_v2 ${isSelected ? "selected" : ""}`}
                onClick={() => onToggleTeam(team.id)}
              >
                <div className="team_card_v2_status_row">
                  <span className={`team_card_v2_status ${isSelected ? "user" : "cpu"}`}>
                    {isSelected ? "USER CONTROL" : "AI MANAGED"}
                  </span>

                  <span className="team_card_v2_check">
                    {isSelected ? "✓" : ""}
                  </span>
                </div>

                <div className="team_card_v2_identity_row">
                  <div className="team_card_v2_logo_wrap">
                    <img
                      src={`/logos/nfl/${team.name.toLowerCase()}.png`}
                      alt={`${team.name} logo`}
                    />
                  </div>

                  <div className="team_card_v2_identity">
                    <strong>{team.name}</strong>
                    <small>Front Office</small>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </LBHTCard>
  );
}

export default TeamSelectionPanel;