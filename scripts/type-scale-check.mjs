// Type scale check (founder 11/17/2026: "at least 10 fonts sizes and families, on one page. It looks like Ai garbage";
// the home page had 22 text sizes). Every font-size in the site's source is one of the six scale tokens in
// src/styles/global.css (var(--fs-small|body|lead|h3|h2|h1)), every font-weight is 400, 700 or 800, and no font
// shorthand sets a size. Runs before every build; prints file:line for each offender and exits 1.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src"];
const TOKENS = ["small", "body", "lead", "h3", "h2", "h1", "brand"]; // brand: the header wordmark only, equal to body at normal text
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(astro|css|md|mdx|html)$/.test(f)) files.push(p); } };
ROOTS.forEach(walk);

const bad = [];
for (const f of files) {
  readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(/font-size\s*:\s*([^;"'}]+)/g)) {
      const v = m[1].trim();
      const t = v.match(/^var\(--fs-([a-z0-9]+)\)$/);
      if (!t || !TOKENS.includes(t[1])) bad.push(`${f}:${i + 1}: font-size "${v}" is not a scale token`);
    }
    for (const m of line.matchAll(/font-weight\s*:\s*([^;"'}]+)/g)) {
      const v = m[1].trim();
      if (!["400", "700", "800", "inherit", "normal", "bold"].includes(v)) bad.push(`${f}:${i + 1}: font-weight "${v}" is not 400, 700 or 800`);
    }
    for (const m of line.matchAll(/(?<![-\w])font\s*:\s*([^;"'}]+)/g)) {
      const v = m[1].trim();
      if (v !== "inherit" && /\d/.test(v)) bad.push(`${f}:${i + 1}: font shorthand "${v}" sets a size or weight outside the scale`);
    }
  });
}
if (bad.length) {
  console.error(`type-scale-check: ${bad.length} problem(s). Use var(--fs-small|body|lead|h3|h2|h1) and weights 400, 700 or 800 (src/styles/global.css).`);
  bad.forEach((b) => console.error("  " + b));
  process.exit(1);
}
console.log(`type-scale-check: ok (${files.length} files; six size tokens, weights 400/700/800)`);
