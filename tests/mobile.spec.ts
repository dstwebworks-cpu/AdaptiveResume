import { test, expect, type Page } from "@playwright/test";

/**
 * MOBILE/TABLET SUITE for the marketing site. Founder directive 09/01/2026:
 * mobile is ~80% of traffic and rising; the capture form is the funnel. Every
 * signed-out marketing surface is loaded at real device widths and checked for:
 *   1. NO horizontal overflow (document.scrollWidth > client width = unwrapped
 *      text or a too-wide element — the automated signature of a broken layout).
 *   2. Zero JS exceptions.
 *   3. On the capture pages: the email field + submit button are visible and are
 *      real tap targets (>=44px, the Apple/WCAG floor) — a cramped or clipped
 *      form on a phone is the silent conversion killer this suite exists to catch.
 */

const VIEWPORTS = [
  { name: "small-phone", width: 360, height: 800 },  // compact Android
  { name: "phone", width: 390, height: 844 },        // iPhone class
  { name: "tablet", width: 768, height: 1024 },      // iPad class
] as const;

// Every signed-out marketing surface — overflow + JS-error checked on ALL.
const PAGES = [
  { path: "/", label: "home" },
  { path: "/demo/", label: "demo" },
  { path: "/fix/", label: "fix" },
  { path: "/career-change/", label: "career-change" },
  { path: "/business/", label: "business" },
  { path: "/guides/", label: "guides index" },
  { path: "/guides/emt-resume/", label: "guide (emt)" },
  // Wave 4 (09/02): five service landing pages + one of the five new guides.
  { path: "/resume-writing-service/", label: "resume-writing-service" },
  { path: "/rewrite-my-resume/", label: "rewrite-my-resume" },
  { path: "/update-my-resume/", label: "update-my-resume" },
  { path: "/resume-makeover/", label: "resume-makeover" },
  { path: "/nurses/", label: "nurses" },
  // Wave 8 (09/09): editing-service landing page + one of the three new guides.
  { path: "/resume-editing-service/", label: "resume-editing-service" },
  { path: "/guides/soc-analyst-resume/", label: "guide (soc-analyst)" },
  { path: "/guides/warehouse-supervisor-resume/", label: "guide (warehouse-supervisor)" },
  { path: "/terms/", label: "terms" },
  { path: "/privacy/", label: "privacy" },
  { path: "/disclaimer/", label: "disclaimer" },
  { path: "/acceptable-use/", label: "acceptable-use" },
] as const;

// Pages whose primary CTA is the email-capture form (the revenue funnel).
const CAPTURE_PAGES = [
  { path: "/", label: "home hero" },
  { path: "/fix/", label: "fix" },
  { path: "/career-change/", label: "career-change" },
  { path: "/resume-writing-service/", label: "resume-writing-service" },
  { path: "/rewrite-my-resume/", label: "rewrite-my-resume" },
  { path: "/update-my-resume/", label: "update-my-resume" },
  { path: "/resume-makeover/", label: "resume-makeover" },
  { path: "/nurses/", label: "nurses" },
  { path: "/resume-editing-service/", label: "resume-editing-service" },
] as const;

function trapPageErrors(page: Page, errors: string[]) {
  page.on("pageerror", (e) => errors.push(String(e)));
}

/** Fails when anything renders wider than the screen. 1px subpixel tolerance. */
async function expectNoSideScroll(page: Page, label: string) {
  const m = await page.evaluate(() => {
    const doc = document.scrollingElement ?? document.documentElement;
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
  });
  expect(
    m.scrollW,
    `${label}: horizontal overflow — ${m.scrollW - m.clientW}px wider than the screen`,
  ).toBeLessThanOrEqual(m.clientW + 1);
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const p of PAGES) {
      test(`${p.label} fits the screen with no JS errors`, async ({ page }) => {
        const errors: string[] = [];
        trapPageErrors(page, errors);
        const resp = await page.goto(p.path);
        expect(resp?.status() ?? 0, `${p.label} HTTP status`).toBeLessThan(400);
        await expectNoSideScroll(page, p.label);
        expect(errors, `${p.label} JS errors: ${errors.join(" | ")}`).toHaveLength(0);
      });
    }

    for (const p of CAPTURE_PAGES) {
      test(`${p.label} capture form is visible and tappable`, async ({ page }) => {
        await page.goto(p.path);
        const form = page.locator("form.capture-form").first();
        await expect(form, `${p.label}: capture form present`).toBeVisible();

        const email = form.locator('input[type="email"]');
        const submit = form.locator('button[type="submit"]');
        await expect(email, `${p.label}: email field visible`).toBeVisible();
        await expect(submit, `${p.label}: submit button visible`).toBeVisible();

        const eb = await email.boundingBox();
        const sb = await submit.boundingBox();
        expect(eb, `${p.label}: email has a box`).not.toBeNull();
        expect(sb, `${p.label}: submit has a box`).not.toBeNull();
        // Tap-target floor (Apple/WCAG 2.5.5): 44px.
        expect(eb!.height, `${p.label}: email tap height`).toBeGreaterThanOrEqual(44);
        expect(sb!.height, `${p.label}: submit tap height`).toBeGreaterThanOrEqual(44);
        // The email field must not be clipped to a sliver or pushed off-screen.
        expect(eb!.width, `${p.label}: email width sane`).toBeGreaterThanOrEqual(180);
        expect(eb!.x, `${p.label}: email starts on-screen`).toBeGreaterThanOrEqual(0);
      });
    }

    // The demo must actually RUN client-side (no server), and reveal the post-demo
    // capture form — the free-value-first path. Proves it works, not just renders.
    test("demo runs end-to-end and reveals the capture form", async ({ page }) => {
      const errors: string[] = [];
      trapPageErrors(page, errors);
      await page.goto("/demo/");
      await expect(page.locator("#review")).toBeVisible();          // default profile preselected
      await page.locator(".pick-add").first().click();              // keep a finding
      await page.getByRole("button", { name: /Build the sample resume/ }).click();
      await expect(page.locator("#built")).toBeVisible();           // sample build appears
      await expect(page.locator(".resume li.new").first()).toBeVisible(); // a kept (green) line landed
      await expect(page.locator('form.capture-form input[type="email"]')).toBeVisible(); // capture revealed
      await expectNoSideScroll(page, "demo built state");
      expect(errors, `demo JS errors: ${errors.join(" | ")}`).toHaveLength(0);
    });
  });
}
