import { importNFLRosterRecords } from "../importNFLRosterRecords";

export function staticRosterImporter(rawRosterRows = []) {
  return importNFLRosterRecords(rawRosterRows);
}

export default staticRosterImporter;