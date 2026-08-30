
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  usage: path.join(root, "src/engines/PlayerUsageIndex.js"),
  performance: path.join(root, "src/engines/PlayerPerformanceIndex.js"),
  roster: path.join(root, "src/engines/PlayerRosterEvaluationEngine.js"),
};

function backup(file) {
  const backupFile = `${file}.before-2.18.6-RC3`;
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(file, backupFile);
  }
  return backupFile;
}

function patchOnceByRegex(text, regex, replacement, label) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const countingRegex = new RegExp(regex.source, flags);
  const matches = [...text.matchAll(countingRegex)];

  if (matches.length !== 1) {
    throw new Error(
      `${label}: expected exactly 1 match, found ${matches.length}; no write.`
    );
  }

  return text.replace(regex, replacement);
}

function writePatched(file, patcher) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patcher(original);

  if (patched === original) {
    throw new Error(`${file}: patch produced no change; no write.`);
  }

  backup(file);
  fs.writeFileSync(file, patched, "utf8");
  console.log(`PATCHED ${path.relative(root, file)}`);
}

writePatched(files.usage, (text) =>
  patchOnceByRegex(
    text,
    /export function getPlayerUsageProfile\(player = \{\}\) \{\r?\n/,
    `export function getPlayerUsageProfile(player = {}) {
  const historicalProfile =
    player?.historicalEvaluationEvidence?.usageProfile ?? null;

  if (historicalProfile) {
    return {
      ...historicalProfile,
      matchedBy: "historicalPregameEvidence",
    };
  }

`,
    "PlayerUsageIndex historical override"
  )
);

writePatched(files.performance, (text) =>
  patchOnceByRegex(
    text,
    /export function getPlayerPerformanceProfile\(player = \{\}\) \{\r?\n/,
    `export function getPlayerPerformanceProfile(player = {}) {
  const historicalProfile =
    player?.historicalEvaluationEvidence?.performanceProfile ?? null;

  if (historicalProfile) {
    return {
      ...historicalProfile,
      matchedBy: "historicalPregameEvidence",
    };
  }

`,
    "PlayerPerformanceIndex historical override"
  )
);

writePatched(files.roster, (text) => {
  let patched = patchOnceByRegex(
    text,
    /function getRecognitionScore\(player\) \{\r?\n/,
    `function getGovernedRecognitionSummary(player) {
  if (player?.historicalEvaluationEvidence?.disableRecognition === true) {
    return {
      available: false,
      score: null,
      rawScore: 0,
      careerRecognitionScore: null,
      recentRecognitionScore: null,
      eliteSeasonCount: 0,
      lastEliteSeason: null,
      provenEliteCeiling: false,
      sustainedEliteRecognition: false,
      establishedCareerBaseline: null,
      tier: "Historical Recognition Unavailable",
      awards: [],
      confidence: 0,
      summary:
        "Recognition disabled for temporally governed historical evaluation.",
    };
  }

  return getPlayerRecognitionSummary(player);
}

function getRecognitionScore(player) {
`,
    "PlayerRosterEvaluationEngine recognition helper"
  );

  const callRegex = /getPlayerRecognitionSummary\(player\)/g;
  const calls = [...patched.matchAll(callRegex)];

  // One direct call must remain inside getGovernedRecognitionSummary itself.
  if (calls.length < 2) {
    throw new Error(
      `PlayerRosterEvaluationEngine recognition routing: expected at least 2 calls, found ${calls.length}; no write.`
    );
  }

  let preservedHelperCall = false;
  patched = patched.replace(callRegex, () => {
    if (!preservedHelperCall) {
      preservedHelperCall = true;
      return "getPlayerRecognitionSummary(player)";
    }
    return "getGovernedRecognitionSummary(player)";
  });

  return patched;
});

console.log(JSON.stringify({
  install: "HISTORICAL_PLAYER_EVALUATION_INPUT_ADAPTER_V1",
  releaseCandidate: "2.18.6-RC3",
  status: "SUCCESS",
  safeguards: {
    existingPositionModelFormulasChanged: false,
    currentLookupDefaultsChangedForNormalPlayers: false,
    historicalRecognitionDisabled: true,
    crlfAndLfSupported: true,
  },
}, null, 2));
