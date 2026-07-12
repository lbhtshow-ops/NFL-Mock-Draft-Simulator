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

function getProspectLogo(prospect) {
  return prospect.display?.logo || prospect.logo || "";
}

export default function WarRoomQueue({
  queuedProspects = [],
  onRemoveProspect,
}) {
  const hasQueuedProspects = queuedProspects.length > 0;

  return (
    <div
      className={`war_room_queue ${
        hasQueuedProspects ? "has_queue_items" : "is_empty"
      }`}
    >
      {!hasQueuedProspects ? (
        <div className="war_room_empty">
          <strong>No prospects queued yet.</strong>
          <span>Use the Queue button to build your draft board.</span>
        </div>
      ) : (
        queuedProspects.map((prospect, index) => {
          const prospectName = getProspectName(prospect);
          const prospectSchool = getProspectSchool(prospect);
          const prospectPosition = getProspectPosition(prospect);
          const prospectLogo = getProspectLogo(prospect);

          return (
            <div key={getProspectId(prospect)} className="war_room_queue_item">
              <span>{index + 1}</span>

              <img src={prospectLogo} alt={`${prospectSchool} logo`} />

              <div>
                <strong>{prospectName}</strong>
                <small>
                  {prospectPosition} • {prospectSchool}
                </small>
              </div>

              <button
                type="button"
                onClick={() => onRemoveProspect?.(prospect)}
              >
                Remove
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}