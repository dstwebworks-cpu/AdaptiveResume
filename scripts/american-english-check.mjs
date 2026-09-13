// American English only, everywhere on the marketing site. Runs before every build.
//
// Why: founder catch 09/13/2026 - British spellings drifted into drafting briefs and app
// comments for weeks with nothing to catch them. The site was clean that day; this keeps
// it that way. Prints file:line for every hit and exits 1 so the build stops.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const SCAN = ["src", "public"];
const EXT = new Set([".astro", ".md", ".mdx", ".ts", ".js", ".mjs", ".json", ".txt", ".html", ".css"]);
const BRITISH = new RegExp(
  String.raw`\b(neighbour|colour|honour|favour|behaviour|labour|centre(s|d)?\b|licence|programmes?\b|` +
  String.raw`organis(e|ed|ing|ation)|recognis(e|ed|ing)|realis(e|ed|ing|ation)|sterilis(e|ed|ing|ation)|` +
  String.raw`authoris(e|ed|ing|ation)|paediatric|anaesth|catalogue|defence|practis(e|ed|ing)|travelling|` +
  String.raw`modelling|cancelled|enrol\b|\bgrey\b|cheque|judgement|whilst|amongst|learnt|fulfil\b|` +
  String.raw`analys(e|ed|ing)\b|apologis(e|ed|ing)|minimis(e|ed|ing)|maximis(e|ed|ing)|optimis(e|ed|ing|ation)|` +
  String.raw`prioritis(e|ed|ing)|summaris(e|ed|ing)|customis(e|ed|ing|ation)|utilis(e|ed|ing)|specialis(e|ed|ing))\w*`,
  "i",
);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p, out); }
    else if (EXT.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

const hits = [];
for (const d of SCAN) {
  const abs = path.join(ROOT, d);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
      const m = BRITISH.exec(line);
      if (m) hits.push(`${path.relative(ROOT, file)}:${i + 1}: "${m[0]}"`);
    });
  }
}
if (hits.length) {
  console.error(`american-english-check: ${hits.length} British spelling(s) found - use American English:\n  ${hits.join("\n  ")}`);
  process.exit(1);
}
console.log("american-english-check: clean");
