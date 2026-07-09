// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Real domain (owned 07/04/2026, Wix registrar) — canonical URLs + sitemap resolve
// here. The site still DEPLOYS only after validation passes (locked rule).
export default defineConfig({
  site: 'https://www.adaptiveresume.com',
  integrations: [sitemap()],
  // Keep build artifacts + Vite's churny dep cache OUT of the Dropbox-synced
  // folder, otherwise Dropbox locks files mid-rename and the build fails (EBUSY).
  // Source stays in Dropbox; only regenerable output moves to temp.
  outDir: 'C:/Users/dammu/AppData/Local/Temp/rb-dist',
  vite: {
    cacheDir: 'C:/Users/dammu/AppData/Local/Temp/rb-vite-cache',
  },
});
