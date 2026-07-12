import teamLogos from "../../../data/nfl/teamLogos";
import "./team-logo.css";

export default function TeamLogo({ abbreviation, name, size = "md" }) {
  const logo = teamLogos[abbreviation];

  return (
    <div className={`team_logo team_logo--${size}`}>
      {logo ? (
        <img src={logo} alt={`${name || abbreviation} logo`} />
      ) : (
        <span>{abbreviation}</span>
      )}
    </div>
  );
}