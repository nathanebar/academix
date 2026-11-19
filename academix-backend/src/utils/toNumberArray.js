
function toNumberArray(str) {
  if (!str) return []; // handle undefined / null / ""
  return str
    .split(",") // split on commas
    .map((s) => s.trim()) // remove surrounding whitespace
    .filter((s) => s !== "") // drop empty items (e.g. "1,,2")
    .map(Number) // convert to numbers
    .filter((n) => !Number.isNaN(n)); // drop non‑numeric values
}

module.exports = {
  toNumberArray,
};
