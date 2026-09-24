// Prebuild guard: every static page's sitemap date must be at least as new as the
// page file's last git commit. Fails the build with the exact fix, so a page can't
// ship advertising an older date than its content. Skips (with a note) when git
// history is unavailable, e.g. a shallow clone or a build host without git.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildLastmodMap } from './page-dates.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dates = JSON.parse(readFileSync(join(root, 'src', 'data', 'page-dates.json'), 'utf8'));

function git(args) {
  return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}
let shallow = 'unknown';
try { shallow = git('rev-parse --is-shallow-repository'); } catch { shallow = 'no-git'; }
if (shallow !== 'false') {
  console.log(`page-dates-check: skipped (git history unavailable: ${shallow}); the map is still validated by the build.`);
  buildLastmodMap(); // still throws on a malformed map or guide date
  process.exit(0);
}

const failures = [];
for (const [path, date] of Object.entries(dates)) {
  if (path.startsWith('_')) continue;
  const file = path === '/' ? 'src/pages/index.astro' : `src/pages/${path.slice(1, -1)}.astro`;
  if (!existsSync(join(root, file))) { failures.push(`${path}: no page file at ${file} (remove the entry or fix the path)`); continue; }
  const last = git(`log -1 --format=%cs -- "${file}"`);
  if (last && last > date) failures.push(`${path}: ${file} last changed ${last} but page-dates.json says ${date} (set it to ${last} or later)`);
}
// Every static page must have an entry, so a new page can't fall through with no date.
const pageFiles = execSync('git ls-files src/pages', { cwd: root }).toString().trim().split(/\r?\n/);
for (const f of pageFiles) {
  const m = f.match(/^src\/pages\/([^/]+)\.astro$/);
  if (!m) continue; // guides/* are handled by frontmatter
  const path = m[1] === 'index' ? '/' : `/${m[1]}/`;
  if (!(path in dates)) failures.push(`${path}: ${f} has no entry in src/data/page-dates.json`);
}
buildLastmodMap();
if (failures.length) {
  console.error('page-dates-check: sitemap dates are behind the content:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`page-dates-check: ok (${Object.keys(dates).filter((k) => !k.startsWith('_')).length} static pages in step with git)`);

// Guides: pubDate is defined (src/content.config.ts) as the first day the guide was
// publicly served, so it can never be earlier than the commit that created the file.
// (09/24/2026: 13 guides carried their drafting date instead; corrected in the same commit.)
{
  const { readdirSync } = await import('node:fs');
  const dir = join(root, 'src', 'content', 'guides');
  const early = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const md = readFileSync(join(dir, f), 'utf8');
    if (/^draft:\s*true/m.test(md)) continue;
    const pub = (md.match(/^pubDate:\s*["']?(\d{4}-\d{2}-\d{2})/m) || [])[1];
    const added = git(`log --diff-filter=A --format=%cs -- "src/content/guides/${f}"`).split(/\r?\n/).pop();
    if (pub && added && pub < added) early.push(`${f}: pubDate ${pub} is before the file first existed (${added})`);
  }
  if (early.length) {
    console.error('page-dates-check: guide pubDate earlier than the file:\n  ' + early.join('\n  '));
    process.exit(1);
  }
}
