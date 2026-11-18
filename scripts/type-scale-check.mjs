// Type scale check (founder 11/17/2026: "at least 10 fonts sizes and families, on one page. It looks like Ai garbage";
// the home page had 22 text sizes). Every font-size in the site's source is one of the scale tokens in
// src/styles/global.css (var(--fs-small|body|lead|h3|h2|h1)); the logo tokens (--fs-brand, --fs-mark) are used only on the
// logo's own lines in the header and footer. Every font-weight is 400, 700 or 800, and no font shorthand sets a size.
// Site review F5 (11/18/2026) added: no <small> element, no text size set from a script, and the token values themselves
// are locked, so changing one is a deliberate edit here too. Runs before every build; prints file:line and exits 1.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const ROOTS = ["src"];
const TOKENS = ["small", "body", "lead", "h3", "h2", "h1"];
const LOGO_TOKENS = ["brand", "mark"];
const LOGO_FILES = ["Header.astro", "Footer.astro"];
// The scale, as decided 11/17/2026. Changing a size means changing it here as well.
const LOCKED = {
  small: ".875rem",
  body: "1.0625rem",
  lead: "clamp(1.0625rem, 1.6vw, 1.25rem)",
  h3: "1.25rem",
  h2: "clamp(1.625rem, 3vw, 2.25rem)",
  h1: "clamp(2.125rem, 4.6vw, 3.375rem)",
  brand: "min(1.0625rem, 17px)",
  mark: "min(.875rem, 14px)",
};
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(astro|css|md|mdx|html|ts|js|mjs|tsx)$/.test(f)) files.push(p); } };
ROOTS.forEach(walk);

const bad = [];
for (const f of files) {
  const logoFile = LOGO_FILES.includes(basename(f));
  readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
    const at = `${f}:${i + 1}`;
    for (const m of line.matchAll(/font-size\s*:\s*([^;"'}]+)/g)) {
      const v = m[1].trim();
      const t = v.match(/^var\(--fs-([a-z0-9]+)\)$/);
      if (t && TOKENS.includes(t[1])) continue;
      if (t && LOGO_TOKENS.includes(t[1]) && logoFile && /\.(brand|mark)\b/.test(line)) continue;
      bad.push(`${at}: font-size "${v}" is not a scale token${t && LOGO_TOKENS.includes(t[1]) ? " (the logo tokens are for the logo only)" : ""}`);
    }
    for (const m of line.matchAll(/font-weight\s*:\s*([^;"'}]+)/g)) {
      const v = m[1].trim();
      if (!["400", "700", "800", "inherit", "normal", "bold"].includes(v)) bad.push(`${at}: font-weight "${v}" is not 400, 700 or 800`);
    }
    for (const m of line.matchAll(/(?<![-\w])font\s*:\s*([^;"'}]+)/g)) {
      const v = m[1].trim();
      if (v !== "inherit" && /\d/.test(v)) bad.push(`${at}: font shorthand "${v}" sets a size or weight outside the scale`);
    }
    if (/<small[\s>]/i.test(line)) bad.push(`${at}: <small> sets its own text size; use class="small" (the small token)`);
    if (/\bfontSize\b|\.style\.font\b|setProperty\(\s*["'`]font-size/.test(line)) bad.push(`${at}: a text size set from a script`);
  });
}
// The token values themselves.
const css = readFileSync("src/styles/global.css", "utf8");
const defined = Object.fromEntries([...css.matchAll(/--fs-([a-z0-9]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
for (const [k, v] of Object.entries(LOCKED)) if (defined[k] !== v) bad.push(`src/styles/global.css: --fs-${k} is "${defined[k]}", the scale says "${v}"`);
for (const k of Object.keys(defined)) if (!(k in LOCKED)) bad.push(`src/styles/global.css: --fs-${k} is not part of the scale`);

if (bad.length) {
  console.error(`type-scale-check: ${bad.length} problem(s). Use var(--fs-small|body|lead|h3|h2|h1) and weights 400, 700 or 800 (src/styles/global.css).`);
  bad.forEach((b) => console.error("  " + b));
  process.exit(1);
}
console.log(`type-scale-check: ok (${files.length} files; six text sizes and two logo sizes, weights 400/700/800)`);
