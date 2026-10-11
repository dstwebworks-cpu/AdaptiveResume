// Postbuild guard (founder 10/11/2026: 12 meta descriptions over Google's display length passed every audit, because no check
// ever measured them). Fails the build when any built page has a missing or over-long meta description or title, so the
// next one is caught before it ships. Limits: description 70-160 characters (Google shows about 155-160), title up to 65.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.platform === 'win32' ? 'C:/Users/dammu/AppData/Local/Temp/rb-dist' : 'dist'; // same rule as astro.config.mjs
const DESC_MIN = 70, DESC_MAX = 160, TITLE_MAX = 65;
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

function pages(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...pages(p));
    else if (name === 'index.html') out.push(p);
  }
  return out;
}

const problems = [];
const files = pages(outDir);
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (/<meta[^>]+http-equiv="refresh"/i.test(html)) continue; // redirect stubs carry no search snippet
  const route = f.slice(outDir.length).replace(/\\/g, '/').replace(/index\.html$/, '') || '/';
  const desc = decode((html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] ?? '');
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] ?? '');
  if (!desc) problems.push(`${route}  no meta description`);
  else if (desc.length > DESC_MAX) problems.push(`${route}  description ${desc.length} characters (max ${DESC_MAX}): ${desc}`);
  else if (desc.length < DESC_MIN) problems.push(`${route}  description ${desc.length} characters (min ${DESC_MIN}): ${desc}`);
  if (!title) problems.push(`${route}  no title`);
  else if (title.length > TITLE_MAX) problems.push(`${route}  title ${title.length} characters (max ${TITLE_MAX}): ${title}`);
}
if (problems.length) {
  console.error(`meta-length-check: ${problems.length} problem(s) in ${files.length} pages. Fix the page's description or title, then build again:`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`meta-length-check: ok (${files.length} pages; descriptions ${DESC_MIN}-${DESC_MAX}, titles up to ${TITLE_MAX})`);
