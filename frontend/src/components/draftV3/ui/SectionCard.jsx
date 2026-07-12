import "./ui-library.css";

export default function SectionCard({
  title,
  children,
}) {
  return (
    <section className="draft_section_card">
      <h3 className="draft_section_card_title">
        {title}
      </h3>

      {children}
    </section>
  );
}