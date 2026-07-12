import { staticRosterImporter } from "./importers";
import { nflverseRosterAdapter } from "./importers";

import generatedNFLVerseRosterSource from "./sources/generatedNFLVerseRosterSource.json";

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