import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import {
  adaptNFLVerseInjuryRows,
} from "../src/data/footballIntelligence/nfl/availability/NFLVerseInjuryReportAdapter.js";

import {
  createNFLAvailabilityAcquisitionPlan,
  createNFLAvailabilityAcquisitionManifest,
} from "../src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.js";

const season =
  Number(
    process.argv[2] ||
    new Date().getFullYear()
  );

const sourcePath =
  path.resolve(
    "src/data/footballIntelligence/nfl/availability/sources/generatedNFLPlayerAvailabilitySource.js"
  );

const manifestPath =
  path.resolve(
    "src/data/footballIntelligence/nfl/availability/sources/generatedNFLPlayerAvailabilityManifest.js"
  );

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const char =
      line[index];

    if (char === `"`) {
      const next =
        line[index + 1];

      if (
        insideQuotes &&
        next === `"`
      ) {
        current += `"`;
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
      }
    } else if (
      char === "," &&
      !insideQuotes
    ) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCSV(text) {
  const lines =
    text
      .split(/\r?\n/)
      .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers =
    parseCSVLine(
      lines[0]
    );

  return lines
    .slice(1)
    .map((line) => {
      const values =
        parseCSVLine(line);

      return headers.reduce(
        (
          record,
          header,
          index
        ) => {
          record[header] =
            values[index] ??
            null;

          return record;
        },
        {}
      );
    });
}

function latestWeek(records) {
  return records.reduce(
    (max, record) =>
      Math.max(
        max,
        Number(record?.week) ||
          -1
      ),
    -1
  );
}

function latestModifiedAt(records) {
  let latest = null;

  for (const record of records) {
    const raw =
      record?.provenance
        ?.modifiedAt;

    if (!raw) continue;

    const date =
      new Date(raw);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      continue;
    }

    if (
      !latest ||
      date.getTime() >
        latest.getTime()
    ) {
      latest = date;
    }
  }

  return latest
    ? latest.toISOString()
    : null;
}

function sourceModuleText(
  evidence
) {
  return (
    `export const generatedNFLPlayerAvailabilitySource = ${JSON.stringify(
      evidence,
      null,
      2
    )};\n\n` +
    `export default generatedNFLPlayerAvailabilitySource;\n`
  );
}

function manifestModuleText(
  manifest
) {
  return (
    `export const generatedNFLPlayerAvailabilityManifest = ${JSON.stringify(
      manifest,
      null,
      2
    )};\n\n` +
    `export default generatedNFLPlayerAvailabilityManifest;\n`
  );
}

function atomicWrite(
  target,
  content
) {
  fs.mkdirSync(
    path.dirname(target),
    { recursive: true }
  );

  const temporary =
    `${target}.tmp`;

  fs.writeFileSync(
    temporary,
    content,
    "utf8"
  );

  fs.renameSync(
    temporary,
    target
  );
}

async function download(
  plan
) {
  for (
    const url of
    plan.candidates
  ) {
    console.log(
      `Trying ${url}`
    );

    let response;

    try {
      response =
        await fetch(url);
    } catch {
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const buffer =
      Buffer.from(
        await response
          .arrayBuffer()
      );

    const text =
      url.endsWith(".gz")
        ? zlib
            .gunzipSync(buffer)
            .toString("utf8")
        : buffer
            .toString("utf8");

    return {
      url,
      text,
    };
  }

  return null;
}

const checkedAt =
  new Date().toISOString();

const plan =
  createNFLAvailabilityAcquisitionPlan(
    season
  );

const downloaded =
  await download(plan);

if (!downloaded) {
  const manifest =
    createNFLAvailabilityAcquisitionManifest({
      season,
      status:
        "SOURCE_UNAVAILABLE",
      provider:
        plan.provider,
      checkedAt,
      fetchedAt:
        null,
      recordCount:
        0,
      latestWeek:
        null,
      latestModifiedAt:
        null,
      message:
        `No nflverse injury-report asset is currently available for ${season}. Existing canonical evidence was preserved.`,
    });

  atomicWrite(
    manifestPath,
    manifestModuleText(
      manifest
    )
  );

  console.log(
    `No ${season} nflverse injury-report asset is currently available.`
  );

  console.log(
    "Existing canonical availability evidence was preserved."
  );

  console.log(
    `Updated acquisition manifest: ${manifestPath}`
  );

  process.exit(0);
}

const rows =
  parseCSV(
    downloaded.text
  );

const evidence =
  adaptNFLVerseInjuryRows(
    rows,
    {
      source:
        "nflverse-injury-reports",
      sourceUrl:
        downloaded.url,
    }
  );

if (!evidence.length) {
  const manifest =
    createNFLAvailabilityAcquisitionManifest({
      season,
      status:
        "INVALID_OR_EMPTY_PROVIDER_DATA",
      provider:
        plan.provider,
      sourceUrl:
        downloaded.url,
      checkedAt,
      fetchedAt:
        null,
      recordCount:
        0,
      message:
        "Provider asset downloaded but produced no valid canonical availability evidence. Existing evidence was preserved.",
    });

  atomicWrite(
    manifestPath,
    manifestModuleText(
      manifest
    )
  );

  console.log(
    "Provider data produced zero valid canonical records."
  );

  console.log(
    "Existing canonical availability evidence was preserved."
  );

  process.exit(0);
}

const fetchedAt =
  new Date().toISOString();

const manifest =
  createNFLAvailabilityAcquisitionManifest({
    season,
    status:
      "READY",
    provider:
      plan.provider,
    sourceUrl:
      downloaded.url,
    checkedAt,
    fetchedAt,
    recordCount:
      evidence.length,
    latestWeek:
      latestWeek(evidence),
    latestModifiedAt:
      latestModifiedAt(
        evidence
      ),
    message:
      null,
  });

atomicWrite(
  sourcePath,
  sourceModuleText(
    evidence
  )
);

atomicWrite(
  manifestPath,
  manifestModuleText(
    manifest
  )
);

console.log(
  `Synced ${evidence.length} ${season} NFL player availability evidence records.`
);

console.log(
  `Latest week: ${manifest.latestWeek}`
);

console.log(
  `Latest provider modification: ${manifest.latestModifiedAt || "unknown"}`
);

console.log(
  sourcePath
);

console.log(
  manifestPath
);
