// Mobile-usability sweep (founder direction 09/20/2026): render pages at three real
// device widths and report the mechanical faults a human tester would hit first.
//   node scripts/mobile-sweep.mjs --group 3          (a group from scripts/clarity-groups.json)
//   node scripts/mobile-sweep.mjs /guides/ /terms/    (explicit paths)
//   node scripts/mobile-sweep.mjs --all               (every page in dist)
// Builds first, serves ./dist on 4322 (same as the Playwright config), then for each
// page and width records: horizontal overflow, elements wider than the viewport, tap
// targets under 44px (links and buttons), JS errors, and a full-page screenshot.
// Output: scripts/out/mobile-sweep/<date>/report.md + report.json + screenshots.
import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import net from 'node:net';

const VIEWPORTS = [
  { name: 'android-360', width: 360, height: 800 },
  { name: 'iphone-390', width: 390, height: 844 },
  { name: 'ipad-768', width: 768, height: 1024 },
];
const DIST = 'C:/Users/dammu/AppData/Local/Temp/rb-dist';
const PORT = 4322;

function pagesFromArgs() {
  const a = process.argv.slice(2);
  if (a.includes('--all')) return walk(DIST, '');
  const gi = a.indexOf('--group');
  if (gi >= 0) {
    const groups = JSON.parse(readFileSync(new URL('./clarity-groups.json', import.meta.url), 'utf8'));
    const n = Number(a[gi + 1]);
    if (!groups[n - 1]) throw new Error('no group ' + n);
    return groups[n - 1];
  }
  // Git Bash rewrites leading-slash args into Windows paths; accept either form and normalize.
  const explicit = a
    .filter((x) => !x.startsWith('--') && !/^[0-9]+$/.test(x))
    .map((x) => x.split(String.fromCharCode(92)).join('/'))
    // Git Bash turns a leading-slash arg into "C:/Program Files/Git/guides/..."; strip that prefix.
    .map((x) => x.replace(/^[A-Za-z]:[/].*?[/](?=guides|terms|privacy|disclaimer|acceptable-use|$)/, ''))
    .map((x) => '/' + x.replace(/^[/]+/, ''))
    .map((x) => (x.endsWith('/') ? x : x + '/'));
  if (!explicit.length) throw new Error('give --group N, --all, or paths');
  return explicit;
}
function walk(dir, rel) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (existsSync(join(p, 'index.html'))) out.push(rel + '/' + e + '/');
      out.push(...walk(p, rel + '/' + e));
    }
  }
  if (rel === '' && existsSync(join(dir, 'index.html'))) out.unshift('/');
  return out.filter((x) => !x.startsWith('/_astro'));
}
function waitPort(port, ms = 120000) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    (function tryOnce() {
      const s = net.connect(port, '127.0.0.1');
      s.once('connect', () => { s.end(); res(); });
      s.once('error', () => { if (Date.now() - t0 > ms) rej(new Error('preview did not start')); else setTimeout(tryOnce, 400); });
    })();
  });
}

const pages = pagesFromArgs();
console.log(`building, then sweeping ${pages.length} page(s) x ${VIEWPORTS.length} widths`);
execSync('npm run build', { stdio: 'inherit' });
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { shell: true, stdio: 'ignore' });
await waitPort(PORT);

const stamp = new Date().toISOString().slice(0, 10);
const outDir = join('scripts', 'out', 'mobile-sweep', stamp);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const report = [];

for (const path of pages) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    const resp = await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'networkidle' });
    const m = await page.evaluate((vw) => {
      const doc = document.scrollingElement ?? document.documentElement;
      const wide = [];
      const small = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 1 && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).overflowX !== 'scroll') {
          if (!el.closest('.table-wrap') && wide.length < 12) wide.push({ tag: el.tagName.toLowerCase(), cls: el.className && String(el.className).slice(0, 40), right: Math.round(r.right), text: (el.textContent || '').trim().slice(0, 50) });
        }
      }
      for (const el of document.querySelectorAll('a, button, input, select, textarea, summary')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Inline text links inside prose are expected to be text-sized; the tap-target rule is for controls and standalone links.
        const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, td, dd, summary, figcaption');
        if ((r.height < 44 || r.width < 44) && !inline && !el.closest('nav.desktop, footer, .skip')) {
          if (small.length < 12) small.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40) });
        }
      }
      return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, wide, small };
    }, vp.width);
    const shot = join(outDir, `${path.replace(/[\/]/g, '_') || '_root'}-${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    report.push({ path, viewport: vp.name, status: resp?.status(), overflowPx: Math.max(0, m.scrollW - m.clientW), wide: m.wide, smallTargets: m.small, jsErrors: errors, screenshot: shot });
    await ctx.close();
  }
}
await browser.close();
server.kill();
try { execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: 'ignore' }); } catch {}

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
let md = `# Mobile sweep ${stamp}\n\n| Page | Width | HTTP | Overflow px | Wide elements | Small tap targets | JS errors |\n|---|---|---|---|---|---|---|\n`;
for (const r of report) md += `| ${r.path} | ${r.viewport} | ${r.status} | ${r.overflowPx} | ${r.wide.length} | ${r.smallTargets.length} | ${r.jsErrors.length} |\n`;
md += '\n## Details (only rows with a fault)\n';
for (const r of report) {
  if (!r.overflowPx && !r.wide.length && !r.smallTargets.length && !r.jsErrors.length) continue;
  md += `\n### ${r.path} at ${r.viewport}\n`;
  if (r.overflowPx) md += `- Horizontal overflow: ${r.overflowPx}px wider than the screen.\n`;
  for (const w of r.wide) md += `- Wide: <${w.tag}${w.cls ? ' .' + w.cls : ''}> extends to ${w.right}px: "${w.text}"\n`;
  for (const s of r.smallTargets) md += `- Small tap target: <${s.tag}> ${s.w}x${s.h}px: "${s.text}"\n`;
  for (const e of r.jsErrors) md += `- JS error: ${e}\n`;
  md += `- Screenshot: ${r.screenshot}\n`;
}
writeFileSync(join(outDir, 'report.md'), md);
const faults = report.filter((r) => r.overflowPx || r.wide.length || r.smallTargets.length || r.jsErrors.length).length;
console.log(`done: ${report.length} renders, ${faults} with a fault -> ${join(outDir, 'report.md')}`);
process.exit(0);
