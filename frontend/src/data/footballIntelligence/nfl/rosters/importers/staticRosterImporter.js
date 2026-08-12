import { importNFLRosterRecords } from "../importNFLRosterRecords.js";

export function staticRosterImporter(rawRosterRows = []) {
  return importNFLRosterRecords(rawRosterRows);
}

export default staticRosterImporter;