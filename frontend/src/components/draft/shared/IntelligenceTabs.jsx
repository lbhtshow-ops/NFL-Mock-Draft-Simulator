import "./IntelligenceTabs.css";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "traits", label: "Traits" },
  { id: "scouting", label: "Scouting" },
  { id: "athletic", label: "Athletic" },
  { id: "football", label: "Football IQ" },
  { id: "scheme", label: "Scheme Fit" },
];

export default function IntelligenceTabs({
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="intelligence_tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`intelligence_tab ${
            activeTab === tab.id ? "active" : ""
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}