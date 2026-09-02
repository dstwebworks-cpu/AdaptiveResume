import { defineConfig } from "@playwright/test";

/**
 * MOBILE SUITE for the marketing site (rb-site). Founder directive 09/01/2026:
 * ~80% of traffic is mobile and rising, the email-capture form IS the revenue
 * funnel, and until now this site had ZERO automated tests — a mobile regression
 * on the form could silently kill conversion (the exact class of failure we hit).
 *
 * Boots a FRESH production build on a dedicated port (4322) so the suite can never
 * pass against stale output (the stale-process trap rb-app documents), then checks
 * every page at real phone/tablet widths.
 *
 * Run: npm run test:mobile   (or npm test)
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  retries: 0,
  use: { baseURL: "http://localhost:4322" },
  webServer: {
    // Build THEN preview so tests always run against current source. Astro
    // preview serves ./dist; the build is fast (~2s) and guarantees freshness.
    command: "npm run build && npm run preview -- --port 4322",
    port: 4322,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
