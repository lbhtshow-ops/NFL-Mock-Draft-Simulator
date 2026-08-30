import { staticRosterImporter } from "./importers/index.js";
import { nflverseRosterAdapter } from "./importers/index.js";

import generatedNFLVerseRosterSource from "./sources/generatedNFLVerseRosterSource.json" with { type: "json" };

const adaptedRosterRows = nflverseRosterAdapter(
  generatedNFLVerseRosterSource
);

export const nflRosterRecords = staticRosterImporter(
  adaptedRosterRows
);

export function getNFLRosterByTeam(abbreviation) {
  return nflRosterRecords[abbreviation] || [];
}

export default nflRosterRecords;