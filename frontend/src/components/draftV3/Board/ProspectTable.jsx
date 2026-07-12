import { resolveProspect } from "../../../data/draft/prospects/resolveProspect";

import "./ProspectTable.css";

export default function ProspectTable({
  prospects = [],
  queuedProspects = [],
  selectedProspect,
  onSelectProspect,
  onQueueProspect,
  onDraftProspect,
}) {
  const resolvedSelectedProspect = resolveProspect(selectedProspect);

  function isQueued(prospect) {
    const resolvedProspect = resolveProspect(prospect);

    return queuedProspects.some((queuedProspect) => {
      const resolvedQueuedProspect = resolveProspect(queuedProspect);

      return resolvedQueuedProspect?.id === resolvedProspect?.id;
    });
  }

  return (
    <div className="prospect_table_shell">
      <table className="prospect_table_v3">
        <thead>
          <tr>
            <th>RK</th>
            <th>Player</th>
            <th>Pos</th>
            <th>Grade ↓</th>
            <th>Tier</th>
            <th>Proj.</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {prospects.map((prospect) => {
            const resolvedProspect = resolveProspect(prospect);
            const queued = isQueued(resolvedProspect);
            const selected =
              resolvedSelectedProspect?.id === resolvedProspect.id;

            return (
              <tr
                key={resolvedProspect.id}
                className={selected ? "selected" : ""}
                onClick={() => onSelectProspect?.(resolvedProspect)}
              >
                <td>{resolvedProspect.rank}</td>

                <td>
                  <div className="prospect_player_cell">
                    <img
                      className="prospect_school_logo"
                      src={resolvedProspect.displayLogo}
                      alt={`${resolvedProspect.displaySchool} logo`}
                    />

                    <div>
                      <div className="prospect_player_name">
                        {resolvedProspect.displayName}
                      </div>

                      <div className="prospect_player_meta">
                        {resolvedProspect.displaySchool} • Age{" "}
                        {resolvedProspect.bio?.age || "--"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="prospect_position">
                  {resolvedProspect.displayPosition}
                </td>

                <td>
                  <span className="grade_badge">
                    {resolvedProspect.displayGrade}
                  </span>
                </td>

                <td>
                  <span className="tier_badge">
                    {String(resolvedProspect.displayTier).toUpperCase()}
                  </span>
                </td>

                <td>
                  <span className="projection_badge">
                    {resolvedProspect.displayProjection}
                  </span>
                </td>

                <td>
                  <div className="prospect_actions">
                    <button
                      className="draft_action_primary"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDraftProspect?.(resolvedProspect);
                      }}
                    >
                      Draft
                    </button>

                    <button
                      className={`draft_action_secondary ${
                        queued ? "queued" : ""
                      }`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onQueueProspect?.(resolvedProspect);
                      }}
                    >
                      {queued ? "Queued" : "Queue"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}