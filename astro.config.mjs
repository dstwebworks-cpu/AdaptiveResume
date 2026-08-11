// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Real domain (owned 07/04/2026, Wix registrar) — canonical URLs + sitemap resolve
// here. The site still DEPLOYS only after validation passes (locked rule).
// Windows/Dropbox only: build artifacts + Vite's churny dep cache go to temp,
// otherwise Dropbox locks files mid-rename and the build fails (EBUSY). On CI
// (linux) the defaults apply — a hardcoded C:/ path would break the build there.
const onWindows = process.platform === 'win32';

export default defineConfig({
  // Non-www is the canonical host: the live site (Render + Cloudflare) serves
  // adaptiveresume.com and 301s www -> non-www; robots.txt already points here.
  site: 'https://adaptiveresume.com',
  integrations: [sitemap({
    // lastmod = honest freshness signal for crawler scheduling (added 08/06):
    // dated only for surfaces genuinely updated. 08/11: batch-one guides (10 new),
    // discount copy on every capture door, and privacy (new collection bullet) —
    // so privacy now carries lastmod too; terms/disclaimer still untouched.
    // Update this date only when content truly changes again.
    serialize(item) {
      const unchanged = ['/terms', '/disclaimer'];
      if (!unchanged.some((p) => item.url.includes(p))) item.lastmod = '2026-08-11';
      return item;
    },
  })],
  ...(onWindows ? {
    outDir: 'C:/Users/dammu/AppData/Local/Temp/rb-dist',
    vite: { cacheDir: 'C:/Users/dammu/AppData/Local/Temp/rb-vite-cache' },
  } : {}),
});
