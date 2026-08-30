import { nflRosterRecords } from "../../data/footballIntelligence/nfl/rosters/index.js";
import {
  getPositionModelDiagnostics,
  getTeamEvaluationDiagnostics,
} from "./PlayerEvaluationDiagnostics.js";
import { getPlayerRecognitionSummary } from "./PlayerRecognitionEngine.js";

function flattenRosterRecords(rosterRecords = {}) {
  return Object.values(rosterRecords).flat();
}

export function runPlayerEvaluationDiagnostics() {
  const players = flattenRosterRecords(nflRosterRecords);

  console.log("LBHT Player Evaluation Diagnostics — Player Count", {
    totalPlayers: players.length,
    teams: Object.keys(nflRosterRecords).length,
  });

const lamar = players.find(
  (player) => player?.playerId === "00-0034796"
);

console.log("LAMAR RAW PLAYER RECORD TEST", lamar);

console.log(
  "LAMAR RECOGNITION ENGINE TEST",
  getPlayerRecognitionSummary(lamar)
);

  console.log(
    "QB Diagnostics",
    getPositionModelDiagnostics(players, "QB", 15)
  );

  console.log(
    "RB Diagnostics",
    getPositionModelDiagnostics(players, "RB", 15)
  );

  console.log(
    "WR Diagnostics",
    getPositionModelDiagnostics(players, "WR", 15)
  );

  console.log(
    "OT Diagnostics",
    getPositionModelDiagnostics(players, "OT", 15)
  );

  console.log(
    "Arizona Team Diagnostics",
    getTeamEvaluationDiagnostics(players, "ARI", 25)
  );
}

export default runPlayerEvaluationDiagnostics;
