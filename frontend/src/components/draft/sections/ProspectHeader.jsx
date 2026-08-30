import MetricTile from "../../draftV3/ui/MetricTile";
import TeamLogo from "../../draftV3/ui/TeamLogo";
import ProspectCardV2 from "../shared/ProspectCardV2";

export default function ProspectHeader({
  player,
  grade,
  tier,
  projection,
  confidence,
}) {
  const playerName = player ? player.name : "Select a Prospect";
  const confidenceValue = Number.parseFloat(String(confidence).replace("%", ""));
  const confidenceWidth = Number.isFinite(confidenceValue) ? Math.max(0, Math.min(100, confidenceValue)) : 0;
  const playerMeta = player
    ? `${player.position ?? "POS"} • ${player.college ?? "College"}`
    : "Choose a player above to view his scouting profile.";

  return (
    <div className="prospect_player_header prospect_player_header_premium">
      <div className="prospect_header_left">
        <ProspectCardV2 player={player} />

        <div className="prospect_header_identity">
          <div className="prospect_header_kicker">Prospect Intelligence Center</div>
          <h2>{playerName}</h2>
          <p>{playerMeta}</p>

          <div className="prospect_header_tags">
  <span>Class: {player?.class ?? "Pending"}</span>

  <span>
    {player?.height ?? "--"} • {player?.weight ?? "--"}
  </span>

  <span>Age: {player?.age ?? "--"}</span>

  <span>Rank {player ? `#${player.rank}` : "--"}</span>
</div>
        </div>
      </div>

      <div className="prospect_header_middle">
        <MetricTile label="Age" value={player?.age ?? "--"} />
        <MetricTile label="Position Rank" value={player ? "Engine Pending" : "--"} />
        <MetricTile label="NFL Comparison" value={player ? "Engine Pending" : "--"} />
      </div>

      <div className="prospect_header_grade_card">
        <span>Overall Grade</span>
        <h1>{grade}</h1>
        <p>{player ? "Draftable Prospect" : "No prospect selected"}</p>

        <div className="prospect_header_grade_meta">
          <div>
            <span>Tier</span>
            <strong>{tier}</strong>
          </div>

          <div>
            <span>Projection</span>
            <strong>{projection}</strong>
          </div>
        </div>

        <div className="prospect_confidence_meter">
          <div className="prospect_confidence_label">
            <span>Confidence</span>
            <strong>{confidence}</strong>
          </div>

          <div className="prospect_confidence_track">
            <div
              className="prospect_confidence_fill"
              style={{ width: player ? `${confidenceWidth}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}