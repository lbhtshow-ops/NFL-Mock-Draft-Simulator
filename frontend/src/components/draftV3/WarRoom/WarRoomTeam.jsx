import SectionCard from "../ui/SectionCard";
import InfoRow from "../ui/InfoRow";
import IntelligenceIndicator from "../ui/IntelligenceIndicator";
import { buildDerivedTeamNeeds } from "../../../engines/DerivedTeamNeedsEngine";

function getTeamAbbreviation(team) {
  return team?.abbreviation || team?.abbr || team?.team || team?.id || "ARI";
}

function getNeedLabel(score) {
  if (score >= 8) return "Critical";
  if (score >= 7) return "High";
  if (score >= 5) return "Moderate";
  if (score >= 3) return "Low";

  return "Minimal";
}

function formatNeedScore(score) {
  return Math.round(score * 10);
}

function getVisibleNeeds(team) {
  const teamAbbreviation = getTeamAbbreviation(team);
  const derivedNeeds = buildDerivedTeamNeeds(teamAbbreviation)?.needs || {};

  const derivedNeedList = Object.entries(derivedNeeds).map(
    ([position, score]) => ({
      position,
      score: formatNeedScore(score),
      rawScore: score,
      label: getNeedLabel(score),
      source: "Derived",
    })
  );

  if (derivedNeedList.length > 0) {
    return derivedNeedList
      .sort((a, b) => b.rawScore - a.rawScore)
      .slice(0, 4);
  }

  return team.needs || [];
}

export default function WarRoomTeam({ team }) {
  const visibleNeeds = getVisibleNeeds(team);

  return (
    <div className="war_room_team">
      <SectionCard title="Front Office">
        <InfoRow label="General Manager" value={team.gm} />

        <InfoRow label="Head Coach" value={team.headCoach} />

        <InfoRow label="Competitive Window" value={team.window} accent />
      </SectionCard>

      <SectionCard title="Football Identity">
        <InfoRow label="Offense" value={team.offensiveScheme} />

        <InfoRow label="Defense" value={team.defensiveScheme} />
      </SectionCard>

      <SectionCard title="Team Needs">
        <div className="war_room_need_list">
          {visibleNeeds.map((need) => (
            <div key={need.position} className="war_room_need_meter">
              <div className="war_room_need_top">
                <strong>{need.position}</strong>
              </div>

              <div className="war_room_need_indicator">
                <IntelligenceIndicator
                  value={need.score}
                  showScale={false}
                  inverse={true}
                />

                <div className="war_room_need_badge">
                  {need.label} Need
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Upcoming Picks">
        <div className="war_room_picks">
          {team.upcomingPicks.map((pick) => (
            <span key={pick}>{pick}</span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}