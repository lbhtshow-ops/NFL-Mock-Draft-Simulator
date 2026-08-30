import IntelligenceIndicator from "../../draftV3/ui/IntelligenceIndicator";
import IntelligenceStat from "../../draftV3/ui/IntelligenceStat";
import { buildProspectIntelligence } from "../../../engines/ProspectIntelligenceEngine";

function formatTraitLabel(label) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return "Pending";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTraitEntries(traits = {}) {
  return Object.entries(traits).map(([key, value]) => ({
    label: formatTraitLabel(key),
    value,
  }));
}

function getOverallTraitGrade(traits = {}) {
  const values = Object.values(traits).filter(
    (value) => typeof value === "number"
  );

  if (values.length === 0) return "--";

  const average =
    values.reduce((total, value) => total + value, 0) / values.length;

  return Math.round(average);
}

function getHighestTrait(traits = {}) {
  const entries = Object.entries(traits).filter(
    ([, value]) => typeof value === "number"
  );

  if (entries.length === 0) return null;

  const [trait, value] = entries.sort((a, b) => b[1] - a[1])[0];

  return {
    label: formatTraitLabel(trait),
    value,
  };
}

function TraitCard({ title, traits }) {
  return (
    <section className="trait_category_card intelligence_card">
      <h3>{title}</h3>

      <div className="trait_indicator_stack">
        {traits.length === 0 ? (
          <IntelligenceStat label="Trait Data" value="Pending" />
        ) : (
          traits.map((trait) => (
            <div key={trait.label} className="trait_indicator_row">
              <span>{trait.label}</span>

              <IntelligenceIndicator
                value={trait.value}
                label={`${trait.value ?? "--"}/100`}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function TraitIntelligence({ player, intelligence }) {
  const prospectIntelligence = intelligence || buildProspectIntelligence(player);

  const traitSummary =
    prospectIntelligence?.traits || {
      available: false,
      playerId: null,
      confidence: 0,
      source: "Unknown",
      lastUpdated: null,
      summary: "No trait profile available yet.",
      notes: "No trait profile available yet.",
      data: {
        playerName: null,
        position: null,
        traits: {},
        primaryTraits: {},
        secondaryTraits: {},
        positionTraitGroup: [],
      },
    };

  const allTraits = traitSummary?.data?.traits || {};
  const primaryTraits = traitSummary?.data?.primaryTraits || {};
  const secondaryTraits = traitSummary?.data?.secondaryTraits || {};
  const positionTraitGroup = traitSummary?.data?.positionTraitGroup || [];

  const primaryTraitEntries = getTraitEntries(primaryTraits);
  const secondaryTraitEntries = getTraitEntries(secondaryTraits);

  const overallTraitGrade = getOverallTraitGrade(allTraits);
  const highestTrait = getHighestTrait(allTraits);

  const highestTraitValue = highestTrait
    ? `${highestTrait.label} (${highestTrait.value})`
    : "Pending";

  const confidence =
    typeof traitSummary?.confidence === "number"
      ? `${Math.round(traitSummary.confidence * 100)}%`
      : "Pending";

  const positionTraitText =
    positionTraitGroup.length > 0
      ? positionTraitGroup.map(formatTraitLabel).join(", ")
      : "Pending";

  return (
    <div className="trait_intelligence_v2">
      <section className="trait_grade_card intelligence_hero">
        <div className="trait_section_label">Overall Trait Grade</div>

        <div className="trait_overall_grade">{overallTraitGrade}</div>

        <div className="trait_grade_subtitle">
          {traitSummary?.available
            ? "Position-Aware Trait Intelligence Engine"
            : "No trait profile available yet"}
        </div>
      </section>

      <section className="intelligence_grid_two">
        <TraitCard title="Primary Position Traits" traits={primaryTraitEntries} />

        <section className="trait_category_card intelligence_card">
          <h3>Trait Context</h3>

          <div className="trait_indicator_stack">
            <IntelligenceStat
              label="Position"
              value={traitSummary?.data?.position || "Pending"}
            />

            <IntelligenceStat
              label="Expected Trait Group"
              value={positionTraitText}
            />

            <IntelligenceStat
              label="Highest Rated Trait"
              value={highestTraitValue}
            />

            <IntelligenceStat label="Confidence" value={confidence} />
          </div>
        </section>
      </section>

      <section className="intelligence_grid_two">
        <TraitCard title="Secondary Traits" traits={secondaryTraitEntries} />

        <section className="trait_category_card intelligence_card">
          <h3>Source & Notes</h3>

          <div className="trait_indicator_stack">
            <IntelligenceStat
              label="Source"
              value={traitSummary?.source || "Pending"}
            />

            <IntelligenceStat
              label="Last Updated"
              value={formatDate(traitSummary?.lastUpdated)}
            />

            <div className="trait_indicator_row">
              <span>
                {traitSummary?.notes || "No trait notes available yet."}
              </span>
            </div>
          </div>
        </section>
      </section>

      <section className="intelligence_grid_two">
        <section className="trait_category_card intelligence_card">
          <h3>Next Intelligence Layer</h3>

          <div className="trait_indicator_stack">
            <IntelligenceStat label="Position Percentile" value="Pending" />
            <IntelligenceStat label="Class Ranking" value="Pending" />
            <IntelligenceStat label="Historical Match" value="Pending" />
          </div>
        </section>
      </section>
    </div>
  );
}