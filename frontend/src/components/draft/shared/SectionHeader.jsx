export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="prospect_section_header">
      <h3>{title}</h3>
      <span>{subtitle}</span>
    </div>
  );
}