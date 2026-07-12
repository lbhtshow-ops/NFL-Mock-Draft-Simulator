import { useState } from "react";
import SectionHeader from "./SectionHeader";

export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible_section ${isOpen ? "open" : "closed"}`}>
      <button
        className="collapsible_section_toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <SectionHeader title={title} subtitle={subtitle} />

        <span className="collapsible_section_icon">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="collapsible_section_content">
          {children}
        </div>
      )}
    </div>
  );
}