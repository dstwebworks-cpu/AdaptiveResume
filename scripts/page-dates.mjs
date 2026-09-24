// Sitemap lastmod, one honest date per URL.
//
// Guides: updatedDate if present, else pubDate, read straight from each guide's
// frontmatter (drafts skipped, matching getStaticPaths). /guides/ = the newest guide.
// Static pages: src/data/page-dates.json, kept in step with the page files by
// scripts/page-dates-check.mjs (runs in prebuild).
//
// Replaces the single hardcoded date that stamped ~50 pages with 2026-08-11
// (found 09/24/2026: nine commercial guides published 09/19-09/20 and the legal
// pages changed 09/06 and 09/08 all advertised older dates to crawlers).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GUIDES_DIR = join(root, 'src', 'content', 'guides');
const PAGE_DATES = join(root, 'src', 'data', 'page-dates.json');
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}
function field(fm, name) {
  const m = fm.match(new RegExp(`^${name}:\s*["']?([^"'\r\n]+?)["']?\s*$`, 'm'));
  return m ? m[1].trim() : undefined;
}

/** @returns {Record<string, string>} URL path (slash form) -> YYYY-MM-DD */
export function buildLastmodMap() {
  const map = {};
  const staticDates = JSON.parse(readFileSync(PAGE_DATES, 'utf8'));
  for (const [path, date] of Object.entries(staticDates)) {
    if (path.startsWith('_')) continue;
    if (!ISO_DAY.test(date)) throw new Error(`page-dates.json: ${path} has a non-ISO date "${date}"`);
    map[path] = date;
  }
  let newestGuide = '0000-00-00';
  for (const file of readdirSync(GUIDES_DIR)) {
    if (!file.endsWith('.md')) continue;
    const fm = frontmatter(readFileSync(join(GUIDES_DIR, file), 'utf8'));
    if (field(fm, 'draft') === 'true') continue;
    const slug = file.replace(/\.md$/, '');
    const date = field(fm, 'updatedDate') ?? field(fm, 'pubDate');
    if (!date || !ISO_DAY.test(date)) throw new Error(`guide ${slug}: pubDate/updatedDate missing or not YYYY-MM-DD (got "${date}")`);
    map[`/guides/${slug}/`] = date;
    if (date > newestGuide) newestGuide = date;
  }
  map['/guides/'] = newestGuide;
  return map;
}

/** Path of a site URL in the canonical slash form, e.g. "/guides/cna-resume/". */
export function urlPath(url, site) {
  let p = url.startsWith('http') ? new URL(url).pathname : url;
  if (!p.endsWith('/')) p += '/';
  return p;
}
