import { test, expect } from "@playwright/test";

// Founder QA bar (10/30/2026): on phone-sized screens the header free-check button never overlaps the logo or the menu,
// the menu opens and closes, nothing is pushed off screen, and the header causes no sideways scroll. Checked at each
// width and at 200% text. The phone button only exists in launch builds (PUBLIC_LAUNCHED=1); in pre-launch builds the
// test still guards the logo and menu. Run the launch version locally with: PUBLIC_LAUNCHED=1 npx playwright test header-fit
const WIDTHS = [280, 320, 360, 375, 390, 412, 430, 600, 899];

for (const zoom of [1, 2]) {
  for (const width of WIDTHS) {
    test(`header fits at ${width}px, ${zoom * 100}% text`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto("/guides/cna-resume/");
      if (zoom === 2) await page.addStyleTag({ content: "html{font-size:200% !important}" });
      await page.waitForTimeout(100);

      const boxes = await page.evaluate(() => {
        const box = (sel: string) => {
          const e = document.querySelector(sel) as HTMLElement | null;
          if (!e || getComputedStyle(e).display === "none") return null;
          const r = e.getBoundingClientRect();
          return r.width && r.height ? { l: r.left, r: r.right, t: r.top, b: r.bottom } : null;
        };
        // Measure against the header bar itself: at 200% text other page content can widen the page (a separate issue).
        const bar = (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect();
        return { brand: box(".site-header .brand"), btn: box(".site-header .cta-phone"), menu: box(".site-header .hamburger"), left: bar.left, vw: bar.right };
      });
      type B = { l: number; r: number; t: number; b: number } | null;
      const overlap = (a: B, z: B) => !!a && !!z && a.l < z.r - 0.5 && z.l < a.r - 0.5 && a.t < z.b - 0.5 && z.t < a.b - 0.5;

      expect(boxes.left, "header starts on screen").toBeGreaterThanOrEqual(-0.5);
      expect(boxes.vw, "header ends on screen").toBeLessThanOrEqual(width + 0.5);
      if (zoom === 1 && width >= 320) {
        const wide = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(wide, "no sideways scroll at normal text").toBeLessThanOrEqual(width + 1);
      }
      expect(boxes.brand, "logo shown").not.toBeNull();
      // Founder 11/14/2026: the brand name is always shown, never only the "AR" square.
      await expect(page.locator(".site-header .brand .word"), "brand name shown").toBeVisible();
      expect(boxes.menu, "menu button shown").not.toBeNull();
      // Review of 11/14/2026: the logo and the menu share the first row, and neither touches the top edge of the header.
      expect(boxes.menu!.t, "menu on the logo's row").toBeLessThan(boxes.brand!.b);
      const top = await page.evaluate(() => (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect().top);
      expect(Math.min(boxes.menu!.t, boxes.brand!.t) - top, "space above the first row").toBeGreaterThanOrEqual(6);
      // Founder 11/14/2026 ("we can tighten it slightly to 113 px"): the phone bar is at most 112px (113px with the header's border).
      if (zoom === 1 && width >= 320 && width <= 430) {
        const h = await page.evaluate(() => (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect().height);
        expect(h, "phone header height").toBeLessThanOrEqual(112.5);
      }
      expect(overlap(boxes.brand, boxes.btn), "button overlaps logo").toBe(false);
      expect(overlap(boxes.btn, boxes.menu), "button overlaps menu").toBe(false);
      expect(overlap(boxes.brand, boxes.menu), "logo overlaps menu").toBe(false);
      for (const b of [boxes.brand, boxes.btn, boxes.menu]) if (b) expect(b.l >= boxes.left - 0.5 && b.r <= boxes.vw + 0.5, "header item outside the header").toBe(true);
      // The menu sits at the right edge, whether or not the phone button is shown (recheck 10/31 F3).
      expect(boxes.vw - boxes.menu!.r, "menu at the right edge").toBeLessThan(40);

      const menu = page.locator(".site-header .hamburger");
      await menu.click();
      await expect(page.locator(".mobile-menu")).toBeVisible();
      await menu.click();
      await expect(page.locator(".mobile-menu")).toBeHidden();
      await ctx.close();
    });
  }
}

// Re-check of 11/14/2026 (FIX E): the phone changes leave the desktop header on one row at its live height.
// Limits sit just above the live height of the header bar (.bar, without the header's 1px bottom border), measured by
// re-check 4 (11/14/2026): 71.19px from 900 to 1060 wide and 64px above that. A bar that grows even a little past live fails.
for (const [width, maxH] of [[900, 71.5], [1024, 71.5], [1280, 64.5]] as const) {
  test(`desktop header stays on one row at ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/guides/cna-resume/");
    const m = await page.evaluate(() => {
      const r = (s: string) => { const e = document.querySelector(s) as HTMLElement | null; return e && getComputedStyle(e).display !== "none" ? e.getBoundingClientRect() : null; };
      return { bar: r(".site-header .bar"), brand: r(".site-header .brand"), cta: r(".site-header a.btn.cta-desktop") };
    });
    expect(m.bar!.height, "desktop header height").toBeLessThanOrEqual(maxH);
    if (m.cta) expect(m.cta.top, "desktop button on the logo row").toBeLessThan(m.brand!.bottom);
    await ctx.close();
  });
}

// Re-check 4 of 11/14/2026 (BLOCK 1): a desktop window 900 to 920 px wide at 200% text shows only the "AR" square, as on live, so
// "Sign in" and the button are not pushed further off screen by the brand name. The name always shows on phones (tests above).
for (const width of [900, 920]) {
  test(`desktop header at ${width}px, 200% text, keeps the live short logo`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/guides/cna-resume/");
    await page.addStyleTag({ content: "html{font-size:200% !important}" });
    await page.waitForTimeout(100);
    await expect(page.locator(".site-header .brand .mark"), "AR square shown").toBeVisible();
    await expect(page.locator(".site-header .brand .word"), "brand name hidden, as on live").toBeHidden();
    await ctx.close();
  });
}
