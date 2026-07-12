import { useState } from "react";

export default function MyDraftBoard({ queuedProspects = [], onRemoveProspect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="my_draft_board_toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? "Close" : "Queue"} ({queuedProspects.length})
      </button>

      <aside className={`my_draft_board ${isOpen ? "open" : ""}`}>
        <div className="my_draft_board_header">
          <p>MY DRAFT BOARD</p>
          <span>{queuedProspects.length} Queued</span>
        </div>

        {queuedProspects.length === 0 ? (
          <div className="my_draft_board_empty">
            <strong>No prospects queued yet.</strong>
            <span>Use the Queue button to build your draft board.</span>
          </div>
        ) : (
          <div className="my_draft_board_list">
            {queuedProspects.map((prospect, index) => (
              <div key={prospect.rank} className="my_draft_board_item">
                <span className="my_draft_board_rank">{index + 1}</span>

                <img
                  className="my_draft_board_logo"
                  src={prospect.logo}
                  alt={`${prospect.school} logo`}
                />

                <div className="my_draft_board_info">
                  <strong>{prospect.player}</strong>
                  <span>
                    {prospect.position} • {prospect.school}
                  </span>
                </div>

                <button
                  className="my_draft_board_remove"
                  type="button"
                  onClick={() => onRemoveProspect(prospect)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}