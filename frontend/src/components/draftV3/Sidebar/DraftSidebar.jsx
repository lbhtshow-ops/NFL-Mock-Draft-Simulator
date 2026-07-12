import "../../../styles/draft-sidebar.css";

function formatPick(pick) {
  if (!pick) return "--";

  return `${pick.round}.${String(pick.pickInRound).padStart(2, "0")}`;
}

function getProspectId(prospect) {
  return prospect.id || prospect.rank;
}

function getProspectName(prospect) {
  return prospect.bio?.name || prospect.name || prospect.player || "Unknown Prospect";
}

function getProspectSchool(prospect) {
  return prospect.bio?.school || prospect.school || prospect.college || "Unknown School";
}

function getProspectPosition(prospect) {
  return prospect.bio?.position || prospect.position || "--";
}

export default function DraftSidebar({
  queuedProspects = [],
  currentPick,
  draftHistory = [],
  onUndoPick,
  onCpuPick,
  isUserPick,
  draftSpeed = "normal",
  onDraftSpeedChange,
}) {
  const totalPicks = 257;
  const completedPicks = draftHistory.length;
  const picksRemaining = Math.max(totalPicks - completedPicks, 0);

  return (
    <aside className="draft_sidebar">
      <section className="sidebar_card">
        <div className="sidebar_card_title">Draft Controls</div>

        <button
          className="sidebar_action primary"
          type="button"
          onClick={onCpuPick}
          disabled={isUserPick}
        >
          <span className="sidebar_action_icon">▶</span>
          CPU Pick
        </button>

        <button
          className="sidebar_action"
          type="button"
          onClick={onUndoPick}
          disabled={draftHistory.length === 0}
        >
          <span className="sidebar_action_icon">↶</span>
          Undo Pick
        </button>

        <button className="sidebar_action" type="button">
          <span className="sidebar_action_icon">⇄</span>
          Trade Center
        </button>

        <button className="sidebar_action danger" type="button">
          <span className="sidebar_action_icon">↻</span>
          Restart Draft
        </button>
      </section>

      <section className="sidebar_card">
        <div className="sidebar_card_title">Draft Settings</div>

        <div className="sidebar_info_row">
          <span>Rounds</span>
          <strong>7</strong>
        </div>

        <div className="sidebar_speed_grid">
          <button
            type="button"
            className={draftSpeed === "slow" ? "active" : ""}
            onClick={() => onDraftSpeedChange?.("slow")}
          >
            Slow
          </button>

          <button
            type="button"
            className={draftSpeed === "normal" ? "active" : ""}
            onClick={() => onDraftSpeedChange?.("normal")}
          >
            Normal
          </button>

          <button
            type="button"
            className={draftSpeed === "fast" ? "active" : ""}
            onClick={() => onDraftSpeedChange?.("fast")}
          >
            Fast
          </button>
        </div>

        <div className="sidebar_info_row">
          <span>Pick Clock</span>
          <strong className="sidebar_toggle">
            On
            <span className="sidebar_toggle_pill" />
          </strong>
        </div>

        <div className="sidebar_info_row">
          <span>Sound</span>
          <strong className="sidebar_toggle">
            On
            <span className="sidebar_toggle_pill" />
          </strong>
        </div>
      </section>

      <section className="sidebar_card">
        <div className="sidebar_card_title">Draft Information</div>

        <div className="sidebar_info_row">
          <span>Current Pick</span>
          <strong>{formatPick(currentPick)}</strong>
        </div>

        <div className="sidebar_info_row">
          <span>Overall Pick</span>
          <strong>
            {currentPick?.overall || "--"} / {totalPicks}
          </strong>
        </div>

        <div className="sidebar_info_row">
          <span>Picks Remaining</span>
          <strong>{picksRemaining}</strong>
        </div>

        <div className="sidebar_info_row">
          <span>Time Remaining</span>
          <strong>60 sec</strong>
        </div>
      </section>

      <section className="sidebar_card sidebar_queue_card">
        <div className="sidebar_card_title">My Queue</div>

        {queuedProspects.length === 0 ? (
          <div className="sidebar_empty_state">
            <strong>No prospects queued</strong>
            <span>
              Add players from the Big Board to build your personal draft board.
            </span>
          </div>
        ) : (
          <div className="sidebar_queue_list">
            {queuedProspects.map((prospect, index) => (
              <div key={getProspectId(prospect)} className="sidebar_queue_item">
                <strong>{index + 1}</strong>

                <div className="sidebar_queue_player">
                  <span>{getProspectName(prospect)}</span>
                  <small>
                    {getProspectPosition(prospect)} • {getProspectSchool(prospect)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}