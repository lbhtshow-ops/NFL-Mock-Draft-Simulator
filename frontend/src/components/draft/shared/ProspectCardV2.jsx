export default function ProspectCardV2({ player }) {
  const position = player?.position ?? "LBHT";
  const school = player?.college ?? "School Pending";
  const archetype = player?.archetype ?? "Prospect Profile";

  return (
    <div className="prospect_card_v2">
      <div className="prospect_card_v2_photo">
        <span>{position}</span>
      </div>

      <div className="prospect_card_v2_body">
        <div className="prospect_card_v2_position">{position}</div>
        <div className="prospect_card_v2_school">{school}</div>
        <div className="prospect_card_v2_archetype">{archetype}</div>
      </div>
    </div>
  );
}