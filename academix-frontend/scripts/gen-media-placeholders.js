// Génère des fichiers médias "placeholder" pour chaque image référencée dans src/
// mais absente du disque (le dossier src/media n'a pas été extrait du réseau fermé).
// Les fichiers existants ne sont JAMAIS écrasés : il suffit de copier les vrais médias
// dans src/media pour les remplacer.
//
// Usage : node scripts/gen-media-placeholders.js [--dry-run]
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "src");
const DRY = process.argv.includes("--dry-run");

// PNG 1x1 gris clair (utilisé aussi pour .jpg/.gif : les navigateurs détectent le format réel)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN4+/btfwAJ3gPw2pBmNAAAAABJRU5ErkJggg==",
  "base64"
);
const svg = (name) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
  `<title>${name.replace(/[<&>]/g, "")}</title>` +
  `<rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>` +
  `</svg>\n`;

const IMG_RE = /['"]((?:\.{1,2}\/)[^'"\n]*?\.(png|jpe?g|svg|gif))['"]/gi;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const missing = new Map();
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(IMG_RE)) {
    const target = path.resolve(path.dirname(file), m[1]);
    if (!target.startsWith(SRC)) continue;
    if (!fs.existsSync(target)) missing.set(target, m[2].toLowerCase());
  }
}

for (const [target, ext] of missing) {
  const rel = path.relative(SRC, target);
  if (DRY) {
    console.log("would create", rel);
    continue;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const content =
    ext === "svg" ? svg(path.basename(target, ".svg")) : PNG;
  fs.writeFileSync(target, content);
  console.log("created", rel);
}
console.log(`${missing.size} placeholder(s) ${DRY ? "to create" : "created"}.`);
