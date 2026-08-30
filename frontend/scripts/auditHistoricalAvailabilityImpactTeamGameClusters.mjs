import fs from "node:fs";

const file =
  "./data/calibration/historical/v1/historical-availability-impact-baseline-residuals-v1.jsonl";

const rows = fs.readFileSync(file, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const finite = v =>
  v !== null &&
  v !== undefined &&
  v !== "" &&
  Number.isFinite(Number(v));

const n = v => Number(v);

const mean = values =>
  values.length
    ? values.reduce((a,b)=>a+b,0) / values.length
    : null;

function pearson(xs,ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;

  const mx = mean(xs);
  const my = mean(ys);

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;

  for (let i=0;i<xs.length;i++) {
    const dx = xs[i]-mx;
    const dy = ys[i]-my;

    num += dx*dy;
    dx2 += dx*dx;
    dy2 += dy*dy;
  }

  const den = Math.sqrt(dx2*dy2);
  return den ? num/den : null;
}

const groups = new Map();

for (const row of rows) {
  const gameId = row?.identity?.gameId;
  const team = row?.identity?.team;

  if (!gameId || !team) continue;

  const key = `${gameId}:${team}`;

  if (!groups.has(key)) groups.set(key,[]);
  groups.get(key).push(row);
}

const teamGames = [];

let inconsistentResidualGroups = 0;
let inconsistentBaselineGroups = 0;

for (const [key,group] of groups) {
  const first = group[0];

  const residuals = [
    ...new Set(
      group
        .map(r=>r?.residual?.gamePerformanceResidual)
        .filter(finite)
        .map(n)
    )
  ];

  const baselines = [
    ...new Set(
      group
        .map(r=>r?.pregameBaseline?.expectedTeamMargin)
        .filter(finite)
        .map(n)
    )
  ];

  if (residuals.length !== 1)
    inconsistentResidualGroups++;

  if (baselines.length !== 1)
    inconsistentBaselineGroups++;

  const deltas = group
    .map(r=>r?.availability?.expectedReplacementDelta)
    .filter(finite)
    .map(n);

  const positiveLosses =
    deltas.map(v=>Math.max(0,v));

  teamGames.push({
    key,
    gameId:first.identity.gameId,
    season:first.identity.season,
    week:first.identity.week,
    team:first.identity.team,
    opponent:first.identity.opponent,
    side:first.identity.side,

    availabilityObservationCount:group.length,

    positions:[
      ...new Set(
        group
          .map(r=>r?.identity?.position)
          .filter(Boolean)
      )
    ],

    replacementDeltaSum:
      deltas.reduce((a,b)=>a+b,0),

    replacementDeltaMean:
      mean(deltas),

    positiveReplacementLossSum:
      positiveLosses.reduce((a,b)=>a+b,0),

    maximumReplacementLoss:
      positiveLosses.length
        ? Math.max(...positiveLosses)
        : 0,

    gamePerformanceResidual:
      residuals.length===1
        ? residuals[0]
        : null
  });
}

const usable = teamGames.filter(
  g =>
    finite(g.positiveReplacementLossSum) &&
    finite(g.gamePerformanceResidual)
);

const xs = usable.map(
  g=>n(g.positiveReplacementLossSum)
);

const ys = usable.map(
  g=>n(g.gamePerformanceResidual)
);

const byCount = {};

for (const g of usable) {
  const k = String(g.availabilityObservationCount);

  if (!byCount[k]) byCount[k]=[];
  byCount[k].push(g);
}

const countSummary = Object.fromEntries(
  Object.entries(byCount).map(([k,v])=>[
    k,
    {
      teamGames:v.length,
      meanCombinedReplacementLoss:
        mean(v.map(x=>x.positiveReplacementLossSum)),
      meanResidual:
        mean(v.map(x=>x.gamePerformanceResidual)),
      correlation:
        pearson(
          v.map(x=>x.positiveReplacementLossSum),
          v.map(x=>x.gamePerformanceResidual)
        )
    }
  ])
);

const bySeason = {};

for (const g of usable) {
  const k=String(g.season);

  if (!bySeason[k]) bySeason[k]=[];
  bySeason[k].push(g);
}

const seasonSummary = Object.fromEntries(
  Object.entries(bySeason).map(([k,v])=>[
    k,
    {
      teamGames:v.length,
      correlation:
        pearson(
          v.map(x=>x.positiveReplacementLossSum),
          v.map(x=>x.gamePerformanceResidual)
        ),
      meanCombinedReplacementLoss:
        mean(v.map(x=>x.positiveReplacementLossSum)),
      meanResidual:
        mean(v.map(x=>x.gamePerformanceResidual)
      )
    }
  ])
);

console.log(JSON.stringify({
  sprint:"2.18.10",
  mode:"READ_ONLY_TEAM_GAME_CLUSTER_AUDIT",

  sourcePlayerAvailabilityRows:rows.length,

  clustering:{
    teamGameGroups:groups.size,
    usableTeamGames:usable.length,

    groupsWithMultipleAvailabilityObservations:
      [...groups.values()]
        .filter(g=>g.length>1).length,

    maximumAvailabilityObservationsInTeamGame:
      groups.size
        ? Math.max(
            ...[...groups.values()]
              .map(g=>g.length)
          )
        : 0,

    inconsistentResidualGroups,
    inconsistentBaselineGroups
  },

  teamGameSignal:{
    combinedPositiveReplacementLossCorrelation:
      pearson(xs,ys),

    meanCombinedPositiveReplacementLoss:
      mean(xs),

    meanGamePerformanceResidual:
      mean(ys)
  },

  byAvailabilityObservationCount:
    countSummary,

  bySeason:
    seasonSummary,

  governance:{
    aggregationIsDiagnosticOnly:true,
    positiveReplacementLossIsNotAuthorizedImpact:true,
    gameResidualIsNotObservedPlayerImpact:true,
    causalTargetDefined:false,
    fittingAuthorized:false,
    learnedWeightsCreated:false,
    calibrationExecuted:false,
    teamStrengthMutated:false,
    pickemScoringMutated:false
  }
},null,2));
