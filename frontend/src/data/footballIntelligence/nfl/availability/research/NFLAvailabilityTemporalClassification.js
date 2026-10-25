const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const INSTANT = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/;

function clean(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function validDateOnly(value) {
  if (!DATE_ONLY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function validInstant(value) {
  const match = INSTANT.exec(value);
  if (!match) return false;

  const [, day, hour, minute, second, , zone] = match;

  if (!validDateOnly(day)) return false;

  if (Number(hour) > 23 ||
      Number(minute) > 59 ||
      Number(second) > 59) return false;

  if (zone !== "Z") {
    const zoneHour = Number(zone.slice(1, 3));
    const zoneMinute = Number(zone.slice(4, 6));

    if (zoneHour > 23 || zoneMinute > 59) return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export function classifyNFLAvailabilityTemporal(signal, checkedAt) {
  // Acquisition timestamps do not establish event-effective time.
  void checkedAt;

  const value = clean(signal?.timing?.effectiveAt);

  if (value && validDateOnly(value)) {
    return {
      type: "DATE_ONLY",
      occurredAt: value,
      precision: "UNSPECIFIED",
      timezone: null,
    };
  }

  if (value && validInstant(value)) {
    return {
      type: "INSTANT",
      occurredAt: new Date(value).toISOString(),
      precision: "EXACT",
      timezone: "UTC",
    };
  }

  return {
    type: "TIME_UNKNOWN",
    occurredAt: null,
    precision: null,
    timezone: null,
  };
}
