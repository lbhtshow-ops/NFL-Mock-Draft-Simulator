import { useMemo, useState } from "react";

import { resolveProspect } from "../../../data/draft/prospects/resolveProspect";

import DraftBoardHeader from "./DraftBoardHeader";
import DraftBoardFilters from "./DraftBoardFilters";
import ProspectTable from "./ProspectTable";

export default function DraftBoard({
  prospects = [],
  queuedProspects = [],
  selectedProspect,
  onSelectProspect,
  onToggleQueueProspect,
  onDraftProspect,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [schoolFilter, setSchoolFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [sortOption, setSortOption] = useState("grade-desc");

  const resolvedProspects = useMemo(() => {
    return prospects.map(resolveProspect).filter(Boolean);
  }, [prospects]);

  const schools = useMemo(() => {
    return [
      "All",
      ...new Set(
        resolvedProspects.map((prospect) => prospect.displaySchool)
      ),
    ]
      .filter(Boolean)
      .sort();
  }, [resolvedProspects]);

  const tiers = useMemo(() => {
    return [
      "All",
      ...new Set(
        resolvedProspects.map((prospect) => prospect.displayTier)
      ),
    ]
      .filter(Boolean)
      .sort();
  }, [resolvedProspects]);

  const visibleProspects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = resolvedProspects.filter((prospect) => {
      const prospectName = prospect.displayName.toLowerCase();
      const prospectSchool = prospect.displaySchool.toLowerCase();

      const matchesSearch =
        !query ||
        prospectName.includes(query) ||
        prospectSchool.includes(query);

      const matchesPosition =
        positionFilter === "All" ||
        prospect.displayPosition === positionFilter;

      const matchesSchool =
        schoolFilter === "All" ||
        prospect.displaySchool === schoolFilter;

      const matchesTier =
        tierFilter === "All" ||
        prospect.displayTier === tierFilter;

      return matchesSearch && matchesPosition && matchesSchool && matchesTier;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "grade-desc") {
        return Number(b.displayGrade) - Number(a.displayGrade);
      }

      if (sortOption === "grade-asc") {
        return Number(a.displayGrade) - Number(b.displayGrade);
      }

      if (sortOption === "player-asc") {
        return a.displayName.localeCompare(b.displayName);
      }

      if (sortOption === "player-desc") {
        return b.displayName.localeCompare(a.displayName);
      }

      if (sortOption === "rank-asc") {
        return Number(a.rank) - Number(b.rank);
      }

      return 0;
    });
  }, [
    resolvedProspects,
    searchTerm,
    positionFilter,
    schoolFilter,
    tierFilter,
    sortOption,
  ]);

  function handleClearFilters() {
    setSearchTerm("");
    setPositionFilter("All");
    setSchoolFilter("All");
    setTierFilter("All");
    setSortOption("grade-desc");
  }

  return (
    <section className="draft_board_v3">
      <DraftBoardHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <DraftBoardFilters
        positionFilter={positionFilter}
        onPositionChange={setPositionFilter}
        schoolFilter={schoolFilter}
        onSchoolChange={setSchoolFilter}
        schools={schools}
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
        tiers={tiers}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onClearFilters={handleClearFilters}
      />

      <ProspectTable
        prospects={visibleProspects}
        queuedProspects={queuedProspects}
        selectedProspect={selectedProspect}
        onSelectProspect={onSelectProspect}
        onQueueProspect={onToggleQueueProspect}
        onDraftProspect={onDraftProspect}
      />
    </section>
  );
}