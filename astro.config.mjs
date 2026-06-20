// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTE: `site` is a PLACEHOLDER domain — swap to the real .com once the brand
// name + domain are registered (TODO: Stage-2 "Check domain availability").
export default defineConfig({
  site: 'https://www.resumevalue.example',
  integrations: [sitemap()],
  // Keep build artifacts + Vite's churny dep cache OUT of the Dropbox-synced
  // folder, otherwise Dropbox locks files mid-rename and the build fails (EBUSY).
  // Source stays in Dropbox; only regenerable output moves to temp.
  outDir: 'C:/Users/dammu/AppData/Local/Temp/rb-dist',
  vite: {
    cacheDir: 'C:/Users/dammu/AppData/Local/Temp/rb-vite-cache',
  },
});
