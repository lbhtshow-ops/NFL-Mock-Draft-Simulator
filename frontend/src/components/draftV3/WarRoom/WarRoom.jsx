import { useState } from "react";

import { getTeamProfile } from "./WarRoomData";
import WarRoomHeader from "./WarRoomHeader";
import WarRoomTabs from "./WarRoomTabs";
import WarRoomTeam from "./WarRoomTeam";
import WarRoomQueue from "./WarRoomQueue";

export default function WarRoom({
  queuedProspects = [],
  onRemoveProspect,
  currentPick,
}) {
  const [activeTab, setActiveTab] = useState("team");

  const activeTeam = getTeamProfile(currentPick?.team);

  const liveTeam = {
    ...activeTeam,
    currentPick: currentPick
      ? `${currentPick.round}.${currentPick.pickInRound}`
      : activeTeam.currentPick,
  };

  return (
    <aside className="draft_v3_warroom">
      <WarRoomHeader team={liveTeam} />

      <WarRoomTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queuedCount={queuedProspects.length}
      />

      <div className="war_room_content">
        {activeTab === "team" && <WarRoomTeam team={liveTeam} />}

        {activeTab === "queue" && (
          <WarRoomQueue
            queuedProspects={queuedProspects}
            onRemoveProspect={onRemoveProspect}
          />
        )}
      </div>
    </aside>
  );
}