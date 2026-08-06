// Per-guide branded card generator (08/06/2026). One card per guide in
// src/content/guides -> public/img/guides/<slug>.png (1200x630). Used as the
// on-page hero, the per-page og:image, and the Article schema image — so every
// guide (including all future SEO-Tracker pages) gets imagery, a real social
// preview, and complete structured data from one `node scripts/generate-guide-cards.mjs`.
// Design: brand navy + amber, audience tag, title, approved tagline. No stock, no clipart.
import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const GUIDES = "src/content/guides";
const OUT = "public/img/guides";
const NAVY = "#1d3a66", NAVY_DEEP = "#16294a", AMBER = "#c9740f", INK = "#ffffff", SOFT = "#b9c6dc";

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Greedy word-wrap to at most `max` chars/line; 3 lines cap (titles are <=80 chars).
function wrap(text, max) {
  const words = text.split(/\s+/); const lines = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + " " + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + " " + w).trim();
  }
  return lines;
}

function cardSvg({ title, audience }) {
  const big = title.length <= 58;
  const size = big ? 58 : 48;
  const lines = wrap(title, big ? 30 : 36).slice(0, 4);
  const lineH = size * 1.22;
  const titleY = 356 - ((lines.length - 1) * lineH) / 2;
  const tspans = lines.map((l, i) =>
    `<tspan x="90" y="${Math.round(titleY + i * lineH)}">${esc(l)}</tspan>`).join("");
  return `<svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="628" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="${AMBER}"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <rect x="90" y="64" width="54" height="54" rx="12" fill="${INK}" opacity="0.95"/>
    <text x="117" y="101" font-size="26" font-weight="800" fill="${NAVY}" text-anchor="middle">AR</text>
    <text x="160" y="99" font-size="30" font-weight="700" fill="${INK}">Adaptive<tspan fill="${AMBER}">Resume</tspan></text>
    <text x="90" y="196" font-size="22" font-weight="700" fill="${AMBER}" letter-spacing="3">${esc(audience.toUpperCase())}</text>
    <text font-size="${size}" font-weight="800" fill="${INK}">${tspans}</text>
    <text x="90" y="560" font-size="24" font-weight="600" fill="${SOFT}">adaptiveresume.com</text>
    <text x="1110" y="560" font-size="24" font-weight="600" fill="${SOFT}" text-anchor="end">You approve every line.</text>
  </g>
</svg>`;
}

// Minimal frontmatter reads — only the two quoted string fields the card needs.
const fm = (src, key) => (src.match(new RegExp(`^${key}:\\s*"([^"]*)"`, "m")) ?? [])[1];

const files = (await readdir(GUIDES)).filter((f) => f.endsWith(".md"));
await mkdir(OUT, { recursive: true });
let n = 0;
for (const f of files) {
  const src = await readFile(path.join(GUIDES, f), "utf8");
  if (/^draft:\s*true/m.test(src)) continue;
  const title = fm(src, "title"), audience = fm(src, "audience");
  if (!title || !audience) { console.warn(`SKIP ${f}: missing title/audience`); continue; }
  const slug = f.replace(/\.md$/, "");
  await sharp(Buffer.from(cardSvg({ title, audience }))).png({ compressionLevel: 9 }).toFile(path.join(OUT, `${slug}.png`));
  n++;
}
console.log(`generated ${n} guide cards -> ${OUT}`);
