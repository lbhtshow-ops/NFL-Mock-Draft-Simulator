import TeamLogo from "../ui/TeamLogo";

export default function WarRoomHeader({ team }) {
  return (
    <div className="war_room_header">
      <p>TEAM WAR ROOM</p>

      <div className="war_room_team_identity">
        <TeamLogo
          abbreviation={team.abbreviation}
          name={team.name}
          size="lg"
        />

        <div className="war_room_team_text">
          <h3>{team.name}</h3>
          <span>{team.abbreviation}</span>
        </div>
      </div>

      <div className="war_room_clock_status">
        <span>ON THE CLOCK</span>
        <strong>Pick {team.currentPick}</strong>
      </div>
    </div>
  );
}