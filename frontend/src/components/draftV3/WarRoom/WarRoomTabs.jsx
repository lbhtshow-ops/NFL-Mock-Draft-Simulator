export default function WarRoomTabs({
  activeTab,
  setActiveTab,
  queuedCount,
}) {
  return (
    <div className="war_room_tabs">
      <button
        className={activeTab === "team" ? "active" : ""}
        onClick={() => setActiveTab("team")}
        type="button"
      >
        Team
      </button>

      <button
        className={activeTab === "queue" ? "active" : ""}
        onClick={() => setActiveTab("queue")}
        type="button"
      >
        Queue ({queuedCount})
      </button>
    </div>
  );
}