const cleanString = (value) =>
  typeof value === "string" && value.trim() && !/^(undefined|null|nan|\[object object\])$/i.test(value.trim())
    ? value.trim()
    : null;

const numericValue = (measurement) => {
  const value = measurement && typeof measurement === "object" ? measurement.value : measurement;
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export function formatHeight(height) {
  const display = cleanString(height);
  if (display) return display;
  const inches = numericValue(height);
  if (inches === null) return null;
  const feet = Math.floor(inches / 12);
  const remainder = Math.round(inches % 12);
  return feet > 0 ? `${feet}'${remainder}"` : `${remainder}"`;
}

export function formatWeight(weight) {
  const display = cleanString(weight);
  if (display) return /(?:lb|lbs|pound)s?\.?$/i.test(display) ? display : `${display} lbs`;
  const pounds = numericValue(weight);
  return pounds === null ? null : `${Math.round(pounds)} lbs`;
}

export function formatMeasurements(measurements) {
  const height = formatHeight(measurements?.height);
  const weight = formatWeight(measurements?.weight);
  return [height, weight].filter(Boolean).join(" • ") || "Measurements unavailable";
}
