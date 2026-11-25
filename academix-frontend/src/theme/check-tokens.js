// Checks that variables.css matches tokens.ts (issue #100): every token has exactly one CSS variable
// with the same value, and variables.css declares nothing else.
// Run from academix-frontend/:  node src/theme/check-tokens.js
// (Plain Node + the TypeScript compiler already installed by react-scripts; no test runner needed.)
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const src = fs.readFileSync(path.join(__dirname, "tokens.ts"), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
const mod = { exports: {} };
new Function("module", "exports", js)(mod, mod.exports);
const { semantic, palette, radius, shadow, fontFamily, toCssVarName, cssVar } = mod.exports;

const css = fs.readFileSync(path.join(__dirname, "variables.css"), "utf8");
const declared = new Map(Array.from(css.matchAll(/(--ax-[\w-]+)\s*:\s*([^;]+);/g)).map((m) => [m[1], m[2].trim()]));
const expected = new Map([
  ...Object.entries(semantic).map(([k, v]) => [`--ax-${toCssVarName(k)}`, v]),
  ...Object.entries(palette).map(([k, v]) => [`--ax-${toCssVarName(k)}`, v]),
  ...Object.entries(radius).map(([k, v]) => [`--ax-radius-${k}`, v]),
  ...Object.entries(shadow).map(([k, v]) => [`--ax-shadow-${k}`, v]),
  ["--ax-font-family", fontFamily],
]);

const errors = [];
for (const [name, value] of expected) {
  if (!declared.has(name)) errors.push(`missing in variables.css: ${name}: ${value}`);
  else if (declared.get(name) !== value) errors.push(`different value for ${name}: css "${declared.get(name)}" vs ts "${value}"`);
}
for (const name of declared.keys()) if (!expected.has(name)) errors.push(`not in tokens.ts: ${name}`);
const values = Object.values(palette);
for (const v of values) if (!/^#[0-9a-f]{6}$/.test(v)) errors.push(`palette value not lowercase 6-digit hex: ${v}`);
if (new Set(values).size !== values.length) errors.push("palette has duplicate values");
if (cssVar("appBg") !== "var(--ax-app-bg)") errors.push("cssVar is broken");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`tokens OK: ${expected.size} variables in sync`);
