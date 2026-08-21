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

  // Trailing slash is the canonical form, and it is now enforced rather than assumed.
  // GSC reported 14 URLs as "Alternate page with proper canonical tag" on 08/2026: the
  // canonicals and the sitemap were correct (slash form), but 33 of OUR OWN internal
  // links pointed at the slash-less variant, which also returns 200. Every one of those
  // links advertised a duplicate URL to Google, which then filed the crawl under the
  // canonical instead of indexing it. Links fixed 08/21; this setting stops the drift
  // coming back, and makes dev behave like production.
  trailingSlash: 'always',
  build: { format: 'directory' },
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
