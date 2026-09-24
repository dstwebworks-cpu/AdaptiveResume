// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { buildLastmodMap, urlPath } from './scripts/page-dates.mjs';

const lastmod = buildLastmodMap();

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
    // lastmod = one honest date per URL (rewritten 09/24/2026). Guides carry their own
    // pubDate/updatedDate; static pages read src/data/page-dates.json, which the
    // prebuild guard (scripts/page-dates-check.mjs) keeps in step with git. Before this,
    // a single constant stamped every non-legal page 2026-08-11, so pages published or
    // changed in September advertised an older date than their content. An unknown URL
    // fails the build on purpose: a page with no date must not ship with a guessed one.
    serialize(item) {
      const path = urlPath(item.url);
      const date = lastmod[path];
      if (!date) throw new Error(`sitemap: no lastmod for ${path}; add it to src/data/page-dates.json (static page) or fix the guide frontmatter`);
      item.lastmod = date;
      return item;
    },
  })],
  ...(onWindows ? {
    outDir: 'C:/Users/dammu/AppData/Local/Temp/rb-dist',
    vite: { cacheDir: 'C:/Users/dammu/AppData/Local/Temp/rb-vite-cache' },
  } : {}),
});
