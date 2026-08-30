import assert from "node:assert/strict";
import { formatHeight, formatMeasurements, formatWeight } from "./formatMeasurements.js";

assert.equal(formatMeasurements({ height: { value: 75, unit: "INCH" }, weight: { value: 239, unit: "POUND" } }), `6'3\" • 239 lbs`);
assert.equal(formatMeasurements({ height: `6'3\"`, weight: "239 lbs" }), `6'3\" • 239 lbs`);
assert.equal(formatMeasurements({ height: { value: 75, unit: "INCH" } }), `6'3\"`);
assert.equal(formatMeasurements({ weight: { value: 239, unit: "POUND" } }), "239 lbs");
assert.equal(formatMeasurements({}), "Measurements unavailable");
assert.equal(formatMeasurements(null), "Measurements unavailable");
assert.equal(formatHeight({ value: Number.NaN }), null);
assert.equal(formatWeight("[object Object]"), null);
console.log("Sprint 2B.4B measurement formatter: 8/8 passed");

