function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rateMatchup(
  offenseValue,
  defenseAllowedOrGenerated,
  {
    lowerOffenseIsBetter = false,
    defenseIsGenerated = false,
    scale = 0.10,
  } = {}
) {
  if (
    !finite(offenseValue) ||
    !finite(defenseAllowedOrGenerated)
  ) {
    return null;
  }

  let teamSpecific;

  if (defenseIsGenerated) {
    // Protection: lower pressure allowed is better while higher
    // opponent pressure generated is harder.
    teamSpecific =
      (1 - offenseValue) -
      defenseAllowedOrGenerated;
  } else if (lowerOffenseIsBetter) {
    teamSpecific =
      defenseAllowedOrGenerated -
      offenseValue;
  } else {
    teamSpecific =
      offenseValue -
      defenseAllowedOrGenerated;
  }

  return clamp(
    (teamSpecific / scale) * 25,
    -50,
    50
  );
}

function compare(home, away) {
  if (!finite(home) || !finite(away)) {
    return null;
  }

  return clamp(home - away, -50, 50);
}

function average(values) {
  const valid = values.filter(finite);

  return valid.length
    ? valid.reduce(
        (sum, value) => sum + value,
        0
      ) / valid.length
    : null;
}

function weatherStyleAdjustment({
  evidence,
  weather,
}) {
  if (!evidence || !weather) {
    return null;
  }

  const windMph =
    Number(weather?.windMph);
  const precipitation =
    Boolean(weather?.precipitation);

  if (
    !Number.isFinite(windMph) &&
    !precipitation
  ) {
    return null;
  }

  const passRate =
    evidence?.tendencies?.passRate;

  if (!finite(passRate)) {
    return null;
  }

  let severity = 0;

  if (Number.isFinite(windMph)) {
    severity +=
      clamp(
        (windMph - 12) / 18,
        0,
        1
      );
  }

  if (precipitation) {
    severity += 0.35;
  }

  severity = clamp(severity, 0, 1);

  // Higher pass dependence means larger adverse-weather exposure.
  return -clamp(
    (passRate - 0.45) *
      50 *
      severity,
    0,
    12
  );
}

export function buildNFLAdvancedMatchupDimensions({
  homeEvidence,
  awayEvidence,
  weather = null,
} = {}) {
  if (!homeEvidence || !awayEvidence) {
    return {
      protectionPressure: null,
      explosivePlay: null,
      redZone: null,
      weatherStyle: null,
      tendencies: null,
    };
  }

  const homeProtection =
    rateMatchup(
      homeEvidence.offense
        ?.pressureAllowedRate,
      awayEvidence.defense
        ?.pressureGeneratedRate,
      {
        defenseIsGenerated: true,
        scale: 0.15,
      }
    );

  const awayProtection =
    rateMatchup(
      awayEvidence.offense
        ?.pressureAllowedRate,
      homeEvidence.defense
        ?.pressureGeneratedRate,
      {
        defenseIsGenerated: true,
        scale: 0.15,
      }
    );

  const homeExplosive =
    average([
      rateMatchup(
        homeEvidence.offense
          ?.explosivePassRate,
        awayEvidence.defense
          ?.explosivePassAllowedRate,
        { scale: 0.08 }
      ),
      rateMatchup(
        homeEvidence.offense
          ?.explosiveRushRate,
        awayEvidence.defense
          ?.explosiveRushAllowedRate,
        { scale: 0.08 }
      ),
    ]);

  const awayExplosive =
    average([
      rateMatchup(
        awayEvidence.offense
          ?.explosivePassRate,
        homeEvidence.defense
          ?.explosivePassAllowedRate,
        { scale: 0.08 }
      ),
      rateMatchup(
        awayEvidence.offense
          ?.explosiveRushRate,
        homeEvidence.defense
          ?.explosiveRushAllowedRate,
        { scale: 0.08 }
      ),
    ]);

  const homeRedZone =
    average([
      rateMatchup(
        homeEvidence.offense
          ?.redZoneSuccessRate,
        awayEvidence.defense
          ?.redZoneSuccessRateAllowed,
        { scale: 0.12 }
      ),
      rateMatchup(
        homeEvidence.offense
          ?.redZoneEpaPerPlay,
        awayEvidence.defense
          ?.redZoneEpaAllowedPerPlay,
        { scale: 0.20 }
      ),
    ]);

  const awayRedZone =
    average([
      rateMatchup(
        awayEvidence.offense
          ?.redZoneSuccessRate,
        homeEvidence.defense
          ?.redZoneSuccessRateAllowed,
        { scale: 0.12 }
      ),
      rateMatchup(
        awayEvidence.offense
          ?.redZoneEpaPerPlay,
        homeEvidence.defense
          ?.redZoneEpaAllowedPerPlay,
        { scale: 0.20 }
      ),
    ]);

  const homeWeather =
    weatherStyleAdjustment({
      evidence: homeEvidence,
      weather,
    });

  const awayWeather =
    weatherStyleAdjustment({
      evidence: awayEvidence,
      weather,
    });

  return {
    protectionPressure:
      compare(
        homeProtection,
        awayProtection
      ),

    explosivePlay:
      compare(
        homeExplosive,
        awayExplosive
      ),

    redZone:
      compare(
        homeRedZone,
        awayRedZone
      ),

    weatherStyle:
      compare(
        homeWeather,
        awayWeather
      ),

    tendencies: {
      home: homeEvidence.tendencies,
      away: awayEvidence.tendencies,
    },

    raw: {
      homeProtection,
      awayProtection,
      homeExplosive,
      awayExplosive,
      homeRedZone,
      awayRedZone,
      homeWeather,
      awayWeather,
    },
  };
}

export default {
  buildNFLAdvancedMatchupDimensions,
};
